import {
  buildPeriodoPadraoDisponibilidadePousada,
  getMenorValorCotacaoSuitesDisponibilidade,
} from "./reservaSuiteHomePricing";

describe("buildPeriodoPadraoDisponibilidadePousada", () => {
  it("usa hoje 16:00 e amanhã 13:00 quando check-in de hoje ainda é futuro", () => {
    const agora = new Date("2026-03-16T10:00:00.000Z");
    const { checkin, checkout } = buildPeriodoPadraoDisponibilidadePousada(agora);

    expect(new Date(checkin).getHours()).toBe(16);
    expect(new Date(checkout).getHours()).toBe(13);
    expect(new Date(checkout).getDate()).toBe(
      new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1).getDate()
    );
  });

  it("avança um dia quando o check-in de hoje já passou", () => {
    const agora = new Date("2026-03-16T22:00:00.000Z");
    const { checkin, checkout } = buildPeriodoPadraoDisponibilidadePousada(agora);
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);

    expect(checkinDate.getDate()).toBe(17);
    expect(checkoutDate.getDate()).toBe(18);
  });
});

describe("getMenorValorCotacaoSuitesDisponibilidade", () => {
  it("retorna o menor cotacao.valorTotal estritamente maior que R$ 200", () => {
    const menor = getMenorValorCotacaoSuitesDisponibilidade([
      { cotacao: { valorTotal: 250 } },
      { cotacao: { valorTotal: 80 } },
      { cotacao: { valorTotal: 120 } },
      { cotacao: { valorTotal: 180 } },
      { cotacao: { valorTotal: 200 } },
      { cotacao: { valorTotal: 350 } },
    ]);

    expect(menor).toBe(250);
  });

  it("retorna undefined quando não há cotações acima de R$ 200", () => {
    expect(getMenorValorCotacaoSuitesDisponibilidade([])).toBeUndefined();
    expect(
      getMenorValorCotacaoSuitesDisponibilidade([
        { cotacao: { valorTotal: 0 } },
        { cotacao: { valorTotal: 80 } },
        { cotacao: { valorTotal: 200 } },
      ])
    ).toBeUndefined();
  });
});
