import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useHospedagemEditLock } from "./HospedagemAdminRefreshContext";

/** Prefill só de contexto operacional — nunca horários de reserva anterior. */
export type NovaReservaPrefill = {
  idEvento: number;
  idEventoSuite?: number | null;
  checkinDate?: string | null;
};

type Ctx = {
  visible: boolean;
  /** Incrementa a cada abertura → força estado limpo do assistente. */
  sessionKey: number;
  prefill: NovaReservaPrefill | null;
  openNovaReserva: (prefill: NovaReservaPrefill) => void;
  closeNovaReserva: () => void;
};

const NovaReservaRecepcaoContext = createContext<Ctx | null>(null);

function NovaReservaEditLockBridge({ visible }: { visible: boolean }) {
  useHospedagemEditLock(visible);
  return null;
}

export function NovaReservaRecepcaoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [prefill, setPrefill] = useState<NovaReservaPrefill | null>(null);

  const openNovaReserva = useCallback((p: NovaReservaPrefill) => {
    setPrefill({
      idEvento: p.idEvento,
      idEventoSuite: p.idEventoSuite ?? null,
      checkinDate: p.checkinDate ?? null,
    });
    setSessionKey((k) => k + 1);
    setVisible(true);
  }, []);

  const closeNovaReserva = useCallback(() => {
    setVisible(false);
    setPrefill(null);
  }, []);

  const value = useMemo(
    () => ({
      visible,
      sessionKey,
      prefill,
      openNovaReserva,
      closeNovaReserva,
    }),
    [visible, sessionKey, prefill, openNovaReserva, closeNovaReserva],
  );

  return (
    <NovaReservaRecepcaoContext.Provider value={value}>
      <NovaReservaEditLockBridge visible={visible} />
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
