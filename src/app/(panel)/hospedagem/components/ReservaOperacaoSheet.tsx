import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { parseISO } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import {
  getReservaAdminDetalhe,
  patchObservacoesReserva,
  atualizarUsuarioReserva,
  postCancelarReservaHospedagem,
  podeExibirCancelamentoReservaAdmin,
  ReservaAdminDetalhe,
  ReservaTimelineEvento,
} from "@/src/lib/hospedagemAdmin";
import {
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  executarCheckinOperacional,
  executarCheckoutOperacional,
  executarRegistrarChegadaOperacional,
  formatDateTimeHospedagem,
  labelStatusOperacionalPadrao,
  ReservaOperacaoRef,
} from "@/src/lib/hospedagemOperacao";
import {
  calcularIdadeEmAnos,
  formatarIdadeAnos,
  isHospedeSemCpf,
} from "@/src/lib/hospedagemHospedes";
import { Usuario } from "@/src/types/geral";
import {
  BADGE_HOSPEDE_CHEGOU,
  HOSPEDAGEM_TZ,
  isAguardandoAcomodacaoReserva,
  mensagemChegadaRegistrada,
  MSG_AGUARDANDO_ACOMODACAO,
} from "@/src/lib/hospedagemStatusOperacional";
import {
  useHospedagemAdminRefresh,
  useHospedagemEditLock,
} from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import { useReceberSaldoHospedagem } from "../contexts/ReceberSaldoHospedagemContext";
import {
  COR_RECEBIDO,
  COR_SALDO_PENDENTE,
  MSG_CHECKIN_BLOQUEADO_SALDO,
} from "@/src/lib/hospedagemPagamentoRecepcao";
import OrigemReservaIndicador, {
  labelCanalVenda,
  labelChipOrigemReserva,
} from "./OrigemReservaIndicador";
import {
  BadgeHospedeChegou,
  PainelHospedeChegou,
} from "./HospedeChegouDestaque";
import AlertaPossivelPagamentoOta from "./AlertaPossivelPagamentoOta";
import ReservaOrigemIntegracaoPanel from "./ReservaOrigemIntegracaoPanel";
import TrocaSuiteModal from "./TrocaSuiteModal";
import AlterarPeriodoModal from "./AlterarPeriodoModal";
import CadastroClienteRapido from "./CadastroClienteRapido";

type HospedeConferencia = {
  key: string;
  nome: string;
  rotulo: string;
  emoji: string;
  isCrianca: boolean;
  isResponsavel: boolean;
  dataNascimento?: string | null;
};

type Props = {
  reserva: ReservaOperacaoRef | null;
  visible: boolean;
  onClose: () => void;
  /** YYYY-MM-DD da operação (Agenda/Suítes). Default = hoje. */
  dataReferencia?: string | null;
  /** Propaga horário de chegada ao card da suíte (somente apresentação). */
  onDetalheAtualizado?: (detalhe: ReservaAdminDetalhe) => void;
};

type ConfirmMode = "chegada" | "checkin" | "checkout" | null;

function combineDateTimeOperacao(date: Date, time: Date): Date {
  const wall = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0,
  );
  return fromZonedTime(wall, HOSPEDAGEM_TZ);
}

/**
 * Central operacional da hospedagem (Agenda + Suítes).
 * Um único GET de detalhe alimenta resumo, financeiro, hóspedes, histórico e ações.
 */
