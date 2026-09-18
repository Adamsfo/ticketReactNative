import { api } from "./api";
import { ApiResponse } from "../types/geral";
import {
  buildPeriodoPadraoDisponibilidadePousada,
  getMenorValorCotacaoSuitesDisponibilidade,
} from "./reservaSuiteHomePricing";

export interface CotacaoReservaSuite {  idEvento: number;
  idEventoSuite: number;
  noites: number;
  checkin: string;
  checkout: string;
  adultos: number;
  criancas: number;
  suite: {
    nome: string;
    descricao?: string;
    qtdeMinimaPessoas?: number;
    qtdeMaximaPessoas?: number;
    diarias: { preco: number; taxaServico: number; valor: number };
    totais: { preco: number; taxaServico: number; valor: number };
    regras?: {
      incluiAte: number;
      valorAdultoExtra: number;
      valorCriancaExtra: number;
    };
  };
  adicionais: {
    adultos: {
      qtde: number;
      encontrado: boolean;
      preco: number;
      taxaServico: number;
      valor: number;
    };
    criancas: {
      qtde: number;
      encontrado: boolean;
      preco: number;
      taxaServico: number;
      valor: number;
    };
  };
  totais: {
    preco: number;
    taxaServico: number;
    valorTotal: number;
  };
}

export interface DisponibilidadeReservaSuite {
  idEvento: number;
  checkin: string;
  checkout: string;
  noites: number;
  suites: Array<
    Record<string, unknown> & {
      id: number;
      nome: string;
      descricao?: string;
      noites?: number;
      cotacao?: { preco: number; taxaServico: number; valorTotal: number };
    }
  >;
}

export type HospedeCheckoutPayload = {
  nome: string;
  tipo: "Adulto" | "Crianca";
  dataNascimento?: string;
};

export type SuiteCheckoutPayload = {
  idEventoSuite: number;
  adultos: number;
  criancas: number;
  hospedes: HospedeCheckoutPayload[];
};

export async function getDisponibilidade(params: {
  idEvento: number;
  checkin: string;
  checkout: string;
}): Promise<ApiResponse<DisponibilidadeReservaSuite>> {
  return api.request<DisponibilidadeReservaSuite>(
    "/reservasuite/disponibilidade",
    "GET",
    null,
    {
      idEvento: String(params.idEvento),
      checkin: params.checkin,
      checkout: params.checkout,
    }
  );
}

export {
  buildPeriodoPadraoDisponibilidadePousada,
  getMenorValorCotacaoSuitesDisponibilidade,
} from "./reservaSuiteHomePricing";

/**
 * Menor preço inicial para card da Home (evento Pousada).
 * Reutiliza o mesmo endpoint e cotação embutida da tela Pousada.
 */
export async function getMenorValorPousadaHome(
  idEvento: number
): Promise<number | undefined> {
  const { checkin, checkout } = buildPeriodoPadraoDisponibilidadePousada();

  try {
    const response = await getDisponibilidade({
      idEvento,
      checkin,
      checkout,
    });

    if (!response.success || !response.data?.suites?.length) {
      return undefined;
    }

    return getMenorValorCotacaoSuitesDisponibilidade(response.data.suites);
  } catch {
    return undefined;
  }
}

export async function getCotacao(params: {
  idEventoSuite: number;
  checkin: string;
  checkout: string;
  adultos: number;
  criancas: number;
}): Promise<ApiResponse<CotacaoReservaSuite>> {
  return api.request<CotacaoReservaSuite>("/reservasuite/cotacao", "GET", null, {
    idEventoSuite: String(params.idEventoSuite),
    checkin: params.checkin,
    checkout: params.checkout,
    adultos: String(params.adultos),
    criancas: String(params.criancas),
  });
}

