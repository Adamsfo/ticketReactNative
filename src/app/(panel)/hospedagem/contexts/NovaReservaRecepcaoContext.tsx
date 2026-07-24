import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type NovaReservaPrefill = {
  idEvento: number;
  idEventoSuite?: number | null;
  checkinDate?: string | null;
  checkinHora?: string | null;
};

type Ctx = {
  visible: boolean;
  prefill: NovaReservaPrefill | null;
  openNovaReserva: (prefill: NovaReservaPrefill) => void;
  closeNovaReserva: () => void;
};

const NovaReservaRecepcaoContext = createContext<Ctx | null>(null);

export function NovaReservaRecepcaoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [prefill, setPrefill] = useState<NovaReservaPrefill | null>(null);

  const openNovaReserva = useCallback((p: NovaReservaPrefill) => {
    setPrefill(p);
    setVisible(true);
  }, []);

  const closeNovaReserva = useCallback(() => {
    setVisible(false);
    setPrefill(null);
  }, []);

  const value = useMemo(
    () => ({ visible, prefill, openNovaReserva, closeNovaReserva }),
    [visible, prefill, openNovaReserva, closeNovaReserva],
  );

  return (
    <NovaReservaRecepcaoContext.Provider value={value}>
      {children}
    </NovaReservaRecepcaoContext.Provider>
  );
}

export function useNovaReservaRecepcao() {
  const ctx = useContext(NovaReservaRecepcaoContext);
  if (!ctx) {
    throw new Error(
      "useNovaReservaRecepcao deve ser usado dentro de NovaReservaRecepcaoProvider",
    );
  }
  return ctx;
}
