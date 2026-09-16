export type SuiteCotacaoDisponibilidade = {
  cotacao?: { valorTotal?: number };
};

/** Valores <= este limite são ignorados no card da Home (somente exibição). */
export const POUSADA_HOME_MENOR_VALOR_MINIMO = 200;

/**
 * Período padrão da tela Pousada (1 noite): check-in 16:00, check-out 13:00 do dia seguinte.
 * Se o check-in de hoje já passou, usa o próximo dia (mesma regra prática da busca na Pousada).
 */
export function buildPeriodoPadraoDisponibilidadePousada(
  agora: Date = new Date()
): { checkin: string; checkout: string } {
  const checkin = new Date(agora);
  checkin.setHours(16, 0, 0, 0);

  const checkout = new Date(agora);
  checkout.setDate(checkout.getDate() + 1);
  checkout.setHours(13, 0, 0, 0);

  if (checkin.getTime() <= agora.getTime()) {
    checkin.setDate(checkin.getDate() + 1);
    checkout.setDate(checkout.getDate() + 1);
  }

  return {
    checkin: checkin.toISOString(),
    checkout: checkout.toISOString(),
  };
}

/**
 * Menor `cotacao.valorTotal` para o card da Home (Pousada).
 * Considera apenas valores estritamente maiores que R$ 200,00.
 */
export function getMenorValorCotacaoSuitesDisponibilidade(
  suites: SuiteCotacaoDisponibilidade[]
): number | undefined {
  const valores = suites
    .map((suite) => Number(suite.cotacao?.valorTotal))
    .filter(
      (valor) =>
        Number.isFinite(valor) && valor > POUSADA_HOME_MENOR_VALOR_MINIMO
    );

  if (!valores.length) {
    return undefined;
  }

  return Math.min(...valores);
}
