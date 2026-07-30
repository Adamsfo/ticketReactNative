import { useWindowDimensions } from "react-native";

/** Breakpoints da grade de suítes (sem largura fixa nos cards). */
export const HOSPEDAGEM_DESKTOP_MIN_WIDTH = 900;
export const HOSPEDAGEM_DESKTOP_MAX_CONTENT = 1450;
/** Desktop grande → 3 colunas */
export const HOSPEDAGEM_SUITE_3COL_MIN_WIDTH = 1200;
/** Notebook / tablet → 2 colunas */
export const HOSPEDAGEM_SUITE_2COL_MIN_WIDTH = 700;

/**
 * Layout da Hospedagem: largura máxima + grid responsiva de suítes.
 * Desktop grande ≥1200 → 3 cols | Notebook/tablet ≥700 → 2 | Mobile → 1
 */
export function useHospedagemDesktopLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= HOSPEDAGEM_DESKTOP_MIN_WIDTH;
  const suiteColumns =
    width >= HOSPEDAGEM_SUITE_3COL_MIN_WIDTH
      ? 3
      : width >= HOSPEDAGEM_SUITE_2COL_MIN_WIDTH
        ? 2
        : 1;
  return {
    width,
    isDesktop,
    suiteColumns,
    contentMaxWidth: HOSPEDAGEM_DESKTOP_MAX_CONTENT,
  };
}
