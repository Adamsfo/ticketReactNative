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
  | "sync_erro"
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
  syncIntegracao?: {
    uiStatus?: string | null;
    syncStatus?: string | null;
    syncAction?: string | null;
    lastError?: string | null;
    errorCode?: string | null;
    errorSeverity?: string | null;
    errorSeverityLabel?: string | null;
    lastSyncAt?: string | null;
    lastSuccessAt?: string | null;
    retryCount?: number;
    provider?: string;
    externalId?: string;
  } | null;
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
  /** Status da limpeza de turnover (checkout anterior) na mesma EventoSuite. */
  statusLimpezaSuite?: "Pendente" | "EmAndamento" | "Concluida" | null;
  ocupadaAgora?: boolean;
  hospedada?: boolean;
  checkinHoje?: boolean;
  checkoutHoje?: boolean;
  aguardandoPagamento?: boolean;
  disponivelHojeAposCheckout?: boolean;
  /** Badge oficial (SuiteDisponibilidadeService) — LIVRE, CHECKIN_HOJE, … */
  badge?: string;
  badgeLabel?: string;
  botaoPrincipal?:
    | "nova_reserva"
    | "checkin"
    | "checkout"
    | "ver_reserva"
    | "nenhum";
  /** True se há reserva com check-in na data (bloqueia nova reserva). */
  bloqueadaPorCheckinNaData?: boolean;
  mensagemDisponibilidade?: string | null;
  mensagemDisponibilidadeSecundaria?: string | null;
  /** Resumo da reserva com entrada na data (ex.: CO + nova entrada). */
  proximaReservaResumo?: {
    id: number;
    responsavel: string | null;
    checkin: string;
    checkout?: string | null;
    status?: string | null;
    origemReserva?: string | null;
    idUsuarioCriacao?: number | null;
    nomeUsuarioCriacao?: string | null;
    podeCheckin?: boolean;
    botao?: "checkin" | "ver_detalhes";
  } | null;
  /** CO hoje + outra reserva com check-in no mesmo dia. */
  modoDuplaReserva?: boolean;
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

export type DisponibilidadeOperacionalReserva = {
  dataSelecionada: string;
  idEventoSuite: number;
  badge: string;
  badgeLabel: string;
  mensagem: string | null;
  mensagemSecundaria: string | null;
  podeCheckin: boolean;
  podeCheckout: boolean;
  botaoPrincipal:
    | "nova_reserva"
    | "checkin"
    | "checkout"
    | "ver_reserva"
    | "nenhum";
  podeReservar: boolean;
  disponivelAposCheckout: boolean;
  agendaOcupada: boolean;
  livre: boolean;
  checkinHoje: boolean;
  checkoutHoje: boolean;
  hospedada: boolean;
  proximaReservaResumo?: {
    id: number;
    responsavel?: string | null;
    checkin: string;
    origemReserva?: string | null;
    idUsuarioCriacao?: number | null;
    nomeUsuarioCriacao?: string | null;
  } | null;
};

export type ReservaTimelineEvento = {
  id: number | string;
  data: string;
  titulo?: string;
  descricao: string;
  usuario?: string | null;
  tipo?: string | null;
  detalhe?: string | null;
  valor?: number | null;
  formaPagamento?: string | null;
  suiteOrigem?: string | null;
  suiteDestino?: string | null;
  motivo?: string | null;
  checkinAnterior?: string | null;
  checkoutAnterior?: string | null;
  checkinNovo?: string | null;
  checkoutNovo?: string | null;
};

