export const VALOR_ADICIONAL_ADULTO_EXTRA = 150;
export const VALOR_ADICIONAL_CRIANCA_EXTRA = 120;

export type SuitePrecificacaoInput = {
  preco: unknown;
  taxaServico: unknown;
  valor: unknown;
  qtdeMinimaPessoas?: number | null;
  qtdeMaximaPessoas?: number | null;
  valorAdultoExtra?: unknown;
  valorCriancaExtra?: unknown;
};

function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function inicioDoDia(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function calcularNoitesHotelaria(checkin: Date, checkout: Date): number {
  const inicio = inicioDoDia(checkin);
  const fim = inicioDoDia(checkout);
  const diffMs = fim.getTime() - inicio.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

function calcularExtrasOcupacao(
  adultos: number,
  criancas: number,
  qtdeMinimaPessoas?: number | null,
  qtdeMaximaPessoas?: number | null,
) {
  const total = adultos + criancas;
  const min = qtdeMinimaPessoas ?? 1;
  const max = qtdeMaximaPessoas ?? min;

  if (total > max || total < min) {
    return null;
  }

  const adultosIncluidos = Math.min(adultos, min);
  const criancasIncluidas = Math.min(criancas, min - adultosIncluidos);
  const adultosExtras = adultos - adultosIncluidos;
  const criancasExtras = criancas - criancasIncluidas;

  return {
    adultosExtras,
    criancasExtras,
  };
}

function obterValoresExtrasSuite(suite: SuitePrecificacaoInput) {
  return {
    valorAdultoExtra: toNumber(
      suite.valorAdultoExtra ?? VALOR_ADICIONAL_ADULTO_EXTRA,
    ),
    valorCriancaExtra: toNumber(
      suite.valorCriancaExtra ?? VALOR_ADICIONAL_CRIANCA_EXTRA,
    ),
  };
}

function calcularTotaisSuitePousada(
  suite: SuitePrecificacaoInput,
  adultos: number,
  criancas: number,
  noites: number,
) {
  const extras = calcularExtrasOcupacao(
    adultos,
    criancas,
    suite.qtdeMinimaPessoas,
    suite.qtdeMaximaPessoas,
  );

  if (!extras || noites < 1) {
    return null;
  }

  const { valorAdultoExtra, valorCriancaExtra } = obterValoresExtrasSuite(suite);
  const precoDiaria = toNumber(suite.preco);
  const taxaDiaria = toNumber(suite.taxaServico);

  const suitePreco = roundMoney(precoDiaria * noites);
  const suiteTaxa = roundMoney(taxaDiaria * noites);

  const extraAdultoValor = roundMoney(
    extras.adultosExtras * valorAdultoExtra * noites,
  );
  const extraCriancaValor = roundMoney(
    extras.criancasExtras * valorCriancaExtra * noites,
  );

  const precoTotal = roundMoney(suitePreco + extraAdultoValor + extraCriancaValor);
  const valorTotal = roundMoney(precoTotal + suiteTaxa);

  return {
    ...extras,
    suitePreco,
    extraAdultoValor,
    extraCriancaValor,
    valorTotal,
    temExtras: extras.adultosExtras > 0 || extras.criancasExtras > 0,
  };
}

export type SubtotalSuitePousada = {
  suitePreco: number;
  adultosExtras: number;
  criancasExtras: number;
  extraAdultoValor: number;
  extraCriancaValor: number;
  valorTotal: number;
  temExtras: boolean;
};

export function calcularSubtotalSuitePousada(
  suite: SuitePrecificacaoInput,
  adultos: number,
  criancas: number,
  noites: number,
): SubtotalSuitePousada | null {
  const totais = calcularTotaisSuitePousada(suite, adultos, criancas, noites);
  if (!totais) {
    return null;
  }

  return {
    suitePreco: totais.suitePreco,
    adultosExtras: totais.adultosExtras,
    criancasExtras: totais.criancasExtras,
    extraAdultoValor: totais.extraAdultoValor,
    extraCriancaValor: totais.extraCriancaValor,
    valorTotal: totais.valorTotal,
    temExtras: totais.temExtras,
  };
}
