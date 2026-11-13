import { Platform, StyleSheet } from "react-native";
import { publicTheme } from "@/src/constants/publicTheme";

/** Estilos compartilhados das telas de checkout (conferência / pagamento). */
export const checkoutScreenStyles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 12,
    maxWidth: publicTheme.contentMaxWidth,
    width: "100%",
    alignSelf: "center",
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: publicTheme.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  areaStep: {
    marginBottom: 12,
  },
  eventHero: {
    marginBottom: 16,
    overflow: "hidden",
  },
  eventHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  eventHeroRowHospedagem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  imagem: {
    width: 88,
    height: 88,
    borderRadius: publicTheme.radiusMd,
    resizeMode: "cover",
    backgroundColor: publicTheme.border,
  },
  tituloEvento: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
  },
  tituloEventoHospedagem: {
    flexShrink: 0,
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    ...(Platform.OS === "web"
      ? ({ whiteSpace: "nowrap" } as object)
      : null),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    marginBottom: 12,
  },
  ticketContainer: {
    marginTop: 10,
    marginBottom: 8,
    padding: 16,
    borderRadius: publicTheme.radiusMd,
    backgroundColor: publicTheme.surface,
    borderWidth: 1,
    borderColor: publicTheme.border,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      default: { elevation: 2 },
    }),
  },
  ticketTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: publicTheme.border,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: publicTheme.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: publicTheme.primary,
  },
  cupomRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    alignItems: "flex-start",
  },
  cupomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: publicTheme.border,
    borderRadius: publicTheme.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: publicTheme.background,
    color: publicTheme.textPrimary,
    minHeight: 48,
  },
  cupomBtn: {
    backgroundColor: publicTheme.accent,
    paddingHorizontal: 16,
    borderRadius: publicTheme.radiusSm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cupomBtnText: {
    color: publicTheme.surface,
    fontWeight: "700",
    fontSize: 14,
  },
});
