/**
 * Operações administrativas compartilhadas (Agenda + Suítes).
 *
 * REGRA: toda ação operacional deve ser implementada uma única vez aqui
 * (ou no backend `/hospedagem/...`) e reutilizada nas duas abas.
 */

import {
  postRegistrarChegadaSuite,
  postRealizarCheckinSuite,
  postRealizarCheckout,
  postRealizarCheckoutSuite,
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
  idReservaSuite?: number | null;
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

/** Registra chegada física da ReservaSuite em foco. */
export async function executarRegistrarChegadaOperacional(
  idReservaHospedagem: number,
  idReservaSuite: number,
  dataHora?: string | null,
): Promise<{
  success: boolean;
  message?: string;
  data?: ReservaAdminDetalhe;
}> {
  const resp = await postRegistrarChegadaSuite(
    idReservaHospedagem,
    idReservaSuite,
    dataHora,
  );
  return {
    success: Boolean(resp.success),
    message: resp.message,
    data: resp.data,
  };
}

/** Executa check-in da ReservaSuite em foco. */
export async function executarCheckinOperacional(
  idReservaHospedagem: number,
  idReservaSuite: number,
  dataHora?: string | null,
): Promise<{
  success: boolean;
  message?: string;
  data?: ReservaAdminDetalhe;
}> {
  const resp = await postRealizarCheckinSuite(
    idReservaHospedagem,
    idReservaSuite,
    dataHora,
  );
  return {
    success: Boolean(resp.success),
    message: resp.message,
    data: resp.data,
  };
}

/** Executa check-out da ReservaSuite em foco (fallback global se sem idReservaSuite). */
export async function executarCheckoutOperacional(
  idReservaHospedagem: number,
  idReservaSuite: number | null | undefined,
  dataHora?: string | null,
): Promise<{
  success: boolean;
  message?: string;
  data?: ReservaAdminDetalhe;
}> {
  const resp =
    idReservaSuite != null && idReservaSuite > 0
      ? await postRealizarCheckoutSuite(
          idReservaHospedagem,
          idReservaSuite,
          dataHora,
        )
      : await postRealizarCheckout(idReservaHospedagem, dataHora);
  return {
    success: Boolean(resp.success),
    message: resp.message,
    data: resp.data,
  };
}
