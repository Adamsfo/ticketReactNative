import { api } from "./api";
import { ApiResponse } from "../types/geral";
import formatCurrency from "@/src/components/FormatCurrency";
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
  /** Somente contratação direta pelo cliente no site (não PDV). */
  contratacaoCliente?: boolean;
  aceitePoliticaHospedagem?: boolean;
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
  podeCancelar: boolean;
  motivoBloqueio: string | null;
  percentualDevolucao: 50 | 100 | null;
  valorDevolucao: number | null;
  podeRemarcar: boolean;
  motivoBloqueioRemarcacao: string | null;
  taxaRemarcacao: number | null;
  remarcacao?: RemarcacaoClienteInfo;
};

export type RemarcacaoClienteInfo = {
  podeRemarcar: boolean;
  motivoBloqueio: string | null;
  horasRestantes: number | null;
  taxaRemarcacao: number | null;
  taxaPlataforma: number | null;
  taxaJango: number | null;
  remarcacaoPendente: {
    idTaxa: number;
    valorPagamento: number;
    saldoPendente: number;
    dataCheckInNova: string;
    dataCheckOutNova: string;
    pixPendente?: {
      paymentId: string;
      status?: string;
      reutilizado: boolean;
    } | null;
  } | null;
};

export type ResultadoRemarcacaoMinhaReserva = {
  reservaId: number;
  remarcada: boolean;
  aguardandoPagamento?: boolean;
  taxa: number;
  valorPagamento?: number;
  valorPago: number;
  saldoPendente: number;
  dataCheckInAnterior: string;
  dataCheckOutAnterior: string;
  dataCheckInNova: string;
  dataCheckOutNova: string;
  idTaxa?: number;
  idTransacao?: number;
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
  cancelamento: {
    podeCancelar: boolean;
    motivoBloqueio: string | null;
    percentualDevolucao: 50 | 100 | null;
    valorDevolucao: number | null;
    valorPago: number;
    valorPagoMercadoPago: number;
    valorEstornado: number;
    requerEstornoManual: boolean;
  };
  remarcacao: RemarcacaoClienteInfo;
};

function unwrapPostData<T>(resp: ApiResponse<T>): ApiResponse<T> {
  if (!resp.success) {
    return resp;
  }

  const body = resp.data as
    | T
    | { success?: boolean; message?: string; data?: T }
    | undefined;

  const payload =
    body && typeof body === "object" && "data" in body && body.data
      ? body.data
      : body;

  if (!payload || typeof payload !== "object") {
    return {
      success: false,
      message:
        (body && typeof body === "object" && "message" in body
          ? String(body.message || "")
          : "") || "Resposta inválida.",
    };
  }

  return {
    success: true,
    data: payload as T,
    message:
      body && typeof body === "object" && "message" in body
        ? body.message
        : undefined,
  };
}

export type ResultadoCancelamentoMinhaReserva = {
  id: number;
  status: string;
  numeroReserva: number;
  /** Valor pago antes do cancelamento (base da política de devolução). */
  valorPago: number;
  percentualDevolucao: 50 | 100 | null;
  valorDevolucao: number;
  valorEstornado: number;
};

function normalizarResultadoCancelamentoMinhaReserva(
  payload: unknown,
): ResultadoCancelamentoMinhaReserva | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const item = payload as Record<string, unknown>;
  const id = Number(item.id);
  const numeroReserva = Number(item.numeroReserva ?? item.id);
  const valorPago = Number(item.valorPago);
  const percentualRaw = Number(item.percentualDevolucao);
  const valorDevolucao = Number(item.valorDevolucao);
  const valorEstornado = Number(item.valorEstornado);
  const status = String(item.status ?? "");

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  const percentualDevolucao: 50 | 100 | null =
    percentualRaw === 50 || percentualRaw === 100 ? percentualRaw : null;

  return {
    id,
    status,
    numeroReserva: Number.isFinite(numeroReserva) && numeroReserva > 0
      ? numeroReserva
      : id,
    valorPago: Number.isFinite(valorPago) ? valorPago : NaN,
    percentualDevolucao,
    valorDevolucao: Number.isFinite(valorDevolucao) ? valorDevolucao : NaN,
    valorEstornado: Number.isFinite(valorEstornado) ? valorEstornado : NaN,
  };
}

