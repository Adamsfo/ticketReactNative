import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type HospedagemAdminRefreshContextValue = {
  /** Incrementa a cada operação que altera reserva/suíte. */
  refreshVersion: number;
  /** Notifica Agenda, Suítes e Reservas para atualizar dados. */
  notifyOperacaoConcluida: () => void;
};

const HospedagemAdminRefreshContext =
  createContext<HospedagemAdminRefreshContextValue>({
    refreshVersion: 0,
    notifyOperacaoConcluida: () => undefined,
  });

export function HospedagemAdminRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refreshVersion, setRefreshVersion] = useState(0);

  const notifyOperacaoConcluida = useCallback(() => {
    setRefreshVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({ refreshVersion, notifyOperacaoConcluida }),
    [refreshVersion, notifyOperacaoConcluida],
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
