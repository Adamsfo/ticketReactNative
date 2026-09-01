import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Alert } from "react-native";
import { useHospedagemEditLock } from "./HospedagemAdminRefreshContext";

export type ReceberSaldoTarget = {
  idReservaHospedagem: number;
  saldoPendente?: number | null;
  valorTotal?: number | null;
  valorPago?: number | null;
  suiteNome?: string | null;
  responsavel?: string | null;
  /** Callback local (ex.: detalhe da reserva fora do provider de refresh). */
  onSuccess?: () => void;
  /** Indicador operacional de possível pagamento via OTA. */
  possivelPagamentoOta?: boolean;
  possivelPagamentoOtaTrecho?: string | null;
  canalVendaLabel?: string | null;
};

type Ctx = {
  visible: boolean;
  target: ReceberSaldoTarget | null;
  openReceberSaldo: (target: ReceberSaldoTarget) => void;
  closeReceberSaldo: () => void;
};

const ReceberSaldoHospedagemContext = createContext<Ctx | null>(null);

function ReceberSaldoEditLockBridge({ visible }: { visible: boolean }) {
  useHospedagemEditLock(visible);
  return null;
}

export function ReceberSaldoHospedagemProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<ReceberSaldoTarget | null>(null);

  const openReceberSaldo = useCallback((t: ReceberSaldoTarget) => {
    const abrir = () => {
      setTarget(t);
      setVisible(true);
    };

    if (!t.possivelPagamentoOta) {
      abrir();
      return;
    }

    const canal = t.canalVendaLabel ? `\n\nCanal: ${t.canalVendaLabel}` : "";
    Alert.alert(
      "Possível pagamento via OTA",
      `Esta reserva possui indicação de pagamento via OTA.${canal}\n\nCaso confirme que o pagamento foi realizado pela plataforma, utilize a forma de pagamento:\n\n"Recebido pela OTA"\n\nAssim esse valor NÃO será lançado no caixa.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Continuar", onPress: abrir },
      ],
    );
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
      <ReceberSaldoEditLockBridge visible={visible} />
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
