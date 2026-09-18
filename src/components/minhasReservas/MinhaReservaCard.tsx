import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  corStatusReserva,
  labelStatusReserva,
} from "@/src/lib/hospedagemAdmin";
import type { MinhaReservaCard as MinhaReservaCardType } from "@/src/lib/reservaSuite";
import {
  acaoCancelarDisponivel,
  acaoRemarcarDisponivel,
  deveExibirAcaoCancelarReserva,
  deveExibirAcaoRemarcarReserva,
  labelBotaoRemarcar,
} from "@/src/lib/minhasReservasAcoes";

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
  onRemarcar?: () => void;
};

export default function MinhaReservaCard({
  item,
  onPress,
  onCancelar,
  onRemarcar,
}: Props) {
  const cor = corStatusReserva(item.status);
  const numero = item.numeroReserva || item.id;
  const remarcacaoPendente = Boolean(item.remarcacao?.remarcacaoPendente);
  const exibirRemarcar = deveExibirAcaoRemarcarReserva({
    status: item.status,
    remarcacaoPendente,
  });
  const exibirCancelar = deveExibirAcaoCancelarReserva(item.status);
  const remarcarDisponivel = acaoRemarcarDisponivel({
    podeRemarcar: item.podeRemarcar,
    remarcacaoPendente,
  });
  const cancelarDisponivel = acaoCancelarDisponivel(item.podeCancelar);

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

      {exibirRemarcar && onRemarcar ? (
        <TouchableOpacity
          style={[
            styles.btnRemarcar,
            !remarcarDisponivel && styles.btnRemarcarBloqueado,
          ]}
          onPress={onRemarcar}
          activeOpacity={0.85}
        >
          <View style={styles.btnConteudo}>
            {!remarcarDisponivel ? (
              <Feather name="lock" size={14} color="#667085" />
            ) : null}
            <Text
              style={[
                styles.btnRemarcarTexto,
                !remarcarDisponivel && styles.btnRemarcarTextoBloqueado,
              ]}
            >
              {labelBotaoRemarcar(remarcacaoPendente)}
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}

      {exibirCancelar && onCancelar ? (
        <TouchableOpacity
          style={[
            styles.btnCancelar,
            !cancelarDisponivel && styles.btnCancelarBloqueado,
          ]}
          onPress={onCancelar}
          activeOpacity={0.85}
        >
          <View style={styles.btnConteudo}>
            {!cancelarDisponivel ? (
              <Feather name="lock" size={14} color="#98a2b3" />
            ) : null}
            <Text
              style={[
                styles.btnCancelarTexto,
                !cancelarDisponivel && styles.btnCancelarTextoBloqueado,
              ]}
            >
              Cancelar reserva
            </Text>
          </View>
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
  btnConteudo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnRemarcar: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnRemarcarBloqueado: {
    borderColor: "#d0d5dd",
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    opacity: 0.92,
  },
  btnRemarcarTexto: {
    color: colors.azul,
    fontWeight: "700",
    fontSize: 14,
  },
  btnRemarcarTextoBloqueado: {
    color: "#667085",
  },
  btnCancelar: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnCancelarBloqueado: {
    borderColor: "#d0d5dd",
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    opacity: 0.92,
  },
  btnCancelarTexto: {
    color: colors.red,
    fontWeight: "700",
    fontSize: 14,
  },
  btnCancelarTextoBloqueado: {
    color: "#667085",
  },
});
