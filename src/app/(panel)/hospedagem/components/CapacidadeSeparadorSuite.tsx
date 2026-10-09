import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/src/constants/colors";

export function tituloSeparadorCapacidadeMaxima(maxHospedes: number): string {
  return `ATÉ ${maxHospedes} HÓSPEDES`;
}

type CapacidadeSeparadorSuiteProps = {
  titulo: string;
  primeiro?: boolean;
};

export default function CapacidadeSeparadorSuite({
  titulo,
  primeiro = false,
}: CapacidadeSeparadorSuiteProps) {
  return (
    <View
      style={[styles.capacidadeSeparador, primeiro && styles.capacidadeSeparadorPrimeiro]}
    >
      <View style={styles.capacidadeSeparadorLinha} />
      <View style={styles.capacidadeSeparadorTitulo}>
        <Text style={styles.capacidadeSeparadorTexto}>{titulo}</Text>
        <Text style={styles.capacidadeSeparadorSeta}>↓</Text>
      </View>
      <View style={styles.capacidadeSeparadorLinha} />
    </View>
  );
}

const styles = StyleSheet.create({
  capacidadeSeparador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    marginBottom: 2,
  },
  capacidadeSeparadorPrimeiro: {
    marginTop: 8,
  },
  capacidadeSeparadorLinha: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  capacidadeSeparadorTitulo: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 5,
  },
  capacidadeSeparadorTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#98A2B3",
    letterSpacing: 0.35,
  },
  capacidadeSeparadorSeta: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B0B7C3",
    lineHeight: 11,
  },
});
