/**
 * Operações administrativas compartilhadas (Agenda + Suítes).
 *
 * REGRA: toda ação operacional deve ser implementada uma única vez aqui
 * (ou no backend `/hospedagem/...`) e reutilizada nas duas abas.
 */

import {
  postRealizarCheckin,
  postRealizarCheckout,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";

export {
  HOSPEDAGEM_TZ,
  formatDateTimeHospedagem,
  formatHoraHospedagem,
  getStatusOperacionalSuite,
  corStatusOperacionalPadrao,
  labelStatusOperacionalPadrao,
  badgeStatusOperacional,
  CORES_STATUS_OPERACIONAL,
  type StatusOperacionalPadrao,
  type InputStatusOperacional,
} from "@/src/lib/hospedagemStatusOperacional";

/** Referência mínima para abrir o sheet de ações em qualquer aba. */
export type ReservaOperacaoRef = {
  idReservaHospedagem: number;
  suiteNome: string;
  inicio?: string | null;
  fim?: string | null;
  status?: string | null;
  statusReserva?: string | null;
  dataHoraCheckinReal?: string | null;
  dataHoraCheckoutRealizado?: string | null;
  responsavel?: string | null;
  adultos?: number;
  criancas?: number;
  valorTotal?: number | null;
  valorPago?: number | null;
  saldoPendente?: number | null;
  /** idEvento para Nova Reserva */
  idEvento?: number | null;
  idEventoSuite?: number | null;
};

/** Executa check-in via único endpoint do backend. */
export async function executarCheckinOperacional(
  idReservaHospedagem: number,
  dataHora?: string | null,
): Promise<{
  success: boolean;
  message?: string;
  data?: ReservaAdminDetalhe;
}> {
  const resp = await postRealizarCheckin(idReservaHospedagem, dataHora);
  return {
    success: Boolean(resp.success),
    message: resp.message,
    data: resp.data,
  };
}

/** Executa check-out via único endpoint do backend. */
export async function executarCheckoutOperacional(
  idReservaHospedagem: number,
  dataHora?: string | null,
): Promise<{
  success: boolean;
  message?: string;
  data?: ReservaAdminDetalhe;
}> {
  const resp = await postRealizarCheckout(idReservaHospedagem, dataHora);
  return {
    success: Boolean(resp.success),
    message: resp.message,
    data: resp.data,
  };
}