export default function ReservaOperacaoSheet({
  reserva,
  visible,
  onClose,
  dataReferencia,
  onDetalheAtualizado,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  /** Layout em duas colunas apenas no desktop largo. */
  const isDesktopLayout = windowWidth >= 1200;
  const { notifyOperacaoConcluida, refreshVersion } =
    useHospedagemAdminRefresh();
  useHospedagemEditLock(visible);
  const { openNovaReserva } = useNovaReservaRecepcao();
  const { openReceberSaldo } = useReceberSaldoHospedagem();
  const [detalhe, setDetalhe] = useState<ReservaAdminDetalhe | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [operacaoDate, setOperacaoDate] = useState(() => new Date());
  const [operacaoTime, setOperacaoTime] = useState(() => new Date());
  const [erroConfirmacao, setErroConfirmacao] = useState<string | null>(null);
  const [executando, setExecutando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [trocaSuiteVisible, setTrocaSuiteVisible] = useState(false);
  const [alterarPeriodoVisible, setAlterarPeriodoVisible] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"operacao" | "integracao">(
    "operacao",
  );
  const [observacoesTexto, setObservacoesTexto] = useState("");
  const [observacoesSalvas, setObservacoesSalvas] = useState("");
  const [observacoesSalvando, setObservacoesSalvando] = useState(false);
  const [observacoesSalvoOk, setObservacoesSalvoOk] = useState(false);
  const [observacoesErro, setObservacoesErro] = useState<string | null>(null);
  const [cadastroClienteVisible, setCadastroClienteVisible] = useState(false);
  const [erroCadastroCliente, setErroCadastroCliente] = useState<string | null>(
    null,
  );
  const [vinculandoCliente, setVinculandoCliente] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelandoReserva, setCancelandoReserva] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState<string | null>(null);
  const observacoesSalvoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const hojeOperacao = useMemo(
    () => formatInTimeZone(new Date(), HOSPEDAGEM_TZ, "yyyy-MM-dd"),
    [],
  );
  const dataSelecionada = dataReferencia || hojeOperacao;

  useEffect(() => {
    if (!visible || !reserva?.idReservaHospedagem) {
      setDetalhe(null);
      setConfirmMode(null);
      setErroAcao(null);
      setTrocaSuiteVisible(false);
      setAlterarPeriodoVisible(false);
      setAbaAtiva("operacao");
      setObservacoesTexto("");
      setObservacoesSalvas("");
      setObservacoesSalvando(false);
      setObservacoesSalvoOk(false);
      setObservacoesErro(null);
      setCadastroClienteVisible(false);
      setErroCadastroCliente(null);
      setVinculandoCliente(false);
      setModalCancelarOpen(false);
      setMotivoCancelamento("");
      setCancelandoReserva(false);
      setErroCancelamento(null);
      if (observacoesSalvoTimerRef.current) {
        clearTimeout(observacoesSalvoTimerRef.current);
        observacoesSalvoTimerRef.current = null;
      }
      return;
    }

    let cancelado = false;
    setLoading(true);
    setErroAcao(null);
    setAbaAtiva("operacao");

    getReservaAdminDetalhe(reserva.idReservaHospedagem, dataSelecionada)
      .then((resp) => {
        if (!cancelado && resp.success && resp.data) {
          setDetalhe(resp.data);
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [
    visible,
    reserva?.idReservaHospedagem,
    dataSelecionada,
    refreshVersion,
  ]);

  useEffect(() => {
    if (!detalhe) return;
    const merged =
      detalhe.observacoes ??
      [detalhe.observacaoImportada, detalhe.observacaoOperador]
        .filter((parte) => String(parte || "").length > 0)
        .join("\n\n");
    setObservacoesTexto(merged);
    setObservacoesSalvas(merged);
    setObservacoesSalvoOk(false);
    setObservacoesErro(null);
  }, [detalhe?.id, detalhe?.observacoes]);

  useEffect(() => {
    if (detalhe && onDetalheAtualizado) {
      onDetalheAtualizado(detalhe);
    }
  }, [detalhe, onDetalheAtualizado]);

  const salvarObservacoes = async () => {
    if (!reserva?.idReservaHospedagem || observacoesSalvando) return;
    if (observacoesTexto === observacoesSalvas) return;

    setObservacoesSalvando(true);
    setObservacoesSalvoOk(false);
    setObservacoesErro(null);

    try {
      const resp = await patchObservacoesReserva(
        reserva.idReservaHospedagem,
        observacoesTexto,
      );
      if (resp.success && resp.data) {
        const detalheAtualizado =
          (resp.data as { data?: ReservaAdminDetalhe }).data ??
          (resp.data as ReservaAdminDetalhe);
        const salvo = detalheAtualizado.observacoes ?? observacoesTexto;
        setDetalhe(detalheAtualizado);
        setObservacoesTexto(salvo);
        setObservacoesSalvas(salvo);
        setObservacoesSalvoOk(true);
        if (observacoesSalvoTimerRef.current) {
          clearTimeout(observacoesSalvoTimerRef.current);
        }
        observacoesSalvoTimerRef.current = setTimeout(() => {
          setObservacoesSalvoOk(false);
          observacoesSalvoTimerRef.current = null;
        }, 3000);
      } else {
        setObservacoesErro(
          resp.message || "Não foi possível salvar as observações.",
        );
      }
    } catch {
      setObservacoesErro("Não foi possível salvar as observações.");
    } finally {
      setObservacoesSalvando(false);
    }
  };

  const statusDb =
    detalhe?.statusOriginal ??
    detalhe?.status ??
    reserva?.statusReserva ??
    reserva?.status ??
    "";
  const checkinIso = detalhe?.checkin ?? reserva?.inicio ?? "";
  const checkoutIso = detalhe?.checkout ?? reserva?.fim ?? "";

  const responsavel =
    detalhe?.responsavel ??
    detalhe?.nomeResponsavel ??
    reserva?.responsavel ??
    "";

  const mostrarCadastrarCliente =
    !loading && Boolean(responsavel) && isHospedeSemCpf(responsavel);

  const handleClienteCadastrado = async (usuario: Usuario) => {
    const idCliente = Number(usuario.id_cliente);
    const idReserva = detalhe?.id ?? reserva?.idReservaHospedagem;
    if (!idReserva || !Number.isFinite(idCliente) || idCliente <= 0) {
      setErroCadastroCliente(
        "Cliente cadastrado, mas sem id_cliente para vincular à reserva.",
      );
      return;
    }

    setVinculandoCliente(true);
    setErroCadastroCliente(null);
    try {
      const resp = await atualizarUsuarioReserva(idReserva, idCliente);
      if (!resp.success) {
        setErroCadastroCliente(
          resp.message || "Não foi possível vincular o cliente à reserva.",
        );
        return;
      }
      setCadastroClienteVisible(false);
      const reload = await getReservaAdminDetalhe(
        reserva!.idReservaHospedagem,
        dataSelecionada,
      );
      if (reload.success && reload.data) {
        setDetalhe(reload.data);
      }
      notifyOperacaoConcluida();
    } catch {
      setErroCadastroCliente("Erro ao vincular o cliente à reserva.");
    } finally {
      setVinculandoCliente(false);
    }
  };

  const hospedesConferencia = useMemo((): HospedeConferencia[] => {
    const suites = detalhe?.suites ?? [];
    const lista: HospedeConferencia[] = [];
    let nAdulto = 0;
    let nCrianca = 0;
    const nomeResp = normalizarNome(responsavel);
    let responsavelMarcado = false;

    suites.forEach((suite) => {
      (suite.hospedes ?? []).forEach((h, hIdx) => {
        const tipo = String(h.tipo || "").toLowerCase();
        const isCrianca =
          tipo === "crianca" || tipo === "criança" || tipo.includes("crianc");
        const matchResp =
          !responsavelMarcado &&
          !isCrianca &&
          nomeResp.length > 0 &&
          normalizarNome(h.nome) === nomeResp;
        if (matchResp) responsavelMarcado = true;

        if (isCrianca) {
          nCrianca += 1;
          lista.push({
            key: `${suite.idReservaSuite}-${h.id ?? hIdx}-c`,
            nome: h.nome,
            rotulo: `Criança ${nCrianca}`,
            emoji: "🧒",
            isCrianca: true,
            isResponsavel: false,
            dataNascimento: h.dataNascimento,
          });
        } else {
          nAdulto += 1;
          lista.push({
            key: `${suite.idReservaSuite}-${h.id ?? hIdx}-a`,
            nome: h.nome,
            rotulo: `Adulto ${nAdulto}`,
            emoji: "👤",
            isCrianca: false,
            isResponsavel: matchResp,
            dataNascimento: h.dataNascimento,
          });
        }
      });
    });

    if (!responsavelMarcado && lista.length > 0) {
      const primeiroAdulto = lista.find((h) => !h.isCrianca);
      if (primeiroAdulto) primeiroAdulto.isResponsavel = true;
    }
    return lista;
  }, [detalhe?.suites, responsavel]);

  const referenciaIdade = useMemo(() => {
    if (checkinIso) {
      try {
        return parseISO(String(checkinIso));
      } catch {
        /* fallthrough */
      }
    }
    return new Date();
  }, [checkinIso]);

  const checkinCuiaba = useMemo(() => {
    if (!checkinIso) return null;
    try {
      return formatInTimeZone(
        parseISO(String(checkinIso)),
        HOSPEDAGEM_TZ,
        "yyyy-MM-dd",
      );
    } catch {
      return null;
    }
  }, [checkinIso]);

  const disp = detalhe?.disponibilidade ?? null;

  const statusOp = useMemo(() => {
    if (
      statusDb === "CheckOutRealizado" ||
      statusDb === "CheckoutRealizado"
    ) {
      return "CHECKOUT_REALIZADO";
    }
    if (statusDb === "Cancelada") return "CANCELADA";
    if (statusDb === "Expirada") return "EXPIRADA";
    return (disp?.badge || "LIVRE").toUpperCase();
  }, [statusDb, disp?.badge]);

  const badgeLabel =
    statusOp === "CHECKOUT_REALIZADO"
      ? "Check-out realizado"
      : statusOp === "CANCELADA"
        ? "Cancelada"
        : statusOp === "EXPIRADA"
          ? "Expirada"
          : disp?.badgeLabel || labelStatusOperacionalPadrao(statusOp);

  const mensagemOp = disp?.mensagem ?? null;
  const mensagemOpSec = disp?.mensagemSecundaria ?? null;

  // Financeiro: exclusivamente valores resolvidos pela API (resolverFinanceiroReserva).
  const valorTotal = Number(detalhe?.valorTotal ?? reserva?.valorTotal ?? 0);
  const valorPago = Number(detalhe?.valorPago ?? reserva?.valorPago ?? 0);
  const saldoPendente = Number(
    detalhe?.saldoPendente ?? reserva?.saldoPendente ?? 0,
  );
  const situacaoFinanceira = String(
    detalhe?.situacaoFinanceira ?? "Pendente",
  );
  const bloqueadoPorSaldo = saldoPendente > 0.009;

  const chegadaRegistrada = detalhe?.dataHoraChegadaReal != null;
  const checkinRealizado =
    statusDb === "Hospedada" || Boolean(detalhe?.dataHoraCheckinReal);

  const aguardandoAcomodacao = isAguardandoAcomodacaoReserva({
    statusReserva: statusDb,
    dataHoraChegadaReal: detalhe?.dataHoraChegadaReal,
    dataHoraCheckinReal: detalhe?.dataHoraCheckinReal,
  });

  const badgeLabelExibicao = aguardandoAcomodacao
    ? BADGE_HOSPEDE_CHEGOU
    : badgeLabel;
  const mensagemOpExibicao = aguardandoAcomodacao
    ? MSG_AGUARDANDO_ACOMODACAO
    : mensagemOp;
  const mensagemOpSecExibicao = aguardandoAcomodacao
    ? mensagemChegadaRegistrada(detalhe?.dataHoraChegadaReal) ??
      mensagemOpSec
    : mensagemOpSec;
  const statusOpExibicao = aguardandoAcomodacao ? "HOSPEDE_CHEGOU" : statusOp;

  const agendaNaoFutura = dataSelecionada <= hojeOperacao;
  const checkinPermitidoNaData =
    checkinCuiaba != null && dataSelecionada >= checkinCuiaba;

  const mostrarBotaoCheckin =
    !checkinRealizado && Boolean(disp?.podeCheckin);
  const mostrarBotaoRegistrarChegada =
    !checkinRealizado &&
    !mostrarBotaoCheckin &&
    statusDb === "Confirmada" &&
    !chegadaRegistrada &&
    agendaNaoFutura &&
    checkinPermitidoNaData &&
    !bloqueadoPorSaldo;
  const mostrarBotaoCheckout = Boolean(disp?.podeCheckout);
  const mostrarNovaReserva = disp?.botaoPrincipal === "nova_reserva";

  const statusParaTroca = detalhe?.statusOriginal ?? statusDb;
  const mostrarTrocarSuite =
    statusParaTroca === "Confirmada" || statusParaTroca === "Hospedada";
  const mostrarAlterarPeriodo = mostrarTrocarSuite;
  const mostrarCancelarReserva = podeExibirCancelamentoReservaAdmin(
    detalhe,
    reserva?.statusReserva ?? reserva?.status ?? null,
  );
  const idReservaSuiteTroca = detalhe?.suites?.[0]?.idReservaSuite ?? null;

  const podeExecutarCheckin =
    mostrarBotaoCheckin && !bloqueadoPorSaldo && !executando && !loading;
  const podeExecutarRegistrarChegada =
    mostrarBotaoRegistrarChegada && !executando && !loading;
  const podeExecutarCheckout = mostrarBotaoCheckout && !executando;

  const adultos = detalhe?.suites?.[0]?.adultos ?? reserva?.adultos ?? 0;
  const criancas = detalhe?.suites?.[0]?.criancas ?? reserva?.criancas ?? 0;
  const noites = Number(detalhe?.noites ?? 0);

  const pagamentos = detalhe?.pagamentos ?? [];
  const movimentacoes = detalhe?.movimentacoesSuite ?? [];
  const timeline = detalhe?.timeline ?? [];
  const proximaReserva = disp?.proximaReservaResumo ?? null;
  const mostrarProximaReserva =
    Boolean(proximaReserva) &&
    (statusOp === "CHECKOUT_HOJE" || Boolean(disp?.checkoutHoje));

  const suiteNomeExibicao =
    detalhe?.suites?.[0]?.nome ?? reserva?.suiteNome ?? "Suíte";

  const isOrigemHospedin =
    String(
      detalhe?.origemReserva || reserva?.origemReserva || "",
    ).toUpperCase() === "HOSPEDIN";
  /** Hospedin: sempre permitir receber (financeiro importado é incompleto). Demais: saldo pendente antes do check-in. */
  const mostrarBotaoReceberSaldo =
    isOrigemHospedin ||
    (saldoPendente > 0.009 &&
      statusDb === "Confirmada" &&
      !checkinRealizado);
  const mostrarAbaIntegracao =
    (isOrigemHospedin || Boolean(detalhe?.syncIntegracao)) &&
    !loading &&
    Boolean(detalhe);
  const syncErro =
    String(detalhe?.syncIntegracao?.uiStatus || "").toUpperCase() === "ERRO";

  if (!reserva) return null;

  const corStatus = corStatusOperacionalPadrao(statusOpExibicao);

  const abrirNovaReserva = () => {
    if (!reserva.idEvento) {
      onClose();
      return;
    }
    onClose();
    openNovaReserva({
      idEvento: reserva.idEvento,
      idEventoSuite: reserva.idEventoSuite ?? undefined,
      checkinDate: dataSelecionada,
    });
  };

  const abrirConfirmacao = (mode: "chegada" | "checkin" | "checkout") => {
    const agora = new Date();
    setOperacaoDate(agora);
    setOperacaoTime(agora);
    setErroConfirmacao(null);
    setConfirmMode(mode);
  };

  const confirmarOperacao = async () => {
    if (!reserva.idReservaHospedagem || !confirmMode) return;
    const mode = confirmMode;
    if (mode === "checkin" && bloqueadoPorSaldo) {
      setConfirmMode(null);
      setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
      return;
    }
    if (mode === "chegada" && bloqueadoPorSaldo) {
      setConfirmMode(null);
      setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
      return;
    }

    const dataHora = combineDateTimeOperacao(operacaoDate, operacaoTime);
    const agora = new Date();
    if (dataHora.getTime() > agora.getTime() + 60_000) {
      setErroConfirmacao("Não é permitido informar data/hora futura.");
      return;
    }
    if (mode === "checkout") {
      const checkinReal =
        detalhe?.dataHoraCheckinReal || reserva.dataHoraCheckinReal;
      if (checkinReal) {
        const ci = new Date(checkinReal);
        if (!Number.isNaN(ci.getTime()) && dataHora.getTime() < ci.getTime()) {
          setErroConfirmacao(
            "A data/hora do check-out não pode ser anterior ao check-in.",
          );
          return;
        }
      }
    }

    setExecutando(true);
    setErroAcao(null);
    setErroConfirmacao(null);
    try {
      const iso = dataHora.toISOString();
      const resp =
        mode === "chegada"
          ? await executarRegistrarChegadaOperacional(
              reserva.idReservaHospedagem,
              iso,
            )
          : mode === "checkin"
            ? await executarCheckinOperacional(
                reserva.idReservaHospedagem,
                iso,
              )
            : await executarCheckoutOperacional(
                reserva.idReservaHospedagem,
                iso,
              );

      if (!resp.success) {
        setErroAcao(
          resp.message ||
            (mode === "chegada"
              ? "Não foi possível registrar a chegada."
              : mode === "checkin"
                ? "Não foi possível realizar o check-in."
                : "Não foi possível realizar o check-out."),
        );
        setConfirmMode(null);
        return;
      }
      if (resp.data) {
        const refreshed = await getReservaAdminDetalhe(
          reserva.idReservaHospedagem,
          dataSelecionada,
        );
        if (refreshed.success && refreshed.data) {
          setDetalhe(refreshed.data);
        } else {
          setDetalhe(resp.data);
        }
      }
      setConfirmMode(null);
      notifyOperacaoConcluida();
      if (mode === "checkin") {
        onClose();
      }
    } catch {
      setErroAcao(
        mode === "chegada"
          ? "Erro ao registrar chegada."
          : mode === "checkin"
            ? "Erro ao realizar check-in."
            : "Erro ao realizar check-out.",
      );
      setConfirmMode(null);
    } finally {
      setExecutando(false);
    }
  };

  const abrirModalCancelar = () => {
    setMotivoCancelamento("");
    setErroCancelamento(null);
    setModalCancelarOpen(true);
  };

  const confirmarCancelamento = async () => {
    if (!reserva?.idReservaHospedagem) return;
    const motivo = motivoCancelamento.trim();
    if (!motivo) {
      setErroCancelamento("Informe o motivo do cancelamento.");
      return;
    }

    setCancelandoReserva(true);
    setErroCancelamento(null);
    try {
      const resp = await postCancelarReservaHospedagem(
        reserva.idReservaHospedagem,
        motivo,
      );
      if (!resp.success || !resp.data) {
        setErroCancelamento(
          resp.message || "Não foi possível cancelar a reserva.",
        );
        return;
      }
      setDetalhe(resp.data);
      setModalCancelarOpen(false);
      setMotivoCancelamento("");
      notifyOperacaoConcluida();
      onClose();
    } catch {
      setErroCancelamento("Erro ao cancelar a reserva.");
    } finally {
      setCancelandoReserva(false);
    }
  };

  const confirmTitulo =
    confirmMode === "checkout"
      ? "Confirmar o check-out desta hospedagem?"
      : confirmMode === "chegada"
        ? "Registrar chegada?"
        : "Confirmar entrada do hóspede?";
  const confirmSub =
    confirmMode === "checkout"
      ? "Após confirmar, a suíte ficará disponível para novas reservas."
      : confirmMode === "chegada"
        ? "Registra a chegada física. A reserva permanece Confirmada até o check-in."
        : "O status passará de Confirmada para Hospedada.";
  const confirmBtnLabel =
    confirmMode === "checkout"
      ? "Confirmar Check-out"
      : confirmMode === "chegada"
        ? "Confirmar chegada"
        : "Confirmar Check-in";

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (confirmMode != null && !executando) {
            setConfirmMode(null);
            setErroConfirmacao(null);
            return;
          }
          onClose();
        }}
      >
        <View style={styles.modalRoot}>
        <Pressable
          style={[styles.backdrop, isDesktopLayout && styles.backdropDesktop]}
          onPress={onClose}
        >
          <Pressable
            style={[styles.sheet, isDesktopLayout && styles.sheetDesktop]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <Text style={styles.titulo}>{suiteNomeExibicao}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Feather name="x" size={22} color={colors.cinza} />
              </TouchableOpacity>
            </View>

            {aguardandoAcomodacao ? (
              <View style={styles.statusBadgeHospedeChegou}>
                <BadgeHospedeChegou fullWidth />
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: corStatus }]}>
                <Text style={styles.statusTexto}>
                  {badgeLabelExibicao.toUpperCase()}
                </Text>
              </View>
            )}

            {aguardandoAcomodacao ? (
              <PainelHospedeChegou
                dataHoraChegadaReal={detalhe?.dataHoraChegadaReal}
              />
            ) : null}

            {isOrigemHospedin && detalhe ? (
              <View style={styles.seloOrigemRow}>
                <View style={styles.seloOrigem}>
                  <Text style={styles.seloOrigemTexto}>Origem: Hospedin</Text>
                </View>
                <View style={[styles.seloOrigem, styles.seloCanal]}>
                  <Text style={styles.seloCanalTexto}>
                    Canal:{" "}
                    {labelCanalVenda(
                      detalhe.canalVenda,
                      detalhe.origemReserva,
                    )}
                  </Text>
                </View>
              </View>
            ) : null}

            {mostrarAbaIntegracao ? (
              <View style={styles.abasRow}>
                <TouchableOpacity
                  style={[
                    styles.aba,
                    abaAtiva === "operacao" && styles.abaAtiva,
                  ]}
                  onPress={() => setAbaAtiva("operacao")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.abaTexto,
                      abaAtiva === "operacao" && styles.abaTextoAtivo,
                    ]}
                  >
                    Operação
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.aba,
                    abaAtiva === "integracao" && styles.abaAtiva,
                  ]}
                  onPress={() => setAbaAtiva("integracao")}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.abaTexto,
                      abaAtiva === "integracao" && styles.abaTextoAtivo,
                    ]}
                  >
                    Integração
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {syncErro && detalhe?.syncIntegracao ? (
              <View style={styles.bannerErro}>
                <Text style={styles.bannerErroTitulo}>
                  🔴 Esta reserva possui falhas de sincronização.
                </Text>
                {detalhe.syncIntegracao.lastSyncAt ? (
                  <Text style={styles.bannerErroTexto}>
                    Última tentativa:{" "}
                    {formatDateTimeHospedagem(
                      detalhe.syncIntegracao.lastSyncAt,
                    )}
                  </Text>
                ) : null}
                {detalhe.syncIntegracao.lastError ? (
                  <Text style={styles.bannerErroTexto}>
                    Motivo: {detalhe.syncIntegracao.lastError}
                  </Text>
                ) : null}
                {detalhe.syncIntegracao.errorSeverityLabel ? (
                  <Text style={styles.bannerErroTexto}>
                    Severidade: {detalhe.syncIntegracao.errorSeverityLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color={colors.azul}
                  style={styles.loader}
                />
              ) : mostrarAbaIntegracao &&
                abaAtiva === "integracao" &&
                detalhe ? (
                <ReservaOrigemIntegracaoPanel
                  detalhe={detalhe}
                  sync={detalhe.syncIntegracao}
                  onReprocessado={() => {
                    void getReservaAdminDetalhe(
                      reserva.idReservaHospedagem,
                      dataSelecionada,
                    ).then((resp) => {
                      if (resp.success && resp.data) setDetalhe(resp.data);
                    });
                    notifyOperacaoConcluida();
                  }}
                />
              ) : (
                <View style={styles.blocos}>
                  {/* Resumo | Período */}
                  <View
                    style={
                      isDesktopLayout ? styles.gridRow : styles.gridStack
                    }
                  >
                    <View
                      style={
                        isDesktopLayout ? styles.gridCell : undefined
                      }
                    >
                      <Secao titulo="Resumo" stretch={isDesktopLayout}>
                        {responsavel ? (
                          <Linha label="Responsável" valor={responsavel} />
                        ) : null}
                        {mostrarCadastrarCliente ? (
                          <TouchableOpacity
                            style={styles.botaoCadastrarCliente}
                            onPress={() => {
                              setErroCadastroCliente(null);
                              setCadastroClienteVisible(true);
                            }}
                            activeOpacity={0.85}
                          >
                            <Feather
                              name="user-plus"
                              size={16}
                              color={colors.branco}
                            />
                            <Text style={styles.botaoCadastrarClienteTexto}>
                              Cadastrar cliente
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                        {(adultos > 0 || criancas > 0) && (
                          <Linha
                            label="Ocupantes"
                            valor={`${adultos} ${adultos === 1 ? "adulto" : "adultos"}${
                              criancas > 0
                                ? ` · ${criancas} ${criancas === 1 ? "criança" : "crianças"}`
                                : ""
                            }`}
                          />
                        )}
                        <Linha label="Status" valor={badgeLabelExibicao} />
                        {!aguardandoAcomodacao && mensagemOpExibicao ? (
                          <Linha label="Situação" valor={mensagemOpExibicao} />
                        ) : null}
                        {!aguardandoAcomodacao && mensagemOpSecExibicao ? (
                          <Text style={styles.hint}>{mensagemOpSecExibicao}</Text>
                        ) : null}
                      </Secao>
                    </View>
                    <View
                      style={
                        isDesktopLayout ? styles.gridCell : undefined
                      }
                    >
                      <Secao titulo="Período" stretch={isDesktopLayout}>
                        <Text style={styles.periodoLabel}>Check-in</Text>
                        <Text style={styles.periodoValor}>
                          {checkinIso
                            ? formatDateTimeHospedagem(checkinIso)
                            : "—"}
                        </Text>
                        <Text style={styles.seta}>↓</Text>
                        <Text style={styles.periodoLabel}>Check-out</Text>
                        <Text style={styles.periodoValor}>
                          {checkoutIso
                            ? formatDateTimeHospedagem(checkoutIso)
                            : "—"}
                        </Text>
                        {noites > 0 ? (
                          <Text style={styles.diarias}>
                            {noites === 1 ? "1 diária" : `${noites} diárias`}
                          </Text>
                        ) : null}
                      </Secao>
                    </View>
                  </View>

                  {/* Financeiro | Observações */}
                  <View
                    style={
                      isDesktopLayout ? styles.gridRow : styles.gridStack
                    }
                  >
                    <View
                      style={
                        isDesktopLayout ? styles.gridCell : undefined
                      }
                    >
                      <Secao titulo="Financeiro" stretch={isDesktopLayout}>
                        {detalhe?.possivelPagamentoOta ? (
                          <AlertaPossivelPagamentoOta
                            canalLabel={
                              detalhe.canalVendaLabel || detalhe.canalVenda
                            }
                            trecho={detalhe.possivelPagamentoOtaTrecho}
                          />
                        ) : null}
                        <Linha
                          label="Total"
                          valor={formatCurrency(valorTotal)}
                        />
                        <Linha
                          label="Recebido"
                          valor={formatCurrency(valorPago)}
                          valorStyle={{ color: COR_RECEBIDO }}
                        />
                        <Linha
                          label="Saldo"
                          valor={formatCurrency(saldoPendente)}
                          valorStyle={{
                            color:
                              saldoPendente > 0.009
                                ? COR_SALDO_PENDENTE
                                : COR_RECEBIDO,
                          }}
                        />
                        <Linha
                          label="Situação"
                          valor={situacaoFinanceira}
                        />
                        {detalhe?.resumoPagamentosCaixa &&
                        detalhe.resumoPagamentosCaixa.totalRecebidoOta >
                          0.009 ? (
                          <Linha
                            label="Recebido pela OTA"
                            valor={formatCurrency(
                              detalhe.resumoPagamentosCaixa.totalRecebidoOta,
                            )}
                            valorStyle={{ color: "#8a5a00" }}
                          />
                        ) : null}
                        {mostrarBotaoReceberSaldo ? (
                          <TouchableOpacity
                            style={styles.btnReceberSaldo}
                            onPress={() => {
                              if (!reserva.idReservaHospedagem) return;
                              openReceberSaldo({
                                idReservaHospedagem:
                                  reserva.idReservaHospedagem,
                                saldoPendente,
                                valorTotal,
                                valorPago,
                                suiteNome: suiteNomeExibicao,
                                responsavel: responsavel || undefined,
                                possivelPagamentoOta: Boolean(
                                  detalhe?.possivelPagamentoOta,
                                ),
                                possivelPagamentoOtaTrecho:
                                  detalhe?.possivelPagamentoOtaTrecho ?? null,
                                canalVendaLabel:
                                  detalhe?.canalVendaLabel ||
                                  detalhe?.canalVenda ||
                                  null,
                              });
                            }}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.btnReceberSaldoTexto}>
                              Receber Saldo
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </Secao>
                    </View>
                    <View
                      style={
                        isDesktopLayout ? styles.gridCell : undefined
                      }
                    >
                      <Secao titulo="Observações" stretch={isDesktopLayout}>
                        <View
                          style={
                            isDesktopLayout
                              ? styles.observacoesWrapDesktop
                              : undefined
                          }
                        >
                          <TextInput
                            style={[
                              styles.observacoesInput,
                              isDesktopLayout &&
                                styles.observacoesInputDesktop,
                            ]}
                            value={observacoesTexto}
                            onChangeText={(texto) => {
                              setObservacoesTexto(texto);
                              setObservacoesSalvoOk(false);
                              setObservacoesErro(null);
                            }}
                            onBlur={() => {
                              void salvarObservacoes();
                            }}
                            placeholder="Observação não informada."
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={isDesktopLayout ? undefined : 5}
                            textAlignVertical="top"
                            scrollEnabled
                          />
                          <View style={styles.observacoesStatusRow}>
                            {observacoesSalvando ? (
                              <Text style={styles.observacoesStatusTexto}>
                                Salvando...
                              </Text>
                            ) : observacoesSalvoOk ? (
                              <Text style={styles.observacoesStatusSalvo}>
                                ✓ Salvo
                              </Text>
                            ) : observacoesErro ? (
                              <Text style={styles.observacoesStatusErro}>
                                {observacoesErro}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </Secao>
                    </View>
                  </View>

                  {/* Origem | Próxima reserva */}
                  <View
                    style={
                      isDesktopLayout ? styles.gridRow : styles.gridStack
                    }
                  >
                    <View
                      style={
                        isDesktopLayout
                          ? mostrarProximaReserva && proximaReserva
                            ? styles.gridCell
                            : styles.gridCellFull
                          : undefined
                      }
                    >
                      <Secao titulo="Origem" stretch={isDesktopLayout}>
                        <OrigemReservaIndicador
                          dados={detalhe ?? undefined}
                          variante="sheet"
                        />
                        {mostrarAbaIntegracao ? (
                          <TouchableOpacity
                            onPress={() => setAbaAtiva("integracao")}
                            style={styles.linkAbaOrigem}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.linkAbaOrigemTexto}>
                              Ver detalhes da integração
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </Secao>
                    </View>
                    {mostrarProximaReserva && proximaReserva ? (
                      <View
                        style={
                          isDesktopLayout ? styles.gridCell : undefined
                        }
                      >
                        <Secao titulo="Próxima reserva" stretch={isDesktopLayout}>
                          <ProximaReservaBloco resumo={proximaReserva} />
                        </Secao>
                      </View>
                    ) : null}
                  </View>

                  {/* Hóspedes | Pagamentos */}
                  <View
                    style={
                      isDesktopLayout ? styles.gridRow : styles.gridStack
                    }
                  >
                    <View
                      style={
                        isDesktopLayout
                          ? pagamentos.length > 0
                            ? styles.gridCell
                            : styles.gridCellFull
                          : undefined
                      }
                    >
                      <Secao titulo="Hóspedes" stretch={isDesktopLayout}>
                        {hospedesConferencia.length === 0 ? (
                          <Text style={styles.vazio}>
                            Nenhum hóspede cadastrado nesta reserva.
                          </Text>
                        ) : (
                          hospedesConferencia.map((h) => (
                            <View key={h.key} style={styles.hospedeItem}>
                              <Text style={styles.hospedeRotulo}>
                                {h.emoji} {h.rotulo}
                                {h.isResponsavel ? " · Responsável" : ""}
                              </Text>
                              <Text style={styles.hospedeNome}>{h.nome}</Text>
                              <HospedeMeta
                                dataNascimento={h.dataNascimento}
                                referenciaIdade={referenciaIdade}
                                mostrarIdade={h.isCrianca}
                              />
                            </View>
                          ))
                        )}
                      </Secao>
                    </View>
                    {pagamentos.length > 0 ? (
                      <View
                        style={
                          isDesktopLayout ? styles.gridCell : undefined
                        }
                      >
                        <Secao titulo="Pagamentos" stretch={isDesktopLayout}>
                          {pagamentos.map((p, idx) => (
                            <View key={p.id}>
                              {idx > 0 ? (
                                <Text style={styles.setaCentro}>↓</Text>
                              ) : null}
                              <Text style={styles.pagForma}>
                                {p.formaPagamentoLabel || p.formaPagamento}
                                {p.contaNoCaixa === false
                                  ? " · fora do caixa"
                                  : ""}
                              </Text>
                              <Text style={styles.pagValor}>
                                {formatCurrency(Number(p.valor))}
                              </Text>
                              <Text style={styles.pagHora}>
                                {formatHoraCurta(p.dataPagamento)}
                              </Text>
                            </View>
                          ))}
                        </Secao>
                      </View>
                    ) : null}
                  </View>

                  {/* Trocas de suíte — largura total */}
                  {movimentacoes.length > 0 ? (
                    <Secao titulo="Trocas de suíte">
                      {movimentacoes.map((m, idx) => (
                        <View key={m.id} style={styles.trocaItem}>
                          {idx > 0 ? (
                            <Text style={styles.setaCentro}>↓</Text>
                          ) : null}
                          <Text style={styles.trocaSuite}>
                            {m.suiteOrigem.nome}
                          </Text>
                          <Text style={styles.setaCentro}>↓</Text>
                          <Text style={styles.trocaSuite}>
                            {m.suiteDestino.nome}
                          </Text>
                          <Text style={styles.metaSuave}>
                            {formatDateTimeHospedagem(m.dataHora)}
                          </Text>
                          {m.usuario ? (
                            <Text style={styles.metaSuave}>
                              por {m.usuario}
                            </Text>
                          ) : null}
                          {m.motivo?.trim() ? (
                            <>
                              <Text style={styles.motivoLabel}>Motivo</Text>
                              <Text style={styles.motivoValor}>
                                {m.motivo.trim()}
                              </Text>
                            </>
                          ) : null}
                        </View>
                      ))}
                    </Secao>
                  ) : null}

                  {/* Histórico — largura total */}
                  <Secao titulo="Histórico">
                    {timeline.length === 0 ? (
                      <Text style={styles.vazio}>
                        Nenhum histórico registrado.
                      </Text>
                    ) : (
                      timeline.map((evento, idx) => (
                        <View key={String(evento.id)}>
                          {idx > 0 ? (
                            <Text style={styles.setaCentro}>↓</Text>
                          ) : null}
                          <HistoricoItem evento={evento} />
                        </View>
                      ))
                    )}
                  </Secao>
                </View>
              )}

              {erroAcao ? (
                <Text style={styles.erroAcao}>{erroAcao}</Text>
              ) : null}

              {!(mostrarAbaIntegracao && abaAtiva === "integracao") ? (
                <>
              <Text style={styles.acoesTitulo}>Ações</Text>

              {mostrarBotaoRegistrarChegada ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.btnAcao,
                      { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                      (!podeExecutarRegistrarChegada || bloqueadoPorSaldo) &&
                        styles.btnDesabilitado,
                    ]}
                    onPress={() => {
                      if (bloqueadoPorSaldo) {
                        setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
                        return;
                      }
                      if (podeExecutarRegistrarChegada) {
                        abrirConfirmacao("chegada");
                      }
                    }}
                    disabled={executando || loading || bloqueadoPorSaldo}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnAcaoTexto}>Registrar Chegada</Text>
                  </TouchableOpacity>
                  {bloqueadoPorSaldo ? (
                    <Text style={styles.hint}>{MSG_CHECKIN_BLOQUEADO_SALDO}</Text>
                  ) : null}
                </>
              ) : null}

              {mostrarBotaoCheckin ? (
                <>
                  <TouchableOpacity
                    style={[
                      styles.btnAcao,
                      { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                      (!podeExecutarCheckin || bloqueadoPorSaldo) &&
                        styles.btnDesabilitado,
                    ]}
                    onPress={() => {
                      if (bloqueadoPorSaldo) {
                        setErroAcao(MSG_CHECKIN_BLOQUEADO_SALDO);
                        return;
                      }
                      if (podeExecutarCheckin) abrirConfirmacao("checkin");
                    }}
                    disabled={executando || loading || bloqueadoPorSaldo}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnAcaoTexto}>Realizar Check-in</Text>
                  </TouchableOpacity>
                  {bloqueadoPorSaldo ? (
                    <Text style={styles.hint}>{MSG_CHECKIN_BLOQUEADO_SALDO}</Text>
                  ) : null}
                </>
              ) : null}

              {mostrarBotaoCheckout ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    {
                      backgroundColor: CORES_STATUS_OPERACIONAL.aguardandoAcao,
                    },
                    !podeExecutarCheckout && styles.btnDesabilitado,
                  ]}
                  onPress={() => {
                    if (podeExecutarCheckout) abrirConfirmacao("checkout");
                  }}
                  disabled={!podeExecutarCheckout}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Realizar Check-out</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarTrocarSuite ? (
                <TouchableOpacity
                  style={[styles.btnAcao, { backgroundColor: colors.azul }]}
                  onPress={() => setTrocaSuiteVisible(true)}
                  disabled={loading || executando}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Trocar Suíte</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarAlterarPeriodo ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: colors.greenEscuro },
                  ]}
                  onPress={() => setAlterarPeriodoVisible(true)}
                  disabled={loading || executando}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Alterar Período</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarCancelarReserva ? (
                <TouchableOpacity
                  style={[styles.btnAcao, styles.btnAcaoDanger]}
                  onPress={abrirModalCancelar}
                  disabled={loading || executando || cancelandoReserva}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnAcaoTexto}>Cancelar reserva</Text>
                </TouchableOpacity>
              ) : null}

              {mostrarNovaReserva ? (
                <TouchableOpacity
                  style={[
                    styles.btnAcao,
                    { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                  ]}
                  onPress={abrirNovaReserva}
                >
                  <Text style={styles.btnAcaoTexto}>Nova Reserva</Text>
                </TouchableOpacity>
              ) : null}
                </>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>

        {confirmMode != null ? (
          <View style={styles.confirmOverlayLayer} pointerEvents="box-none">
            <Pressable
              style={styles.confirmBackdrop}
              onPress={() => {
                if (!executando) {
                  setConfirmMode(null);
                  setErroConfirmacao(null);
                }
              }}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmTitulo}>{confirmTitulo}</Text>
                  <Text style={styles.confirmSub}>{confirmSub}</Text>

                  <Text style={styles.confirmLabel}>
                    {confirmMode === "checkout"
                      ? "Data/hora do check-out"
                      : confirmMode === "chegada"
                        ? "Data/hora da chegada"
                        : "Data/hora do check-in"}
                  </Text>
                  <View style={styles.confirmDateTimeRow}>
                    <View style={styles.confirmDateField}>
                      <DatePickerComponente
                        value={operacaoDate}
                        onChange={(d) => {
                          setOperacaoDate(d);
                          setErroConfirmacao(null);
                        }}
                      />
                    </View>
                    <View style={styles.confirmTimeField}>
                      <TimePickerComponente
                        value={operacaoTime}
                        onChange={(t) => {
                          setOperacaoTime(t);
                          setErroConfirmacao(null);
                        }}
                      />
                    </View>
                  </View>
                  <Text style={styles.confirmHint}>
                    Padrão: agora. Altere apenas para registro retroativo.
                  </Text>
                  {erroConfirmacao ? (
                    <Text style={styles.confirmErro}>{erroConfirmacao}</Text>
                  ) : null}

                  <View style={styles.confirmBtns}>
                    <TouchableOpacity
                      style={styles.btnCancelar}
                      onPress={() => {
                        setConfirmMode(null);
                        setErroConfirmacao(null);
                      }}
                      disabled={executando}
                    >
                      <Text style={styles.btnCancelarTexto}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btnConfirmar,
                        confirmMode === "checkout" && {
                          backgroundColor:
                            CORES_STATUS_OPERACIONAL.aguardandoAcao,
                        },
                      ]}
                      onPress={confirmarOperacao}
                      disabled={executando}
                    >
                      {executando ? (
                        <ActivityIndicator color={colors.branco} />
                      ) : (
                        <Text style={styles.btnConfirmarTexto}>
                          {confirmBtnLabel}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </View>
        ) : null}
        </View>
      </Modal>

      <Modal
        visible={modalCancelarOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancelandoReserva) setModalCancelarOpen(false);
        }}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitulo}>Cancelar reserva</Text>
            <Text style={styles.confirmSub}>
              Esta ação altera o status para Cancelada. Informe o motivo.
            </Text>
            <TextInput
              style={styles.cancelMotivoInput}
              value={motivoCancelamento}
              onChangeText={setMotivoCancelamento}
              placeholder="Motivo do cancelamento"
              placeholderTextColor="#9ca3af"
              multiline
              editable={!cancelandoReserva}
            />
            {erroCancelamento ? (
              <Text style={styles.confirmErro}>{erroCancelamento}</Text>
            ) : null}
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalCancelarOpen(false)}
                disabled={cancelandoReserva}
              >
                <Text style={styles.btnCancelarTexto}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnConfirmar, styles.btnConfirmarDanger]}
                onPress={confirmarCancelamento}
                disabled={cancelandoReserva}
              >
                {cancelandoReserva ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnConfirmarTexto}>
                    Confirmar cancelamento
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TrocaSuiteModal
        visible={trocaSuiteVisible}
        idReservaHospedagem={reserva.idReservaHospedagem}
        idReservaSuite={idReservaSuiteTroca}
        onClose={() => setTrocaSuiteVisible(false)}
        onSucesso={() => {
          setTrocaSuiteVisible(false);
          onClose();
        }}
      />

      <AlterarPeriodoModal
        visible={alterarPeriodoVisible}
        idReservaHospedagem={reserva.idReservaHospedagem}
        onClose={() => setAlterarPeriodoVisible(false)}
        onSucesso={() => {
          setAlterarPeriodoVisible(false);
          onClose();
        }}
      />

      <Modal
        visible={cadastroClienteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!vinculandoCliente) setCadastroClienteVisible(false);
        }}
      >
        <View style={styles.cadastroModalContainer}>
          <TouchableWithoutFeedback
            onPress={() => {
              if (!vinculandoCliente) setCadastroClienteVisible(false);
            }}
          >
            <View style={styles.cadastroModalOverlay} />
          </TouchableWithoutFeedback>
          <View
            style={[
              styles.cadastroModalContent,
              observacoesTexto.length > 0 && styles.cadastroModalContentLargo,
            ]}
          >
            {vinculandoCliente ? (
              <View style={styles.cadastroVinculandoBox}>
                <ActivityIndicator size="large" color={colors.azul} />
                <Text style={styles.cadastroVinculandoTexto}>
                  Vinculando cliente à reserva...
                </Text>
              </View>
            ) : (
              <>
                <CadastroClienteRapido
                  onCadastrado={handleClienteCadastrado}
                  onCancelar={() => setCadastroClienteVisible(false)}
                  observacoesReserva={observacoesTexto}
                />
                {erroCadastroCliente ? (
                  <Text style={styles.cadastroErro}>{erroCadastroCliente}</Text>
                ) : null}
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

function Secao({
  titulo,
  children,
  stretch = false,
}: {
  titulo: string;
  children: React.ReactNode;
  /** Desktop: preenche a altura da célula do grid. */
  stretch?: boolean;
}) {
  return (
    <View style={[styles.secao, stretch && styles.secaoStretch]}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <View
        style={[styles.secaoCorpo, stretch && styles.secaoCorpoStretch]}
      >
        {children}
      </View>
    </View>
  );
}

function Linha({
  label,
  valor,
  valorStyle,
}: {
  label: string;
  valor: string;
  valorStyle?: object;
}) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={[styles.linhaValor, valorStyle]}>{valor}</Text>
    </View>
  );
}

