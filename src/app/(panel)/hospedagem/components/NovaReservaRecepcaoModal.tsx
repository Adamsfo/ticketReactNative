import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";
import { apiAuth } from "@/src/lib/auth";
import {
  criarHospedesIniciais,
  calcularIdadeEmAnos,
  formatarIdadeAnos,
  HospedesSuiteForm,
  hospedesSuiteParaCheckout,
  IDADE_MAXIMA_CRIANCA_HOSPEDAGEM,
  MSG_CRIANCA_ACIMA_IDADE,
  validarHospedes,
} from "@/src/lib/hospedagemHospedes";
import { postReservaRecepcao } from "@/src/lib/hospedagemAdmin";
import {
  nomeCompletoCliente,
  ordenarClientesPorRelevancia,
  TextoComDestaque,
} from "@/src/lib/hospedagemBuscaCliente";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemStatusOperacional";
import {
  aplicarDescontoProporcional,
  calcularValorFinalComDesconto,
  DescontoRecepcaoInput,
  DescontoRecepcaoTipo,
  descontoRecepcaoValido,
  DESCONTO_MAX_PERCENTUAL_RECEPCAO,
  MSG_DESCONTO_INVALIDO,
  parseDescontoInput,
} from "@/src/lib/hospedagemDescontoRecepcao";
import { getCotacao, getDisponibilidade } from "@/src/lib/reservaSuite";
import {
  calcularNoitesHotelaria,
  calcularSubtotalSuitePousada,
} from "@/src/lib/reservaSuitePricing";
import { EventoSuite, Usuario } from "@/src/types/geral";
import CadastroClienteRapido from "./CadastroClienteRapido";
import ComprovanteUploader from "./ComprovanteUploader";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import {
  calcularSaldoPendente,
  FORMAS_PAGAMENTO_RECEPCAO,
  FormaPagamentoRecepcao,
  MSG_VALOR_PAGO_MAIOR,
  parseValorMonetario,
  reservaQuitada,
  valorPagoValido,
} from "@/src/lib/hospedagemPagamentoRecepcao";

const STEPS = ["Cliente", "Período", "Suíte", "Hóspedes", "Resumo"] as const;

/** Recepção: seletor completo (00:00–23:30, slots de 30 min). */
const DIA_INICIO = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
const DIA_FIM = (() => {
  const d = new Date();
  d.setHours(23, 30, 0, 0);
  return d;
})();

const INTERVALO_SLOTS_MIN = 30;
const MSG_SEM_HORARIOS_HOJE =
  "Não há mais horários disponíveis para check-in hoje. Selecione outra data.";

type SuiteDisponivel = EventoSuite & {
  noites?: number;
  cotacao?: { preco: number; taxaServico: number; valorTotal: number };
};

type ItemCarrinhoRecepcao = ItemCarrinhoHospedagem & {
  desconto?: DescontoRecepcaoInput | null;
};

function calcularTotaisItemRecepcao(item: ItemCarrinhoRecepcao) {
  const valorOriginal = Number(item.cotacao.totais.valorTotal ?? 0);
  const valorFinal = calcularValorFinalComDesconto(valorOriginal, item.desconto);
  const valorDesconto = Math.max(0, valorOriginal - valorFinal);
  const repartido = aplicarDescontoProporcional(
    Number(item.cotacao.totais.preco ?? 0),
    Number(item.cotacao.totais.taxaServico ?? 0),
    valorFinal,
  );
  return {
    valorOriginal,
    valorDesconto,
    valorFinal,
    preco: repartido.preco,
    taxaServico: repartido.taxaServico,
    valorTotal: repartido.valorTotal,
  };
}

function minutosDesdeMeiaNoite(time: Date): number {
  return time.getHours() * 60 + time.getMinutes();
}

function aplicarHorarioBase(hours: number, minutes: number): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function isMesmaDataLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function proximoSlotAposAgora(
  agora: Date,
  intervaloMinutos = INTERVALO_SLOTS_MIN,
): number {
  const minutos = minutosDesdeMeiaNoite(agora);
  return Math.ceil((minutos + 1) / intervaloMinutos) * intervaloMinutos;
}

/** Recepção: hoje = próximo slot > agora; futuro = qualquer horário (00:00). */
function calcularMinCheckinRecepcao(dataCheckin: Date, agora: Date): Date {
  if (!isMesmaDataLocal(dataCheckin, agora)) {
    return aplicarHorarioBase(0, 0);
  }
  const aposAgora = proximoSlotAposAgora(agora);
  if (aposAgora > minutosDesdeMeiaNoite(DIA_FIM)) {
    return aplicarHorarioBase(24, 0); // além do fim do dia → sem slots
  }
  return aplicarHorarioBase(Math.floor(aposAgora / 60), aposAgora % 60);
}

function haHorariosCheckinDisponiveis(dataCheckin: Date, agora: Date): boolean {
  if (!isMesmaDataLocal(dataCheckin, agora)) return true;
  const min = calcularMinCheckinRecepcao(dataCheckin, agora);
  return minutosDesdeMeiaNoite(min) <= minutosDesdeMeiaNoite(DIA_FIM);
}

function horarioMaiorOuIgual(time: Date, min: Date): boolean {
  return minutosDesdeMeiaNoite(time) >= minutosDesdeMeiaNoite(min);
}

