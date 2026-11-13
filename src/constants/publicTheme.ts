import colors from "./colors";

/** Tokens visuais da jornada pública de compra (sem alterar colors legado). */
export const publicTheme = {
  /** Fundo neutro opcional (`PublicShopLayout variant="neutral"`). */
  background: "#F8FAFC",
  /** Gradiente oficial da jornada pública (identidade Jango). */
  brandGradient: [colors.white, colors.laranjado] as const,
  brandOrange: colors.laranjado,
  surface: "#FFFFFF",
  border: colors.line,
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  primary: "#FF8A00",
  primarySoft: "#FFF4E6",
  /** CTAs, stepper ativo, contadores — azul legado Jango. */
  accent: colors.azul,
  accentSoft: "rgba(0, 115, 230, 0.1)",
  link: colors.azul,
  success: "#16A34A",
  shadow: "rgba(15, 23, 42, 0.08)",
  headerHeightWeb: 72,
  headerHeightNative: 88,
  contentMaxWidth: 1280,
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 20,
} as const;

export type PublicEventCategory = "todos" | "ingresso" | "pousada";
