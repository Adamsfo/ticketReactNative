import React from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

/**
 * Controle exclusivo do Pagamento PDV.
 * Permite apenas reduzir quantidade (botão + sempre desabilitado).
 * Mínimo: 1.
 */
type QuantidadeAjustePdvProps = {
  quantidade: number;
  disabled?: boolean;
  onReduzir: () => void;
};

export default function QuantidadeAjustePdv({
  quantidade,
  disabled = false,
  onReduzir,
}: QuantidadeAjustePdvProps) {
  const podeReduzir = !disabled && quantidade > 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.botao, !podeReduzir && styles.botaoDesabilitado]}
        disabled={!podeReduzir}
        onPress={onReduzir}
        accessibilityLabel="Reduzir quantidade"
      >
        <Feather name="minus" size={20} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.quantidade}>{quantidade}</Text>

      <TouchableOpacity
        style={[styles.botao, styles.botaoDesabilitado]}
        disabled
        accessibilityLabel="Aumentar quantidade (indisponível no pagamento)"
      >
        <Feather name="plus" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  botao: {
    backgroundColor: "rgb(0, 146, 250)",
    borderRadius: 7,
    padding: 4,
  },
  botaoDesabilitado: {
    backgroundColor: "#9aa3ad",
    opacity: 0.7,
  },
  quantidade: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
});
