/**
 * Helpers de apresentação (cores / labels) para status de reserva e badges.
 *
 * Disponibilidade e estado operacional das suítes: SuiteDisponibilidadeService (API).
 * Este módulo NÃO decide podeCheckin / podeCheckout / Livre — só pinta e rotula.
 */

import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const HOSPEDAGEM_TZ = "America/Cuiaba";

export type StatusOperacionalPadrao =
  | "LIVRE"
  | "CHECKIN_HOJE"
  | "HOSPEDADA"
  | "CHECKOUT_HOJE"
  | "RESERVADA"
  | "AGUARDANDO_PAGAMENTO"
  | "BLOQUEADA"
  | "MANUTENCAO"
  | "CANCELADA"
  | "EXPIRADA"
  | "CHECKOUT_REALIZADO";

/** Paleta oficial — não alterar. */
export const CORES_STATUS_OPERACIONAL = {
  livre: "#027a3a",
  hospedada: "#0073E6",
  aguardandoAcao: "#e67e22",
  alerta: "#c0392b",
  encerrada: "#9ca3af",
} as const;

export type InputStatusOperacional = {
  /** Status da reserva no banco / exibição (Confirmada, Hospedada, …) */
  statusReserva?: string | null;
  /** Status operacional já classificado pelo backend (CheckInHoje, Hospedada, …) */
  statusOperacional?: string | null;
  checkin?: string | Date | null;
  checkout?: string | Date | null;
  dataHoraCheckinReal?: string | Date | null;
  dataReferencia?: string | null;
  bloqueada?: boolean;
  manutencao?: boolean;
};

function dataStrCuiaba(d: string | Date): string {
  const date = d instanceof Date ? d : parseISO(String(d));
  return formatInTimeZone(date, HOSPEDAGEM_TZ, "yyyy-MM-dd");
}

function hojeStrCuiaba(): string {
  return formatInTimeZone(new Date(), HOSPEDAGEM_TZ, "yyyy-MM-dd");
}

/**
 * Mapeia status de reserva / badge já classificado para o enum de apresentação.
 * Não recalcula disponibilidade — use SuiteDisponibilidadeService no backend.
 */
export function getStatusOperacionalSuite(
  input: InputStatusOperacional,
): StatusOperacionalPadrao {
  if (input.manutencao) return "MANUTENCAO";
  if (input.bloqueada) return "BLOQUEADA";

  const statusDb = String(input.statusReserva || "");
  const statusOp = String(input.statusOperacional || "");
  const ref = input.dataReferencia || hojeStrCuiaba();

  if (
    statusDb === "Cancelada" ||
    statusOp === "Cancelada" ||
    statusOp === "CANCELADA"
  ) {
    return "CANCELADA";
  }
  if (
    statusDb === "Expirada" ||
    statusOp === "Expirada" ||
    statusOp === "EXPIRADA"
  ) {
    return "EXPIRADA";
  }
  if (
    statusDb === "CheckOutRealizado" ||
    statusDb === "CheckoutRealizado" ||
    statusOp === "CHECKOUT_REALIZADO"
  ) {
    return "CHECKOUT_REALIZADO";
  }
  if (
    statusDb === "AguardandoPagamento" ||
    statusOp === "AguardandoPagamento" ||
    statusOp === "AGUARDANDO_PAGAMENTO"
  ) {
    return "AGUARDANDO_PAGAMENTO";
  }
  if (
    statusOp === "Manutencao" ||
    statusOp === "MANUTENCAO" ||
    statusDb === "Manutencao"
  ) {
    return "MANUTENCAO";
  }
  if (
    statusOp === "Bloqueada" ||
    statusOp === "BLOQUEADA" ||
    statusDb === "Bloqueada"
  ) {
    return "BLOQUEADA";
  }
  if (statusOp === "Livre" || statusOp === "LIVRE") {
    return "LIVRE";
  }

  // Check-in real tem prioridade sobre qualquer rótulo de "Check-in Hoje"
  const jaFezCheckin =
    statusDb === "Hospedada" ||
    statusOp === "Hospedada" ||
    statusOp === "HOSPEDADA" ||
    statusOp === "CheckOutHoje" ||
    statusOp === "CHECKOUT_HOJE" ||
    Boolean(input.dataHoraCheckinReal);

  if (jaFezCheckin) {
    if (statusOp === "CheckOutHoje" || statusOp === "CHECKOUT_HOJE") {
      return "CHECKOUT_HOJE";
    }
    if (input.checkout && dataStrCuiaba(input.checkout) === ref) {
      return "CHECKOUT_HOJE";
    }
    return "HOSPEDADA";
  }

  // Confirmada / ainda sem check-in
  if (
    statusOp === "CheckInHoje" ||
    statusOp === "CHECKIN_HOJE" ||
    (statusDb === "Confirmada" &&
      input.checkin &&
      dataStrCuiaba(input.checkin) === ref)
  ) {
    return "CHECKIN_HOJE";
  }

  // Confirmada no período (noite intermediária) ainda sem check-in
  if (
    statusDb === "Confirmada" &&
    (statusOp === "Ocupada" || statusOp === "Confirmada")
  ) {
    return "CHECKIN_HOJE";
  }

  if (!statusDb && !statusOp) {
    return "LIVRE";
  }

  return "LIVRE";
}

