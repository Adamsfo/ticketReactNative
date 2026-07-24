/**
 * Status operacional padronizado — Fonte única para Agenda + Suítes.
 *
 * Cores:
 * 🟢 Livre / disponível
 * 🔵 Hospedada (check-in feito)
 * 🟠 Aguardando ação (check-in hoje, check-out hoje, aguardando pagamento)
 * 🔴 Manutenção / Bloqueada / Cancelada / Expirada / Overbooking
 * ⚪ Check-out realizado
 */

import { parseISO, startOfDay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const HOSPEDAGEM_TZ = "America/Cuiaba";

export type StatusOperacionalPadrao =
  | "LIVRE"
  | "CHECKIN_HOJE"
  | "HOSPEDADA"
  | "CHECKOUT_HOJE"
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
 * Classificação única consumida por Suítes, Agenda e BottomSheet.
 *
 * Regra-chave: quem já fez check-in NUNCA retorna CHECKIN_HOJE.
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

/** Ações sugeridas no BottomSheet conforme status. */
export function acoesSheetPorStatus(status: StatusOperacionalPadrao): {
  realizarCheckin: boolean;
  realizarCheckout: boolean;
  verReserva: boolean;
  novaReserva: boolean;
} {
  switch (status) {
    case "CHECKIN_HOJE":
      return {
        realizarCheckin: true,
        realizarCheckout: false,
        verReserva: true,
        novaReserva: false,
      };
    case "HOSPEDADA":
      return {
        realizarCheckin: false,
        realizarCheckout: true,
        verReserva: true,
        novaReserva: false,
      };
    case "CHECKOUT_HOJE":
      return {
        realizarCheckin: false,
        realizarCheckout: true,
        verReserva: true,
        novaReserva: false,
      };
    case "CHECKOUT_REALIZADO":
      return {
        realizarCheckin: false,
        realizarCheckout: false,
        verReserva: true,
        novaReserva: false,
      };
    case "LIVRE":
      return {
        realizarCheckin: false,
        realizarCheckout: false,
        verReserva: false,
        novaReserva: true,
      };
    default:
      return {
        realizarCheckin: false,
        realizarCheckout: false,
        verReserva: true,
        novaReserva: false,
      };
  }
}

export function checkinDisponivelInfo(checkinIso: string): {
  disponivel: boolean;
  labelDisponivelEm: string | null;
} {
  try {
    const agora = toZonedTime(new Date(), HOSPEDAGEM_TZ);
    const checkin = toZonedTime(parseISO(String(checkinIso)), HOSPEDAGEM_TZ);
    const disponivel =
      startOfDay(agora).getTime() >= startOfDay(checkin).getTime();
    if (disponivel) return { disponivel: true, labelDisponivelEm: null };
    return {
      disponivel: false,
      labelDisponivelEm: formatInTimeZone(
        parseISO(String(checkinIso)),
        HOSPEDAGEM_TZ,
        "dd/MM",
      ),
    };
  } catch {
    return { disponivel: false, labelDisponivelEm: null };
  }
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