function combineDateTime(date: Date, time: Date): Date {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

function defaultCheckinTime() {
  const d = new Date();
  d.setHours(16, 0, 0, 0);
  return d;
}

function defaultCheckoutTime() {
  const d = new Date();
  d.setHours(13, 0, 0, 0);
  return d;
}

function getLimitesSuite(suite: EventoSuite) {
  const min = suite.qtdeMinimaPessoas ?? 1;
  const max = suite.qtdeMaximaPessoas ?? min;
  return { min, max };
}

function labelCapacidade(suite: EventoSuite): string {
  const { min, max } = getLimitesSuite(suite);
  return min === max ? `${max} hóspedes` : `${min} a ${max} hóspedes`;
}

function parsePrefillDates(
  checkinDate?: string | null,
  checkinHora?: string | null,
) {
  const agora = new Date();
  let checkinDateLocal = new Date();
  let checkoutDateLocal = new Date();
  checkoutDateLocal.setDate(checkoutDateLocal.getDate() + 1);

  if (checkinDate) {
    const [y, m, d] = checkinDate.split("-").map(Number);
    checkinDateLocal = new Date(y, (m || 1) - 1, d || 1);
    checkoutDateLocal = new Date(checkinDateLocal);
    checkoutDateLocal.setDate(checkoutDateLocal.getDate() + 1);
  }

  // Sem hora explícita: aplica regra da recepção (16:00 ou próximo slot se for hoje)
  let checkinTimeLocal: Date;
  if (checkinHora) {
    const horaParts = checkinHora.split(":");
    checkinTimeLocal = new Date();
    checkinTimeLocal.setHours(
      Number(horaParts[0]) || 16,
      Number(horaParts[1]) || 0,
      0,
      0,
    );
  } else {
    checkinTimeLocal = calcularMinCheckinRecepcao(checkinDateLocal, agora);
    // Datas futuras: padrão operacional 16:00
    if (!isMesmaDataLocal(checkinDateLocal, agora)) {
      checkinTimeLocal = defaultCheckinTime();
    }
  }

  return {
    checkinDate: checkinDateLocal,
    checkoutDate: checkoutDateLocal,
    checkinTime: checkinTimeLocal,
    checkoutTime: defaultCheckoutTime(),
    agora,
  };
}

export default function NovaReservaRecepcaoModal() {
  const { visible, prefill, closeNovaReserva } = useNovaReservaRecepcao();
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();

  const [step, setStep] = useState(1);
  const [cliente, setCliente] = useState<Usuario | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Usuario[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showCadastro, setShowCadastro] = useState(false);

  const [checkinDate, setCheckinDate] = useState(new Date());
  const [checkinTime, setCheckinTime] = useState(defaultCheckinTime);
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [checkoutTime, setCheckoutTime] = useState(defaultCheckoutTime);
  const [periodoErrors, setPeriodoErrors] = useState<Record<string, string>>({});
  const [agoraTick, setAgoraTick] = useState(() => new Date());

  const [suites, setSuites] = useState<SuiteDisponivel[]>([]);
  const [buscandoSuites, setBuscandoSuites] = useState(false);
  const [suiteEmEdicao, setSuiteEmEdicao] = useState<SuiteDisponivel | null>(null);
  const [adultosItem, setAdultosItem] = useState(1);
  const [criancasItem, setCriancasItem] = useState(0);
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinhoRecepcao[]>([]);
  const [suiteErro, setSuiteErro] = useState<string | null>(null);
  const [descontoTipoEdicao, setDescontoTipoEdicao] =
    useState<DescontoRecepcaoTipo>("VALOR");
  const [descontoInputEdicao, setDescontoInputEdicao] = useState("");
  const [descontoErroEdicao, setDescontoErroEdicao] = useState<string | null>(
    null,
  );
  const [descontoInputsCarrinho, setDescontoInputsCarrinho] = useState<
    Record<number, { tipo: DescontoRecepcaoTipo; input: string }>
  >({});

  const [hospedes, setHospedes] = useState<HospedesSuiteForm[]>([]);
  const [hospedesErrors, setHospedesErrors] = useState<Record<string, string>>({});

  const [observacoes, setObservacoes] = useState("");
  const [valorPagoInput, setValorPagoInput] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamentoRecepcao | null>(null);
  const [comprovantePagamento, setComprovantePagamento] = useState<string | null>(
    null,
  );
  const [observacaoPagamento, setObservacaoPagamento] = useState("");
  const [pagamentoErro, setPagamentoErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const prefillSuiteRef = useRef<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const idEvento = prefill?.idEvento ?? 0;

  const resetState = useCallback(() => {
    setStep(1);
    setCliente(null);
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
    setSearched(false);
    setShowCadastro(false);
    setCheckinDate(new Date());
    setCheckinTime(defaultCheckinTime());
    setCheckoutDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    });
    setCheckoutTime(defaultCheckoutTime());
    setPeriodoErrors({});
    setSuites([]);
    setBuscandoSuites(false);
    setSuiteEmEdicao(null);
    setAdultosItem(1);
    setCriancasItem(0);
    setAdicionandoItem(false);
    setCarrinho([]);
    setDescontoTipoEdicao("VALOR");
    setDescontoInputEdicao("");
    setDescontoErroEdicao(null);
    setDescontoInputsCarrinho({});
    setSuiteErro(null);
    setHospedes([]);
    setHospedesErrors({});
    setObservacoes("");
    setValorPagoInput("");
    setFormaPagamento(null);
    setComprovantePagamento(null);
    setObservacaoPagamento("");
    setPagamentoErro(null);
    setSalvando(false);
    setErroGeral(null);
    prefillSuiteRef.current = null;
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
      return;
    }

    resetState();
    const parsed = parsePrefillDates(prefill?.checkinDate, prefill?.checkinHora);
    setCheckinDate(parsed.checkinDate);
    setCheckoutDate(parsed.checkoutDate);
    setCheckinTime(parsed.checkinTime);
    setCheckoutTime(parsed.checkoutTime);
    prefillSuiteRef.current = prefill?.idEventoSuite ?? null;
  }, [visible, prefill, resetState]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setAgoraTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible || step !== 1 || showCadastro) return;
    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setErroGeral(null);
      try {
        const resp = await apiAuth.getUsuario({ search: q, pageSize: 50 });
        const lista = (resp.data as Usuario[]) ?? [];
        setSearchResults(ordenarClientesPorRelevancia(lista, q));
        setSearched(true);
      } catch {
        setSearchResults([]);
        setSearched(true);
        setErroGeral("Erro ao buscar clientes.");
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, visible, step, showCadastro]);

  const checkinMinEfetivo = useMemo(
    () => calcularMinCheckinRecepcao(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  const checkinHojeSemHorarios = useMemo(
    () =>
      isMesmaDataLocal(checkinDate, agoraTick) &&
      !haHorariosCheckinDisponiveis(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  useEffect(() => {
    if (checkinHojeSemHorarios) return;
    setCheckinTime((atual) => {
      const minutos = minutosDesdeMeiaNoite(atual);
      const min = minutosDesdeMeiaNoite(checkinMinEfetivo);
      const max = minutosDesdeMeiaNoite(DIA_FIM);
      if (minutos < min || minutos > max) return checkinMinEfetivo;
      return atual;
    });
  }, [checkinMinEfetivo, checkinHojeSemHorarios]);

  const getCheckinIso = useCallback(
    () => combineDateTime(checkinDate, checkinTime).toISOString(),
    [checkinDate, checkinTime],
  );

  const getCheckoutIso = useCallback(
    () => combineDateTime(checkoutDate, checkoutTime).toISOString(),
    [checkoutDate, checkoutTime],
  );

  const calcularErrosPeriodo = useCallback(() => {
    const newErrors: Record<string, string> = {};
    const agora = new Date();
    const checkin = combineDateTime(checkinDate, checkinTime);
    const checkout = combineDateTime(checkoutDate, checkoutTime);
    const minEfetivo = calcularMinCheckinRecepcao(checkinDate, agora);

    if (!checkinDate || !checkoutDate) {
      newErrors.datas = "Check-in e check-out são obrigatórios.";
    }
    if (checkout <= checkin) {
      newErrors.datas = "Check-out deve ser posterior ao check-in.";
    }
    if (
      isMesmaDataLocal(checkinDate, agora) &&
      !haHorariosCheckinDisponiveis(checkinDate, agora)
    ) {
      newErrors.checkinHorario = MSG_SEM_HORARIOS_HOJE;
    } else if (!horarioMaiorOuIgual(checkinTime, minEfetivo)) {
      newErrors.checkinHorario =
        "O horário de check-in deve ser posterior ao horário atual.";
    } else if (
      isMesmaDataLocal(checkinDate, agora) &&
      checkin.getTime() <= agora.getTime()
    ) {
      newErrors.checkinHorario =
        "O horário de check-in deve ser posterior ao horário atual.";
    }

    return newErrors;
  }, [checkinDate, checkinTime, checkoutDate, checkoutTime]);

  const validarPeriodo = useCallback(() => {
    const newErrors = calcularErrosPeriodo();
    setPeriodoErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [calcularErrosPeriodo]);

  const periodoValido = useMemo(() => {
    if (checkinHojeSemHorarios) return false;
    return Object.keys(calcularErrosPeriodo()).length === 0;
  }, [calcularErrosPeriodo, checkinHojeSemHorarios]);

  useEffect(() => {
    if (!visible || step !== 2) return;
    setPeriodoErrors(calcularErrosPeriodo());
  }, [visible, step, calcularErrosPeriodo]);

  const buscarDisponibilidade = useCallback(async () => {
    if (!idEvento || !validarPeriodo()) return;

    setBuscandoSuites(true);
    setSuiteErro(null);
    setSuites([]);
    setSuiteEmEdicao(null);

    try {
      const resp = await getDisponibilidade({
        idEvento,
        checkin: getCheckinIso(),
        checkout: getCheckoutIso(),
      });

      if (!resp.success || !resp.data) {
        setSuiteErro(resp.message || "Erro ao buscar disponibilidade.");
        return;
      }

      const lista = (resp.data.suites ?? []) as SuiteDisponivel[];
      setSuites(lista);

      const alvoId = prefillSuiteRef.current;
      if (alvoId) {
        const alvo = lista.find((s) => s.id === alvoId);
        if (alvo) {
          const { min } = getLimitesSuite(alvo);
          setSuiteEmEdicao(alvo);
          setAdultosItem(min);
          setCriancasItem(0);
          setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
        }
        prefillSuiteRef.current = null;
      }
    } catch {
      setSuiteErro("Erro ao buscar disponibilidade.");
    } finally {
      setBuscandoSuites(false);
    }
  }, [getCheckinIso, getCheckoutIso, idEvento, validarPeriodo]);

  useEffect(() => {
    if (!visible || step !== 3) return;
    buscarDisponibilidade();
  }, [visible, step, buscarDisponibilidade]);

  useEffect(() => {
    if (!visible || step !== 4 || carrinho.length === 0) return;
    setHospedes(criarHospedesIniciais(carrinho));
    setHospedesErrors({});
  }, [visible, step, carrinho]);

  const totaisResumo = useMemo(() => {
    let preco = 0;
    let taxa = 0;
    let total = 0;
    let descontoTotal = 0;
    let adultos = 0;
    let criancas = 0;

    for (const item of carrinho) {
      const t = calcularTotaisItemRecepcao(item);
      preco += t.preco;
      taxa += t.taxaServico;
      total += t.valorTotal;
      descontoTotal += t.valorDesconto;
      adultos += item.adultos;
      criancas += item.criancas;
    }

    return { preco, taxa, total, descontoTotal, adultos, criancas };
  }, [carrinho]);

  const valorPagoNumero = useMemo(
    () => parseValorMonetario(valorPagoInput),
    [valorPagoInput],
  );

  const saldoPendente = useMemo(() => {
    if (Number.isNaN(valorPagoNumero)) return totaisResumo.total;
    return calcularSaldoPendente(totaisResumo.total, valorPagoNumero);
  }, [totaisResumo.total, valorPagoNumero]);

  const quitada = useMemo(
    () =>
      !Number.isNaN(valorPagoNumero) &&
      reservaQuitada(totaisResumo.total, valorPagoNumero),
    [totaisResumo.total, valorPagoNumero],
  );

  useEffect(() => {
    if (!valorPagoInput.trim()) {
      setPagamentoErro(null);
      return;
    }
    if (Number.isNaN(valorPagoNumero) || valorPagoNumero < 0) {
      setPagamentoErro(MSG_VALOR_PAGO_MAIOR);
      return;
    }
    if (!valorPagoValido(totaisResumo.total, valorPagoNumero)) {
      setPagamentoErro(MSG_VALOR_PAGO_MAIOR);
      return;
    }
    setPagamentoErro(null);
  }, [valorPagoInput, valorPagoNumero, totaisResumo.total]);

  const carrinhoTemDescontoInvalido = useMemo(
    () =>
      carrinho.some((item) => {
        const valorOriginal = Number(item.cotacao.totais.valorTotal ?? 0);
        const ui = descontoInputsCarrinho[item.idEventoSuite];
        if (ui?.input?.trim()) {
          return !descontoRecepcaoValido(
            valorOriginal,
            parseDescontoInput(ui.tipo, ui.input),
          );
        }
        return !descontoRecepcaoValido(valorOriginal, item.desconto);
      }),
    [carrinho, descontoInputsCarrinho],
  );

  const stepValido = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(cliente?.id);
      case 2:
        return periodoValido;
      case 3:
        return carrinho.length > 0 && !carrinhoTemDescontoInvalido;
      case 4:
        return Object.keys(validarHospedes(hospedes)).length === 0;
      case 5:
        return (
          Boolean(cliente?.id) &&
          carrinho.length > 0 &&
          !pagamentoErro &&
          (valorPagoNumero <= 0 || Boolean(formaPagamento))
        );
      default:
        return false;
    }
  }, [
    step,
    cliente,
    periodoValido,
    carrinho,
    hospedes,
    carrinhoTemDescontoInvalido,
    pagamentoErro,
    valorPagoNumero,
    formaPagamento,
  ]);

  const handleContinuar = () => {
    setErroGeral(null);
    if (step === 1 && !cliente?.id) return;
    if (step === 2) {
      if (checkinHojeSemHorarios || !validarPeriodo()) return;
    }
    if (step === 3 && carrinho.length === 0) {
      setSuiteErro("Selecione ao menos uma suíte.");
      return;
    }
    if (step === 3 && carrinhoTemDescontoInvalido) {
      setSuiteErro(MSG_DESCONTO_INVALIDO);
      return;
    }
    if (step === 4) {
      const errs = validarHospedes(hospedes);
      setHospedesErrors(errs);
      if (Object.keys(errs).length > 0) {
        setErroGeral("Preencha todos os dados dos hóspedes.");
        return;
      }
    }
    setStep((s) => Math.min(5, s + 1));
  };

  const handleVoltar = () => {
    setErroGeral(null);
    if (step === 1) {
      closeNovaReserva();
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  };

  const handleAbrirSuite = (suite: SuiteDisponivel) => {
    const { min } = getLimitesSuite(suite);
    setSuiteEmEdicao(suite);
    setAdultosItem(min);
    setCriancasItem(0);
    // Mantém o tipo escolhido na sessão (R$ ou %); só limpa o valor
    setDescontoInputEdicao("");
    setDescontoErroEdicao(null);
    setSuiteErro(null);
  };

  const validarDescontoEdicao = (
    valorOriginal: number,
    tipo: DescontoRecepcaoTipo,
    input: string,
  ): DescontoRecepcaoInput | null => {
    const desconto = parseDescontoInput(tipo, input);
    if (!desconto) {
      return null;
    }
    if (!descontoRecepcaoValido(valorOriginal, desconto)) {
      throw new Error(MSG_DESCONTO_INVALIDO);
    }
    return desconto;
  };

  const atualizarDescontoCarrinho = (
    idEventoSuite: number,
    tipo: DescontoRecepcaoTipo,
    input: string,
  ) => {
    setDescontoInputsCarrinho((prev) => ({
      ...prev,
      [idEventoSuite]: { tipo, input },
    }));

    setCarrinho((prev) =>
      prev.map((item) => {
        if (item.idEventoSuite !== idEventoSuite) {
          return item;
        }
        const valorOriginal = Number(item.cotacao.totais.valorTotal ?? 0);
        const desconto = parseDescontoInput(tipo, input);
        if (!desconto || !descontoRecepcaoValido(valorOriginal, desconto)) {
          return { ...item, desconto: null };
        }
        return { ...item, desconto };
      }),
    );
  };

  const handleAdicionarAoCarrinho = async () => {
    if (!suiteEmEdicao) return;
    const { min, max } = getLimitesSuite(suiteEmEdicao);
    const total = adultosItem + criancasItem;

    if (total < min) {
      setSuiteErro(`Esta suíte requer no mínimo ${min} hóspede(s).`);
      return;
    }
    if (total > max) {
      setSuiteErro(`Esta suíte permite no máximo ${max} hóspede(s).`);
      return;
    }
    if (carrinho.some((i) => i.idEventoSuite === suiteEmEdicao.id)) {
      setSuiteErro("Esta suíte já está selecionada.");
      return;
    }

    const noites =
      suiteEmEdicao.noites ??
      calcularNoitesHotelaria(
        combineDateTime(checkinDate, checkinTime),
        combineDateTime(checkoutDate, checkoutTime),
      );
    const subtotalPreview = calcularSubtotalSuitePousada(
      suiteEmEdicao,
      adultosItem,
      criancasItem,
      noites,
    );
    const valorOriginalPreview = subtotalPreview?.valorTotal ?? 0;

    let descontoAplicado: DescontoRecepcaoInput | null = null;
    try {
      descontoAplicado = validarDescontoEdicao(
        valorOriginalPreview,
        descontoTipoEdicao,
        descontoInputEdicao,
      );
      setDescontoErroEdicao(null);
    } catch {
      setDescontoErroEdicao(MSG_DESCONTO_INVALIDO);
      return;
    }

    setAdicionandoItem(true);
    setSuiteErro(null);
    try {
      const response = await getCotacao({
        idEventoSuite: suiteEmEdicao.id,
        checkin: getCheckinIso(),
        checkout: getCheckoutIso(),
        adultos: adultosItem,
        criancas: criancasItem,
      });
      if (!response.success || !response.data) {
        setSuiteErro(response.message || "Erro ao calcular cotação.");
        return;
      }

      const valorOriginalCotacao = Number(
        response.data.totais.valorTotal ?? 0,
      );
      if (descontoAplicado && !descontoRecepcaoValido(valorOriginalCotacao, descontoAplicado)) {
        setDescontoErroEdicao(MSG_DESCONTO_INVALIDO);
        return;
      }

      setCarrinho((prev) => [
        ...prev,
        {
          idEventoSuite: suiteEmEdicao.id,
          nomeSuite: suiteEmEdicao.nome,
          adultos: adultosItem,
          criancas: criancasItem,
          cotacao: response.data!,
          desconto: descontoAplicado,
        },
      ]);
      setDescontoInputsCarrinho((prev) => ({
        ...prev,
        [suiteEmEdicao.id]: {
          tipo: descontoTipoEdicao,
          input: descontoInputEdicao,
        },
      }));
      setSuiteEmEdicao(null);
      setDescontoInputEdicao("");
      setDescontoErroEdicao(null);
    } catch {
      setSuiteErro("Erro ao calcular cotação.");
    } finally {
      setAdicionandoItem(false);
    }
  };

  const handleRemoverDoCarrinho = (idEventoSuite: number) => {
    setCarrinho((prev) => prev.filter((i) => i.idEventoSuite !== idEventoSuite));
    setDescontoInputsCarrinho((prev) => {
      const next = { ...prev };
      delete next[idEventoSuite];
      return next;
    });
  };

  const atualizarAdulto = (
    idEventoSuite: number,
    ordem: number,
    nomeCompleto: string,
  ) => {
    setHospedes((prev) =>
      prev.map((suite) =>
        suite.idEventoSuite === idEventoSuite
          ? {
              ...suite,
              adultos: suite.adultos.map((adulto) =>
                adulto.ordem === ordem ? { ...adulto, nomeCompleto } : adulto,
              ),
            }
          : suite,
      ),
    );
  };

  const atualizarCrianca = (
    idEventoSuite: number,
    ordem: number,
    field: "nomeCompleto" | "dataNascimento",
    value: string | Date,
  ) => {
    setHospedes((prev) =>
      prev.map((suite) =>
        suite.idEventoSuite === idEventoSuite
          ? {
              ...suite,
              criancas: suite.criancas.map((crianca) =>
                crianca.ordem === ordem
                  ? {
                      ...crianca,
                      [field]:
                        field === "dataNascimento" ? (value as Date) : value,
                    }
                  : crianca,
              ),
            }
          : suite,
      ),
    );

    if (field === "dataNascimento" && value instanceof Date) {
      const idade = calcularIdadeEmAnos(value);
      const key = `${idEventoSuite}-crianca-${ordem}-nasc`;
      setHospedesErrors((prev) => {
        const next = { ...prev };
        if (idade > IDADE_MAXIMA_CRIANCA_HOSPEDAGEM) {
          next[key] = MSG_CRIANCA_ACIMA_IDADE;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };

  const handleSalvar = async () => {
    if (!cliente?.id || !idEvento || carrinho.length === 0) return;

    if (carrinhoTemDescontoInvalido) {
      setErroGeral(MSG_DESCONTO_INVALIDO);
      return;
    }

    const valorPago = valorPagoInput.trim()
      ? parseValorMonetario(valorPagoInput)
      : 0;

    if (!valorPagoValido(totaisResumo.total, valorPago)) {
      setPagamentoErro(MSG_VALOR_PAGO_MAIOR);
      setErroGeral(MSG_VALOR_PAGO_MAIOR);
      return;
    }

    if (valorPago > 0 && !formaPagamento) {
      setErroGeral("Selecione a forma de pagamento.");
      return;
    }

    const errs = validarHospedes(hospedes);
    setHospedesErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErroGeral("Revise os dados dos hóspedes.");
      return;
    }

    setSalvando(true);
    setErroGeral(null);
    try {
      const resp = await postReservaRecepcao({
        idEvento,
        idUsuario: cliente.id,
        checkin: getCheckinIso(),
        checkout: getCheckoutIso(),
        suites: carrinho.map((item) => {
          const suiteHospedes = hospedes.find(
            (s) => s.idEventoSuite === item.idEventoSuite,
          );
          return {
            idEventoSuite: item.idEventoSuite,
            adultos: item.adultos,
            criancas: item.criancas,
            hospedes: suiteHospedes
              ? hospedesSuiteParaCheckout(suiteHospedes)
              : [],
            desconto: item.desconto && item.desconto.valor > 0 ? item.desconto : undefined,
          };
        }),
        observacoes: observacoes.trim() || null,
        pagamento: {
          valor: valorPago,
          formaPagamento: formaPagamento || "Dinheiro",
          comprovante: comprovantePagamento,
          observacao: observacaoPagamento.trim() || null,
        },
      });

      if (!resp.success) {
        setErroGeral(resp.message || "Não foi possível salvar a reserva.");
        return;
      }

      notifyOperacaoConcluida();
      closeNovaReserva();
    } catch {
      setErroGeral("Erro ao salvar reserva.");
    } finally {
      setSalvando(false);
    }
  };

  if (!visible) return null;

  const bottomPad = Platform.OS === "ios" ? 24 : 12;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeNovaReserva}>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={closeNovaReserva} style={styles.headerBtn}>
            <Feather name="x" size={22} color={colors.cinza} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova reserva</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.stepper}>
          {STEPS.map((label, index) => {
            const num = index + 1;
            const ativo = step === num;
            const concluido = step > num;
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    ativo && styles.stepCircleAtivo,
                    concluido && styles.stepCircleConcluido,
                  ]}
                >
                  {concluido ? (
                    <Feather name="check" size={14} color={colors.branco} />
                  ) : (
                    <Text
                      style={[
                        styles.stepNum,
                        ativo && styles.stepNumAtivo,
                      ]}
                    >
                      {num}
                    </Text>
                  )}
                </View>
                <Text
                  style={[styles.stepLabel, ativo && styles.stepLabelAtivo]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
                {index < STEPS.length - 1 ? (
                  <View style={[styles.stepLine, concluido && styles.stepLineAtivo]} />
                ) : null}
              </View>
            );
          })}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {erroGeral ? <Text style={styles.erro}>{erroGeral}</Text> : null}

          {step === 1 && (
            <View style={styles.section}>
              {showCadastro ? (
                <CadastroClienteRapido
                  cpfInicial={/^\d/.test(searchQuery) ? searchQuery : ""}
                  onCancelar={() => setShowCadastro(false)}
                  onCadastrado={(usuario) => {
                    setCliente(usuario);
                    setShowCadastro(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    setStep(2);
                  }}
                />
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Buscar cliente</Text>
                  <Text style={styles.hint}>
                    Nome, sobrenome, CPF ou telefone (mín. 3 caracteres)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Ex.: Souza, Juliana, CPF..."
                    autoCapitalize="none"
                  />

                  {searching ? (
                    <ActivityIndicator color={colors.azul} style={{ marginTop: 12 }} />
                  ) : null}

                  {cliente ? (
                    <View style={styles.chip}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.chipNome}>
                          {nomeCompletoCliente(cliente) || "—"}
                        </Text>
                        <Text style={styles.chipSub}>{cliente.cpf || "—"}</Text>
                        <Text style={styles.chipSub}>
                          {cliente.telefone || "—"}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setCliente(null)}>
                        <Feather name="x-circle" size={22} color={colors.cinza} />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {!cliente &&
                    searchResults.map((u) => {
                      const nome = nomeCompletoCliente(u);
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={styles.resultCard}
                          onPress={() => {
                            setCliente(u);
                            setSearchResults([]);
                            setSearchQuery("");
                          }}
                        >
                          <TextoComDestaque
                            text={nome || "—"}
                            query={searchQuery}
                            style={styles.resultNome}
                          />
                          <Text style={styles.resultSub}>{u.cpf || "—"}</Text>
                          <Text style={styles.resultSub}>
                            {u.telefone || "—"}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                  {!cliente &&
                    searched &&
                    !searching &&
                    searchQuery.trim().length >= 3 &&
                    searchResults.length === 0 && (
                      <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Cliente não encontrado</Text>
                        <TouchableOpacity
                          style={styles.btnOutline}
                          onPress={() => setShowCadastro(true)}
                        >
                          <Text style={styles.btnOutlineText}>
                            Cadastrar novo cliente
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Período da estadia</Text>
              <Text style={styles.hintPersonalizado}>Horário personalizado</Text>

              <Text style={styles.label}>Check-in</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateField}>
                  <DatePickerComponente
                    value={checkinDate}
                    onChange={setCheckinDate}
                  />
                </View>
                <View style={styles.timeField}>
                  <TimePickerComponente
                    value={checkinTime}
                    onChange={setCheckinTime}
                    minTime={checkinMinEfetivo}
                    maxTime={DIA_FIM}
                  />
                </View>
              </View>
              {checkinHojeSemHorarios ? (
                <Text style={styles.erro}>{MSG_SEM_HORARIOS_HOJE}</Text>
              ) : null}
              {periodoErrors.checkinHorario && !checkinHojeSemHorarios ? (
                <Text style={styles.erro}>{periodoErrors.checkinHorario}</Text>
              ) : null}

              <Text style={[styles.label, { marginTop: 12 }]}>Check-out</Text>
              <View style={styles.dateTimeRow}>
                <View style={styles.dateField}>
                  <DatePickerComponente
                    value={checkoutDate}
                    onChange={setCheckoutDate}
                  />
                </View>
                <View style={styles.timeField}>
                  <TimePickerComponente
                    value={checkoutTime}
                    onChange={setCheckoutTime}
                    minTime={DIA_INICIO}
                    maxTime={DIA_FIM}
                  />
                </View>
              </View>
              {periodoErrors.checkoutHorario ? (
                <Text style={styles.erro}>{periodoErrors.checkoutHorario}</Text>
              ) : null}
              {periodoErrors.datas ? (
                <Text style={styles.erro}>{periodoErrors.datas}</Text>
              ) : null}
            </View>
          )}

          {step === 3 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Suítes disponíveis</Text>

              {buscandoSuites ? (
                <ActivityIndicator color={colors.azul} style={{ marginVertical: 20 }} />
              ) : null}

              {suiteErro ? <Text style={styles.erro}>{suiteErro}</Text> : null}

              {carrinho.length > 0 && (
                <View style={styles.carrinhoBox}>
                  <Text style={styles.carrinhoTitulo}>
                    Selecionadas ({carrinho.length})
                  </Text>
                  {carrinho.map((item) => {
                    const totais = calcularTotaisItemRecepcao(item);
                    const descontoUi = descontoInputsCarrinho[item.idEventoSuite] ?? {
                      tipo: item.desconto?.tipo ?? ("VALOR" as DescontoRecepcaoTipo),
                      input: item.desconto
                        ? String(item.desconto.valor).replace(".", ",")
                        : "",
                    };
                    const descontoInvalido =
                      descontoUi.input.trim().length > 0 &&
                      !descontoRecepcaoValido(
                        totais.valorOriginal,
                        parseDescontoInput(descontoUi.tipo, descontoUi.input),
                      );
                    return (
                    <View key={item.idEventoSuite} style={styles.carrinhoItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.carrinhoNome}>{item.nomeSuite}</Text>
                        <Text style={styles.carrinhoSub}>
                          {item.adultos} adulto(s)
                          {item.criancas > 0 ? `, ${item.criancas} criança(s)` : ""}
                        </Text>
                        <DescontoSuiteFields
                          valorOriginal={totais.valorOriginal}
                          tipo={descontoUi.tipo}
                          input={descontoUi.input}
                          onChangeTipo={(tipo) =>
                            atualizarDescontoCarrinho(
                              item.idEventoSuite,
                              tipo,
                              descontoUi.input,
                            )
                          }
                          onChangeInput={(text) =>
                            atualizarDescontoCarrinho(
                              item.idEventoSuite,
                              descontoUi.tipo,
                              text,
                            )
                          }
                          erro={descontoInvalido ? MSG_DESCONTO_INVALIDO : null}
                          compact
                        />
                        <Text style={styles.suitePreco}>
                          Total da suíte: {formatCurrency(totais.valorTotal)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleRemoverDoCarrinho(item.idEventoSuite)}
                      >
                        <Feather name="trash-2" size={20} color={colors.red} />
                      </TouchableOpacity>
                    </View>
                    );
                  })}
                </View>
              )}

              {!buscandoSuites && suites.length === 0 && !suiteErro ? (
                <Text style={styles.hint}>
                  Nenhuma suíte disponível para o período informado.
                </Text>
              ) : null}

              {suites.map((suite) => {
                const noCarrinho = carrinho.some(
                  (i) => i.idEventoSuite === suite.id,
                );
                const emEdicao = suiteEmEdicao?.id === suite.id;
                const { min, max } = getLimitesSuite(suite);
                const totalHospedes = adultosItem + criancasItem;
                const podeIncrementar = totalHospedes < max;
                const podeDecrementarAdulto =
                  adultosItem > 0 && totalHospedes - 1 >= min;
                const podeDecrementarCrianca =
                  criancasItem > 0 && totalHospedes - 1 >= min;
                const noites =
                  suite.noites ??
                  calcularNoitesHotelaria(
                    combineDateTime(checkinDate, checkinTime),
                    combineDateTime(checkoutDate, checkoutTime),
                  );
                const subtotal = emEdicao
                  ? calcularSubtotalSuitePousada(
                      suite,
                      adultosItem,
                      criancasItem,
                      noites,
                    )
                  : null;

                return (
                  <View
                    key={suite.id}
                    style={[
                      styles.suiteCard,
                      (emEdicao || noCarrinho) && styles.suiteCardAtiva,
                    ]}
                  >
                    <Text style={styles.suiteNome}>
                      {suite.nome}
                      {noCarrinho ? " ✓" : ""}
                    </Text>
                    <Text style={styles.suiteMeta}>
                      Capacidade: {labelCapacidade(suite)}
                    </Text>
                    {suite.cotacao?.valorTotal != null ? (
                      <Text style={styles.suitePreco}>
                        A partir de {formatCurrency(suite.cotacao.valorTotal)}
                      </Text>
                    ) : null}

                    {!noCarrinho && !emEdicao && (
                      <TouchableOpacity
                        style={styles.btnPri}
                        onPress={() => handleAbrirSuite(suite)}
                      >
                        <Text style={styles.btnPriText}>Selecionar</Text>
                      </TouchableOpacity>
                    )}

                    {emEdicao && !noCarrinho && (
                      <View style={styles.stepperBox}>
                        <CounterRow
                          label="Adultos"
                          value={adultosItem}
                          onDec={() =>
                            podeDecrementarAdulto &&
                            setAdultosItem((v) => v - 1)
                          }
                          onInc={() =>
                            podeIncrementar && setAdultosItem((v) => v + 1)
                          }
                          canDec={podeDecrementarAdulto}
                          canInc={podeIncrementar}
                        />
                        <CounterRow
                          label="Crianças"
                          value={criancasItem}
                          onDec={() =>
                            podeDecrementarCrianca &&
                            setCriancasItem((v) => v - 1)
                          }
                          onInc={() =>
                            podeIncrementar && setCriancasItem((v) => v + 1)
                          }
                          canDec={podeDecrementarCrianca}
                          canInc={podeIncrementar}
                        />
                        <Text style={styles.hint}>
                          {totalHospedes} de {max} hóspedes
                        </Text>
                        {subtotal ? (
                          <>
                            <Text style={styles.suitePreco}>
                              Subtotal: {formatCurrency(subtotal.valorTotal)}
                            </Text>
                            <DescontoSuiteFields
                              valorOriginal={subtotal.valorTotal}
                              tipo={descontoTipoEdicao}
                              input={descontoInputEdicao}
                              onChangeTipo={setDescontoTipoEdicao}
                              onChangeInput={setDescontoInputEdicao}
                              erro={descontoErroEdicao}
                            />
                            <Text style={styles.suitePreco}>
                              Total da suíte:{" "}
                              {formatCurrency(
                                calcularValorFinalComDesconto(
                                  subtotal.valorTotal,
                                  parseDescontoInput(
                                    descontoTipoEdicao,
                                    descontoInputEdicao,
                                  ),
                                ),
                              )}
                            </Text>
                          </>
                        ) : null}
                        <View style={styles.rowBtns}>
                          <TouchableOpacity
                            style={styles.btnOutline}
                            onPress={() => setSuiteEmEdicao(null)}
                          >
                            <Text style={styles.btnOutlineText}>Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.btnPri,
                              adicionandoItem && { opacity: 0.6 },
                            ]}
                            onPress={handleAdicionarAoCarrinho}
                            disabled={adicionandoItem}
                          >
                            {adicionandoItem ? (
                              <ActivityIndicator color={colors.branco} />
                            ) : (
                              <Text style={styles.btnPriText}>Adicionar</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dados dos hóspedes</Text>
              <Text style={styles.hint}>
                Informe o nome de cada hóspede conforme a reserva.
              </Text>

              {hospedes.map((suite) => (
                <View key={suite.idEventoSuite} style={styles.hospedeSuite}>
                  <Text style={styles.hospedeSuiteTitulo}>
                    Suíte {suite.nomeSuite}
                  </Text>

                  {suite.adultos.map((adulto) => (
                    <View
                      key={`a-${suite.idEventoSuite}-${adulto.ordem}`}
                      style={styles.hospedeCard}
                    >
                      <Text style={styles.hospedeLabel}>
                        Adulto {adulto.ordem}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nome completo"
                        value={adulto.nomeCompleto}
                        onChangeText={(t) =>
                          atualizarAdulto(suite.idEventoSuite, adulto.ordem, t)
                        }
                      />
                      {hospedesErrors[
                        `${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`
                      ] ? (
                        <Text style={styles.erro}>
                          {
                            hospedesErrors[
                              `${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`
                            ]
                          }
                        </Text>
                      ) : null}
                    </View>
                  ))}

                  {suite.criancas.map((crianca) => (
                    <View
                      key={`c-${suite.idEventoSuite}-${crianca.ordem}`}
                      style={styles.hospedeCard}
                    >
                      <Text style={styles.hospedeLabel}>
                        Criança {crianca.ordem}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Nome completo"
                        value={crianca.nomeCompleto}
                        onChangeText={(t) =>
                          atualizarCrianca(
                            suite.idEventoSuite,
                            crianca.ordem,
                            "nomeCompleto",
                            t,
                          )
                        }
                      />
                      {hospedesErrors[
                        `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                      ] ? (
                        <Text style={styles.erro}>
                          {
                            hospedesErrors[
                              `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                            ]
                          }
                        </Text>
                      ) : null}

                      <Text style={[styles.label, { marginTop: 8 }]}>
                        Data de nascimento
                      </Text>
                      <View style={styles.nascRow}>
                        <View style={styles.dateField}>
                          <DatePickerComponente
                            value={crianca.dataNascimento ?? new Date()}
                            onChange={(date) =>
                              atualizarCrianca(
                                suite.idEventoSuite,
                                crianca.ordem,
                                "dataNascimento",
                                date,
                              )
                            }
                          />
                        </View>
                        {crianca.dataNascimento ? (
                          <Text style={styles.idadeTexto}>
                            {formatarIdadeAnos(
                              calcularIdadeEmAnos(crianca.dataNascimento),
                            )}
                          </Text>
                        ) : null}
                      </View>
                      {hospedesErrors[
                        `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                      ] ? (
                        <Text style={styles.erro}>
                          {
                            hospedesErrors[
                              `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                            ]
                          }
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          {step === 5 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Resumo da reserva</Text>

              <View style={styles.resumoCard}>
                <Text style={styles.resumoLabel}>Cliente</Text>
                <Text style={styles.resumoValor}>
                  {cliente ? nomeCompletoCliente(cliente) : "—"}
                </Text>
                <Text style={styles.resumoSub}>
                  {cliente?.telefone || "—"} · {cliente?.cpf || "—"}
                </Text>
              </View>

              <View style={styles.resumoCard}>
                <Text style={styles.resumoLabel}>Período</Text>
                <Text style={styles.resumoValor}>
                  {formatDateTimeHospedagem(getCheckinIso())}
                </Text>
                <Text style={styles.resumoSub}>
                  até {formatDateTimeHospedagem(getCheckoutIso())}
                </Text>
              </View>

              <View style={styles.resumoCard}>
                <Text style={styles.resumoLabel}>Hóspedes</Text>
                <Text style={styles.resumoValor}>
                  {totaisResumo.adultos} adulto(s)
                  {totaisResumo.criancas > 0
                    ? `, ${totaisResumo.criancas} criança(s)`
                    : ""}
                </Text>
              </View>

              {carrinho.map((item) => {
                const totais = calcularTotaisItemRecepcao(item);
                return (
                <View key={item.idEventoSuite} style={styles.resumoCard}>
                  <Text style={styles.resumoLabel}>{item.nomeSuite}</Text>
                  <Text style={styles.resumoSub}>
                    {item.adultos} adulto(s)
                    {item.criancas > 0 ? `, ${item.criancas} criança(s)` : ""}
                  </Text>
                  {totais.valorDesconto > 0 ? (
                    <>
                      <View style={styles.totalRow}>
                        <Text style={styles.resumoSub}>Valor original</Text>
                        <Text style={styles.resumoValor}>
                          {formatCurrency(totais.valorOriginal)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.resumoSub}>Desconto</Text>
                        <Text style={[styles.resumoValor, { color: colors.red }]}>
                          -{formatCurrency(totais.valorDesconto)}
                        </Text>
                      </View>
                      <View style={styles.totalRow}>
                        <Text style={styles.resumoLabel}>Total</Text>
                        <Text style={styles.resumoValor}>
                          {formatCurrency(totais.valorTotal)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.resumoValor}>
                      {formatCurrency(totais.valorTotal)}
                    </Text>
                  )}
                </View>
                );
              })}

              <View style={styles.totaisBox}>
                {totaisResumo.descontoTotal > 0 ? (
                  <View style={styles.totalRow}>
                    <Text style={styles.resumoSub}>Descontos</Text>
                    <Text style={[styles.resumoValor, { color: colors.red }]}>
                      -{formatCurrency(totaisResumo.descontoTotal)}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={styles.resumoSub}>Valor</Text>
                  <Text style={styles.resumoValor}>
                    {formatCurrency(totaisResumo.preco)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.resumoSub}>Taxa de serviço</Text>
                  <Text style={styles.resumoValor}>
                    {formatCurrency(totaisResumo.taxa)}
                  </Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.resumoLabel}>Total</Text>
                  <Text style={[styles.resumoValor, { color: colors.azul }]}>
                    {formatCurrency(totaisResumo.total)}
                  </Text>
                </View>
              </View>

              <View style={styles.pagamentoCard}>
                <Text style={styles.pagamentoTitulo}>💳 Pagamento</Text>

                <View style={styles.totalRow}>
                  <Text style={styles.resumoSub}>Valor da reserva</Text>
                  <Text style={styles.resumoValor}>
                    {formatCurrency(totaisResumo.total)}
                  </Text>
                </View>

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Valor pago antecipadamente
                </Text>
                <Text style={styles.hint}>Valor recebido</Text>
                <TextInput
                  style={styles.input}
                  value={valorPagoInput}
                  onChangeText={setValorPagoInput}
                  placeholder="R$ 0,00"
                  keyboardType="decimal-pad"
                />
                {pagamentoErro ? (
                  <Text style={styles.erro}>{pagamentoErro}</Text>
                ) : null}

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Forma de pagamento
                </Text>
                <View style={styles.formasWrap}>
                  {FORMAS_PAGAMENTO_RECEPCAO.map((f) => {
                    const ativo = formaPagamento === f.value;
                    return (
                      <TouchableOpacity
                        key={f.value}
                        style={[
                          styles.formaChip,
                          ativo && styles.formaChipAtivo,
                        ]}
                        onPress={() => setFormaPagamento(f.value)}
                      >
                        <Text
                          style={[
                            styles.formaChipText,
                            ativo && styles.formaChipTextAtivo,
                          ]}
                        >
                          {f.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Comprovante
                </Text>
                <ComprovanteUploader
                  value={comprovantePagamento}
                  onChange={setComprovantePagamento}
                />

                <Text style={[styles.label, { marginTop: 10 }]}>
                  Observação do pagamento
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={observacaoPagamento}
                  onChangeText={setObservacaoPagamento}
                  placeholder="Opcional — ex.: Pagamento de sinal via WhatsApp."
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.financeiroBox}>
                  <View style={styles.totalRow}>
                    <Text style={styles.resumoSub}>Valor da reserva</Text>
                    <Text style={styles.resumoValor}>
                      {formatCurrency(totaisResumo.total)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.resumoSub}>Pago antecipadamente</Text>
                    <Text style={styles.resumoValor}>
                      -
                      {formatCurrency(
                        Number.isNaN(valorPagoNumero) ? 0 : valorPagoNumero,
                      )}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.saldoLabel}>Saldo para Check-in</Text>
                    <Text style={styles.saldoValor}>
                      {formatCurrency(saldoPendente)}
                    </Text>
                  </View>
                  {quitada ? (
                    <Text style={styles.quitadaTexto}>
                      ✓ Reserva totalmente quitada.
                    </Text>
                  ) : null}
                </View>
              </View>

              <Text style={[styles.label, { marginTop: 8 }]}>
                Observações da reserva
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Opcional"
                multiline
                numberOfLines={3}
              />
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: bottomPad }]}>
          {step === 5 ? (
            <>
              <TouchableOpacity
                style={styles.btnFooterSec}
                onPress={closeNovaReserva}
                disabled={salvando}
              >
                <Text style={styles.btnFooterSecText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnFooterPri,
                  (salvando || !!pagamentoErro) && { opacity: 0.6 },
                ]}
                onPress={handleSalvar}
                disabled={salvando || !!pagamentoErro}
              >
                {salvando ? (
                  <ActivityIndicator color={colors.branco} />
                ) : (
                  <Text style={styles.btnFooterPriText}>Salvar Reserva</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.btnFooterSec} onPress={handleVoltar}>
                <Text style={styles.btnFooterSecText}>
                  {step === 1 ? "Cancelar" : "Voltar"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnFooterPri,
                  !stepValido && { opacity: 0.45 },
                ]}
                onPress={handleContinuar}
                disabled={!stepValido}
              >
                <Text style={styles.btnFooterPriText}>Continuar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function DescontoSuiteFields({
  valorOriginal,
  tipo,
  input,
  onChangeTipo,
  onChangeInput,
  erro,
  compact = false,
}: {
  valorOriginal: number;
  tipo: DescontoRecepcaoTipo;
  input: string;
  onChangeTipo: (tipo: DescontoRecepcaoTipo) => void;
  onChangeInput: (value: string) => void;
  erro?: string | null;
  compact?: boolean;
}) {
  const desconto = parseDescontoInput(tipo, input);
  const invalido =
    input.trim().length > 0 &&
    !descontoRecepcaoValido(valorOriginal, desconto);

  return (
    <View style={[styles.descontoBox, compact && styles.descontoBoxCompact]}>
      <Text style={styles.descontoLabel}>Desconto</Text>
      <View style={styles.descontoRow}>
        <TextInput
          style={[styles.input, styles.descontoInput]}
          value={input}
          onChangeText={onChangeInput}
          placeholder={tipo === "PERCENTUAL" ? "0" : "0,00"}
          keyboardType="decimal-pad"
        />
        <View style={styles.descontoTipoRow}>
          <TouchableOpacity
            style={[
              styles.descontoTipoBtn,
              tipo === "PERCENTUAL" && styles.descontoTipoBtnAtivo,
            ]}
            onPress={() => onChangeTipo("PERCENTUAL")}
          >
            <Text
              style={[
                styles.descontoTipoText,
                tipo === "PERCENTUAL" && styles.descontoTipoTextAtivo,
              ]}
            >
              %
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.descontoTipoBtn,
              tipo === "VALOR" && styles.descontoTipoBtnAtivo,
            ]}
            onPress={() => onChangeTipo("VALOR")}
          >
            <Text
              style={[
                styles.descontoTipoText,
                tipo === "VALOR" && styles.descontoTipoTextAtivo,
              ]}
            >
              R$
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {!compact ? (
        <Text style={styles.hint}>
          Máximo {DESCONTO_MAX_PERCENTUAL_RECEPCAO}% em desconto percentual.
        </Text>
      ) : null}
      {erro || invalido ? (
        <Text style={styles.erro}>{erro ?? MSG_DESCONTO_INVALIDO}</Text>
      ) : null}
    </View>
  );
}

function CounterRow({
  label,
  value,
  onDec,
  onInc,
  canDec,
  canInc,
}: {
  label: string;
  value: number;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
}) {
  return (
    <View style={styles.counterRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.counterBtns}>
        <TouchableOpacity onPress={onDec} disabled={!canDec}>
          <Feather
            name="minus-circle"
            size={26}
            color={canDec ? colors.azul : colors.lightGray}
          />
        </TouchableOpacity>
        <Text style={styles.counterVal}>{value}</Text>
        <TouchableOpacity onPress={onInc} disabled={!canInc}>
          <Feather
            name="plus-circle"
            size={26}
            color={canInc ? colors.azul : colors.lightGray}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.branco },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  headerBtn: { width: 36, alignItems: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  stepItem: { flex: 1, alignItems: "center" },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleAtivo: { backgroundColor: colors.azul },
  stepCircleConcluido: { backgroundColor: colors.green },
  stepNum: { fontSize: 11, fontWeight: "700", color: colors.cinza },
  stepNumAtivo: { color: colors.branco },
  stepLabel: { fontSize: 9, color: colors.cinza, marginTop: 4 },
  stepLabelAtivo: { color: colors.azul, fontWeight: "700" },
  stepLine: {
    position: "absolute",
    top: 13,
    right: -20,
    width: 40,
    height: 2,
    backgroundColor: colors.gray,
    zIndex: -1,
  },
  stepLineAtivo: { backgroundColor: colors.green },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingVertical: 16 },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 4,
  },
  hint: { fontSize: 12, color: "#777" },
  hintPersonalizado: {
    fontSize: 11,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 12,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#666" },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.branco,
    color: colors.cinza,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  erro: { color: colors.red, fontSize: 13, marginTop: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#E8F4FF",
    borderWidth: 1,
    borderColor: colors.azul,
  },
  chipNome: { fontWeight: "700", color: colors.cinza },
  chipSub: { fontSize: 12, color: "#666", marginTop: 2 },
  resultCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 8,
  },
  resultNome: { fontWeight: "600", color: colors.cinza },
  resultSub: { fontSize: 12, color: "#777", marginTop: 2 },
  emptyCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontWeight: "600", color: colors.cinza },
  dateTimeRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  dateField: { flex: 1.2 },
  timeField: { flex: 1 },
  suiteCard: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fafafa",
    gap: 6,
  },
  suiteCardAtiva: {
    borderColor: colors.azul,
    backgroundColor: "#F0F7FF",
  },
  suiteNome: { fontSize: 16, fontWeight: "700", color: colors.cinza },
  suiteMeta: { fontSize: 13, color: "#666" },
  suitePreco: { fontSize: 14, fontWeight: "600", color: colors.azul },
  stepperBox: { marginTop: 8, gap: 8 },
  descontoBox: {
    marginTop: 10,
    gap: 6,
  },
  descontoBoxCompact: {
    marginTop: 8,
  },
  descontoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  descontoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  descontoInput: {
    flex: 1,
    minWidth: 80,
  },
  descontoTipoRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    overflow: "hidden",
  },
  descontoTipoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.branco,
  },
  descontoTipoBtnAtivo: {
    backgroundColor: colors.azul,
  },
  descontoTipoText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
  },
  descontoTipoTextAtivo: {
    color: colors.branco,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterBtns: { flexDirection: "row", alignItems: "center", gap: 10 },
  counterVal: { fontSize: 16, fontWeight: "700", minWidth: 24, textAlign: "center" },
  carrinhoBox: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    gap: 8,
  },
  carrinhoTitulo: { fontWeight: "700", color: colors.cinza },
  carrinhoItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  carrinhoNome: { fontWeight: "600", color: colors.cinza },
  carrinhoSub: { fontSize: 12, color: "#666" },
  hospedeSuite: { marginTop: 12, gap: 8 },
  hospedeSuiteTitulo: { fontSize: 16, fontWeight: "700", color: colors.azul },
  hospedeCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 4,
  },
  hospedeLabel: { fontWeight: "600", color: colors.cinza },
  nascRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  idadeTexto: { fontSize: 13, color: colors.cinza, fontWeight: "600" },
  resumoCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: 8,
    gap: 2,
  },
  resumoLabel: { fontSize: 12, fontWeight: "600", color: "#666" },
  resumoValor: { fontSize: 15, fontWeight: "600", color: colors.cinza },
  resumoSub: { fontSize: 13, color: "#777" },
  pagamentoCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.branco,
    gap: 4,
  },
  pagamentoTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 8,
  },
  formasWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  formaChip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.branco,
  },
  formaChipAtivo: {
    backgroundColor: colors.azul,
    borderColor: colors.azul,
  },
  formaChipText: { fontSize: 12, fontWeight: "600", color: colors.cinza },
  formaChipTextAtivo: { color: colors.branco },
  financeiroBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 6,
  },
  saldoLabel: { fontSize: 14, fontWeight: "700", color: colors.cinza },
  saldoValor: { fontSize: 16, fontWeight: "800", color: "#e67e22" },
  quitadaTexto: {
    marginTop: 6,
    color: "#027a3a",
    fontWeight: "700",
    fontSize: 13,
  },
  totaisBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F8FC",
    gap: 6,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnPri: {
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 6,
  },
  btnPriText: { color: colors.branco, fontWeight: "700" },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnOutlineText: { fontWeight: "600", color: colors.cinza },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.branco,
  },
  btnFooterSec: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnFooterSecText: { fontWeight: "600", color: colors.cinza },
  btnFooterPri: {
    flex: 1.4,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  btnFooterPriText: { fontWeight: "700", color: colors.branco },
});
