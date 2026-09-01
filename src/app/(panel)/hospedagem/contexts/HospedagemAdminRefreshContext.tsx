import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import {
  getSyncSummary,
  SyncSummaryCounts,
} from "@/src/lib/integrationsAdmin";
import { getHospedagemRefreshVersion } from "@/src/lib/hospedagemAdmin";

/** Polling com aba/tela visível. */
const POLL_VISIBLE_MS = 25_000;
/** Aba oculta (Page Visibility) — reduz frequência. */
const POLL_HIDDEN_MS = 90_000;

type PollMode = "visible" | "hidden" | "paused";

function resolvePollMode(
  appState: AppStateStatus,
  pageVisible: boolean,
): PollMode {
  // App em background / inativo (mobile ou web minimizado) → pausa.
  if (appState === "background" || appState === "inactive") {
    return "paused";
  }
  // Web: aba oculta → polling reduzido.
  if (Platform.OS === "web" && !pageVisible) {
    return "hidden";
  }
  return "visible";
}

function pollIntervalMs(mode: PollMode): number | null {
  if (mode === "paused") return null;
  if (mode === "hidden") return POLL_HIDDEN_MS;
  return POLL_VISIBLE_MS;
}

type HospedagemAdminRefreshContextValue = {
  /** Incrementa a cada operação que altera reserva/suíte. */
  refreshVersion: number;
  /**
   * Solicita refresh pelo mesmo fluxo do polling (respeita edit lock).
   * Usar no botão "Atualizar agora" e em qualquer tela da hospedagem.
   */
  requestRefresh: () => void;
  /**
   * Refresh imediato após ação local (check-in, pagamento, etc.).
   * Não espera o polling.
   */
  notifyOperacaoConcluida: () => void;
  /**
   * Timestamp (ms) do último bump de refreshVersion.
   * Null até o primeiro refresh via RefreshManager.
   */
  lastRefreshAt: number | null;
  /**
   * Bloqueia auto-refresh enquanto modal/sheet/drawer de edição estiver aberto.
   * Usar via useHospedagemEditLock(visible).
   */
  acquireEditLock: () => void;
  releaseEditLock: () => void;
  /** Quantidade de overlays de edição abertos. */
  editLockCount: number;
  syncSummary: SyncSummaryCounts | null;
  /** OPEN com reserva — alinhado ao filtro Reservas "Falhas sync". */
  syncErros: number;
  /** OPEN sem reserva — só Integrações → Pendências. */
  syncErrosSemReserva: number;
  /** Badge / atenção total. */
  syncErrosTotal: number;
  refreshSyncSummary: () => void;
  /** Quando true, a aba Reservas deve filtrar sync_erro. */
  filtroSyncErroPedido: boolean;
  pedirFiltroSyncErro: () => void;
  limparFiltroSyncErroPedido: () => void;
  /** Quando true, abrir Integrações na sub-aba Pendências. */
  abrirPendenciasPedido: boolean;
  pedirAbrirPendencias: () => void;
  limparAbrirPendenciasPedido: () => void;
};

const emptySummary: SyncSummaryCounts = {
  erros: 0,
  errosSemReserva: 0,
  errosTotal: 0,
  criticos: 0,
  alertas: 0,
  informativos: 0,
  pendentes: 0,
  processando: 0,
  sincronizadas: 0,
  ignoradas: 0,
  aguardandoSync: 0,
  ultimoErro: null,
  ultimaSincronizacaoSucesso: null,
};

const HospedagemAdminRefreshContext =
  createContext<HospedagemAdminRefreshContextValue>({
    refreshVersion: 0,
    requestRefresh: () => undefined,
    notifyOperacaoConcluida: () => undefined,
    lastRefreshAt: null,
    acquireEditLock: () => undefined,
    releaseEditLock: () => undefined,
    editLockCount: 0,
    syncSummary: null,
    syncErros: 0,
    syncErrosSemReserva: 0,
    syncErrosTotal: 0,
    refreshSyncSummary: () => undefined,
    filtroSyncErroPedido: false,
    pedirFiltroSyncErro: () => undefined,
    limparFiltroSyncErroPedido: () => undefined,
    abrirPendenciasPedido: false,
    pedirAbrirPendencias: () => undefined,
    limparAbrirPendenciasPedido: () => undefined,
  });

