import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";

type ModalCancelarCortesiaProps = {
  visible: boolean;
  codigo: number;
  nomeImpresso: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function ModalCancelarCortesia({
  visible,
  codigo,
  nomeImpresso,
  onClose,
  onConfirm,
}: ModalCancelarCortesiaProps) {
  const [loading, setLoading] = useState(false);

  if (!visible) {
    return null;
  }

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={loading ? undefined : onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Cancelar esta cortesia?</Text>
              <TouchableOpacity onPress={onClose} disabled={loading}>
                <Feather name="x" size={28} color="#212743" />
              </TouchableOpacity>
            </View>

            <Text style={styles.identificacao}>
              Código: <Text style={styles.identificacaoValor}>{codigo}</Text>
            </Text>
            <Text style={styles.identificacao}>
              Nome impresso:{" "}
              <Text style={styles.identificacaoValor}>
                {nomeImpresso || "—"}
              </Text>
            </Text>

            <Text style={styles.explicacao}>
              Esta ação cancelará a cortesia selecionada. O ingresso não poderá
              mais ser utilizado.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonVoltar}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.buttonVoltarTexto}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.buttonConfirmar,
                  loading && styles.buttonConfirmarDisabled,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.branco} />
                ) : (
                  <Text style={styles.buttonConfirmarTexto}>
                    Confirmar cancelamento
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 16,
    maxWidth: 480,
    width: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: "#212743",
  },
  identificacao: {
    fontSize: 15,
    color: "#333",
    marginBottom: 6,
  },
  identificacaoValor: {
    fontWeight: "700",
  },
  explicacao: {
    fontSize: 14,
    color: "#555",
    marginTop: 10,
    marginBottom: 22,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
  buttonVoltar: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  buttonVoltarTexto: {
    color: colors.cinza,
    fontWeight: "600",
  },
  buttonConfirmar: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 180,
    alignItems: "center",
  },
  buttonConfirmarDisabled: {
    opacity: 0.7,
  },
  buttonConfirmarTexto: {
    color: colors.branco,
    fontWeight: "700",
    textAlign: "center",
  },
});