export function corStatusOperacionalPadrao(
  status: StatusOperacionalPadrao | string,
): string {
  switch (status) {
    case "LIVRE":
    case "Livre":
      return CORES_STATUS_OPERACIONAL.livre;
    case "HOSPEDADA":
    case "Hospedada":
      return CORES_STATUS_OPERACIONAL.hospedada;
    case "CHECKIN_HOJE":
    case "CheckInHoje":
    case "CHECKOUT_HOJE":
    case "CheckOutHoje":
    case "RESERVADA":
    case "Ocupada":
    case "AGUARDANDO_PAGAMENTO":
    case "AguardandoPagamento":
    case "Confirmada":
      return CORES_STATUS_OPERACIONAL.aguardandoAcao;
    case "MANUTENCAO":
    case "Manutencao":
    case "BLOQUEADA":
    case "Bloqueada":
    case "CANCELADA":
    case "Cancelada":
    case "EXPIRADA":
    case "Expirada":
      return CORES_STATUS_OPERACIONAL.alerta;
    case "CHECKOUT_REALIZADO":
    case "CheckOutRealizado":
    case "CheckoutRealizado":
      return CORES_STATUS_OPERACIONAL.encerrada;
    default:
      return CORES_STATUS_OPERACIONAL.encerrada;
  }
}

export function labelStatusOperacionalPadrao(
  status: StatusOperacionalPadrao | string,
): string {
  switch (status) {
    case "LIVRE":
    case "Livre":
      return "Livre";
    case "CHECKIN_HOJE":
    case "CheckInHoje":
      return "Check-in hoje";
    case "HOSPEDADA":
    case "Hospedada":
      return "Hospedada";
    case "CHECKOUT_HOJE":
    case "CheckOutHoje":
      return "Check-out hoje";
    case "RESERVADA":
    case "Ocupada":
      return "Reservada";
    case "AGUARDANDO_PAGAMENTO":
    case "AguardandoPagamento":
      return "Aguardando pagamento";
    case "MANUTENCAO":
    case "Manutencao":
      return "Manutenção";
    case "BLOQUEADA":
    case "Bloqueada":
      return "Bloqueada";
    case "CANCELADA":
    case "Cancelada":
      return "Cancelada";
    case "EXPIRADA":
    case "Expirada":
      return "Expirada";
    case "CHECKOUT_REALIZADO":
    case "CheckOutRealizado":
    case "CheckoutRealizado":
      return "Check-out realizado";
    case "Confirmada":
      return "Confirmada";
    default:
      return String(status);
  }
}

export function badgeStatusOperacional(
  status: StatusOperacionalPadrao | string,
): string {
  return labelStatusOperacionalPadrao(status).toUpperCase();
}

export function formatDateTimeHospedagem(iso: string): string {
  try {
    return formatInTimeZone(
      parseISO(String(iso)),
      HOSPEDAGEM_TZ,
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return String(iso);
  }
}

export function formatHoraHospedagem(iso?: string | Date | null): string {
  if (!iso) return "--:--";
  try {
    return formatInTimeZone(
      iso instanceof Date ? iso : parseISO(String(iso)),
      HOSPEDAGEM_TZ,
      "HH:mm",
    );
  } catch {
    return "--:--";
  }
}
