import {
  ajustarDatasIniciaisPeriodoHospedagem,
  dataCivilHospedagem,
  type VerificadorFechamentoExcepcional,
} from "@/src/lib/hospedagemDiasFechados";

/** Chave de conclusão do ajuste automático (alinhada à página pública da pousada). */
export function chaveAjustePeriodoInicialPousada(params: {
  idEvento: number;
  agendaPrefillKey: string;
  fechamentosExcepcionaisCarregados: boolean;
}): string {
  return `${params.idEvento}|${params.agendaPrefillKey}|${
    params.fechamentosExcepcionaisCarregados ? "fe" : "sem-fe"
  }`;
}

export function chaveBuscaAgendaAposAjuste(chaveAjuste: string): string {
  return `${chaveAjuste}|busca`;
}

export function ajustePeriodoInicialConcluido(
  periodoAjustadoChave: string | null,
  chaveAjuste: string,
): boolean {
  return periodoAjustadoChave === chaveAjuste;
}

/**
 * Período que a busca automática da agenda deve usar: datas do prefill após
 * o mesmo ajuste aplicado na tela (evita buscar com terça/quarta crus).
 */
export function periodoBuscaAgendaAposAjusteInicial(params: {
  checkinPrefill: Date;
  checkoutPrefill: Date;
  verificadorExcepcional?: VerificadorFechamentoExcepcional;
}): { checkinDate: Date; checkoutDate: Date } {
  return ajustarDatasIniciaisPeriodoHospedagem(
    params.checkinPrefill,
    params.checkoutPrefill,
    1,
    params.verificadorExcepcional,
  );
}

export function prefillAgendaUsariaPeriodoFechadoSemAjuste(params: {
  checkinPrefill: Date;
  checkoutPrefill: Date;
  verificadorExcepcional?: VerificadorFechamentoExcepcional;
}): boolean {
  const ajustado = periodoBuscaAgendaAposAjusteInicial(params);
  return (
    dataCivilHospedagem(ajustado.checkinDate) !==
      dataCivilHospedagem(params.checkinPrefill) ||
    dataCivilHospedagem(ajustado.checkoutDate) !==
      dataCivilHospedagem(params.checkoutPrefill)
  );
}