/**
 * RefreshManager oficial da hospedagem.
 * - Versão global no backend (contador incrementado nas mutações)
 * - Polling leve + Page Visibility / AppState
 * - Sem reload se nada mudou
 * - Bloqueia auto-refresh com modal/sheet aberto
 * - refreshPending quando mudança chega durante edição
 * - requestRefresh = polling e botão manual (mesmo fluxo, respeita edit lock)
 * - notifyOperacaoConcluida = refresh imediato pós-ação local
 */
export function HospedagemAdminRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [editLockCount, setEditLockCount] = useState(0);
  const [syncSummary, setSyncSummary] = useState<SyncSummaryCounts | null>(
    null,
  );
  const [filtroSyncErroPedido, setFiltroSyncErroPedido] = useState(false);
  const [abrirPendenciasPedido, setAbrirPendenciasPedido] = useState(false);
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const [pageVisible, setPageVisible] = useState(true);

  const remoteVersionRef = useRef<string | null>(null);
  const refreshPendingRef = useRef(false);
  const editLockCountRef = useRef(0);
  const pollingRef = useRef(false);

  const bumpRefresh = useCallback(() => {
    setRefreshVersion((v) => v + 1);
    setLastRefreshAt(Date.now());
  }, []);

  /** Mesmo fluxo interno do polling e do botão manual. */
  const requestRefresh = useCallback(() => {
    if (editLockCountRef.current > 0) {
      refreshPendingRef.current = true;
      return;
    }
    refreshPendingRef.current = false;
    bumpRefresh();
  }, [bumpRefresh]);

  const notifyOperacaoConcluida = useCallback(() => {
    // Ação local: sempre atualiza (sheet/listas reagem a refreshVersion).
    refreshPendingRef.current = false;
    bumpRefresh();
    // Alinha o token remoto para o próximo poll não disparar refresh duplicado.
    setTimeout(() => {
      void getHospedagemRefreshVersion()
        .then((resp) => {
          if (!resp.success || !resp.data) return;
          const next = String(
            (resp.data as { version?: string }).version ?? "",
          );
          if (next) remoteVersionRef.current = next;
        })
        .catch(() => undefined);
    }, 1500);
  }, [bumpRefresh]);

  const acquireEditLock = useCallback(() => {
    editLockCountRef.current += 1;
    setEditLockCount(editLockCountRef.current);
  }, []);

  const releaseEditLock = useCallback(() => {
    editLockCountRef.current = Math.max(0, editLockCountRef.current - 1);
    setEditLockCount(editLockCountRef.current);
    if (editLockCountRef.current === 0 && refreshPendingRef.current) {
      refreshPendingRef.current = false;
      bumpRefresh();
    }
  }, [bumpRefresh]);

  const refreshSyncSummary = useCallback(() => {
    void getSyncSummary()
      .then((resp) => {
        if (resp.success && resp.data) setSyncSummary(resp.data);
      })
      .catch(() => undefined);
  }, []);

  const pollRemoteVersion = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      const resp = await getHospedagemRefreshVersion();
      if (!resp.success || !resp.data) {
        // DEBUG temporário — remover após diagnóstico do polling
        console.log("[POLL]\nremote request failed");
        return;
      }
      const next = String((resp.data as { version?: string }).version ?? "");
      if (!next) {
        // DEBUG temporário — remover após diagnóstico do polling
        console.log("[POLL]\nremote request failed");
        return;
      }

      const local = remoteVersionRef.current;
      if (local == null) {
        remoteVersionRef.current = next;
        // DEBUG temporário — remover após diagnóstico do polling
        console.log(
          `[POLL]\nlocal=null\nremote=${next}\nchanged=false\nmotivo=seed inicial (sem requestRefresh)`,
        );
        return;
      }
      if (local === next) {
        // DEBUG temporário — remover após diagnóstico do polling
        console.log(`[POLL]\nlocal=${local}\nremote=${next}\nchanged=false`);
        return;
      }

      remoteVersionRef.current = next;
      // DEBUG temporário — remover após diagnóstico do polling
      console.log(
        `[POLL]\nlocal=${local}\nremote=${next}\nchanged=true\ncalling requestRefresh()`,
      );
      requestRefresh();
    } catch {
      // DEBUG temporário — remover após diagnóstico do polling
      console.log("[POLL]\nremote request failed");
    } finally {
      pollingRef.current = false;
    }
  }, [requestRefresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", setAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const onVisibility = () => {
      setPageVisible(document.visibilityState === "visible");
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const pollMode = resolvePollMode(appState, pageVisible);
  const intervalMs = pollIntervalMs(pollMode);

  useEffect(() => {
    if (intervalMs == null) return;

    refreshSyncSummary();
    void pollRemoteVersion();
    const t = setInterval(() => {
      refreshSyncSummary();
      void pollRemoteVersion();
    }, intervalMs);
    return () => clearInterval(t);
  }, [intervalMs, refreshSyncSummary, pollRemoteVersion]);

  // Ao voltar a ficar visível, consulta imediatamente.
  useEffect(() => {
    if (pollMode !== "visible") return;
    void pollRemoteVersion();
    refreshSyncSummary();
  }, [pollMode, pollRemoteVersion, refreshSyncSummary]);

  const syncErros = syncSummary?.erros ?? 0;
  const syncErrosSemReserva = syncSummary?.errosSemReserva ?? 0;
  const syncErrosTotal =
    syncSummary?.errosTotal ?? syncErros + syncErrosSemReserva;

  const value = useMemo(
    () => ({
      refreshVersion,
      requestRefresh,
      notifyOperacaoConcluida,
      lastRefreshAt,
      acquireEditLock,
      releaseEditLock,
      editLockCount,
      syncSummary,
      syncErros,
      syncErrosSemReserva,
      syncErrosTotal,
      refreshSyncSummary,
      filtroSyncErroPedido,
      pedirFiltroSyncErro: () => setFiltroSyncErroPedido(true),
      limparFiltroSyncErroPedido: () => setFiltroSyncErroPedido(false),
      abrirPendenciasPedido,
      pedirAbrirPendencias: () => setAbrirPendenciasPedido(true),
      limparAbrirPendenciasPedido: () => setAbrirPendenciasPedido(false),
    }),
    [
      refreshVersion,
      requestRefresh,
      notifyOperacaoConcluida,
      lastRefreshAt,
      acquireEditLock,
      releaseEditLock,
      editLockCount,
      syncSummary,
      syncErros,
      syncErrosSemReserva,
      syncErrosTotal,
      refreshSyncSummary,
      filtroSyncErroPedido,
      abrirPendenciasPedido,
    ],
  );

  return (
    <HospedagemAdminRefreshContext.Provider value={value}>
      {children}
    </HospedagemAdminRefreshContext.Provider>
  );
}

export function useHospedagemAdminRefresh() {
  return useContext(HospedagemAdminRefreshContext);
}

/**
 * Bloqueia auto-refresh do RefreshManager enquanto `active` for true
 * (modal, sheet, drawer ou qualquer edição aberta).
 */
export function useHospedagemEditLock(active: boolean) {
  const { acquireEditLock, releaseEditLock } = useHospedagemAdminRefresh();
  useEffect(() => {
    if (!active) return;
    acquireEditLock();
    return () => releaseEditLock();
  }, [active, acquireEditLock, releaseEditLock]);
}

export { emptySummary };
