import { useEffect, useState } from "react";
import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";
import { HospedagemReserva } from "@/src/contexts_/HospedagemContext";
import { getResumoPagamentoHospedagem } from "@/src/lib/reservaSuite";
import { Transacao } from "@/src/types/geral";

export type ResumoPagamentoHospedagemTaxaAdicional = {
  id: number;
  descricao: string;
  valor: number;
  ordem: number;
  idReservaSuite: number | null;
};

export type ResumoPagamentoHospedagemData = {
  checkin: string;
  checkout: string;
  noites: number;
  suites: Array<{
    nomeSuite: string;
    adultos: number;
    criancas: number;
    subtotal: number;
  }>;
  subtotalGeral: number;
  taxasAdicionais: ResumoPagamentoHospedagemTaxaAdicional[];
  valorTaxasAdicionais: number;
  taxaServico: number;
  taxaServicoDesconto?: number;
  /** Total integral da reserva (hospedagem). */
  valorTotal: number;
  /** Valor da transação/cobrança atual (ex.: 50% do link), quando diferente do total da reserva. */
  valorTotalCobranca?: number;
};

function resumoFromContext(
  reserva: HospedagemReserva,
  transacao: Transacao,
): ResumoPagamentoHospedagemData {
  const valorTotalReserva = Number(transacao.valorTotal ?? 0);
  const valorCobranca = Number(transacao.valorTotal ?? 0);
  return {
    checkin: reserva.checkin,
    checkout: reserva.checkout,
    noites: reserva.itens[0]?.cotacao.noites ?? 0,
    suites: reserva.itens.map((item: ItemCarrinhoHospedagem) => ({
      nomeSuite: item.nomeSuite,
      adultos: item.adultos,
      criancas: item.criancas,
      subtotal: Number(item.cotacao.totais.preco),
    })),
    subtotalGeral: reserva.itens.reduce(
      (acc, item) => acc + Number(item.cotacao.totais.preco),
      0,
    ),
    taxasAdicionais: [],
    valorTaxasAdicionais: 0,
    taxaServico: Number(transacao.taxaServico ?? 0),
    taxaServicoDesconto: transacao.taxaServicoDesconto,
    valorTotal: valorTotalReserva,
    valorTotalCobranca: valorCobranca,
  };
}

function resumoFromApi(data: {
  checkin: string | Date;
  checkout: string | Date;
  noites: number;
  suites: ResumoPagamentoHospedagemData["suites"];
  subtotalGeral: number;
  taxasAdicionais?: ResumoPagamentoHospedagemTaxaAdicional[];
  valorTaxasAdicionais?: number;
  taxaServico: number;
  valorTotal: number;
}): ResumoPagamentoHospedagemData {
  const taxasAdicionais = data.taxasAdicionais ?? [];
  const valorTaxasAdicionais = Number(data.valorTaxasAdicionais ?? 0);
  return {
    checkin:
      data.checkin instanceof Date ? data.checkin.toISOString() : String(data.checkin),
    checkout:
      data.checkout instanceof Date
        ? data.checkout.toISOString()
        : String(data.checkout),
    noites: data.noites,
    suites: data.suites,
    subtotalGeral: Number(data.subtotalGeral),
    taxasAdicionais,
    valorTaxasAdicionais,
    taxaServico: Number(data.taxaServico),
    valorTotal: Number(data.valorTotal),
  };
}

function aplicarTransacaoNoResumo(
  resumo: ResumoPagamentoHospedagemData,
  registroTransacao?: Transacao | null,
): ResumoPagamentoHospedagemData {
  if (!registroTransacao) {
    return resumo;
  }
  const valorCobranca = Number(registroTransacao.valorTotal ?? resumo.valorTotal);
  const valorTotalReserva = Number(resumo.valorTotal);
  const cobrancaDiferente =
    Math.abs(valorCobranca - valorTotalReserva) > 0.009;
  return {
    ...resumo,
    taxaServicoDesconto: registroTransacao.taxaServicoDesconto,
    taxaServico: Number(
      registroTransacao.taxaServico ?? resumo.taxaServico,
    ),
    valorTotal: valorTotalReserva,
    valorTotalCobranca: cobrancaDiferente ? valorCobranca : undefined,
  };
}

export function useResumoPagamentoHospedagem(params: {
  tipoCompra?: string;
  idEvento: number;
  registroTransacao?: Transacao | null;
  reserva: HospedagemReserva | null;
  /** Opcional: resumo já carregado (ex.: link público /reserva/TOKEN). */
  resumoBootstrap?: ResumoPagamentoHospedagemData | null;
}) {
  const {
    tipoCompra,
    idEvento,
    registroTransacao,
    reserva,
    resumoBootstrap,
  } = params;
  const isHospedagem = tipoCompra === "hospedagem";
  const [resumo, setResumo] = useState<ResumoPagamentoHospedagemData | null>(
    null,
  );

  useEffect(() => {
    if (!isHospedagem) {
      setResumo(null);
      return;
    }

    if (resumoBootstrap) {
      setResumo(aplicarTransacaoNoResumo(resumoBootstrap, registroTransacao));
      return;
    }

    if (
      reserva &&
      reserva.idEvento === idEvento &&
      reserva.itens.length > 0 &&
      registroTransacao
    ) {
      setResumo(resumoFromContext(reserva, registroTransacao));
      return;
    }

    const idTransacao = registroTransacao?.id;
    if (!idTransacao) {
      setResumo(null);
      return;
    }

    let ativo = true;

    getResumoPagamentoHospedagem(idTransacao).then((response) => {
      if (!ativo || !response.success || !response.data) {
        return;
      }

      const resumoApi = resumoFromApi(response.data);
      setResumo(aplicarTransacaoNoResumo(resumoApi, registroTransacao));
    });

    return () => {
      ativo = false;
    };
  }, [isHospedagem, reserva, idEvento, registroTransacao, resumoBootstrap]);

  return { isHospedagem, resumo };
}
