/**
 * Precificação de ingresso — mesma base do checkout (ModalResumoIngresso).
 * O valor final unitário cobrado é `EventoIngresso.valor`
 * (já inclui taxaServico gravada no tipo de ingresso).
 */

export type IngressoPrecoCampos = {
  preco: number;
  taxaServico: number;
  valor: number;
};

/** Valor final unitário pago no checkout (1 ingresso). */
export function getValorFinalUnitarioIngresso(
  ingresso: Pick<IngressoPrecoCampos, "valor">
): number {
  return Number(ingresso.valor) || 0;
}

/** Menor valor final disponível entre os ingressos (ex.: card da Home). */
export function getMenorValorFinalIngressos(
  ingressos: Array<Pick<IngressoPrecoCampos, "valor">>
): number | undefined {
  if (!ingressos.length) return undefined;
  return Math.min(...ingressos.map(getValorFinalUnitarioIngresso));
}
