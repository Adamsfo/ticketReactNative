import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { HOSPEDAGEM_TZ } from "@/src/lib/hospedagemStatusOperacional";

/** 0 domingo … 6 sábado — terça e quarta fechadas. */
export const DIAS_FECHADOS_HOSPEDAGEM = [2, 3];

export const MSG_DIAS_FECHADOS_HOSPEDAGEM =
  "Não é possível realizar reservas em períodos que incluam terças ou quartas-feiras, pois a pousada não funciona nesses dias. Escolha outro período.";

export const MSG_PERIODO_FECHADO_EXCEPCIONAL_HOSPEDAGEM =
  "Não é possível realizar reservas em períodos que incluam datas em que a pousada não funciona. Escolha outro período.";

export type IntervaloFechamentoExcepcional = {
  inicio: string;
  fim: string;
};

export type VerificadorFechamentoExcepcional = (dataCivil: string) => boolean;

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

export function isDataCivilFechadaSemanalHospedagem(dataCivil: string): boolean {
  const instante = fromZonedTime(`${dataCivil} 12:00:00`, HOSPEDAGEM_TZ);
  return isDiaFechadoEntradaSaidaHospedagem(instante);
}

function avancarDataCivilHospedagem(dataCivil: string): string {
  const instante = fromZonedTime(`${dataCivil} 12:00:00`, HOSPEDAGEM_TZ);
  return formatInTimeZone(addDays(instante, 1), HOSPEDAGEM_TZ, "yyyy-MM-dd");
}

export function criarVerificadorFechamentosExcepcionais(
  intervalos: IntervaloFechamentoExcepcional[],
): VerificadorFechamentoExcepcional {
  const normalizados = intervalos.map((i) => ({
    inicio: i.inicio,
    fim: i.fim,
  }));
  return (dataCivil: string) =>
    normalizados.some(
      (i) => dataCivil >= i.inicio && dataCivil <= i.fim,
    );
}

function isDataCivilFechadaPousada(
  dataCivil: string,
  excepcional?: VerificadorFechamentoExcepcional,
): boolean {
  if (isDataCivilFechadaSemanalHospedagem(dataCivil)) {
    return true;
  }
  return excepcional ? excepcional(dataCivil) : false;
}

function periodoIncluiFechamento(
  checkin: Date,
  checkout: Date,
  excepcional?: VerificadorFechamentoExcepcional,
): { bloqueado: boolean; semanal: boolean; excepcional: boolean } {
  const ci = dataCivilHospedagem(checkin);
  const co = dataCivilHospedagem(checkout);

  const testar = (dataCivil: string) => {
    const sem = isDataCivilFechadaSemanalHospedagem(dataCivil);
    const exc = excepcional ? excepcional(dataCivil) : false;
    return { sem, exc, bloqueado: sem || exc };
  };

  const coTest = testar(co);
  if (coTest.bloqueado) {
    return {
      bloqueado: true,
      semanal: coTest.sem,
      excepcional: coTest.exc,
    };
  }

  let cursor = ci;
  while (cursor < co) {
    const t = testar(cursor);
    if (t.bloqueado) {
      return {
        bloqueado: true,
        semanal: t.sem,
        excepcional: t.exc,
      };
    }
    cursor = avancarDataCivilHospedagem(cursor);
  }

  return { bloqueado: false, semanal: false, excepcional: false };
}

/**
 * True se o período inclui dia fechado (Cuiabá): cada dia civil de CI até o dia
 * anterior ao CO, mais o dia civil do check-out.
 */
export function periodoHospedagemIncluiDiaFechado(
  checkin: Date,
  checkout: Date,
  excepcional?: VerificadorFechamentoExcepcional,
): boolean {
  return periodoIncluiFechamento(checkin, checkout, excepcional).bloqueado;
}

export function mensagemErroPeriodoFechado(
  checkin: Date,
  checkout: Date,
  excepcional?: VerificadorFechamentoExcepcional,
): string {
  const r = periodoIncluiFechamento(checkin, checkout, excepcional);
  if (!r.bloqueado) {
    return "";
  }
  if (r.semanal) {
    return MSG_DIAS_FECHADOS_HOSPEDAGEM;
  }
  return MSG_PERIODO_FECHADO_EXCEPCIONAL_HOSPEDAGEM;
}

/** Para react-datepicker: true = data selecionável. */
export function isDataSelecionavelEntradaSaidaHospedagem(
  date: Date,
  excepcional?: VerificadorFechamentoExcepcional,
): boolean {
  const civil = dataCivilHospedagem(date);
  return !isDataCivilFechadaPousada(civil, excepcional);
}

function inicioDoDiaLocal(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Próximo dia civil (a partir de `inicio`) permitido para entrada/saída.
 * Usa a mesma regra do datepicker (semanal + excepcional quando informado).
 */
export function proximaDataSelecionavelHospedagem(
  inicio: Date,
  excepcional?: VerificadorFechamentoExcepcional,
  maxIteracoes = 400,
): Date {
  let d = inicioDoDiaLocal(inicio);
  for (let i = 0; i < maxIteracoes; i += 1) {
    if (isDataSelecionavelEntradaSaidaHospedagem(d, excepcional)) {
      return d;
    }
    d = addDays(d, 1);
  }
  return d;
}

/**
 * Ajusta check-in/check-out iniciais: avança check-in fechado e preserva noites;
 * prolonga check-out se o período ainda incluir dia fechado.
 */
export function ajustarDatasIniciaisPeriodoHospedagem(
  checkinDate: Date,
  checkoutDate: Date,
  noitesMinimas: number,
  excepcional?: VerificadorFechamentoExcepcional,
): { checkinDate: Date; checkoutDate: Date } {
  const ci0 = inicioDoDiaLocal(checkinDate);
  const co0 = inicioDoDiaLocal(checkoutDate);
  const noitesOrig = Math.max(
    noitesMinimas,
    Math.max(0, Math.round((co0.getTime() - ci0.getTime()) / 86400000)),
  );

  const ci = proximaDataSelecionavelHospedagem(ci0, excepcional);
  let co = addDays(ci, noitesOrig);

  for (let i = 0; i < 400; i += 1) {
    if (co.getTime() <= ci.getTime()) {
      co = addDays(ci, noitesMinimas);
    }
    if (!periodoHospedagemIncluiDiaFechado(ci, co, excepcional)) {
      return { checkinDate: ci, checkoutDate: co };
    }
    co = addDays(co, 1);
  }

  return { checkinDate: ci, checkoutDate: co };
}
