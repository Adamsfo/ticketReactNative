import { api } from "./api";
import { ApiResponse } from "../types/geral";
import {
  corStatusOperacionalHospedagem,
  HOSPEDAGEM_STATUS_COLORS,
} from "@/src/constants/hospedagemStatusColors";
import {
  getStatusOperacionalSuite,
  corStatusOperacionalPadrao,
  labelStatusOperacionalPadrao,
} from "@/src/lib/hospedagemStatusOperacional";

export type FiltroRapidoReserva =
  | "hoje"
  | "confirmadas"
  | "canceladas"
  | "expiradas"
  | "checkout_realizado"
  | "aguardando_pagamento"
  | "online"
  | "atendente"
  | "todos"
  | null;

export type OrdenacaoReservas =
  | "recentes"
  | "antigas"
  | "checkin"
  | "checkout"
  | "nome";

export type StatusReservaAdmin =
  | "Confirmada"
  | "AguardandoPagamento"
  | "Cancelada"
  | "Expirada"
  | "CheckOutRealizado"
  | string;

export type StatusOperacionalSuite =
  | "Livre"
  | "Hospedada"
  | "Ocupada"
  | "CheckInHoje"
  | "CheckOutHoje"
  | "AguardandoPagamento"
  | "Manutencao"
  | "Bloqueada"
  | string;

export type FiltroSuiteOperacional =
  | "todas"
  | "livres"
  | "ocupadas"
  | "hospedadas"
  | "checkin_hoje"
  | "checkout_hoje"
  | "aguardando_pagamento"
  | "manutencao"
  | "bloqueadas";

export type ReservaAdminCard = {
  id: number;
  idReservaHospedagem: number;
  numeroReserva: number;
  nomeSuite: string;
  responsavel: string;
  nomeResponsavel?: string;
  telefone?: string | null;
  email?: string | null;
  checkin: string;
  checkout: string;
  adultos: number;
  criancas: number;
  totalAdultos?: number;
  totalCriancas?: number;
  quantidadeSuites?: number;
  noites?: number;
  valorTotal: number;
  valorPago?: number;
  saldoPendente?: number;
  formaPagamentoRecepcao?: string | null;
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | null;
  idUsuarioCriacao?: number | null;
  nomeUsuarioCriacao?: string | null;
  dataCriacao?: string | null;
  taxaServico?: number;
  status: StatusReservaAdmin;
  dataHoraCheckinReal?: string | null;
  dataHoraCheckoutRealizado?: string | null;
  suites?: Array<{ nome: string; quantidade: number }>;
};

export type SuiteOperacionalCard = {
  id: number;
  idEventoSuite: number;
  nome: string;
  descricao?: string | null;
  idEvento: number;
  eventoNome?: string | null;
  status: StatusOperacionalSuite;
  responsavel?: string | null;
  telefone?: string | null;
  checkin?: string | null;
  checkout?: string | null;
  dataHoraCheckinReal?: string | null;
  adultos: number;
  criancas: number;
  valorHospedagem?: number | null;
  valorPago?: number | null;
  saldoPendente?: number | null;
  formaPagamentoRecepcao?: string | null;
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | null;
  idUsuarioCriacao?: number | null;
  nomeUsuarioCriacao?: string | null;
  dataCriacao?: string | null;
  valorSuite?: number | null;
  idReservaHospedagem?: number | null;
  numeroReserva?: number | null;
  statusReserva?: string | null;
  ocupadaAgora?: boolean;
  hospedada?: boolean;
  checkinHoje?: boolean;
  checkoutHoje?: boolean;
  aguardandoPagamento?: boolean;
  disponivelHojeAposCheckout?: boolean;
  mensagemDisponibilidade?: string | null;
  mensagemDisponibilidadeSecundaria?: string | null;
  acoesDisponiveis?: {
    verReserva?: boolean;
    reservar?: boolean;
    checkin?: boolean;
    checkout?: boolean;
    limpeza?: boolean;
    manutencao?: boolean;
    bloqueio?: boolean;
    calendario?: boolean;
  };
};

/** @deprecated use SuiteOperacionalCard */
export type SuiteAdminCard = SuiteOperacionalCard;

