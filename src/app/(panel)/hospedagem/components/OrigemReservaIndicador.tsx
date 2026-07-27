import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";

export type DadosOrigemReserva = {
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | string | null;
  nomeUsuarioCriacao?: string | null;
  idUsuarioCriacao?: number | null;
  dataCriacao?: string | Date | null;
};

export function normalizarOrigemReserva(
  origem?: string | null,
  extras?: {
    idUsuarioCriacao?: number | null;
    valorPago?: number | null;
    formaPagamentoRecepcao?: string | null;
  },
): "CLIENTE" | "ATENDENTE" {
  // Produção: CLIENTE | ATENDENTE. SITE legado = cliente online.
  if (origem === "ATENDENTE") return "ATENDENTE";
  if (
    Number(extras?.idUsuarioCriacao ?? 0) > 0 ||
    Number(extras?.valorPago ?? 0) > 0 ||
    Boolean(extras?.formaPagamentoRecepcao)
  ) {
    return "ATENDENTE";
  }
  return "CLIENTE";
}

type Props = {
  dados: DadosOrigemReserva | null | undefined;
  /** card = badge compacto; sheet = seção ORIGEM; detalhe = bloco completo */
  variante?: "card" | "sheet" | "detalhe";
};

/**
 * Indicador de origem da reserva (Site vs Atendente).
 * Mesma regra em Suítes, Reservas, Sheet e Detalhes.
 */
export default function OrigemReservaIndicador({
  dados,
  variante = "card",
}: Props) {
  if (!dados) return null;

  const origem = normalizarOrigemReserva(dados.origemReserva, {
    idUsuarioCriacao: dados.idUsuarioCriacao,
    valorPago: (dados as DadosOrigemReserva & { valorPago?: number }).valorPago,
    formaPagamentoRecepcao: (
      dados as DadosOrigemReserva & { formaPagamentoRecepcao?: string | null }
    ).formaPagamentoRecepcao,
  });
  const nome = dados.nomeUsuarioCriacao?.trim() || "Atendente";
  const dataIso = dados.dataCriacao
    ? typeof dados.dataCriacao === "string"
      ? dados.dataCriacao
      : new Date(dados.dataCriacao).toISOString()
    : null;

  if (variante === "card") {
    if (origem === "ATENDENTE") {
      return (
        <View style={[styles.badge, styles.badgeAtendente]}>
          <Text style={styles.badgeTextoAtendente}>🏢 Criada por {nome}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, styles.badgeSite]}>
        <Text style={styles.badgeTextoSite}>🌐 Reserva Online</Text>
      </View>
    );
  }

  if (variante === "sheet") {
    return (
      <View style={styles.sheetBox}>
        <Text style={styles.sheetTitulo}>ORIGEM</Text>
        {origem === "ATENDENTE" ? (
          <>
            <Text style={styles.sheetValor}>Criada pelo atendente</Text>
            <Text style={styles.sheetSub}>{nome}</Text>
            {dataIso ? (
              <Text style={styles.sheetSub}>
                {formatDateTimeHospedagem(dataIso)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.sheetValor}>Reserva Online</Text>
        )}
      </View>
    );
  }

  // detalhe
  return (
    <View style={styles.detalheBox}>
      <Text style={styles.detalheTitulo}>Origem da reserva</Text>
      {origem === "ATENDENTE" ? (
        <>
          <Text style={styles.detalheValor}>🏢 Atendimento interno</Text>
          <Text style={styles.detalheLabel}>Atendente</Text>
          <Text style={styles.detalheSub}>{nome}</Text>
          {dataIso ? (
            <>
              <Text style={[styles.detalheLabel, { marginTop: 8 }]}>
                Criada em
              </Text>
              <Text style={styles.detalheSub}>
                {formatDateTimeHospedagem(dataIso)}
              </Text>
            </>
          ) : null}
        </>
      ) : (
        <Text style={styles.detalheValor}>
          🌐 Reserva realizada pelo cliente
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeSite: {
    backgroundColor: "rgba(0,115,230,0.12)",
  },
  badgeAtendente: {
    backgroundColor: "rgba(107,114,128,0.16)",
  },
  badgeTextoSite: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0073E6",
  },
  badgeTextoAtendente: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  sheetBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  sheetTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sheetValor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  sheetSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  detalheBox: {
    marginTop: 4,
  },
  detalheTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    marginBottom: 6,
  },
  detalheValor: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  detalheLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
  },
  detalheSub: {
    fontSize: 15,
    color: "#333",
    marginTop: 2,
  },
});
