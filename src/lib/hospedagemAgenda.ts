import { addDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  DiaCalendarioSuites,
  getSuitesOperacionais,
  SuiteOperacionalCard,
} from "@/src/lib/hospedagemAdmin";

export const TZ = "America/Cuiaba";
export const AGENDA_DAY_WIDTH = 52;
export const AGENDA_ROW_HEIGHT = 52;
export const AGENDA_SUITE_COL_WIDTH = 108;
export const AGENDA_HEADER_HEIGHT = 40;

export type AgendaRange = 7 | 15 | 30;

export type BarraAgendaReserva = {
  id: string;
  idReservaHospedagem: number;
  idEventoSuite: number;
  suiteNome: string;
  inicio: string;
  fim: string;
  status: string;
  responsavel: string | null;
  adultos?: number;
  criancas?: number;
  valorTotal?: number;
  valorPago?: number;
  saldoPendente?: number;
  dataHoraCheckinReal?: string | null;
  dataHoraCheckoutRealizado?: string | null;
  /**
   * Dias civis em que o calendário das Suítes marcou a reserva como ocupante
   * (`classificarReservaNoDia` / `agendaOcupada`) — mesma fonte dos cards.
   */
  diasOcupados: string[];
};

const MESES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function hojeStrCuiaba(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

export function mesDeData(data: string): string {
  return data.slice(0, 7);
}

export function labelMesAno(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES_PT[(m || 1) - 1]}/${y}`;
}

export function addMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function buildDiasVisiveis(
  dataInicio: string,
  range: AgendaRange,
): string[] {
  const start = parseISO(`${dataInicio}T12:00:00`);
  return Array.from({ length: range }, (_, i) =>
    formatInTimeZone(addDays(start, i), TZ, "yyyy-MM-dd"),
  );
}

export function mesesNoIntervalo(dias: string[]): string[] {
  const set = new Set(dias.map(mesDeData));
  return Array.from(set).sort();
}

function chaveBarra(idReserva: number, idSuite: number): string {
  return `${idReserva}-${idSuite}`;
}

/**
 * Posição da barra na grade — somente nos dias que o calendário das Suítes
 * marcou como ocupados (`diasOcupados`), alinhado aos cards.
 * Meia célula no dia civil de check-in / check-out (hotelaria).
 */
export function calcularGeometriaBarra(
  inicio: string,
  fim: string,
  diasVisiveis: string[],
  dayWidth = AGENDA_DAY_WIDTH,
  diasOcupados: string[] = [],
): { left: number; width: number } | null {
  const ocupadosSet = new Set(diasOcupados);
  const indices = diasVisiveis
    .map((data, idx) => ({ data, idx }))
    .filter(({ data }) => ocupadosSet.has(data))
    .map(({ idx }) => idx);

  if (!indices.length) return null;

  const firstIdx = indices[0];
  const lastIdx = indices[indices.length - 1];
  const half = dayWidth / 2;
  const checkinDia = dataCuiabaFromIso(inicio);
  const checkoutDia = dataCuiabaFromIso(fim);
  const pad = 2;

  const startX =
    checkinDia === diasVisiveis[firstIdx]
      ? firstIdx * dayWidth + half
      : firstIdx * dayWidth;

  const endX =
    checkoutDia === diasVisiveis[lastIdx]
      ? lastIdx * dayWidth + half
      : (lastIdx + 1) * dayWidth;

  const width = endX - startX - pad * 2;
  if (width < 8) return null;

  return {
    left: startX + pad,
    width,
  };
}

/**
 * Barras somente a partir de `meta.calendario.eventosAgenda`
 * (mesmo `SuiteDisponibilidadeService` / `classificarReservaNoDia` dos cards).
 */
function extrairBarrasDoCalendarioSuites(
  dias: DiaCalendarioSuites[],
): Map<string, BarraAgendaReserva> {
  const map = new Map<string, BarraAgendaReserva>();

  for (const dia of dias) {
    for (const ev of dia.eventosAgenda ?? []) {
      const key = chaveBarra(ev.idReservaHospedagem, ev.idEventoSuite);
      const existente = map.get(key);
      if (!existente) {
        map.set(key, {
          id: key,
          idReservaHospedagem: ev.idReservaHospedagem,
          idEventoSuite: ev.idEventoSuite,
          suiteNome: ev.suiteNome,
          inicio: ev.inicio,
          fim: ev.fim,
          status: ev.status,
          responsavel: ev.responsavel,
          dataHoraCheckinReal: ev.dataHoraCheckinReal ?? null,
          dataHoraCheckoutRealizado: ev.dataHoraCheckoutRealizado ?? null,
          diasOcupados: [dia.data],
        });
      } else if (!existente.diasOcupados.includes(dia.data)) {
        existente.diasOcupados.push(dia.data);
        existente.diasOcupados.sort();
      }
    }
  }

  return map;
}

/**
 * Dados da Agenda = mesma API/estrutura operacional das Suítes
 * (`getSuitesOperacionais` → `meta.calendario` via SuiteDisponibilidadeService).
 * Não mescla listagem de reservas nem recalcula ocupação no cliente.
 */
export async function carregarDadosAgenda(
  dataInicio: string,
  range: AgendaRange,
): Promise<{
  suites: SuiteOperacionalCard[];
  barras: BarraAgendaReserva[];
  /** Dias do calendário com disponibilidadePorSuite (SuiteDisponibilidadeService). */
  diasCalendario: DiaCalendarioSuites[];
}> {
  const diasVisiveis = buildDiasVisiveis(dataInicio, range);
  const meses = mesesNoIntervalo(diasVisiveis);
  const mesPrincipal = mesDeData(dataInicio);

  const suitesResp = await getSuitesOperacionais({
    filtro: "todas",
    data: dataInicio,
    mes: mesPrincipal,
  });
  const suites = suitesResp.data ?? [];

  const diasCalendario: DiaCalendarioSuites[] = [];
  const diasVistos = new Set<string>();

  for (const mes of meses) {
    const resp =
      mes === mesPrincipal
        ? suitesResp
        : await getSuitesOperacionais({
            filtro: "todas",
            data: `${mes}-01`,
            mes,
          });
    for (const dia of resp.meta?.calendario?.dias ?? []) {
      if (diasVistos.has(dia.data)) continue;
      diasVistos.add(dia.data);
      diasCalendario.push(dia);
    }
  }

  const barrasMap = extrairBarrasDoCalendarioSuites(diasCalendario);

  // Check-out real encerra a barra no horário efetivo (já vem do evento do calendário).
  for (const barra of barrasMap.values()) {
    if (barra.dataHoraCheckoutRealizado) {
      barra.fim = barra.dataHoraCheckoutRealizado;
      barra.status = "CheckOutRealizado";
    }
  }

  const barras = Array.from(barrasMap.values()).filter((b) =>
    Boolean(
      calcularGeometriaBarra(
        b.inicio,
        b.fim,
        diasVisiveis,
        AGENDA_DAY_WIDTH,
        b.diasOcupados,
      ),
    ),
  );

  return { suites, barras, diasCalendario };
}

export function labelDiaCurto(data: string): string {
  return String(Number(data.slice(8, 10)));
}

export function labelDiaSemana(data: string): string {
  try {
    return formatInTimeZone(parseISO(`${data}T12:00:00`), TZ, "EEE");
  } catch {
    return "";
  }
}

export function dataCuiabaFromIso(iso: string): string {
  return formatInTimeZone(new Date(iso), TZ, "yyyy-MM-dd");
}

/** Dia ocupa a grade se o serviço marcou agendaOcupada (não recalcula datas). */
export function diaOcupadoPorDisponibilidade(
  data: string,
  idEventoSuite: number,
  diasCalendario: DiaCalendarioSuites[],
): boolean {
  const dia = diasCalendario.find((d) => d.data === data);
  const info = dia?.disponibilidadePorSuite?.find(
    (s) => s.idEventoSuite === idEventoSuite,
  );
  return Boolean(info?.agendaOcupada);
}

export type SlotDisponivelAgenda = {
  data: string;
  /** meia = tarde após check-out 13:00; cheia = dia inteiro livre */
  modo: "meia" | "cheia";
};

/**
 * Slots verdes da Agenda = mesmos dias em que a aba Suítes permite Nova Reserva.
 * Usa apenas `podeReservar` / `disponivelAposCheckout` de
 * `disponibilidadePorSuite` (SuiteDisponibilidadeService) — sem filtro esparso.
 */
export function slotsDisponiveisDaAgenda(
  idEventoSuite: number,
  diasVisiveis: string[],
  diasCalendario: DiaCalendarioSuites[],
): SlotDisponivelAgenda[] {
  if (!diasVisiveis.length) return [];

  const byData = new Map(diasCalendario.map((d) => [d.data, d]));

  return diasVisiveis
    .map((data) => {
      const info = byData
        .get(data)
        ?.disponibilidadePorSuite?.find((s) => s.idEventoSuite === idEventoSuite);
      return { data, info };
    })
    .filter((i) => Boolean(i.info?.podeReservar))
    .map((i) => ({
      data: i.data,
      modo: i.info?.disponivelAposCheckout ? ("meia" as const) : ("cheia" as const),
    }));
}

export type AgendaNovaReservaPrefill = {
  idEvento: number;
  idEventoSuite: number;
  suiteNome: string;
  checkinDate: string;
  checkinHora: string;
};
