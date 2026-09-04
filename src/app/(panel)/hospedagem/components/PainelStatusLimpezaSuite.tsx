import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  labelStatusLimpeza,
  mensagemStatusLimpeza,
  StatusLimpezaSuite,
} from "@/src/lib/limpezaSuites";

type PainelProps = {
  status: StatusLimpezaSuite;
  compact?: boolean;
};

function estiloPainel(status: StatusLimpezaSuite): {
  backgroundColor: string;
  borderColor: string;
  tituloColor: string;
} {
  switch (status) {
    case "Pendente":
      return {
        backgroundColor: "rgba(0, 115, 230, 0.08)",
        borderColor: "rgba(0, 115, 230, 0.2)",
        tituloColor: "#0073E6",
      };
    case "EmAndamento":
      return {
        backgroundColor: "rgba(0, 115, 230, 0.12)",
        borderColor: "rgba(0, 115, 230, 0.28)",
        tituloColor: "#005bb5",
      };
    case "Concluida":
      return {
        backgroundColor: "rgba(2, 122, 58, 0.1)",
        borderColor: "rgba(2, 122, 58, 0.22)",
        tituloColor: "#027a3a",
      };
    default:
      return {
        backgroundColor: "rgba(107, 114, 128, 0.08)",
        borderColor: "rgba(107, 114, 128, 0.18)",
        tituloColor: "#344054",
      };
  }
}

/** Informativo de status da limpeza (turnover) — independente do painel verde de chegada. */
export default function PainelStatusLimpezaSuite({
  status,
  compact,
}: PainelProps) {
  const visual = estiloPainel(status);

  return (
    <View
      style={[
        styles.painel,
        compact && styles.painelCompact,
        {
          backgroundColor: visual.backgroundColor,
          borderColor: visual.borderColor,
        },
      ]}
    >
      <Text
        style={[
          styles.titulo,
          compact && styles.tituloCompact,
          { color: visual.tituloColor },
        ]}
      >
        🧹 STATUS DA LIMPEZA: {labelStatusLimpeza(status).toUpperCase()}
      </Text>
      <Text style={[styles.mensagem, compact && styles.mensagemCompact]}>
        {mensagemStatusLimpeza(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: {
    marginTop: -4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  painelCompact: {
    marginTop: -4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.35,
    lineHeight: 16,
  },
  tituloCompact: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  mensagem: {
    fontSize: 12,
    color: "#344054",
    lineHeight: 16,
  },
  mensagemCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
