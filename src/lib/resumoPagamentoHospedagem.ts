import { useEffect, useState } from "react";
import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";
import { HospedagemReserva } from "@/src/contexts_/HospedagemContext";
import { getResumoPagamentoHospedagem } from "@/src/lib/reservaSuite";
import { Transacao } from "@/src/types/geral";

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
  taxaServico: number;
  taxaServicoDesconto?: number;
  valorTotal: number;
};

function resumoFromContext(
  reserva: HospedagemReserva,
  transacao: Transacao,
): ResumoPagamentoHospedagemData {
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
    subtotalGeral: Number(transacao.preco ?? 0),
    taxaServico: Number(transacao.taxaServico ?? 0),
    taxaServicoDesconto: transacao.taxaServicoDesconto,
    valorTotal: Number(transacao.valorTotal ?? 0),
  };
}

function resumoFromApi(data: {
  checkin: string | Date;
  checkout: string | Date;
  noites: number;
  suites: ResumoPagamentoHospedagemData["suites"];
  subtotalGeral: number;
  taxaServico: number;
  valorTotal: number;
}): ResumoPagamentoHospedagemData {
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
    taxaServico: Number(data.taxaServico),
    valorTotal: Number(data.valorTotal),
  };
}

export function useResumoPagamentoHospedagem(params: {
  tipoCompra?: string;
  idEvento: number;
  registroTransacao?: Transacao | null;
  reserva: HospedagemReserva | null;
}) {
  const { tipoCompra, idEvento, registroTransacao, reserva } = params;
  const isHospedagem = tipoCompra === "hospedagem";
  const [resumo, setResumo] = useState<ResumoPagamentoHospedagemData | null>(
    null,
  );

  useEffect(() => {
    if (!isHospedagem) {
      setResumo(null);
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
      setResumo({
        ...resumoApi,
        taxaServicoDesconto: registroTransacao?.taxaServicoDesconto,
        subtotalGeral: Number(registroTransacao?.preco ?? resumoApi.subtotalGeral),
        taxaServico: Number(registroTransacao?.taxaServico ?? resumoApi.taxaServico),
        valorTotal: Number(registroTransacao?.valorTotal ?? resumoApi.valorTotal),
      });
    });

    return () => {
      ativo = false;
    };
  }, [isHospedagem, reserva, idEvento, registroTransacao]);

  return { isHospedagem, resumo };
}