export type ReservaAdminDetalhe = {
  id: number;
  idReservaHospedagem: number;
  numeroReserva: number;
  status: StatusReservaAdmin;
  statusOriginal?: string;
  checkin: string;
  checkout: string;
  dataHoraCheckinReal?: string | null;
  dataHoraCheckoutRealizado?: string | null;
  idUsuarioCheckout?: number | null;
  noites: number;
  preco: number;
  taxaServico: number;
  valorTotal: number;
  valorPago?: number;
  saldoPendente?: number;
  formaPagamentoRecepcao?: string | null;
  observacaoPagamento?: string | null;
  comprovantePagamento?: string | null;
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | null;
  idUsuarioCriacao?: number | null;
  nomeUsuarioCriacao?: string | null;
  dataCriacao?: string | null;
  dataConfirmacao?: string | null;
  responsavel: string;
  nomeResponsavel?: string;
  telefone?: string | null;
  email?: string | null;
  evento?: { id: number; nome: string } | null;
  suites: Array<{
    idReservaSuite: number;
    nome: string;
    adultos: number;
    criancas: number;
    preco: number;
    taxaServico?: number;
    valorTotal?: number;
    valorOriginal?: number | null;
    descontoTipo?: "PERCENTUAL" | "VALOR" | null;
    descontoValor?: number | null;
    valorFinal?: number | null;
    hospedes: Array<{
      id?: number;
      nome: string;
      tipo: string;
      dataNascimento?: string | null;
    }>;
  }>;
  pagamentos?: Array<{
    id: number;
    valor: number;
    dataPagamento: string;
    formaPagamento: string;
    formaPagamentoLabel?: string;
    comprovante?: string | null;
    observacao?: string | null;
    idUsuario?: number;
    usuario?: string | null;
  }>;
  pagamento?: {
    id: number;
    status: string;
    preco: number;
    taxaServico: number;
    valorTotal: number;
    valorRecebido?: number;
    tipoPagamento?: string | null;
    gatewayPagamento?: string | null;
    dataPagamento?: string | null;
    dataTransacao?: string;
  } | null;
  timeline?: Array<{
    id: number;
    data: string;
    descricao: string;
    usuario?: string | null;
  }>;
};

export type MetaReservasAdmin = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  filtro?: string;
  ordenacao?: string;
  busca?: string | null;
};

export function corStatusReserva(status: StatusReservaAdmin): string {
  return corStatusOperacionalPadrao(
    getStatusOperacionalSuite({ statusReserva: status }),
  );
}

export function labelStatusReserva(status: StatusReservaAdmin): string {
  return labelStatusOperacionalPadrao(
    getStatusOperacionalSuite({ statusReserva: status }),
  );
}

export function corStatusSuiteOperacional(status: StatusOperacionalSuite): string {
  return corStatusOperacionalHospedagem(status);
}

/** Reexporta a paleta unificada para telas que precisam das cores diretamente. */
export { HOSPEDAGEM_STATUS_COLORS };

export function labelStatusSuiteOperacional(
  status: StatusOperacionalSuite,
): string {
  return labelStatusOperacionalPadrao(
    getStatusOperacionalSuite({ statusOperacional: status }),
  );
}

/** @deprecated */
export function corStatusSuite(status: StatusOperacionalSuite): string {
  return corStatusSuiteOperacional(status);
}

/** @deprecated */
export function labelStatusSuite(status: StatusOperacionalSuite): string {
  return labelStatusSuiteOperacional(status);
}