function ProximaReservaBloco({
  resumo,
}: {
  resumo: NonNullable<
    NonNullable<ReservaAdminDetalhe["disponibilidade"]>["proximaReservaResumo"]
  >;
}) {
  const chip = labelChipOrigemReserva({
    origemReserva: resumo.origemReserva,
    idUsuarioCriacao: resumo.idUsuarioCriacao,
    nomeUsuarioCriacao: resumo.nomeUsuarioCriacao,
  });
  return (
    <View style={styles.proximaBox}>
      <Text style={styles.proximaNome}>
        {resumo.responsavel?.trim() || "Hóspede"}
      </Text>
      <Text style={styles.metaSuave}>
        Check-in {formatHoraCurta(resumo.checkin)}
      </Text>
      {chip ? <Text style={styles.metaSuave}>{chip.texto}</Text> : null}
    </View>
  );
}

function HistoricoItem({ evento }: { evento: ReservaTimelineEvento }) {
  const titulo = evento.titulo || evento.descricao;
  return (
    <View style={styles.histItem}>
      <Text style={styles.histData}>{formatDataCurta(evento.data)}</Text>
      <Text style={styles.histTitulo}>{titulo}</Text>
      {evento.tipo === "troca_suite" ? (
        <>
          {evento.suiteOrigem ? (
            <Text style={styles.histDetalhe}>{evento.suiteOrigem}</Text>
          ) : null}
          <Text style={styles.setaCentro}>↓</Text>
          {evento.suiteDestino ? (
            <Text style={styles.histDetalhe}>{evento.suiteDestino}</Text>
          ) : null}
          {evento.motivo?.trim() ? (
            <Text style={styles.metaSuave}>Motivo: {evento.motivo.trim()}</Text>
          ) : null}
        </>
      ) : null}
      {evento.tipo === "alteracao_periodo" ? (
        <>
          <Text style={styles.metaSuave}>Check-in</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkinAnterior || "")}
          </Text>
          <Text style={styles.setaCentro}>↓</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkinNovo || "")}
          </Text>
          <Text style={[styles.metaSuave, { marginTop: 6 }]}>Check-out</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkoutAnterior || "")}
          </Text>
          <Text style={styles.setaCentro}>↓</Text>
          <Text style={styles.histDetalhe}>
            {formatDateTimeHospedagem(evento.checkoutNovo || "")}
          </Text>
          {evento.motivo?.trim() ? (
            <Text style={styles.metaSuave}>Motivo: {evento.motivo.trim()}</Text>
          ) : null}
        </>
      ) : null}
      {evento.tipo === "pagamento" ? (
        <>
          {evento.formaPagamento ? (
            <Text style={styles.histDetalhe}>{evento.formaPagamento}</Text>
          ) : null}
          {evento.valor != null ? (
            <Text style={styles.histDetalhe}>
              {formatCurrency(Number(evento.valor))}
            </Text>
          ) : null}
          <Text style={styles.metaSuave}>{formatHoraCurta(evento.data)}</Text>
        </>
      ) : null}
      {evento.tipo === "checkin" || evento.tipo === "checkout" ? (
        <Text style={styles.metaSuave}>{formatHoraCurta(evento.data)}</Text>
      ) : null}
      {evento.usuario ? (
        <Text style={styles.metaSuave}>{evento.usuario}</Text>
      ) : null}
    </View>
  );
}

