import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { addMonths, format } from "date-fns";
import colors from "@/src/constants/colors";
import {
  criarVerificadorFromPublicos,
  fetchFechamentosExcepcionaisPublicos,
  type FechamentoExcepcionalPublico,
} from "@/src/lib/hospedagemFechamentos";
import {
  isDataSelecionavelEntradaSaidaHospedagem,
  type VerificadorFechamentoExcepcional,
} from "@/src/lib/hospedagemDiasFechados";

export const MSG_ERRO_CARREGAR_FECHAMENTOS_EXCEPCIONAIS =
  "Não foi possível carregar os fechamentos excepcionais da pousada. Terças e quartas continuam indisponíveis; ao confirmar a reserva, o sistema validará o período no servidor.";

function intervaloConsultaPadrao(): { de: string; ate: string } {
  const de = format(new Date(), "yyyy-MM-dd");
  const ate = format(addMonths(new Date(), 18), "yyyy-MM-dd");
  return { de, ate };
}

export function useFechamentosExcepcionaisPousada(
  idEvento: number,
  enabled = true,
) {
  const [lista, setLista] = useState<FechamentoExcepcionalPublico[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(
    null,
  );
  const [fechamentosExcepcionaisCarregados, setFechamentosExcepcionaisCarregados] =
    useState(false);

  const recarregar = useCallback(async () => {
    if (!enabled || !idEvento) {
      setLista([]);
      setErroCarregamento(null);
      setFechamentosExcepcionaisCarregados(false);
      return;
    }
    setCarregando(true);
    setErroCarregamento(null);
    setFechamentosExcepcionaisCarregados(false);
    try {
      const { de, ate } = intervaloConsultaPadrao();
      const data = await fetchFechamentosExcepcionaisPublicos({
        idEvento,
        de,
        ate,
      });
      setLista(data);
      setFechamentosExcepcionaisCarregados(true);
    } catch {
      setLista([]);
      setErroCarregamento(MSG_ERRO_CARREGAR_FECHAMENTOS_EXCEPCIONAIS);
      setFechamentosExcepcionaisCarregados(false);
    } finally {
      setCarregando(false);
    }
  }, [enabled, idEvento]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const verificadorExcepcional: VerificadorFechamentoExcepcional | undefined =
    useMemo(() => {
      if (!fechamentosExcepcionaisCarregados) {
        return undefined;
      }
      return criarVerificadorFromPublicos(lista);
    }, [fechamentosExcepcionaisCarregados, lista]);

  const filterDate = useCallback(
    (date: Date) =>
      isDataSelecionavelEntradaSaidaHospedagem(date, verificadorExcepcional),
    [verificadorExcepcional],
  );

  return {
    lista,
    verificadorExcepcional,
    filterDate,
    carregando,
    erroCarregamento,
    fechamentosExcepcionaisCarregados,
    recarregar,
  };
}

export function AvisoErroCarregamentoFechamentosExcepcionais({
  mensagem,
}: {
  mensagem: string | null;
}) {
  if (!mensagem) {
    return null;
  }
  return React.createElement(Text, { style: avisoErroStyles.texto }, mensagem);
}

const avisoErroStyles = StyleSheet.create({
  texto: {
    color: colors.red,
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
});