export async function checkoutReserva(body: {
  idEvento: number;
  idUsuario: number;
  checkin: string;
  checkout: string;
  suites: SuiteCheckoutPayload[];
}) {
  return api.request<{
    data: {
      hospedagem: Record<string, unknown>;
      itens: unknown[];
      transacao: Record<string, unknown>;
    };
  }>("/reservasuite/checkout", "POST", body);
}

export type ResumoPagamentoHospedagemApi = {
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
  valorTotal: number;
};

export async function getResumoPagamentoHospedagem(idTransacao: number) {
  return api.request<ResumoPagamentoHospedagemApi>(
    "/reservasuite/resumo-pagamento",
    "GET",
    null,
    { idTransacao: String(idTransacao) },
  );
}

export type ReservaConfirmadaApi = {
  reserva: {
    id: number;
    status: string;
    checkin: string;
    checkout: string;
    noites: number;
    preco: number;
    taxaServico: number;
    valorTotal: number;
    dataConfirmacao: string | null;
  };
  evento: {
    id: number;
    nome: string;
    imagem?: string | null;
  };
  suites: Array<{
    idReservaSuite: number;
    nome: string;
    adultos: number;
    criancas: number;
    preco: number;
    taxaServico: number;
    valorTotal: number;
    hospedes: Array<{
      nome: string;
      tipo: string;
      dataNascimento: string | null;
    }>;
  }>;
};

export async function getReservaConfirmada(idTransacao: number) {
  return api.request<ReservaConfirmadaApi>(
    "/reservasuite/reserva-confirmada",
    "GET",
    null,
    { idTransacao: String(idTransacao) },
  );
}

export type FiltroStatusMinhasReservas =
  | "confirmadas"
  | "hospedadas"
  | "canceladas";

export type MinhaReservaCard = {
  id: number;
  numeroReserva: number;
  status: string;
  evento: { id: number; nome: string } | null;
  nomeSuite: string;
  suites: Array<{ nome: string; adultos: number; criancas: number }>;
  checkin: string;
  checkout: string;
  noites: number;
  adultos: number;
  criancas: number;
  valorTotal: number;
  valorPago: number;
  saldoPendente: number;
  origemReserva: string | null;
  dataCriacao: string | null;
  dataConfirmacao: string | null;
};

export type MetaMinhasReservas = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  status: FiltroStatusMinhasReservas;
};

export async function getMinhasReservas(params: {
  status: FiltroStatusMinhasReservas;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<MinhaReservaCard[]> & { meta?: MetaMinhasReservas }> {
  return api.request<MinhaReservaCard[]>(
    "/reservasuite/minhas-reservas",
    "GET",
    null,
    {
      status: params.status,
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 20),
    },
  ) as Promise<ApiResponse<MinhaReservaCard[]> & { meta?: MetaMinhasReservas }>;
}

export type SituacaoFinanceiraMinhaReserva =
  | "Quitada"
  | "Parcial"
  | "Pendente";

export type MinhaReservaDetalhe = {
  id: number;
  numeroReserva: number;
  status: string;
  dataCriacao: string | null;
  dataConfirmacao: string | null;
  checkin: string;
  checkout: string;
  noites: number;
  preco: number;
  taxaServico: number;
  evento: {
    id: number;
    nome: string;
    imagem: string | null;
  };
  suites: Array<{
    idReservaSuite: number;
    idEventoSuite: number;
    nome: string;
    adultos: number;
    criancas: number;
    hospedes: Array<{
      nome: string;
      tipo: string;
      dataNascimento: string | null;
    }>;
  }>;
  financeiro: {
    valorTotal: number;
    valorPago: number;
    saldoPendente: number;
    situacaoFinanceira: SituacaoFinanceiraMinhaReserva;
  };
  podeContinuarPagamento: boolean;
  tokenPagamento: string | null;
};

export async function getMinhaReservaDetalhe(
  idReserva: number,
): Promise<ApiResponse<MinhaReservaDetalhe>> {
  return api.request<MinhaReservaDetalhe>(
    `/reservasuite/minhas-reservas/${idReserva}`,
    "GET",
  );
}
