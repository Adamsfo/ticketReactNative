import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  canalLabel?: string | null;
  trecho?: string | null;
  compact?: boolean;
};

/**
 * Aviso operacional: note da OTA sugere que o pagamento já foi feito pela plataforma.
 * Não quita automaticamente.
 */
export default function AlertaPossivelPagamentoOta({
  canalLabel,
  trecho,
  compact = false,
}: Props) {
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Text style={styles.titulo}>⚠ POSSÍVEL PAGAMENTO VIA OTA</Text>
      <Text style={styles.texto}>
        Esta reserva possui indícios de que o pagamento foi realizado pela
        plataforma. Revise as informações antes de cobrar o hóspede.
      </Text>
      {canalLabel ? (
        <Text style={styles.meta}>
          Canal: <Text style={styles.metaValor}>{canalLabel}</Text>
        </Text>
      ) : null}
      <Text style={styles.meta}>Origem da detecção: campo Note</Text>
      {trecho ? (
        <View style={styles.trechoBox}>
          <Text style={styles.trechoLabel}>Trecho encontrado</Text>
          <Text style={styles.trecho}>{trecho}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#fff8e6",
    borderWidth: 1,
    borderColor: "#e6a817",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 6,
  },
  boxCompact: {
    marginBottom: 8,
    padding: 10,
  },
  titulo: {
    fontSize: 13,
    fontWeight: "800",
    color: "#8a5a00",
    letterSpacing: 0.2,
  },
  texto: {
    fontSize: 13,
    lineHeight: 18,
    color: "#5c4500",
  },
  meta: {
    fontSize: 12,
    color: "#6b5500",
  },
  metaValor: {
    fontWeight: "700",
    color: "#4a3a00",
  },
  trechoBox: {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f0d78a",
    padding: 8,
  },
  trechoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8a5a00",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  trecho: {
    fontSize: 12,
    lineHeight: 17,
    color: "#333",
    fontFamily: "monospace",
  },
});
