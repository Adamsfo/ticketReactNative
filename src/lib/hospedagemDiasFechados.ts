import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { HOSPEDAGEM_TZ } from "@/src/lib/hospedagemStatusOperacional";

/** 0 domingo … 6 sábado — terça e quarta fechadas. */
export const DIAS_FECHADOS_HOSPEDAGEM = [2, 3];

export const MSG_DIAS_FECHADOS_HOSPEDAGEM =
  "Não é possível realizar reservas em períodos que incluam terças ou quartas-feiras, pois a pousada não funciona nesses dias. Escolha outro período.";

export function dataCivilHospedagem(value: Date): string {
  return formatInTimeZone(value, HOSPEDAGEM_TZ, "yyyy-MM-dd");
}

/** Dia da semana da data civil em America/Cuiabá (0=domingo … 6=sábado). */
export function diaSemanaCivilHospedagem(value: Date): number {
  const iso = Number(formatInTimeZone(value, HOSPEDAGEM_TZ, "i"));
  return iso % 7;
}

/** True se o dia civil (Cuiabá) é terça ou quarta. */
export function isDiaFechadoEntradaSaidaHospedagem(value: Date): boolean {
  return DIAS_FECHADOS_HOSPEDAGEM.includes(diaSemanaCivilHospedagem(value));
}

function isDataCivilFechadaHospedagem(dataCivil: string): boolean {
  const instante = fromZonedTime(`${dataCivil} 12:00:00`, HOSPEDAGEM_TZ);
  return isDiaFechadoEntradaSaidaHospedagem(instante);
}

function avancarDataCivilHospedagem(dataCivil: string): string {
  const instante = fromZonedTime(`${dataCivil} 12:00:00`, HOSPEDAGEM_TZ);
  return formatInTimeZone(addDays(instante, 1), HOSPEDAGEM_TZ, "yyyy-MM-dd");
}

/**
 * True se o período inclui terça/quarta (Cuiabá): cada dia civil de CI até o dia
 * anterior ao CO, mais o dia civil do check-out.
 */
export function periodoHospedagemIncluiDiaFechado(
  checkin: Date,
  checkout: Date,
): boolean {
  const ci = dataCivilHospedagem(checkin);
  const co = dataCivilHospedagem(checkout);

  if (isDataCivilFechadaHospedagem(co)) {
    return true;
  }

  let cursor = ci;
  while (cursor < co) {
    if (isDataCivilFechadaHospedagem(cursor)) {
      return true;
    }
    cursor = avancarDataCivilHospedagem(cursor);
  }

  return false;
}

/** Para react-datepicker: true = data selecionável (terça/quarta ainda bloqueadas no calendário). */
export function isDataSelecionavelEntradaSaidaHospedagem(date: Date): boolean {
  return !isDiaFechadoEntradaSaidaHospedagem(date);
}
