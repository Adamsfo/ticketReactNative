import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  CORES_STATUS_OPERACIONAL,
  formatHoraHospedagem,
} from "@/src/lib/hospedagemStatusOperacional";

export const LABEL_AGUARDANDO_ACOMODACAO_DESTAQUE = "AGUARDANDO ACOMODAÇÃO";

type BadgeProps = {
  compact?: boolean;
  /** Ocupa a largura disponível (sheet/modal). */
  fullWidth?: boolean;
};

/** Badge destacado para o estado operacional "hóspede chegou". */
export function BadgeHospedeChegou({ compact, fullWidth }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        fullWidth && styles.badgeFullWidth,
      ]}
    >
      <Feather
        name="users"
        size={compact ? 11 : 12}
        color="#fff"
        style={styles.badgeIcon}
      />
      <Text
        style={[styles.badgeTexto, compact && styles.badgeTextoCompact]}
        numberOfLines={1}
      >
        HÓSPEDE CHEGOU
      </Text>
    </View>
  );
}

type PainelProps = {
  dataHoraChegadaReal?: string | null;
  compact?: boolean;
};

/** Área de destaque: horário da chegada + aguardando acomodação. */
export function PainelHospedeChegou({
  dataHoraChegadaReal,
  compact,
}: PainelProps) {
  const horarioFormatado = dataHoraChegadaReal
    ? formatHoraHospedagem(dataHoraChegadaReal)
    : null;
  const linhaChegada =
    horarioFormatado != null && horarioFormatado !== "--:--"
      ? `Chegada registrada às ${horarioFormatado}`
      : null;

  return (
    <View style={[styles.painel, compact && styles.painelCompact]}>
      <Feather
        name="clock"
        size={compact ? 16 : 18}
        color={CORES_STATUS_OPERACIONAL.livre}
        style={styles.painelIcon}
      />
      <View style={styles.painelTextos}>
        {linhaChegada ? (
          <Text
            style={[
              styles.painelPrincipal,
              compact && styles.painelPrincipalCompact,
            ]}
            numberOfLines={2}
          >
            {linhaChegada}
          </Text>
        ) : null}
        <Text
          style={[
            styles.painelSecundario,
            compact && styles.painelSecundarioCompact,
          ]}
          numberOfLines={1}
        >
          {LABEL_AGUARDANDO_ACOMODACAO_DESTAQUE}
        </Text>
      </View>
    </View>
  );
}

const VERDE = CORES_STATUS_OPERACIONAL.livre;

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    flexShrink: 0,
    maxWidth: "62%",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: VERDE,
    gap: 5,
  },
  badgeCompact: {
    maxWidth: "68%",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeFullWidth: {
    alignSelf: "stretch",
    maxWidth: "100%",
    justifyContent: "center",
  },
  badgeIcon: {
    flexShrink: 0,
  },
  badgeTexto: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.35,
  },
  badgeTextoCompact: {
    fontSize: 10,
    letterSpacing: 0.25,
  },
  painel: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(2, 122, 58, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(2, 122, 58, 0.22)",
  },
  painelCompact: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  painelIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  painelTextos: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  painelPrincipal: {
    fontSize: 14,
    fontWeight: "700",
    color: VERDE,
    lineHeight: 19,
  },
  painelPrincipalCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  painelSecundario: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#344054",
    lineHeight: 16,
  },
  painelSecundarioCompact: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
