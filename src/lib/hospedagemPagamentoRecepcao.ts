export type FormaPagamentoRecepcao =
  | "PIX"
  | "Dinheiro"
  | "CartaoCredito"
  | "CartaoDebito"
  | "Transferencia"
  | "Outro";

export type OrigemReservaHospedagem = "SITE" | "ATENDENTE";

export const FORMAS_PAGAMENTO_RECEPCAO: Array<{
  value: FormaPagamentoRecepcao;
  label: string;
}> = [
  { value: "PIX", label: "PIX" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "CartaoCredito", label: "Cartão Crédito" },
  { value: "CartaoDebito", label: "Cartão Débito" },
  { value: "Transferencia", label: "Transferência" },
  { value: "Outro", label: "Outro" },
];

export const MSG_VALOR_PAGO_MAIOR =
  "O valor recebido não pode ser maior que o valor da reserva.";

export const COR_RECEBIDO = "#027a3a";
export const COR_SALDO_PENDENTE = "#e67e22";

export type PagamentoRecepcaoPayload = {
  valor: number;
  formaPagamento: FormaPagamentoRecepcao;
  comprovante?: string | null;
  observacao?: string | null;
};

export type DadosFinanceirosReserva = {
  origemReserva?: OrigemReservaHospedagem | "CLIENTE" | string | null;
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

  const saldo =
    dados.saldoPendente != null
      ? Number(dados.saldoPendente)
      : calcularSaldoPendente(
          Number(dados.valorTotal ?? 0),
          Number(dados.valorPago ?? 0),
        );
  return saldo > 0.009;
}

export function obterSaldoPendenteExibicao(
  dados: DadosFinanceirosReserva,
): number {
  if (dados.saldoPendente != null) return roundMoney(Number(dados.saldoPendente));
  return calcularSaldoPendente(
    Number(dados.valorTotal ?? 0),
    Number(dados.valorPago ?? 0),
  );
}
