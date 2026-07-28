import { useWindowDimensions } from "react-native";

/** Breakpoint exclusivo desktop/notebook — mobile/tablet inalterados. */
export const HOSPEDAGEM_DESKTOP_MIN_WIDTH = 900;
export const HOSPEDAGEM_DESKTOP_MAX_CONTENT = 1450;

/**
 * Layout desktop da Hospedagem: largura máxima + grid 2 colunas.
 * Em telas < 900px retorna isDesktop=false (UI mobile intacta).
 */
export function useHospedagemDesktopLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= HOSPEDAGEM_DESKTOP_MIN_WIDTH;
  /** Duas colunas quando o conteúdo útil comporta (~900+). */
  const suiteColumns = isDesktop ? 2 : 1;
  return {
    width,
    isDesktop,
    suiteColumns,
    contentMaxWidth: HOSPEDAGEM_DESKTOP_MAX_CONTENT,
  };
}