export type ReservaSuiteMovimentacaoItem = {
  id: number;
  dataHora: string;
  motivo?: string | null;
  tipo?: string;
  suiteOrigem: { id: number; nome: string };
  suiteDestino: { id: number; nome: string };
  usuario?: string | null;
  idUsuario?: number;
};

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
  dataHoraChegadaReal?: string | null;
  idUsuarioChegada?: number | null;
  idVendaJango?: number | null;
  idUsuarioCheckout?: number | null;
  noites: number;
  preco: number;
  taxaServico: number;
  valorTotal: number;
  valorPago?: number;
  saldoPendente?: number;
  situacaoFinanceira?: "Quitada" | "Parcial" | "Pendente" | string;
  formaPagamentoRecepcao?: string | null;
  observacaoPagamento?: string | null;
  comprovantePagamento?: string | null;
  observacoes?: string | null;
  observacaoImportada?: string | null;
  observacaoOperador?: string | null;
  origemReserva?: "SITE" | "ATENDENTE" | "CLIENTE" | "HOSPEDIN" | string | null;
  idExterno?: string | null;
  codigoExterno?: string | null;
  canalVenda?: string | null;
  canalVendaLabel?: string | null;
  /** Indicador operacional: note sugere pagamento pela OTA. */
  possivelPagamentoOta?: boolean;
  possivelPagamentoOtaTrecho?: string | null;
  idUsuarioCriacao?: number | null;
  nomeUsuarioCriacao?: string | null;
  dataCriacao?: string | null;
  dataConfirmacao?: string | null;
  tokenPagamento?: string | null;
  linkPagamento?: string | null;
  linkPagamentoEnviadoEm?: string | null;
  expiraEm?: string | null;
  idTransacao?: number | null;
  responsavel: string;
  nomeResponsavel?: string;
  telefone?: string | null;
  email?: string | null;
  evento?: { id: number; nome: string } | null;
  suites: Array<{
    idReservaSuite: number;
    idEventoSuite?: number;
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
  /** Parte 7: SuiteDisponibilidadeService para o dia consultado. */
  disponibilidade?: DisponibilidadeOperacionalReserva | null;
  pagamentos?: Array<{
    id: number;
    valor: number;
    dataPagamento: string;
    formaPagamento: string;
    formaPagamentoLabel?: string;
    contaNoCaixa?: boolean;
    categoriaFinanceira?: string | null;
    comprovante?: string | null;
    observacao?: string | null;
    idUsuario?: number;
    usuario?: string | null;
  }>;
  /** Totais separados: caixa do hotel vs informativo OTA. */
  resumoPagamentosCaixa?: {
    totalCaixa: number;
    totalRecebidoOta: number;
    porFormaCaixa: Array<{ forma: string; label: string; total: number }>;
    porFormaOta: Array<{ forma: string; label: string; total: number }>;
  } | null;
  movimentacoesSuite?: ReservaSuiteMovimentacaoItem[];
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
  timeline?: ReservaTimelineEvento[];
  /** Metadados da integração (só quando origem Hospedin / IDs externos). */
  origemIntegracao?: ReservaOrigemIntegracao | null;
  /** Estado de sync derivado de integration_sync_state. */
  syncIntegracao?: {
    uiStatus?: string | null;
    syncStatus?: string | null;
    syncAction?: string | null;
    lastError?: string | null;
    errorCode?: string | null;
    errorSeverity?: string | null;
    errorSeverityLabel?: string | null;
    lastSyncAt?: string | null;
    lastSuccessAt?: string | null;
    retryCount?: number;
    provider?: string;
    externalId?: string;
    nextRetryAt?: string | null;
  } | null;
};

export type ReservaOrigemIntegracaoIdentificador = {
  id: number;
  provider: string;
  tipo: string;
  valor: string;
};

export type ReservaOrigemIntegracaoFinanceira = {
  provider: string;
  moeda?: string | null;
  total?: number | null;
  received?: number | null;
  toReceive?: number | null;
  daily?: number | null;
  totalDaily?: number | null;
  discount?: number | null;
  product?: number | null;
  service?: number | null;
  itemsCount?: number | null;
  paymentFromOta?: boolean | null;
  statusPagamento?: string | null;
  formaPagamento?: string | null;
  origemPagamento?: string | null;
  responsavelPagamento?: string | null;
  syncedAt?: string | null;
  aviso?: string;
};

export type ReservaOrigemIntegracaoDocumento = {
  id: number;
  idReservaHospede: number;
  hospedeNome?: string | null;
  hospedeTipo?: string | null;
  provider?: string | null;
  tipo: string;
  numero: string;
  paisEmissao?: string | null;
  observacao?: string | null;
};

export type ReservaOrigemIntegracaoPayload = {
  id: number;
  provider: string;
  kind: string;
  externalId?: string | null;
  payloadHash: string;
  capturedAt: string;
  payloadJson: unknown;
};

export type ReservaOrigemIntegracao = {
  identificadores: ReservaOrigemIntegracaoIdentificador[];
  financeira: ReservaOrigemIntegracaoFinanceira | null;
  documentos: ReservaOrigemIntegracaoDocumento[];
  payloads: ReservaOrigemIntegracaoPayload[];
  ultimaSincronizacao?: string | null;
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

/** Status persistido no banco (statusOriginal) — elegível para cancelamento admin. */
export function podeExibirCancelamentoReservaAdmin(
  input?: {
    statusOriginal?: string | null;
    status?: string | null;
  } | null,
  statusFallback?: string | null,
): boolean {
  const status = String(
    input?.statusOriginal ?? statusFallback ?? "",
  ).trim();
  return status === "Confirmada" || status === "AguardandoPagamento";
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
  dataSelecionada?: string | null,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  const query: Record<string, string> = {};
  if (dataSelecionada) query.data = dataSelecionada;
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${id}`,
    "GET",
    null,
    query,
  );
}

/** Vincula o responsável da reserva a um cliente Jango (id_cliente). */
export async function atualizarUsuarioReserva(
  idReserva: number,
  idCliente: number,
): Promise<ApiResponse<unknown>> {
  return api.request<unknown>(
    `/hospedagem/reservas/${idReserva}/usuario`,
    "PATCH",
    { id_cliente: idCliente },
  );
}

/** Token leve para o RefreshManager (polling sem recarregar listas). */
export async function getHospedagemRefreshVersion(): Promise<
  ApiResponse<{ version: string }>
> {
  return api.request<{ version: string }>(
    `/hospedagem/refresh-version`,
    "GET",
  );
}

/** Registro de chegada física: mantém Confirmada (conta Jango no backend). */
export async function postRegistrarChegada(
  idReservaHospedagem: number,
  dataHora?: string | null,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/registrar-chegada`,
    "POST",
    dataHora ? { dataHora } : null,
  );
}

