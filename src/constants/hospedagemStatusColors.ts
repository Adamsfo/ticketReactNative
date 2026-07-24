/**
 * Paleta unificada da operação de hospedagem.
 * Fonte de verdade das cores: lib/hospedagemStatusOperacional.ts
 */
import {
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  getStatusOperacionalSuite,
} from "@/src/lib/hospedagemStatusOperacional";

export type IndicadoresCalendarioHospedagem = {
  checkin: number;
  checkout: number;
  ocupada: number;
  livre: number;
  bloqueada: number;
  manutencao: number;
};

export const HOSPEDAGEM_STATUS_COLORS = {
  /** 🟢 Livre */
  livre: CORES_STATUS_OPERACIONAL.livre,
  /** 🔵 Hospedada */
  hospedada: CORES_STATUS_OPERACIONAL.hospedada,
  /** 🟠 Check-in / Check-out / Aguardando pagamento */
  checkInHoje: CORES_STATUS_OPERACIONAL.aguardandoAcao,
  checkOutHoje: CORES_STATUS_OPERACIONAL.aguardandoAcao,
  aguardandoPagamento: CORES_STATUS_OPERACIONAL.aguardandoAcao,
  /** 🔴 Bloqueada / Manutenção */
  bloqueada: CORES_STATUS_OPERACIONAL.alerta,
  manutencao: CORES_STATUS_OPERACIONAL.alerta,
  /** ⚪ Encerrada / fallback cinza */
  ocupada: CORES_STATUS_OPERACIONAL.encerrada,
  checkoutRealizado: CORES_STATUS_OPERACIONAL.encerrada,
} as const;

export type HospedagemStatusColorKey = keyof typeof HOSPEDAGEM_STATUS_COLORS;

/** Cor do selo/borda do card conforme status operacional da suíte. */
export function corStatusOperacionalHospedagem(status: string): string {
  const padrao = getStatusOperacionalSuite({ statusOperacional: status });
  return corStatusOperacionalPadrao(padrao);
}

/**
 * Bolinhas do calendário — mesma paleta da operação.
 * Ordem: check-in → check-out → livre → hospedada → bloqueada/manutenção.
 */
export function dotsIndicadoresCalendario(
  indicadores?: IndicadoresCalendarioHospedagem | null,
): Array<{ key: string; cor: string }> {
  if (!indicadores) return [];

  const dots: Array<{ key: string; cor: string }> = [];

  if (indicadores.checkin > 0) {
    dots.push({
      key: "checkin",
      cor: HOSPEDAGEM_STATUS_COLORS.checkInHoje,
    });
  }
  if (indicadores.checkout > 0) {
    dots.push({
      key: "checkout",
      cor: HOSPEDAGEM_STATUS_COLORS.checkOutHoje,
    });
  }
  if (indicadores.livre > 0) {
    dots.push({ key: "livre", cor: HOSPEDAGEM_STATUS_COLORS.livre });
  }
  if (indicadores.ocupada > 0) {
    dots.push({ key: "ocupada", cor: HOSPEDAGEM_STATUS_COLORS.hospedada });
  }
  if (indicadores.bloqueada > 0 || indicadores.manutencao > 0) {
    dots.push({
      key: "bloqueada",
      cor: HOSPEDAGEM_STATUS_COLORS.bloqueada,
    });
  }

  return dots;
}

/**
 * Cor da barra contínua na timeline da Agenda.
 * Mesma paleta operacional: Confirmada/check-in → laranja; Hospedada → azul.
 */
export function corBarraReservaAgenda(status: string): string {
  switch (status) {
    case "Hospedada":
    case "HOSPEDADA":
      return HOSPEDAGEM_STATUS_COLORS.hospedada;
    case "Confirmada":
    case "CheckInHoje":
    case "CHECKIN_HOJE":
    case "CheckOutHoje":
    case "CHECKOUT_HOJE":
    case "AguardandoPagamento":
      return HOSPEDAGEM_STATUS_COLORS.checkInHoje;
    case "Manutencao":
    case "Bloqueada":
    case "Cancelada":
    case "Expirada":
      return HOSPEDAGEM_STATUS_COLORS.bloqueada;
    case "CheckOutRealizado":
    case "CheckoutRealizado":
      return HOSPEDAGEM_STATUS_COLORS.checkoutRealizado;
    default: {
      const padrao = getStatusOperacionalSuite({ statusReserva: status });
      return corStatusOperacionalPadrao(padrao);
    }
  }
}
