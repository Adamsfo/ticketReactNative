import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  corStatusReserva,
  labelStatusReserva,
} from "@/src/lib/hospedagemAdmin";
import type { MinhaReservaCard as MinhaReservaCardType } from "@/src/lib/reservaSuite";

function formatarDataHora(iso: string): string {
  try {
    return formatInTimeZone(
      parseISO(String(iso)),
      "America/Cuiaba",
      "dd/MM/yyyy HH:mm",
    );
  } catch {
    return String(iso);
  }
}

function formatarSuites(item: MinhaReservaCardType): string {
  const nomes = (item.suites ?? [])
    .map((suite) => suite.nome)
    .filter(Boolean);
  if (nomes.length > 0) {
    return nomes.join(" · ");
  }
  return item.nomeSuite || "Suíte";
}

type Props = {
  item: MinhaReservaCardType;
  onPress: () => void;
  onCancelar?: () => void;
};

export default function MinhaReservaCard({ item, onPress, onCancelar }: Props) {
  const cor = corStatusReserva(item.status);
  const numero = item.numeroReserva || item.id;

  return (
    <View style={[styles.card, { borderLeftColor: cor }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={styles.headerRow}>
        <Text style={styles.numero}>Reserva #{numero}</Text>
        <View style={[styles.statusBadge, { backgroundColor: cor }]}>
          <Text style={styles.statusTexto}>
            {labelStatusReserva(item.status)}
          </Text>
        </View>
      </View>

      {item.evento?.nome ? (
        <Text style={styles.evento} numberOfLines={1}>
          {item.evento.nome}
        </Text>
      ) : null}

      <Text style={styles.suite} numberOfLines={2}>
        {formatarSuites(item)}
      </Text>

      <Text style={styles.periodo}>
        {formatarDataHora(item.checkin)} → {formatarDataHora(item.checkout)}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {item.noites} {item.noites === 1 ? "noite" : "noites"}
        </Text>
        <Text style={styles.meta}>
          {item.adultos} {item.adultos === 1 ? "adulto" : "adultos"}
          {item.criancas > 0
            ? ` · ${item.criancas} ${item.criancas === 1 ? "criança" : "crianças"}`
            : ""}
        </Text>
      </View>

      <Text style={styles.valor}>
        {formatCurrency(Number(item.valorTotal || 0))}
      </Text>
      </TouchableOpacity>

      {item.podeCancelar && onCancelar ? (
        <TouchableOpacity
          style={styles.btnCancelar}
          onPress={onCancelar}
          activeOpacity={0.85}
        >
          <Text style={styles.btnCancelarTexto}>Cancelar reserva</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  numero: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  evento: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 2,
  },
  suite: {
    fontSize: 14,
    color: "#475467",
    marginBottom: 8,
  },
  periodo: {
    fontSize: 13,
    color: "#667085",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  meta: {
    fontSize: 13,
    color: "#667085",
  },
  valor: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  btnCancelar: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnCancelarTexto: {
    color: colors.red,
    fontWeight: "700",
    fontSize: 14,
  },
});