function HospedeMeta({
  dataNascimento,
  referenciaIdade,
  mostrarIdade,
}: {
  dataNascimento?: string | null;
  referenciaIdade: Date;
  mostrarIdade: boolean;
}) {
  const nascLabel = formatNascimentoHospede(dataNascimento);
  const nascDate = parseDataNascimentoHospede(dataNascimento);
  const idade =
    mostrarIdade && nascDate != null
      ? calcularIdadeEmAnos(nascDate, referenciaIdade)
      : null;

  if (!nascLabel && idade == null) return null;

  return (
    <View style={styles.criancaMeta}>
      {nascLabel ? (
        <Text style={styles.criancaMetaTexto}>Nascimento: {nascLabel}</Text>
      ) : null}
      {idade != null ? (
        <Text style={styles.criancaMetaTexto}>
          Idade: {formatarIdadeAnos(idade)}
        </Text>
      ) : null}
    </View>
  );
}

function normalizarNome(nome?: string | null): string {
  return String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatDataCurta(iso?: string | Date | null): string {
  if (!iso) return "—";
  try {
    return formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "dd/MM");
  } catch {
    return "—";
  }
}

function formatHoraCurta(iso?: string | Date | null): string {
  if (!iso) return "--:--";
  try {
    return formatInTimeZone(new Date(iso), HOSPEDAGEM_TZ, "HH:mm");
  } catch {
    return "--:--";
  }
}

