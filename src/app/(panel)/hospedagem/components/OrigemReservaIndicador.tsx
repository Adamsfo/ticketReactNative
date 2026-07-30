import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";

export type DadosOrigemReserva = {
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | "HOSPEDIN" | string | null;
  canalVenda?: string | null;
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
): "CLIENTE" | "ATENDENTE" | "HOSPEDIN" | string {
  const raw = String(origem || "").toUpperCase();
  if (raw === "HOSPEDIN") return "HOSPEDIN";
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

/** Chip compacto de origem (card / resumo próxima reserva). */
export function labelChipOrigemReserva(
  dados: DadosOrigemReserva | null | undefined,
): { texto: string; atendente: boolean } | null {
  if (!dados) return null;
  const raw = String(dados.origemReserva || "").toUpperCase();
  const nome = dados.nomeUsuarioCriacao?.trim() || "Atendente";
  const canal = String(dados.canalVenda || "").trim().toUpperCase();

  if (raw === "HOSPEDIN") {
    const canalLabel =
      canal === "BOOKING"
        ? "Booking.com"
        : canal === "AIRBNB"
          ? "Airbnb"
          : canal === "EXPEDIA"
            ? "Expedia"
            : canal === "SITE"
              ? "Site"
              : canal
                ? dados.canalVenda
                : null;
    return {
      texto: canalLabel ? `🔗 Hospedin · ${canalLabel}` : "🔗 Hospedin",
      atendente: false,
    };
  }
  if (raw === "BOOKING") {
    return { texto: "🌐 Booking.com", atendente: false };
  }
  if (raw === "EXPEDIA") {
    return { texto: "🌐 Expedia", atendente: false };
  }
  if (raw === "AIRBNB") {
    return { texto: "🌐 Airbnb", atendente: false };
  }
  if (raw === "TELEFONE") {
    return { texto: "☎️ Telefone", atendente: false };
  }
  if (raw === "BALCAO" || raw === "BALCÃO") {
    return { texto: "🚶 Balcão", atendente: false };
  }
  if (
    raw === "ATENDENTE" ||
    Number(dados.idUsuarioCriacao ?? 0) > 0
  ) {
    return { texto: `🧑‍💼 Criada por ${nome}`, atendente: true };
  }
  if (raw === "SITE" || raw === "CLIENTE" || raw === "LINK_CLIENTE" || !raw) {
    const canalNorm = normalizarOrigemReserva(dados.origemReserva, {
      idUsuarioCriacao: dados.idUsuarioCriacao,
    });
    if (canalNorm === "ATENDENTE") {
      return { texto: `🧑‍💼 Criada por ${nome}`, atendente: true };
    }
    return { texto: "💻 Site", atendente: false };
  }
  return { texto: `🌐 ${dados.origemReserva}`, atendente: false };
}

type Props = {
  dados: DadosOrigemReserva | null | undefined;
  /** card = badge compacto; sheet = seção ORIGEM; detalhe = bloco completo */
  variante?: "card" | "sheet" | "detalhe";
};

/**
 * Indicador de origem da reserva (Site, Atendente, OTAs…).
 * Mesma regra em Suítes, Reservas, Sheet e Detalhes.
 */
export default function OrigemReservaIndicador({
  dados,
  variante = "card",
}: Props) {
  if (!dados) return null;

  const chip = labelChipOrigemReserva(dados);
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
    if (!chip) return null;
    return (
      <View
        style={[
          styles.badge,
          chip.atendente ? styles.badgeAtendente : styles.badgeSite,
        ]}
      >
        <Text
          style={
            chip.atendente
              ? styles.badgeTextoAtendente
              : styles.badgeTextoSite
          }
        >
          {chip.texto}
        </Text>
      </View>
    );
  }

  if (variante === "sheet") {
    if (origem === "HOSPEDIN") {
      const canalTxt = dados.canalVenda
        ? String(dados.canalVenda).trim()
        : null;
      return (
        <View style={styles.sheetBox}>
          <Text style={styles.sheetValor}>Hospedin</Text>
          {canalTxt ? (
            <Text style={styles.sheetSub}>Canal: {canalTxt}</Text>
          ) : null}
        </View>
      );
    }
    return (
      <View style={styles.sheetBox}>
        {origem === "ATENDENTE" ? (
          <>
            <Text style={styles.sheetValor}>Criada por {nome}</Text>
            {dataIso ? (
              <Text style={styles.sheetSub}>
                {formatDateTimeHospedagem(dataIso)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.sheetValor}>
            {chip?.texto?.replace(/^[^\s]+\s/, "") || "Reserva Online"}
          </Text>
        )}
      </View>
    );
  }

  // detalhe
  if (origem === "HOSPEDIN") {
    return (
      <View style={styles.detalheBox}>
        <Text style={styles.detalheTitulo}>Origem da reserva</Text>
        <Text style={styles.detalheValor}>🔗 Integração Hospedin</Text>
        {dados.canalVenda ? (
          <>
            <Text style={[styles.detalheLabel, { marginTop: 8 }]}>
              Canal de venda
            </Text>
            <Text style={styles.detalheSub}>{dados.canalVenda}</Text>
          </>
        ) : null}
      </View>
    );
  }

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
          {chip?.texto || "🌐 Reserva realizada pelo cliente"}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  badgeAtendente: {
    backgroundColor: "rgba(0, 115, 230, 0.12)",
  },
  badgeSite: {
    backgroundColor: "rgba(2, 122, 58, 0.12)",
  },
  badgeTextoAtendente: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0073E6",
  },
  badgeTextoSite: {
    fontSize: 11,
    fontWeight: "700",
    color: "#027a3a",
  },
  sheetBox: {
    gap: 2,
  },
  sheetTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sheetValor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  sheetSub: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  detalheBox: {
    marginTop: 12,
  },
  detalheTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 6,
  },
  detalheValor: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  detalheLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  detalheSub: {
    fontSize: 14,
    color: "#374151",
  },
});
