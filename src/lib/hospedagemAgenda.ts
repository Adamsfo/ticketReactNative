import { addDays, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import {
  DiaCalendarioSuites,
  EventoAgendaSuite,
  getReservasAdmin,
  getSuitesOperacionais,
  ReservaAdminCard,
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

function diaInicioMs(data: string): number {
  return parseISO(`${data}T00:00:00`).getTime();
}

function diaFimMs(data: string): number {
  return parseISO(`${data}T23:59:59.999`).getTime();
}

/** Posição da barra na grade (hotelaria: check-in 16:00 → check-out 13:00).
 * Inicia na metade do dia de check-in e termina na metade do dia de check-out. */
export function calcularGeometriaBarra(
  inicio: string,
  fim: string,
  diasVisiveis: string[],
  dayWidth = AGENDA_DAY_WIDTH,
): { left: number; width: number } | null {
  const ci = new Date(inicio).getTime();
  const co = new Date(fim).getTime();
  if (!(co > ci)) return null;

  let firstIdx = -1;
  let lastIdx = -1;

  diasVisiveis.forEach((data, idx) => {
    const inicioDia = diaInicioMs(data);
    const fimDia = diaFimMs(data);
    if (ci < fimDia && co > inicioDia) {
      if (firstIdx === -1) firstIdx = idx;
      lastIdx = idx;
    }
  });

  if (firstIdx === -1 || lastIdx === -1) return null;

  const half = dayWidth / 2;
  const checkinDia = dataCuiabaFromIso(inicio);
  const checkoutDia = dataCuiabaFromIso(fim);
  const pad = 2;

  // Check-in 16:00 → começa na metade; se a reserva já estava ativa no início da janela, ocupa desde o início do dia.
  const startX =
    checkinDia === diasVisiveis[firstIdx]
      ? firstIdx * dayWidth + half
      : firstIdx * dayWidth;

  // Check-out 13:00 → termina na metade; se o check-out fica fora da janela, ocupa até o fim do último dia.
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

function extrairEventosCalendario(
  dias: { eventosAgenda?: EventoAgendaSuite[] }[],
): Map<string, BarraAgendaReserva> {
  const map = new Map<string, BarraAgendaReserva>();

  for (const dia of dias) {
    for (const ev of dia.eventosAgenda ?? []) {
      const key = chaveBarra(ev.idReservaHospedagem, ev.idEventoSuite);
      if (!map.has(key)) {
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
        });
      }
    }
  }

  return map;
}

function mesclarReservasAdmin(
  map: Map<string, BarraAgendaReserva>,
  reservas: ReservaAdminCard[],
  suites: SuiteOperacionalCard[],
  diasVisiveis: string[],
) {
  const inicioJanela = diaInicioMs(diasVisiveis[0]);
  const fimJanela = diaFimMs(diasVisiveis[diasVisiveis.length - 1]);

  for (const r of reservas) {
    const ci = new Date(r.checkin).getTime();
    const co = new Date(r.checkout).getTime();
    if (co <= inicioJanela || ci >= fimJanela) continue;

    const suite = suites.find((s) => s.nome === r.nomeSuite);
    if (!suite) continue;

    const key = chaveBarra(r.idReservaHospedagem, suite.idEventoSuite);
    const existente = map.get(key);

    map.set(key, {
      id: key,
      idReservaHospedagem: r.idReservaHospedagem,
      idEventoSuite: suite.idEventoSuite,
      suiteNome: r.nomeSuite,
      inicio: existente?.inicio ?? r.checkin,
      fim:
        existente?.fim ??
        (r as ReservaAdminCard & { dataHoraCheckoutRealizado?: string | null })
          .dataHoraCheckoutRealizado ??
        r.checkout,
      status: r.status || existente?.status || "Confirmada",
      responsavel:
        r.responsavel || r.nomeResponsavel || existente?.responsavel || null,
      adultos: r.adultos,
      criancas: r.criancas,
      valorTotal: r.valorTotal,
      valorPago: r.valorPago ?? existente?.valorPago,
      saldoPendente: r.saldoPendente ?? existente?.saldoPendente,
      dataHoraCheckinReal:
        (r as ReservaAdminCard & { dataHoraCheckinReal?: string | null })
          .dataHoraCheckinReal ??
        existente?.dataHoraCheckinReal ??
        null,
      dataHoraCheckoutRealizado:
        (r as ReservaAdminCard & { dataHoraCheckoutRealizado?: string | null })
          .dataHoraCheckoutRealizado ??
        existente?.dataHoraCheckoutRealizado ??
        null,
    });
  }
}

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

  const barrasMap = new Map<string, BarraAgendaReserva>();
  const diasCalendario: DiaCalendarioSuites[] = [];
  const diasVistos = new Set<string>();

  for (const mes of meses) {
    const resp = await getSuitesOperacionais({
      filtro: "todas",
      data: `${mes}-01`,
      mes,
    });
    for (const dia of resp.meta?.calendario?.dias ?? []) {
      if (diasVistos.has(dia.data)) continue;
      diasVistos.add(dia.data);
      diasCalendario.push(dia);
    }
    const eventos = extrairEventosCalendario(
      resp.meta?.calendario?.dias ?? [],
    );
    for (const [k, v] of eventos) {
      if (!barrasMap.has(k)) barrasMap.set(k, v);
    }
  }

  try {
    const reservasResp = await getReservasAdmin({
      filtro: "todos",
      page: 1,
      pageSize: 200,
    });
    mesclarReservasAdmin(
      barrasMap,
      reservasResp.data ?? [],
      suites,
      diasVisiveis,
    );
  } catch {
    // Mantém apenas eventos do calendário se a listagem falhar
  }

  // Geometria: check-out real encerra a barra no horário efetivo (não recalcula disponibilidade).
  for (const barra of barrasMap.values()) {
    if (barra.dataHoraCheckoutRealizado) {
      barra.fim = barra.dataHoraCheckoutRealizado;
      barra.status = "CheckOutRealizado";
    }
  }

  const barras = Array.from(barrasMap.values()).filter((b) =>
    Boolean(
      calcularGeometriaBarra(b.inicio, b.fim, diasVisiveis, AGENDA_DAY_WIDTH),
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
 * Slots clicáveis na Agenda — somente flags do SuiteDisponibilidadeService
 * (`podeReservar` / `disponivelAposCheckout` / `agendaOcupada`).
 * Mantém a UX esparsa: suíte sem ocupação → primeiro dia reservável;
 * com ocupação → dias de disponível após checkout.
 */
export function slotsDisponiveisDaAgenda(
  idEventoSuite: number,
  diasVisiveis: string[],
  diasCalendario: DiaCalendarioSuites[],
): SlotDisponivelAgenda[] {
  if (!diasVisiveis.length) return [];

  const byData = new Map(diasCalendario.map((d) => [d.data, d]));
  const infos = diasVisiveis.map((data) => {
    const info = byData
      .get(data)
      ?.disponibilidadePorSuite?.find((s) => s.idEventoSuite === idEventoSuite);
    return { data, info };
  });

  const temOcupacao = infos.some((i) => i.info?.agendaOcupada);
  if (!temOcupacao) {
    const primeiro = infos.find((i) => i.info?.podeReservar);
    return primeiro
      ? [{ data: primeiro.data, modo: "cheia" }]
      : [];
  }

  return infos
    .filter(
      (i) =>
        Boolean(i.info?.podeReservar) &&
        Boolean(i.info?.disponivelAposCheckout),
    )
    .map((i) => ({ data: i.data, modo: "meia" as const }));
}

export type AgendaNovaReservaPrefill = {
  idEvento: number;
  idEventoSuite: number;
  suiteNome: string;
  checkinDate: string;
  checkinHora: string;
};
