import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";
import {
  emojiUiStatus,
  labelUiStatus,
  SyncIntegracaoResumo,
} from "@/src/lib/integrationsAdmin";

type Props = {
  sync?: SyncIntegracaoResumo | null;
  compact?: boolean;
};

/**
 * Chip discreto de status de sincronização (lista / cards).
 */
export default function SyncStatusIndicator({ sync, compact }: Props) {
  if (!sync?.uiStatus) return null;

  const emoji = emojiUiStatus(sync.uiStatus);
  const label = labelUiStatus(sync.uiStatus);
  const titleParts = [
    `Última sincronização: ${
      sync.lastSyncAt
        ? formatDateTimeHospedagem(sync.lastSyncAt)
        : "—"
    }`,
    sync.syncAction
      ? `Resultado: ${sync.syncAction}${
          sync.uiStatus === "ERRO" ? " falhou" : ""
        }`
      : null,
    sync.lastError ? `Motivo: ${sync.lastError}` : null,
    sync.errorSeverityLabel
      ? `Severidade: ${sync.errorSeverityLabel}`
      : null,
  ].filter(Boolean);

  return (
    <View
      style={[
        styles.chip,
        sync.uiStatus === "ERRO" && styles.chipErro,
        sync.uiStatus === "SINCRONIZADA" && styles.chipOk,
      ]}
      // @ts-expect-error title web tooltip
      title={Platform.OS === "web" ? titleParts.join("\n") : undefined}
      accessibilityLabel={titleParts.join(". ")}
      accessibilityHint={titleParts.join(". ")}
    >
      <Text style={styles.chipTexto}>
        {emoji}
        {compact ? "" : ` ${label}`}
      </Text>
      {Platform.OS !== "web" && sync.uiStatus === "ERRO" && sync.lastError ? (
        <Text style={styles.hint} numberOfLines={2}>
          {sync.lastError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(107, 114, 128, 0.12)",
    maxWidth: 220,
  },
  chipErro: {
    backgroundColor: "rgba(185, 28, 28, 0.12)",
  },
  chipOk: {
    backgroundColor: "rgba(2, 122, 58, 0.12)",
  },
  chipTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  hint: {
    marginTop: 2,
    fontSize: 10,
    color: "#b91c1c",
  },
});
