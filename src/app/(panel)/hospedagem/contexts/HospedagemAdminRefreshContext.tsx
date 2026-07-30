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
  syncErros: number;
  refreshSyncSummary: () => void;
  /** Quando true, a aba Reservas deve filtrar sync_erro. */
  filtroSyncErroPedido: boolean;
  pedirFiltroSyncErro: () => void;
  limparFiltroSyncErroPedido: () => void;
};

const emptySummary: SyncSummaryCounts = {
  erros: 0,
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
    refreshSyncSummary: () => undefined,
    filtroSyncErroPedido: false,
    pedirFiltroSyncErro: () => undefined,
    limparFiltroSyncErroPedido: () => undefined,
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

  const value = useMemo(
    () => ({
      refreshVersion,
      notifyOperacaoConcluida,
      syncSummary,
      syncErros: syncSummary?.erros ?? 0,
      refreshSyncSummary,
      filtroSyncErroPedido,
      pedirFiltroSyncErro: () => setFiltroSyncErroPedido(true),
      limparFiltroSyncErroPedido: () => setFiltroSyncErroPedido(false),
    }),
    [
      refreshVersion,
      notifyOperacaoConcluida,
      syncSummary,
      refreshSyncSummary,
      filtroSyncErroPedido,
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