/** Check-in operacional: Confirmada → Hospedada. */
export async function postRealizarCheckin(
  idReservaHospedagem: number,
  dataHora?: string | null,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/checkin`,
    "POST",
    dataHora ? { dataHora } : null,
  );
}

/** Check-out operacional: Hospedada → CheckOutRealizado. */
export async function postRealizarCheckout(
  idReservaHospedagem: number,
  dataHora?: string | null,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/checkout`,
    "POST",
    dataHora ? { dataHora } : null,
  );
}

/** Cancelamento administrativo da reserva (soft delete de status). */
export async function postCancelarReservaHospedagem(
  idReservaHospedagem: number,
  motivo: string,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/cancelar`,
    "POST",
    { motivo },
  );
}

export type SuiteDisponivelTroca = {
  id: number;
  idEventoSuite: number;
  nome: string;
  descricao?: string | null;
  qtdeMinimaPessoas?: number;
  qtdeMaximaPessoas?: number;
  livre?: boolean;
  podeReservar?: boolean;
};

export type SuitesDisponiveisTrocaData = {
  idReservaHospedagem: number;
  idReservaSuite: number;
  suiteAtual: {
    idEventoSuite: number;
    nome: string;
  };
  checkin: string;
  checkout: string;
  responsavel: string;
  adultos: number;
  criancas: number;
  suites: SuiteDisponivelTroca[];
};

/** Suítes disponíveis para troca (SuiteDisponibilidadeService). */
export async function getSuitesDisponiveisTroca(
  idReservaHospedagem: number,
  idReservaSuite?: number | null,
): Promise<ApiResponse<SuitesDisponiveisTrocaData>> {
  const query: Record<string, string> = {};
  if (idReservaSuite) query.idReservaSuite = String(idReservaSuite);
  return api.request<SuitesDisponiveisTrocaData>(
    `/hospedagem/reservas/${idReservaHospedagem}/suites-disponiveis-troca`,
    "GET",
    null,
    query,
  );
}

/** Opera troca de suíte com histórico. */
export async function postTrocarSuiteReserva(
  idReservaHospedagem: number,
  body: {
    idReservaSuite: number;
    idEventoSuiteDestino: number;
    motivo?: string | null;
  },
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/trocar-suite`,
    "POST",
    body,
  );
}

/** Altera período da reserva com histórico. */
export async function postAlterarPeriodoReserva(
  idReservaHospedagem: number,
  body: {
    checkin: string;
    checkout: string;
    motivo?: string | null;
  },
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/alterar-periodo`,
    "POST",
    body,
  );
}

/** Atualiza observações operacionais (auto-save onBlur). */
export async function patchObservacoesReserva(
  idReservaHospedagem: number,
  observacoes: string,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/observacoes`,
    "PATCH",
    { observacoes },
  );
}

/** Recebe saldo (parcial/total) — módulo isolado da hospedagem. */
export async function postReceberSaldoHospedagem(
  idReservaHospedagem: number,
  pagamento: {
    valor: number;
    formaPagamento: string;
    comprovante?: string | null;
    observacao?: string | null;
  },
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/receber-saldo`,
    "POST",
    { pagamento },
  );
}

export type HospedagemPagamentoPayload = {
  valor: number;
  formaPagamento: string;
  comprovante?: string | null;
  observacao?: string | null;
};

/** Retorno idêntico ao POST /pagamentopos do PDV. */
export type HospedagemTefInicio = {
  id: string | number;
  status: string;
};

/** Retorno idêntico ao GET /consultapagamentopos do PDV. */
export type HospedagemTefConsultaData = {
  payment_uniqueid?: string | number;
  payment_status?: number;
  payment_message?: string;
  created_at?: string;
  payment_data?: Record<string, unknown>;
};

/** Dinheiro — espelho de /pagamentodinheiro, grava só hospedagem. */
export async function postReceberSaldoDinheiroHospedagem(
  idReservaHospedagem: number,
  body: { valorTotal: number; observacao?: string | null },
): Promise<ApiResponse<{ data: HospedagemTefConsultaData; reserva?: ReservaAdminDetalhe }>> {
  return api.request(
    `/hospedagem/reservas/${idReservaHospedagem}/pagamento/dinheiro`,
    "POST",
    body,
  );
}

/** Transferência / Outro — registro manual na hospedagem. */
export async function postReceberSaldoManualHospedagem(
  idReservaHospedagem: number,
  pagamento: HospedagemPagamentoPayload,
): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/${idReservaHospedagem}/pagamento/manual`,
    "POST",
    { pagamento },
  );
}

