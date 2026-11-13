import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { Evento, TipoEvento } from "@/src/types/geral";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import formatCurrency from "../FormatCurrency";
import { api } from "@/src/lib/api";
import { CalendarIcon, MapPinIcon, Ticket } from "lucide-react-native";
import { publicTheme } from "@/src/constants/publicTheme";

interface CardEventoProps {
  data: Evento;
  onPress: () => void;
  widthCardItem: number;
  /** Centraliza card em telas estreitas (Home mobile). */
  centeredOnNarrowScreen?: boolean;
  /** Mesma largura/altura na grade da Home (desktop). */
  uniformDesktop?: boolean;
}

function labelTipo(tipo?: TipoEvento): string {
  if (tipo === TipoEvento.Pousada) return "Hospedagem";
  return "Ingresso";
}

export default function CardEvento({
  data,
  onPress,
  widthCardItem,
  centeredOnNarrowScreen = false,
  uniformDesktop = false,
}: CardEventoProps) {
  const isPousada = data.tipo === TipoEvento.Pousada;
  const precoLabel =
    data.MenorValor !== undefined
      ? formatCurrency(data.MenorValor.toFixed(2))
      : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        uniformDesktop && styles.cardUniform,
        uniformDesktop
          ? {
              width: widthCardItem,
              maxWidth: widthCardItem,
              alignSelf: "stretch",
            }
          : centeredOnNarrowScreen
            ? {
                width: widthCardItem,
                maxWidth: "100%",
                alignSelf: "center",
              }
            : {
                maxWidth: widthCardItem,
                width: "100%",
                flex: 1,
              },
      ]}
      activeOpacity={0.92}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Evento ${data.nome}`}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: api.getBaseApi() + "/uploads/" + data.imagem }}
          style={styles.image}
        />
        <View style={styles.badgeTipo}>
          <Text style={styles.badgeTipoText}>{labelTipo(data.tipo)}</Text>
        </View>
        {data.Produtor_logo ? (
          <Image
            source={{
              uri: api.getBaseApi() + "/uploads/" + data.Produtor_logo,
            }}
            style={styles.logo}
          />
        ) : null}
      </View>

      <View style={[styles.content, uniformDesktop && styles.contentUniform]}>
        <Text style={styles.title} numberOfLines={2}>
          {data.nome}
        </Text>

        <View style={styles.row}>
          <MapPinIcon size={16} color={publicTheme.textSecondary} />
          <Text style={styles.text} numberOfLines={2}>
            {data.endereco}
          </Text>
        </View>

        {!isPousada ? (
          <View style={[styles.row, uniformDesktop && styles.dateSlot]}>
            <CalendarIcon size={16} color={publicTheme.textSecondary} />
            <Text style={styles.text} numberOfLines={2}>
              {formatInTimeZone(
                parseISO(data.data_hora_inicio.toString()),
                "America/Cuiaba",
                "dd/MM/yyyy HH:mm",
              )}{" "}
              —{" "}
              {formatInTimeZone(
                parseISO(data.data_hora_fim.toString()),
                "America/Cuiaba",
                "dd/MM/yyyy HH:mm",
              )}
            </Text>
          </View>
        ) : uniformDesktop ? (
          <View style={styles.dateSlot} />
        ) : null}

        <View
          style={[styles.footer, uniformDesktop && styles.footerUniform]}
        >
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.priceValue}>
              {precoLabel ?? "Consulte"}
            </Text>
          </View>
          <View style={styles.cta}>
            <Ticket size={16} color={publicTheme.surface} />
            <Text style={styles.ctaText}>Ver</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardUniform: {
    flex: 1,
    ...Platform.select({
      web: { height: "100%" },
      default: { alignSelf: "stretch" },
    }),
  },
  card: {
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusLg,
    margin: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: publicTheme.border,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      default: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#E2E8F0",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  badgeTipo: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeTipoText: {
    color: publicTheme.surface,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  logo: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 56,
    height: 40,
    resizeMode: "contain",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: publicTheme.radiusSm,
    padding: 4,
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 8,
  },
  contentUniform: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  dateSlot: {
    minHeight: 44,
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    lineHeight: 24,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  text: {
    flex: 1,
    color: publicTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: publicTheme.border,
  },
  footerUniform: {
    marginTop: "auto",
  },
  priceBlock: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: publicTheme.textMuted,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: publicTheme.primary,
    marginTop: 2,
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: publicTheme.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: publicTheme.radiusMd,
  },
  ctaText: {
    color: publicTheme.surface,
    fontWeight: "700",
    fontSize: 14,
  },
});