export async function getReservasAdmin(params?: {
  busca?: string;
  filtro?: FiltroRapidoReserva | string;
  ordenacao?: OrdenacaoReservas;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<ReservaAdminCard[]> & { meta?: MetaReservasAdmin }> {
  return api.request<ReservaAdminCard[]>(
    "/hospedagem/reservas",
    "GET",
    null,
    {
      busca: params?.busca ?? "",
      filtro: params?.filtro ?? "todos",
      ordenacao: params?.ordenacao ?? "recentes",
      page: String(params?.page ?? 1),
      pageSize: String(params?.pageSize ?? 20),
    },
  ) as Promise<
    ApiResponse<ReservaAdminCard[]> & { meta?: MetaReservasAdmin }
  >;
}

export async function getReservaAdminDetalhe(
  id: number,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(`/hospedagem/reservas/${id}`, "GET");
}

/** Check-in operacional: Confirmada → Hospedada. */
export async function postRealizarCheckin(
  idReservaHospedagem: number,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/checkin`,
    "POST",
  );
}

/** Check-out operacional: Hospedada → CheckOutRealizado. */
export async function postRealizarCheckout(
  idReservaHospedagem: number,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/checkout`,
    "POST",
  );
}

export type SuiteRecepcaoPayload = {
  idEventoSuite: number;
  adultos: number;
  criancas: number;
  hospedes: Array<{
    nome: string;
    tipo: "Adulto" | "Crianca";
    dataNascimento?: string;
  }>;
  desconto?: {
    tipo: "PERCENTUAL" | "VALOR";
    valor: number;
  } | null;
};

/** Reserva manual da recepção (status Confirmada). */
export async function postReservaRecepcao(body: {
  idEvento: number;
  idUsuario: number;
  checkin: string;
  checkout: string;
  suites: SuiteRecepcaoPayload[];
  observacoes?: string | null;
  pagamento?: {
    valor: number;
    formaPagamento: string;
    comprovante?: string | null;
    observacao?: string | null;
  } | null;
}): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/recepcao`,
    "POST",
    body,
  );
}

/** Indicadores do calendário horizontal (e base para agenda/timeline futura). */
export type IndicadoresDiaCalendario = {
  checkin: number;
  checkout: number;
  /** Permanência no dia — hóspede sem check-in/check-out na data. */
  ocupada: number;
  livre: number;
  bloqueada: number;
  manutencao: number;
};

/** Evento preparado para visualização em agenda (Booking/Airbnb) sem mudar a API. */
export type EventoAgendaSuite = {
  tipo: "reserva" | "checkin" | "checkout";
  idReservaHospedagem: number;
  idEventoSuite: number;
  suiteNome: string;
  inicio: string;
  fim: string;
  status: string;
  responsavel: string | null;
  dataHoraCheckinReal?: string | null;
  dataHoraCheckoutRealizado?: string | null;
};

export type DiaCalendarioSuites = {
  data: string;
  indicadores: IndicadoresDiaCalendario;
  eventosAgenda: EventoAgendaSuite[];
};

export type MetaCalendarioSuites = {
  versao: number;
  modo: "mes" | string;
  /** Modo futuro da visualização em agenda — não alterará a forma dos dias. */
  modoAgendaFuturo: "timeline" | string;
  mes: string;
  dias: DiaCalendarioSuites[];
};

export type MetaAgendaSuites = {
  versao: number;
  suporte: Array<"dia" | "mes" | "timeline" | string>;
  timezone: string;
};

export type MetaSuitesOperacionais = {
  filtro?: string;
  total?: number;
  mensagem?: string;
  dataReferencia?: string;
  mes?: string;
  calendario?: MetaCalendarioSuites;
  agenda?: MetaAgendaSuites;
};

export async function getSuitesOperacionais(params?: {
  filtro?: FiltroSuiteOperacional | string;
  /** Data de referência operacional (YYYY-MM-DD). */
  data?: string;
  /** Mês do calendário / indicadores (YYYY-MM). */
  mes?: string;
}): Promise<
  ApiResponse<SuiteOperacionalCard[]> & { meta?: MetaSuitesOperacionais }
> {
  const query: Record<string, string> = {
    filtro: params?.filtro ?? "todas",
  };
  if (params?.data) query.data = params.data;
  if (params?.mes) query.mes = params.mes;

  return api.request<SuiteOperacionalCard[]>(
    "/hospedagem/suites",
    "GET",
    null,
    query,
  ) as Promise<
    ApiResponse<SuiteOperacionalCard[]> & { meta?: MetaSuitesOperacionais }
  >;
}

export async function getSuiteOperacionalDetalhe(
  idEventoSuite: number,
  data?: string,
): Promise<ApiResponse<SuiteOperacionalCard>> {
  return api.request<SuiteOperacionalCard>(
    `/hospedagem/suites/${idEventoSuite}`,
    "GET",
    null,
    data ? { data } : undefined,
  );
}

/** @deprecated */
export async function getSuitesAdmin(): Promise<
  ApiResponse<SuiteOperacionalCard[]>
> {
  return getSuitesOperacionais({ filtro: "todas" });
}
