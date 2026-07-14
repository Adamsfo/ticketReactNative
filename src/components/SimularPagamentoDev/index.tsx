import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import colors from "@/src/constants/colors";
import ModalMsg from "@/src/components/ModalMsg";
import {
  isDevPaymentEnabled,
  simularPagamentoDev,
} from "@/src/lib/pagamentoDev";
import { useHospedagem } from "@/src/contexts_/HospedagemContext";

type SimularPagamentoDevProps = {
  idTransacao?: number;
  tipoCompra?: string;
};

export default function SimularPagamentoDev({
  idTransacao,
  tipoCompra,
}: SimularPagamentoDevProps) {
  const navigation = useNavigation() as any;
  const { dispatch: dispatchHospedagem } = useHospedagem();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [visibleMsg, setVisibleMsg] = useState(false);

  if (!isDevPaymentEnabled()) {
    return null;
  }

  const handleSimular = async () => {
    if (!idTransacao) {
      setMsg("Transação não encontrada.");
      setVisibleMsg(true);
      return;
    }

    setLoading(true);
    try {
      const response = await simularPagamentoDev(idTransacao);
      if (!response.success) {
        setMsg(response.message || "Erro ao simular pagamento.");
        setVisibleMsg(true);
        return;
      }

      dispatchHospedagem({ type: "CLEAR" });

      if (tipoCompra === "hospedagem") {
        navigation.navigate("reservaConfirmada", { idTransacao });
        return;
      }

      setMsg("Pagamento simulado com sucesso (DEV).");
      setVisibleMsg(true);
    } catch {
      setMsg("Erro ao simular pagamento.");
      setVisibleMsg(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSimular}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.branco} />
        ) : (
          <Text style={styles.buttonText}>🟢 Simular Pagamento (DEV)</Text>
        )}
      </TouchableOpacity>

      <Modal visible={visibleMsg} transparent animationType="fade">
        <ModalMsg msg={msg} onClose={() => setVisibleMsg(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  button: {
    backgroundColor: colors.greenEscuro,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: {
    color: colors.branco,
    fontWeight: "600",
    fontSize: 15,
  },
});
