export type FormaPagamentoRecepcao =
  | "PIX"
  | "Dinheiro"
  | "CartaoCredito"
  | "CartaoDebito"
  | "Transferencia"
  | "LinkPagamento"
  | "Antecipado"
  | "RECEBIDO_OTA"
  | "Outro";

/** Valores de produção: CLIENTE | ATENDENTE. SITE = legado. */
export type OrigemReservaHospedagem =
  | "CLIENTE"
  | "ATENDENTE"
  | "SITE"
  | string;

export const FORMAS_PAGAMENTO_RECEPCAO: Array<{
  value: FormaPagamentoRecepcao;
  label: string;
}> = [
  { value: "PIX", label: "PIX" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "CartaoCredito", label: "Cartão Crédito" },
  { value: "CartaoDebito", label: "Cartão Débito" },
  { value: "Transferencia", label: "Transferência" },
  { value: "LinkPagamento", label: "Link de Pagamento" },
  { value: "Antecipado", label: "Antecipado" },
  { value: "RECEBIDO_OTA", label: "Recebido pela OTA" },
  { value: "Outro", label: "Outro" },
];

/** Formas que não entram no caixa / fechamento do operador. */
export const FORMAS_PAGAMENTO_FORA_DO_CAIXA: FormaPagamentoRecepcao[] = [
  "RECEBIDO_OTA",
];

export function isFormaPagamentoForaDoCaixa(
  forma: string | null | undefined,
): boolean {
  return (
    typeof forma === "string" &&
    (FORMAS_PAGAMENTO_FORA_DO_CAIXA as string[]).includes(forma)
  );
}

export const MSG_VALOR_PAGO_MAIOR =
  "O valor recebido não pode ser maior que o valor da reserva.";

export const MSG_VALOR_MAIOR_QUE_SALDO =
  "O valor recebido não pode ser maior que o saldo pendente.";

export const MSG_CHECKIN_BLOQUEADO_SALDO =
  "Não é possível realizar o check-in enquanto houver saldo pendente. Receba o pagamento antes de prosseguir.";

export const COR_RECEBIDO = "#027a3a";
export const COR_SALDO_PENDENTE = "#e67e22";

export type PagamentoRecepcaoPayload = {
  valor: number;
  formaPagamento: FormaPagamentoRecepcao;
  comprovante?: string | null;
  observacao?: string | null;
};

export type DadosFinanceirosReserva = {
  origemReserva?: OrigemReservaHospedagem | null;
  idUsuarioCriacao?: number | null;
  valorPago?: number | null;
  saldoPendente?: number | null;
  valorTotal?: number | null;
  formaPagamentoRecepcao?: string | null;
  formaPagamentoLabel?: string | null;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseValorMonetario(raw: string): number {
  const normalizado = raw.replace(/\s/g, "").replace(",", ".").trim();
  if (!normalizado) return 0;
  const n = Number(normalizado);
  return Number.isNaN(n) ? NaN : roundMoney(n);
}

export function calcularSaldoPendente(
  valorTotal: number,
  valorPago: number,
): number {
  return roundMoney(Math.max(0, valorTotal - valorPago));
}

export function reservaQuitada(valorTotal: number, valorPago: number): boolean {
  return roundMoney(valorPago) >= roundMoney(valorTotal) - 0.009;
}

export function valorPagoValido(
  valorTotal: number,
  valorPago: number,
): boolean {
  if (Number.isNaN(valorPago) || valorPago < 0) return false;
  return valorPago <= roundMoney(valorTotal) + 0.009;
}

export function labelFormaPagamentoRecepcao(
  forma: string | null | undefined,
): string {
  const found = FORMAS_PAGAMENTO_RECEPCAO.find((f) => f.value === forma);
  if (found) return found.label;
  return forma ? String(forma) : "";
}

/**
 * Exibe bloco financeiro somente se:
 * origem ATENDENTE && saldoPendente > 0
 * (site e quitadas não mostram nada)
 */
export function deveExibirFinanceiroRecepcao(
  dados: DadosFinanceirosReserva | null | undefined,
): boolean {
  if (!dados) return false;
  const origemRaw = String(dados.origemReserva ?? "");
  const origemAtendente =
    origemRaw === "ATENDENTE" ||
    Number(
      (dados as DadosFinanceirosReserva & { idUsuarioCriacao?: number })
        .idUsuarioCriacao ?? 0,
    ) > 0 ||
    Number(dados.valorPago ?? 0) > 0 ||
    Boolean(dados.formaPagamentoRecepcao);
  if (!origemAtendente) return false;

  return obterSaldoPendenteExibicao(dados) > 0.009;
}

/**
 * Saldo para UI: preferencialmente ReservaHospedagem.saldo_pendente,
 * desde que coerente com valor_total - valor_pago. Caso contrário, recalcula.
 */
export function obterSaldoPendenteExibicao(
  dados: DadosFinanceirosReserva,
): number {
  const valorTotal = roundMoney(Number(dados.valorTotal ?? 0));
  const valorPago = roundMoney(Number(dados.valorPago ?? 0));
  const calculado = calcularSaldoPendente(valorTotal, valorPago);

  if (dados.saldoPendente == null) return calculado;

  const coluna = roundMoney(Number(dados.saldoPendente));
  if (Number.isNaN(coluna)) return calculado;

  // Coluna desatualizada (ex.: 0 com valor_pago < valor_total) → usa o cálculo.
  if (Math.abs(coluna - calculado) > 0.009) return calculado;

  return coluna;
}

/** Impede início do check-in enquanto houver qualquer valor pendente. */
export function bloqueiaCheckinPorSaldoPendente(
  dados: DadosFinanceirosReserva | null | undefined,
): boolean {
  if (!dados) return false;
  return obterSaldoPendenteExibicao(dados) > 0.009;
}
