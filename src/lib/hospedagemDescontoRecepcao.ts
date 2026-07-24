export type DescontoRecepcaoTipo = "PERCENTUAL" | "VALOR";

export type DescontoRecepcaoInput = {
  tipo: DescontoRecepcaoTipo;
  valor: number;
};

export const DESCONTO_MAX_PERCENTUAL_RECEPCAO = 30;
export const MSG_DESCONTO_INVALIDO = "O desconto informado é inválido.";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calcularValorDesconto(
  valorOriginal: number,
  desconto: DescontoRecepcaoInput,
): number {
  if (desconto.tipo === "PERCENTUAL") {
    return roundMoney((valorOriginal * desconto.valor) / 100);
  }
  return roundMoney(desconto.valor);
}

export function calcularValorFinalComDesconto(
  valorOriginal: number,
  desconto: DescontoRecepcaoInput | null | undefined,
): number {
  if (!desconto || desconto.valor <= 0) {
    return roundMoney(valorOriginal);
  }
  const valorDesconto = calcularValorDesconto(valorOriginal, desconto);
  return roundMoney(Math.max(0, valorOriginal - valorDesconto));
}

export function descontoRecepcaoValido(
  valorOriginal: number,
  desconto: DescontoRecepcaoInput | null | undefined,
): boolean {
  if (!desconto || desconto.valor <= 0) {
    return true;
  }

  if (valorOriginal <= 0) {
    return false;
  }

  if (desconto.tipo === "PERCENTUAL") {
    if (
      desconto.valor > 100 ||
      desconto.valor > DESCONTO_MAX_PERCENTUAL_RECEPCAO
    ) {
      return false;
    }
    const valorDesconto = calcularValorDesconto(valorOriginal, desconto);
    return valorDesconto > 0 && valorDesconto < valorOriginal;
  }

  return desconto.valor > 0 && desconto.valor < valorOriginal;
}

export function aplicarDescontoProporcional(
  preco: number,
  taxaServico: number,
  valorFinal: number,
): { preco: number; taxaServico: number; valorTotal: number } {
  const valorOriginal = roundMoney(preco + taxaServico);
  if (valorOriginal <= 0) {
    return { preco: 0, taxaServico: 0, valorTotal: 0 };
  }

  if (valorFinal >= valorOriginal) {
    return {
      preco: roundMoney(preco),
      taxaServico: roundMoney(taxaServico),
      valorTotal: valorOriginal,
    };
  }

  const ratio = valorFinal / valorOriginal;
  const precoFinal = roundMoney(preco * ratio);
  const taxaFinal = roundMoney(valorFinal - precoFinal);

  return {
    preco: precoFinal,
    taxaServico: taxaFinal,
    valorTotal: roundMoney(valorFinal),
  };
}

export function formatarDescontoResumo(
  desconto: DescontoRecepcaoInput,
): string {
  if (desconto.tipo === "PERCENTUAL") {
    return `${desconto.valor}%`;
  }
  return `R$ ${desconto.valor.toFixed(2).replace(".", ",")}`;
}

export function parseDescontoInput(
  tipo: DescontoRecepcaoTipo,
  raw: string,
): DescontoRecepcaoInput | null {
  const normalizado = raw.replace(",", ".").trim();
  if (!normalizado) {
    return null;
  }
  const valor = Number(normalizado);
  if (Number.isNaN(valor) || valor <= 0) {
    return null;
  }
  return { tipo, valor: roundMoney(valor) };
}