/**
 * Inicia SuperTEF — mesma sequência do PDV (POST /pagamentopos).
 * Body: valorTotal + transaction_type (1 débito, 2 crédito, 3 PIX).
 * Retorno: { id: payment_uniqueid, status: 'pending' }
 */
export async function postIniciarTefHospedagem(
  idReservaHospedagem: number,
  body: {
    valorTotal: number;
    transaction_type: number;
    /** Mesmo campo enviado pelo PagamentoPDV em /pagamentopos. */
    idUsuarioPDV: number;
    observacao?: string | null;
  },
): Promise<{
  id?: string | number;
  status?: string;
  success?: boolean;
  message?: string;
  error?: string;
  data?: any;
}> {
  const resp = await api.request<any>(
    `/hospedagem/reservas/${idReservaHospedagem}/pagamento/tef/iniciar`,
    "POST",
    body,
  );
  // api.request em POST devolve o body inteiro em data
  const bodyResp = resp.data ?? resp;
  const errorMsg =
    bodyResp?.error || bodyResp?.message || resp.message || undefined;
  return {
    ...resp,
    id: bodyResp?.id ?? bodyResp?.data?.id,
    status: bodyResp?.status ?? bodyResp?.data?.status,
    error: errorMsg,
    message: errorMsg || resp.message,
    success: Boolean(bodyResp?.id ?? bodyResp?.data?.id) && !bodyResp?.error,
  };
}

/** Consulta SuperTEF — mesma sequência do PDV (filters.payment_uniqueid). */
export async function getConsultarTefHospedagem(
  idReservaHospedagem: number,
  paymentUniqueId: string,
): Promise<ApiResponse<HospedagemTefConsultaData>> {
  return api.request<HospedagemTefConsultaData>(
    `/hospedagem/reservas/${idReservaHospedagem}/pagamento/tef/consultar`,
    "GET",
    null,
    {
      filters: JSON.stringify({ payment_uniqueid: paymentUniqueId }),
      payment_uniqueid: paymentUniqueId,
    },
  );
}

/** Cancela SuperTEF — mesma sequência do PDV. */
export async function postCancelarTefHospedagem(
  idReservaHospedagem: number,
  paymentUniqueId: string,
): Promise<ApiResponse<HospedagemTefConsultaData>> {
  return api.request(
    `/hospedagem/reservas/${idReservaHospedagem}/pagamento/tef/cancelar`,
    "POST",
    { payment_uniqueid: paymentUniqueId },
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

/** Cria reserva AguardandoPagamento e envia link ao cliente (novo endpoint). */
export async function postReservaRecepcaoEnviarCliente(body: {
  idEvento: number;
  idUsuario: number;
  checkin: string;
  checkout: string;
  suites: SuiteRecepcaoPayload[];
  observacoes?: string | null;
}): Promise<ApiResponse<ReservaAdminDetalhe>> {
  return api.request<ReservaAdminDetalhe>(
    `/hospedagem/reservas/recepcao/enviar-cliente`,
    "POST",
    body,
  );
}

/** Reenvia WhatsApp/e-mail com o link de pagamento. */
export async function postReenviarLinkPagamentoReserva(
  idReserva: number,
): Promise<ApiResponse<ReservaAdminDetalhe & { linkPagamento?: string }>> {
  return api.request(
    `/hospedagem/reservas/${idReserva}/reenviar-link`,
    "POST",
    {},
  );
}

/** Consulta pública da reserva pelo token do link. */
export async function getReservaPublicaPorToken(
  token: string,
): Promise<ApiResponse<any>> {
  return api.request(`/reserva/${encodeURIComponent(token)}`, "GET");
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
  /** Parte 5: estado por suíte via SuiteDisponibilidadeService (origem no backend). */
  disponibilidadePorSuite?: DisponibilidadeSuiteNoDia[];
};

/** Espelho do retorno de `calcularDisponibilidadeSuite` usado pela Agenda. */
export type DisponibilidadeSuiteNoDia = {
  idEventoSuite: number;
  badge: string;
  podeReservar: boolean;
  disponivelAposCheckout: boolean;
  agendaOcupada: boolean;
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
