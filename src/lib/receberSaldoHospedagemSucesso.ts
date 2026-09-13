import type { ReservaAdminDetalhe } from "./hospedagemAdmin";
import { obterSaldoPendenteExibicao } from "./hospedagemPagamentoRecepcao";
import { roundMoney } from "./mascaraMoeda";

export type SucessoConfirmacaoPagamento = {
  valorRecebido: number;
  valorPagoTotal: number;
  saldoRestante: number;
  valorTotal: number;
  quitada: boolean;
};

function isReservaAdminDetalhe(value: unknown): value is ReservaAdminDetalhe {
  if (!value || typeof value !== "object") return false;
  const row = value as ReservaAdminDetalhe;
  return (
    Number.isFinite(Number(row.idReservaHospedagem ?? row.id)) &&
    Number.isFinite(Number(row.valorTotal))
  );
}

/**
 * Extrai o detalhe da reserva retornado pelos endpoints de pagamento
 * (manual, dinheiro, TEF), sem inventar valores.
 */
export function extrairReservaDaRespostaPagamento(
  resposta: unknown,
): ReservaAdminDetalhe | null {
  if (!resposta || typeof resposta !== "object") return null;

  const root = resposta as Record<string, unknown>;

  if (isReservaAdminDetalhe(root)) {
    return root;
  }

  const data = root.data;
  if (isReservaAdminDetalhe(data)) {
    return data;
  }

  if (data && typeof data === "object") {
    const nested = data as Record<string, unknown>;
    if (isReservaAdminDetalhe(nested.reserva)) {
      return nested.reserva;
    }
  }

  if (isReservaAdminDetalhe(root.reserva)) {
    return root.reserva;
  }

  return null;
}

/** Monta o resumo exibido na confirmação a partir do detalhe retornado pela API. */
export function montarConfirmacaoSucesso(
  valorRecebido: number,
  detalhe: Pick<
    ReservaAdminDetalhe,
    "valorTotal" | "valorPago" | "saldoPendente"
  >,
): SucessoConfirmacaoPagamento {
  const valorTotal = roundMoney(Number(detalhe.valorTotal ?? 0));
  const valorPagoTotal = roundMoney(Number(detalhe.valorPago ?? 0));
  const saldoRestante = obterSaldoPendenteExibicao({
    valorTotal,
    valorPago: valorPagoTotal,
    saldoPendente: detalhe.saldoPendente,
  });

  return {
    valorRecebido: roundMoney(valorRecebido),
    valorPagoTotal,
    saldoRestante,
    valorTotal,
    quitada: saldoRestante <= 0.009,
  };
}

export function podeReceberNovoSaldo(saldoRestante: number): boolean {
  return roundMoney(saldoRestante) > 0.009;
}