export function formatarMensagemResultadoCancelamentoMinhaReserva(
  resultado: ResultadoCancelamentoMinhaReserva,
): string {
  const linhas = ["Reserva cancelada.", "", `Reserva #${resultado.numeroReserva}`];

  if (Number.isFinite(resultado.valorPago)) {
    linhas.push(`Valor pago: ${formatCurrency(resultado.valorPago)}`);
  }

  if (resultado.percentualDevolucao === 50 || resultado.percentualDevolucao === 100) {
    linhas.push(`Devolução: ${resultado.percentualDevolucao}%`);
  }

  if (Number.isFinite(resultado.valorEstornado)) {
    linhas.push(`Valor estornado: ${formatCurrency(resultado.valorEstornado)}`);
  }

  return linhas.join("\n");
}

export async function getMinhaReservaDetalhe(
  idReserva: number,
): Promise<ApiResponse<MinhaReservaDetalhe>> {
  return api.request<MinhaReservaDetalhe>(
    `/reservasuite/minhas-reservas/${idReserva}`,
    "GET",
  );
}

export async function cancelarMinhaReserva(
  idReserva: number,
): Promise<ApiResponse<ResultadoCancelamentoMinhaReserva>> {
  const resp = await api.request<ResultadoCancelamentoMinhaReserva>(
    `/reservasuite/minhas-reservas/${idReserva}/cancelar`,
    "POST",
  );

  if (!resp.success) {
    return resp;
  }

  // api.request em POST devolve o body inteiro em data ({ success, message, data }).
  const body = resp.data as
    | ResultadoCancelamentoMinhaReserva
    | {
        success?: boolean;
        message?: string;
        data?: ResultadoCancelamentoMinhaReserva;
      }
    | undefined;

  const payload =
    body && typeof body === "object" && "data" in body && body.data
      ? body.data
      : body;

  const resultado = normalizarResultadoCancelamentoMinhaReserva(payload);
  if (!resultado) {
    return {
      success: false,
      message:
        (body && typeof body === "object" && "message" in body
          ? String(body.message || "")
          : "") || "Resposta inválida ao cancelar a reserva.",
    };
  }

  return {
    success: true,
    data: resultado,
    message:
      body && typeof body === "object" && "message" in body
        ? body.message
        : undefined,
  };
}

export async function remarcarMinhaReserva(
  idReserva: number,
  params: { dataCheckIn: string; dataCheckOut: string },
): Promise<ApiResponse<ResultadoRemarcacaoMinhaReserva>> {
  const resp = await api.request<ResultadoRemarcacaoMinhaReserva>(
    `/reservasuite/minhas-reservas/${idReserva}/remarcar`,
    "POST",
    params,
  );
  return unwrapPostData(resp);
}

export async function obterPixPendenteRemarcacaoMinhaReserva(
  idReserva: number,
): Promise<
  ApiResponse<{
    paymentId: string;
    status?: string;
    point_of_interaction?: unknown;
    reutilizado: boolean;
    idTaxa: number;
    valorPagamento: number;
  } | null>
> {
  return api.request(
    `/reservasuite/minhas-reservas/${idReserva}/remarcar/pix-pendente`,
    "GET",
  );
}

export async function criarPixRemarcacaoMinhaReserva(
  idReserva: number,
  email: string,
): Promise<
  ApiResponse<{
    id: string | number;
    status?: string;
    point_of_interaction?: unknown;
    valorPagamento: number;
    reutilizado?: boolean;
    remarcada?: boolean;
  }>
> {
  const resp = await api.request(
    `/reservasuite/minhas-reservas/${idReserva}/remarcar/pix`,
    "POST",
    { email },
  );
  return unwrapPostData(resp);
}

export async function pagarCartaoRemarcacaoMinhaReserva(
  idReserva: number,
  body: Record<string, unknown>,
): Promise<
  ApiResponse<{
    status?: string;
    id?: string | number;
    remarcada?: boolean;
  }>
> {
  const resp = await api.request(
    `/reservasuite/minhas-reservas/${idReserva}/remarcar/pagamento`,
    "POST",
    body,
  );
  return unwrapPostData(resp);
}

export async function consultarPagamentoRemarcacaoMinhaReserva(
  idReserva: number,
  paymentId: string,
): Promise<
  ApiResponse<{
    status?: string;
    remarcada?: boolean;
    aguardandoPagamento?: boolean;
    erroAplicacao?: string;
    pagamentoRegistrado?: boolean;
    reserva?: {
      checkin: string;
      checkout: string;
      valorPago?: number;
      saldoPendente?: number;
    };
  }>
> {
  return api.request(
    `/reservasuite/minhas-reservas/${idReserva}/remarcar/consulta`,
    "GET",
    null,
    { paymentId },
  );
}