function formatNascimentoHospede(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return formatInTimeZone(
      parseISO(String(iso).slice(0, 10) + "T12:00:00"),
      HOSPEDAGEM_TZ,
      "dd/MM/yyyy",
    );
  } catch {
    return String(iso);
  }
}

function parseDataNascimentoHospede(iso?: string | null): Date | null {
  if (!iso) return null;
  try {
    const raw = String(iso).slice(0, 10);
    const [y, m, d] = raw.split("-").map(Number);
    if (!y || !m || !d) return parseISO(String(iso));
    return new Date(y, m - 1, d);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  confirmOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  backdropDesktop: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: colors.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    paddingTop: 8,
    maxHeight: "92%",
  },
  sheetDesktop: {
    width: "100%",
    maxWidth: 1320,
    maxHeight: "90%",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignSelf: "center",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
    flex: 1,
    paddingRight: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
  },
  statusBadgeHospedeChegou: {
    alignSelf: "stretch",
    marginBottom: 10,
  },
  statusTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  seloOrigemRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  seloOrigem: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 115, 230, 0.1)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seloOrigemTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0073E6",
  },
  seloCanal: {
    backgroundColor: "rgba(2, 122, 58, 0.1)",
  },
  seloCanalTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#027a3a",
  },
  bannerErro: {
    backgroundColor: "rgba(185, 28, 28, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  bannerErroTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#b91c1c",
  },
  bannerErroTexto: {
    fontSize: 12,
    color: "#7f1d1d",
  },
  abasRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  aba: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
  },
  abaAtiva: {
    backgroundColor: "rgba(0, 115, 230, 0.12)",
  },
  abaTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  abaTextoAtivo: {
    color: "#0073E6",
    fontWeight: "700",
  },
  linkAbaOrigem: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  linkAbaOrigemTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0073E6",
  },
  loader: {
    marginVertical: 24,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  blocos: {
    gap: 12,
    marginBottom: 16,
  },
  gridStack: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  gridCell: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
  },
  gridCellFull: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    alignSelf: "stretch",
  },
  secao: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
  },
  secaoStretch: {
    flex: 1,
    alignSelf: "stretch",
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  secaoCorpo: {
    gap: 8,
  },
  secaoCorpoStretch: {
    flex: 1,
    minHeight: 0,
  },
  linha: {
    gap: 2,
  },
  linhaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  linhaValor: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  periodoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#777",
    textTransform: "uppercase",
  },
  periodoValor: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
    marginTop: 2,
  },
  seta: {
    fontSize: 16,
    color: "#999",
    marginVertical: 2,
  },
  setaCentro: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginVertical: 4,
  },
  diarias: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  hint: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  btnReceberSaldo: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: COR_SALDO_PENDENTE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnReceberSaldoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 13,
  },
  vazio: {
    fontSize: 14,
    color: "#888",
  },
  observacoesInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.branco,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  observacoesWrapDesktop: {
    flex: 1,
    minHeight: 0,
    gap: 6,
  },
  observacoesInputDesktop: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  observacoesStatusRow: {
    minHeight: 18,
    marginTop: 6,
  },
  observacoesStatusTexto: {
    fontSize: 12,
    color: "#888",
  },
  observacoesStatusSalvo: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
  observacoesStatusErro: {
    fontSize: 12,
    color: "#c62828",
  },
  hospedeItem: {
    backgroundColor: colors.branco,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hospedeRotulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
  },
  hospedeNome: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  criancaMeta: {
    marginTop: 4,
    gap: 2,
  },
  criancaMetaTexto: {
    fontSize: 13,
    color: "#666",
  },
  pagForma: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  pagValor: {
    fontSize: 16,
    fontWeight: "600",
    color: COR_RECEBIDO,
  },
  pagHora: {
    fontSize: 13,
    color: "#777",
  },
  trocaItem: {
    gap: 2,
  },
  trocaSuite: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  metaSuave: {
    fontSize: 13,
    color: "#777",
  },
  motivoLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
  },
  motivoValor: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  histItem: {
    gap: 2,
  },
  histData: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
  },
  histTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
  },
  histDetalhe: {
    fontSize: 14,
    color: colors.cinza,
  },
  proximaBox: {
    gap: 4,
  },
  proximaNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  acoesTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 4,
  },
  btnAcao: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
    marginBottom: 8,
  },
  btnDesabilitado: {
    opacity: 0.45,
  },
  btnAcaoTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
  btnAcaoDanger: {
    backgroundColor: "#c0392b",
  },
  cancelMotivoInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    textAlignVertical: "top",
    fontSize: 15,
    color: colors.cinza,
    marginBottom: 12,
  },
  btnConfirmarDanger: {
    backgroundColor: "#c0392b",
  },
  erroAcao: {
    color: CORES_STATUS_OPERACIONAL.alerta,
    fontSize: 13,
    marginBottom: 8,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  confirmBox: {
    backgroundColor: colors.branco,
    borderRadius: 16,
    padding: 16,
  },
  confirmTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 8,
  },
  confirmSub: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  confirmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 6,
  },
  confirmDateTimeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  confirmDateField: {
    flex: 1.2,
  },
  confirmTimeField: {
    flex: 1,
  },
  confirmHint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 12,
  },
  confirmErro: {
    fontSize: 13,
    color: "#c0392b",
    marginBottom: 10,
    fontWeight: "600",
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 10,
  },
  btnCancelar: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancelarTexto: {
    fontWeight: "600",
    color: colors.cinza,
  },
  btnConfirmar: {
    flex: 1.2,
    borderRadius: 12,
    backgroundColor: CORES_STATUS_OPERACIONAL.livre,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
  },
  btnConfirmarTexto: {
    fontWeight: "700",
    color: colors.branco,
  },
  botaoCadastrarCliente: {
    marginTop: 10,
    marginBottom: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  botaoCadastrarClienteTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 13,
  },
  cadastroModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  cadastroModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  cadastroModalContent: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: colors.branco,
    borderRadius: 16,
    padding: 16,
    zIndex: 1,
  },
  cadastroModalContentLargo: {
    maxWidth: 920,
  },
  cadastroVinculandoBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  cadastroVinculandoTexto: {
    fontSize: 14,
    color: colors.cinza,
    textAlign: "center",
  },
  cadastroErro: {
    marginTop: 10,
    fontSize: 13,
    color: "#c0392b",
    fontWeight: "600",
    textAlign: "center",
  },
});
