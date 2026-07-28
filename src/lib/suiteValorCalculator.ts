/**
 * Regra única de Valor da suíte (frontend).
 *
 * - Enquanto o usuário não definir Valor manualmente: Valor = Preço + Taxa.
 * - Após edição manual do Valor: campo independente (Preço/Taxa não alteram mais).
 * - Backend apenas persiste o valor enviado; não recalcula.
 */

import { roundMoney } from "@/src/lib/mascaraMoeda";

export type SuiteMoneyInput = {
  preco?: number | null;
  taxaServico?: number | null;
  /** Ausente/null = ainda não definido. */
  valor?: number | null;
};

export type SuiteValorResolved = {
  preco: number;
  taxaServico: number;
  valor: number;
  /** false = ainda segue Preço + Taxa */
  valorManual: boolean;
};

/**
 * Resolve Preço/Taxa/Valor + flag manual ao carregar qualquer fluxo
 * (nova suíte, edição ou prefill Hospedin).
 */
export function resolveSuiteValorState(
  input: SuiteMoneyInput,
): SuiteValorResolved {
  const preco = roundMoney(Number(input.preco ?? 0) || 0);
  const taxaServico = roundMoney(Number(input.taxaServico ?? 0) || 0);
  const sugerido = roundMoney(preco + taxaServico);

  if (input.valor === undefined || input.valor === null) {
    return { preco, taxaServico, valor: sugerido, valorManual: false };
  }

  const valorInformado = roundMoney(Number(input.valor) || 0);

  // Compatibilidade: Valor 0 com sugestão > 0 = ainda não definido manualmente.
  if (valorInformado === 0 && sugerido > 0) {
    return { preco, taxaServico, valor: sugerido, valorManual: false };
  }

  if (valorInformado === sugerido) {
    return {
      preco,
      taxaServico,
      valor: valorInformado,
      valorManual: false,
    };
  }

  return {
    preco,
    taxaServico,
    valor: valorInformado,
    valorManual: true,
  };
}

/**
 * Atualiza Preço ou Taxa; recalcula Valor só se ainda não for manual.
 */
export function applySuitePrecoTaxaChange(
  state: { preco: number; taxaServico: number; valor: number },
  field: "preco" | "taxaServico",
  nextValue: number,
  valorManual: boolean,
): { preco: number; taxaServico: number; valor: number } {
  const safe = roundMoney(Number.isFinite(nextValue) ? nextValue : 0);
  const preco = field === "preco" ? safe : roundMoney(Number(state.preco || 0));
  const taxaServico =
    field === "taxaServico"
      ? safe
      : roundMoney(Number(state.taxaServico || 0));

  return {
    preco,
    taxaServico,
    valor: valorManual
      ? roundMoney(Number(state.valor || 0))
      : roundMoney(preco + taxaServico),
  };
}

/** Marca edição manual do Valor. */
export function applySuiteValorManual(nextValue: number): {
  valor: number;
  valorManual: true;
} {
  const valor = roundMoney(Number.isFinite(nextValue) ? nextValue : 0);
  return { valor, valorManual: true };
}

export { roundMoney };
