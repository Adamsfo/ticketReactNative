import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSyncSummary,
  SyncSummaryCounts,
} from "@/src/lib/integrationsAdmin";

type HospedagemAdminRefreshContextValue = {
  /** Incrementa a cada operação que altera reserva/suíte. */
  refreshVersion: number;
  /** Notifica Agenda, Suítes e Reservas para atualizar dados. */
  notifyOperacaoConcluida: () => void;
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
    notifyOperacaoConcluida: () => undefined,
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

export function HospedagemAdminRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [syncSummary, setSyncSummary] = useState<SyncSummaryCounts | null>(
    null,
  );
  const [filtroSyncErroPedido, setFiltroSyncErroPedido] = useState(false);
  const [abrirPendenciasPedido, setAbrirPendenciasPedido] = useState(false);

  const refreshSyncSummary = useCallback(() => {
    void getSyncSummary()
      .then((resp) => {
        if (resp.success && resp.data) setSyncSummary(resp.data);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refreshSyncSummary();
    const t = setInterval(refreshSyncSummary, 20_000);
    return () => clearInterval(t);
  }, [refreshSyncSummary, refreshVersion]);

  const notifyOperacaoConcluida = useCallback(() => {
    setRefreshVersion((v) => v + 1);
  }, []);

  const syncErros = syncSummary?.erros ?? 0;
  const syncErrosSemReserva = syncSummary?.errosSemReserva ?? 0;
  const syncErrosTotal =
    syncSummary?.errosTotal ?? syncErros + syncErrosSemReserva;

  const value = useMemo(
    () => ({
      refreshVersion,
      notifyOperacaoConcluida,
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
      notifyOperacaoConcluida,
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

export { emptySummary };
