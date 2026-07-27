import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ReceberSaldoTarget = {
  idReservaHospedagem: number;
  saldoPendente?: number | null;
  valorTotal?: number | null;
  valorPago?: number | null;
  suiteNome?: string | null;
  responsavel?: string | null;
  /** Callback local (ex.: detalhe da reserva fora do provider de refresh). */
  onSuccess?: () => void;
};

type Ctx = {
  visible: boolean;
  target: ReceberSaldoTarget | null;
  openReceberSaldo: (target: ReceberSaldoTarget) => void;
  closeReceberSaldo: () => void;
};

const ReceberSaldoHospedagemContext = createContext<Ctx | null>(null);

export function ReceberSaldoHospedagemProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<ReceberSaldoTarget | null>(null);

  const openReceberSaldo = useCallback((t: ReceberSaldoTarget) => {
    setTarget(t);
    setVisible(true);
  }, []);

  const closeReceberSaldo = useCallback(() => {
    setVisible(false);
    setTarget(null);
  }, []);

  const value = useMemo(
    () => ({ visible, target, openReceberSaldo, closeReceberSaldo }),
    [visible, target, openReceberSaldo, closeReceberSaldo],
  );

  return (
    <ReceberSaldoHospedagemContext.Provider value={value}>
      {children}
    </ReceberSaldoHospedagemContext.Provider>
  );
}

export function useReceberSaldoHospedagem() {
  const ctx = useContext(ReceberSaldoHospedagemContext);
  if (!ctx) {
    throw new Error(
      "useReceberSaldoHospedagem deve ser usado dentro de ReceberSaldoHospedagemProvider",
    );
  }
  return ctx;
}
