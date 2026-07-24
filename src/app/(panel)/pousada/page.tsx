import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  useWindowDimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Evento, EventoSuite, QueryParams, Usuario } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import ModalResumoPousada, {
  ItemCarrinhoHospedagem,
} from "@/src/components/ModalResumoPousada";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import { useCart } from "@/src/contexts_/CartContext";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useHospedagem } from "@/src/contexts_/HospedagemContext";
import { apiAuth } from "@/src/lib/auth";
import { Feather } from "@expo/vector-icons";
import formatCurrency from "@/src/components/FormatCurrency";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import ModalMsg from "@/src/components/ModalMsg";
import {
  getCotacao,
  getDisponibilidade,
} from "@/src/lib/reservaSuite";
import {
  calcularNoitesHotelaria,
  calcularSubtotalSuitePousada,
  VALOR_ADICIONAL_ADULTO_EXTRA,
  VALOR_ADICIONAL_CRIANCA_EXTRA,
} from "@/src/lib/reservaSuitePricing";

const { width } = Dimensions.get("window");

/** Espaço superior ao alinhar a lista de suítes (não cobrir título pelo topo do ScrollView). */
const SCROLL_OFFSET_SUITES = 16;

const CHECKIN_TIME_MIN = (() => {
  const d = new Date();
  d.setHours(16, 0, 0, 0);
  return d;
})();
const CHECKIN_TIME_MAX = (() => {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  return d;
})();
const CHECKOUT_TIME_MIN = (() => {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  return d;
})();
const CHECKOUT_TIME_MAX = (() => {
  const d = new Date();
  d.setHours(13, 0, 0, 0);
  return d;
})();

const INTERVALO_SLOTS_CHECKIN_MIN = 30;
const MSG_SEM_HORARIOS_HOJE =
  "Os horários disponíveis para hoje já se encerraram. Escolha uma nova data.";
const MSG_SEM_HORARIOS_HOJE_BUSCA =
  "Não há mais horários disponíveis para check-in hoje. Selecione outra data.";

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

/** Próximo slot de 30 min estritamente posterior ao horário atual. */
function proximoSlotAposAgora(
  agora: Date,
  intervaloMinutos = INTERVALO_SLOTS_CHECKIN_MIN,
): number {
  const minutos = minutosDesdeMeiaNoite(agora);
  return Math.ceil((minutos + 1) / intervaloMinutos) * intervaloMinutos;
}

/**
 * Mínimo efetivo do check-in:
 * - datas futuras: 16:00
 * - hoje: max(16:00, próximo slot > agora)
 */
function calcularMinCheckinEfetivo(dataCheckin: Date, agora: Date): Date {
  const oficial = minutosDesdeMeiaNoite(CHECKIN_TIME_MIN);
  if (!isMesmaDataLocal(dataCheckin, agora)) {
    return aplicarHorarioBase(
      Math.floor(oficial / 60),
      oficial % 60,
    );
  }
  const aposAgora = proximoSlotAposAgora(agora);
  const efetivo = Math.max(oficial, aposAgora);
  return aplicarHorarioBase(Math.floor(efetivo / 60), efetivo % 60);
}

function haHorariosCheckinDisponiveis(
  dataCheckin: Date,
  agora: Date,
): boolean {
  const min = calcularMinCheckinEfetivo(dataCheckin, agora);
  return minutosDesdeMeiaNoite(min) <= minutosDesdeMeiaNoite(CHECKIN_TIME_MAX);
}

function horarioDentroDoIntervalo(time: Date, min: Date, max: Date): boolean {
  const atual = minutosDesdeMeiaNoite(time);
  const minimo = minutosDesdeMeiaNoite(min);
  const maximo = minutosDesdeMeiaNoite(max);
  if (minimo > maximo) return false;
  return atual >= minimo && atual <= maximo;
}

function getLimitesSuite(suite: EventoSuite) {
  const min = suite.qtdeMinimaPessoas ?? 1;
  const max = suite.qtdeMaximaPessoas ?? min;
  return { min, max };
}

export default function Index() {
  const { width: screenWidth } = useWindowDimensions();
  const isMobileSuiteLayout = screenWidth < 768;
  const endpointApi = "/evento";
  const { isPDV, user } = useAuth();
  const route = useRoute();
  const { state, dispatch } = useCart();
  const { dispatch: dispatchHospedagem } = useHospedagem();
  const navigation = useNavigation() as any;
  const routeParams = (route.params || {}) as {
    id: number;
    agendaPrefill?: {
      checkinDate: string;
      idEventoSuite?: number;
      checkinHora?: string;
    };
  };
  const { id } = routeParams;
  const agendaPrefill = routeParams.agendaPrefill;
  const agendaPrefillKey = agendaPrefill
    ? `${agendaPrefill.checkinDate}-${agendaPrefill.idEventoSuite ?? ""}`
    : "";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [infoUsuario, setInfoUsuario] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    endereco: "",
    idUsuario: 0,
    idProdutor: 0,
  });

  const [formDataUsuario, setFormDataUsuario] = useState<Usuario>({
    id: 0,
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    confirmaSenha: "",
    cpf: "",
    telefone: "",
    id_cliente: 0,
  });

  const [registrosEventoSuites, setRegistrosEventoSuites] = useState<
    EventoSuite[]
  >([]);
  const [disponibilidadeBuscada, setDisponibilidadeBuscada] = useState(false);
  const [buscandoDisponibilidade, setBuscandoDisponibilidade] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinhoHospedagem[]>([]);
  const [suiteEmEdicao, setSuiteEmEdicao] = useState<EventoSuite | null>(null);
  const [adultosItem, setAdultosItem] = useState(1);
  const [criancasItem, setCriancasItem] = useState(0);
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [msgApi, setMsgApi] = useState("");
  const [visibleMsg, setVisibleMsg] = useState(false);
  const [filtroErrors, setFiltroErrors] = useState<{ [key: string]: string }>(
    {},
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const suitesListRef = useRef<View>(null);
  const scrollOffsetYRef = useRef(0);
  const pendenteScrollSuitesRef = useRef(false);

  const defaultCheckinTime = () => {
    const d = new Date();
    d.setHours(16, 0, 0, 0);
    return d;
  };
  const defaultCheckoutTime = () => {
    const d = new Date();
    d.setHours(13, 0, 0, 0);
    return d;
  };

  const [checkinDate, setCheckinDate] = useState(new Date());
  const [checkinTime, setCheckinTime] = useState(defaultCheckinTime);
  const [checkoutDate, setCheckoutDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [checkoutTime, setCheckoutTime] = useState(defaultCheckoutTime);
  const [agoraTick, setAgoraTick] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAgoraTick(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const checkinMinEfetivo = useMemo(
    () => calcularMinCheckinEfetivo(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  const checkinHojeSemHorarios = useMemo(
    () =>
      isMesmaDataLocal(checkinDate, agoraTick) &&
      !haHorariosCheckinDisponiveis(checkinDate, agoraTick),
    [checkinDate, agoraTick],
  );

  // Mantém o horário selecionado dentro da faixa válida (hoje > agora)
  useEffect(() => {
    if (checkinHojeSemHorarios) return;
    setCheckinTime((atual) => {
      const minutos = minutosDesdeMeiaNoite(atual);
      const min = minutosDesdeMeiaNoite(checkinMinEfetivo);
      const max = minutosDesdeMeiaNoite(CHECKIN_TIME_MAX);
      if (minutos < min || minutos > max) {
        return checkinMinEfetivo;
      }
      return atual;
    });
  }, [checkinMinEfetivo, checkinHojeSemHorarios]);

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);
    }
  };

  const combineDateTime = (date: Date, time: Date) => {
    const d = new Date(date);
    d.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return d;
  };

  const getCheckinIso = () => combineDateTime(checkinDate, checkinTime).toISOString();
  const getCheckoutIso = () =>
    combineDateTime(checkoutDate, checkoutTime).toISOString();

  const validarFiltros = () => {
    const newErrors: { [key: string]: string } = {};
    const agora = new Date();
    const checkin = combineDateTime(checkinDate, checkinTime);
    const checkout = combineDateTime(checkoutDate, checkoutTime);
    const minEfetivo = calcularMinCheckinEfetivo(checkinDate, agora);

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
      newErrors.checkinHorario = MSG_SEM_HORARIOS_HOJE_BUSCA;
    } else if (
      !horarioDentroDoIntervalo(checkinTime, minEfetivo, CHECKIN_TIME_MAX)
    ) {
      if (isMesmaDataLocal(checkinDate, agora)) {
        newErrors.checkinHorario =
          "O horário de check-in deve ser posterior ao horário atual.";
      } else {
        newErrors.checkinHorario =
          "O horário de check-in deve estar entre 16:00 e 19:00.";
      }
    } else if (
      isMesmaDataLocal(checkinDate, agora) &&
      checkin.getTime() <= agora.getTime()
    ) {
      newErrors.checkinHorario =
        "O horário de check-in deve ser posterior ao horário atual.";
    }
    if (!horarioDentroDoIntervalo(checkoutTime, CHECKOUT_TIME_MIN, CHECKOUT_TIME_MAX)) {
      newErrors.checkoutHorario =
        "O horário de check-out deve estar entre 08:00 e 13:00.";
    }
    setFiltroErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBuscarDisponibilidade = async (override?: {
    checkinIso: string;
    checkoutIso: string;
    idEventoSuite?: number;
  }) => {
    setFiltroErrors({});
    setCarrinho([]);
    setSuiteEmEdicao(null);
    pendenteScrollSuitesRef.current = false;

    const checkinIso = override?.checkinIso ?? getCheckinIso();
    const checkoutIso = override?.checkoutIso ?? getCheckoutIso();

    if (!override) {
      if (!validarFiltros()) return;
    } else {
      // Prefill/agenda: ainda valida check-in de hoje vs horário atual
      const checkinOverride = new Date(checkinIso);
      const agora = new Date();
      if (
        !Number.isNaN(checkinOverride.getTime()) &&
        isMesmaDataLocal(checkinOverride, agora) &&
        checkinOverride.getTime() <= agora.getTime()
      ) {
        setFiltroErrors({
          checkinHorario: MSG_SEM_HORARIOS_HOJE_BUSCA,
        });
        return;
      }
    }

    setBuscandoDisponibilidade(true);
    setDisponibilidadeBuscada(false);
    try {
      const response = await getDisponibilidade({
        idEvento: id,
        checkin: checkinIso,
        checkout: checkoutIso,
      });
      if (!response.success || !response.data) {
        setMsgApi(response.message || "Erro ao buscar disponibilidade.");
        setVisibleMsg(true);
        setRegistrosEventoSuites([]);
        return;
      }
      const suites = (response.data.suites ?? []) as EventoSuite[];
      setRegistrosEventoSuites(suites);
      setDisponibilidadeBuscada(true);
      if (suites.length > 0) {
        pendenteScrollSuitesRef.current = true;
      }
      if (override?.idEventoSuite) {
        const alvo = suites.find((s) => s.id === override.idEventoSuite);
        if (alvo) {
          const { min } = getLimitesSuite(alvo);
          setSuiteEmEdicao(alvo);
          setAdultosItem(min);
          setCriancasItem(0);
        }
      }
    } catch {
      setMsgApi("Erro ao buscar disponibilidade.");
      setVisibleMsg(true);
    } finally {
      setBuscandoDisponibilidade(false);
    }
  };

  const scrollParaListaSuites = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const target = suitesListRef.current;
    if (!scrollView || !target) return;

    if (Platform.OS === "web" && typeof document !== "undefined") {
      const el = document.getElementById("pousada-suites-anchor");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    target.measureInWindow((_tx, targetY) => {
      scrollView.measureInWindow((_sx, scrollViewY) => {
        const y =
          targetY - scrollViewY + scrollOffsetYRef.current - SCROLL_OFFSET_SUITES;
        scrollView.scrollTo({
          y: Math.max(0, y),
          animated: true,
        });
      });
    });
  }, []);

  useEffect(() => {
    if (!pendenteScrollSuitesRef.current) return;
    if (!disponibilidadeBuscada || registrosEventoSuites.length === 0) return;

    pendenteScrollSuitesRef.current = false;

    const timer = setTimeout(() => {
      scrollParaListaSuites();
    }, Platform.OS === "web" ? 80 : 120);

    return () => clearTimeout(timer);
  }, [disponibilidadeBuscada, registrosEventoSuites, scrollParaListaSuites]);

  const handleAbrirAdicionarSuite = (suite: EventoSuite) => {
    const { min } = getLimitesSuite(suite);
    setSuiteEmEdicao(suite);
    setAdultosItem(min);
    setCriancasItem(0);
  };

  const handleAdicionarAoCarrinho = async () => {
    if (!suiteEmEdicao) return;
    const { min, max } = getLimitesSuite(suiteEmEdicao);
    const total = adultosItem + criancasItem;
    if (total < min) {
      setMsgApi(`Esta suíte requer no mínimo ${min} hóspede(s).`);
      setVisibleMsg(true);
      return;
    }
    if (total > max) {
      setMsgApi(`Esta suíte permite no máximo ${max} hóspede(s).`);
      setVisibleMsg(true);
      return;
    }
    if (carrinho.some((i) => i.idEventoSuite === suiteEmEdicao.id)) {
      setMsgApi("Esta suíte já está no carrinho.");
      setVisibleMsg(true);
      return;
    }

    setAdicionandoItem(true);
    try {
      const response = await getCotacao({
        idEventoSuite: suiteEmEdicao.id,
        checkin: getCheckinIso(),
        checkout: getCheckoutIso(),
        adultos: adultosItem,
        criancas: criancasItem,
      });
      if (!response.success || !response.data) {
        setMsgApi(response.message || "Erro ao calcular cotação.");
        setVisibleMsg(true);
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
        },
      ]);
      setSuiteEmEdicao(null);
    } catch {
      setMsgApi("Erro ao calcular cotação.");
      setVisibleMsg(true);
    } finally {
      setAdicionandoItem(false);
    }
  };

  const handleRemoverDoCarrinho = (idEventoSuite: number) => {
    setCarrinho((prev) => prev.filter((i) => i.idEventoSuite !== idEventoSuite));
  };

  const handleIrConferencia = () => {
    if (carrinho.length === 0) return;

    dispatchHospedagem({
      type: "SET_RESERVA",
      payload: {
        idEvento: id,
        checkin: getCheckinIso(),
        checkout: getCheckoutIso(),
        itens: carrinho,
        usuarioVendaPdvId: isPDV ? formDataUsuario.id : null,
      },
    });

    navigation.navigate("conferenciaHospedagem", { idEvento: id });
  };

  useEffect(() => {
    zerarIngressos();
    dispatch({ type: "REMOVE_TRANSACAO" });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      zerarIngressos();
      dispatch({ type: "REMOVE_TRANSACAO" });
      dispatchHospedagem({ type: "CLEAR" });
      setDisponibilidadeBuscada(false);
      setRegistrosEventoSuites([]);
      setCarrinho([]);
      setSuiteEmEdicao(null);
      setFormDataUsuario({
        id: 0,
        login: "",
        email: "",
        senha: "",
        nomeCompleto: "",
        sobreNome: "",
        confirmaSenha: "",
        cpf: "",
        telefone: "",
        id_cliente: 0,
      });
      if (id > 0) {
        getRegistros(id);
        // getRegistrosIngressos({ filters: { idEvento: id } });
      }
      if (id > 1 && isPDV && user) {
        setFormDataUsuario(user);
      }

      if (!agendaPrefill?.checkinDate || !id) {
        return;
      }

      const [y, m, d] = agendaPrefill.checkinDate.split("-").map(Number);
      const checkinDateLocal = new Date(y, (m || 1) - 1, d || 1);
      const checkoutDateLocal = new Date(checkinDateLocal);
      checkoutDateLocal.setDate(checkoutDateLocal.getDate() + 1);

      const horaParts = (agendaPrefill.checkinHora || "16:00").split(":");
      const checkinTimeLocal = new Date();
      checkinTimeLocal.setHours(
        Number(horaParts[0]) || 16,
        Number(horaParts[1]) || 0,
        0,
        0,
      );
      const checkoutTimeLocal = defaultCheckoutTime();

      setCheckinDate(checkinDateLocal);
      setCheckinTime(checkinTimeLocal);
      setCheckoutDate(checkoutDateLocal);
      setCheckoutTime(checkoutTimeLocal);

      const checkinIso = combineDateTime(
        checkinDateLocal,
        checkinTimeLocal,
      ).toISOString();
      const checkoutIso = combineDateTime(
        checkoutDateLocal,
        checkoutTimeLocal,
      ).toISOString();

      const timer = setTimeout(() => {
        handleBuscarDisponibilidade({
          checkinIso,
          checkoutIso,
          idEventoSuite: agendaPrefill.idEventoSuite,
        });
      }, 150);

      return () => clearTimeout(timer);
    }, [id, agendaPrefillKey]),
  );

  const zerarIngressos = () => {
    state.items.map((ingresso) => {
      dispatch({ type: "REMOVE_ITEM", id: ingresso.id });
    });
  };

  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf[i]) * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10 || firstDigit === 11) firstDigit = 0;
    if (firstDigit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf[i]) * (11 - i);
    }
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10 || secondDigit === 11) secondDigit = 0;
    if (secondDigit !== Number(cpf[10])) return false;

    return true;
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não for número
    const onlyNumbers = value.replace(/\D/g, "");

    // Aplica a máscara do CPF
    return onlyNumbers
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
      .slice(0, 14); // Garante que não passe de 14 caracteres (formato final)
  };

  const formatPhone = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");

    if (onlyNumbers.length <= 10) {
      // Formato: (99) 9999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      // Formato: (99) 99999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleChangeUsuario = (field: keyof Usuario, value: string) => {
    setFormDataUsuario({ ...formDataUsuario, [field]: value });
  };

  const handleBuscarUsuario = async () => {
    setErrors({});
    formDataUsuario.id = 0;
    formDataUsuario.id_cliente = 0;
    formDataUsuario.nomeCompleto = "";
    formDataUsuario.sobreNome = "";
    formDataUsuario.email = "";
    formDataUsuario.telefone = "";

    setInfoUsuario("");

    if (!formDataUsuario.cpf) {
      setInfoUsuario("O cpf é obrigatório.");
      return;
    } else if (!isValidCPF(formDataUsuario.cpf)) {
      setInfoUsuario("CPF inválido. Verifique e tente novamente.");
      return;
    }

    const vUserResponse = await apiAuth.getUsuario({
      filters: { cpf: formDataUsuario.cpf },
    });
    console.log("vUser", vUserResponse);

    const vUser: Usuario = vUserResponse.data[0];

    if (!vUser) {
      setInfoUsuario(
        "Usuário não encontrado. Preencha os dados para fazer o pre-cadastro.",
      );
      handleGetClienteJango(formDataUsuario.cpf);
      return;
    }

    setFormDataUsuario(vUser);

    setInfoUsuario("Usuário encontrado.");
  };

  const handleGetClienteJango = async (cpf: string) => {
    const resCliente = await apiGeral.createResource<any>("/clientejango", {
      cpf: cpf?.replace(/\D/g, "") ?? "",
    });

    const cliente = resCliente.data;

    if (cliente) {
      const nomePartes = cliente.nome.trim().split(" ");
      const primeiroNome = nomePartes[0];
      const sobrenome = nomePartes.slice(1).join(" "); // junta o restante como sobrenome

      setFormDataUsuario({
        ...formDataUsuario,
        nomeCompleto: primeiroNome,
        sobreNome: sobrenome,
        telefone: cliente.telefone_celular
          ? formatPhone(cliente.telefone_celular)
          : "",
        email: cliente.email ? cliente.email : "",
        id_cliente: cliente.id_cliente,
      });
    }
  };

  useEffect(() => {
    if (
      formDataUsuario.id_cliente &&
      formDataUsuario.id_cliente > 0 &&
      formDataUsuario.id === 0
    ) {
      handleCadastrarUsuario(formDataUsuario);
    }
  }, [formDataUsuario.id_cliente]);

  const isEmail = (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formDataUsuario.cpf) {
      newErrors.cpf = "O cpf é obrigatório.";
    } else if (!isValidCPF(formDataUsuario.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    // if (!formDataUsuario.email) newErrors.email = "O email é obrigatório.";
    if (!formDataUsuario.telefone)
      newErrors.telefone = "O telefone é obrigatório.";
    if (!formDataUsuario.sobreNome)
      newErrors.sobreNome = "A sobrenome é obrigatória.";
    if (!formDataUsuario.nomeCompleto)
      newErrors.nomeCompleto = "Nome Completo é obrigatório.";
    // if (formDataUsuario.email) {
    //   if (!emailRegex.test(formDataUsuario.email)) {
    //     newErrors.email = "Por favor, insira um email válido.";
    //   }
    // }

    return newErrors;
  };

  const handleCadastrarUsuario = async (dados: Usuario) => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    // let dados = formDataUsuario;

    if (dados.id_cliente === 0) {
      try {
        const resCliente = await apiGeral.createResource<any>(
          "/clientejangoadd",
          {
            cpf: (dados.cpf ?? "").replace(/\D/g, ""),
            nomeCompleto: dados.nomeCompleto,
            sobreNome: dados.sobreNome,
            telefone: (dados.telefone ?? "").replace(/\D/g, ""),
            email: dados.email,
          },
        );

        const cliente = resCliente.data;

        if (cliente) {
          dados = {
            ...dados,
            id_cliente: cliente.id_cliente,
          };
          // setFormDataUsuario({
          //   ...formDataUsuario,
          //   id_cliente: cliente.id_cliente,
          // });
        }
      } catch (error) {
        console.error("Network request failed:", error);
        setErrors({
          api: "Erro ao registrar usuário no Jango. Tente novamente mais tarde.",
        });
        setLoading(false);
      }
    }

    try {
      const endpoint = api.getBaseUrlSite();
      const response = await apiAuth.addlogin({
        ...dados,
        login: dados.email,
        endpoint: endpoint,
        preCadastro: true,
      });

      console.log("Response from addlogin:", response);
      if (response.data.message) {
        setErrors({
          api: response.message || "Erro desconhecido ao registrar usuário.",
        });
        setInfoUsuario("Erro ao cadastrar usuário:" + response.data.message);
        return;
      } else {
        setFormDataUsuario({
          ...response.data,
        });

        console.log("Usuário cadastrado com sucesso id :", response.data.id);

        setInfoUsuario("Usuário cadastrado com sucesso!\n\n");
      }
    } catch (error) {
      console.error("Network request failed:", error);
      console.log(error);
      setErrors({
        api: "Erro ao registrar usuário. Tente novamente mais tarde." + error,
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.areaStep}>
          <StepIndicatorHospedagem currentStep={1} />
        </View>
        <Text style={styles.titulo}>Pousada</Text>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
          }}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
        >
          <View style={styles.areaEvento}>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + formData.imagem }}
              style={styles.imagem}
            />
            <View style={styles.areaTextoEvento}>
              <Text style={styles.tituloEvento}>{formData.nome}</Text>
              {/* <Text style={styles.enderecoEvento}>{formData.endereco}</Text> */}
            </View>
          </View>

          {isPDV && id === 1 && (
            <View style={styles.areaUsuario}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>CPF</Text>
                <View style={styles.grupoInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="CPF..."
                    keyboardType="numeric"
                    value={formDataUsuario.cpf}
                    onChangeText={(text) => {
                      const formatted = formatCPF(text);
                      handleChangeUsuario("cpf", formatted);
                    }}
                    onBlur={() => {
                      if ((formDataUsuario.cpf?.length ?? 0) === 14) {
                        handleBuscarUsuario();
                      }
                    }}
                  ></TextInput>
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 12,
                    }}
                    onPress={handleBuscarUsuario}
                  >
                    <Feather name="search" size={24} color="#212743" />
                  </TouchableOpacity>
                </View>
                {infoUsuario && (
                  <Text
                    style={
                      infoUsuario === "Usuário encontrado." ||
                      infoUsuario === "Usuário cadastrado com sucesso!\n\n"
                        ? styles.labelSucess
                        : styles.labelError
                    }
                  >
                    {infoUsuario}
                  </Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome..."
                  value={formDataUsuario.nomeCompleto}
                  onChangeText={(text) =>
                    (formDataUsuario.id ?? 0) > 0
                      ? ""
                      : handleChangeUsuario("nomeCompleto", text.toUpperCase())
                  }
                ></TextInput>
                {errors.nomeCompleto && (
                  <Text style={styles.labelError}>{errors.nomeCompleto}</Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Sobrenome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sobrenome..."
                  value={formDataUsuario.sobreNome}
                  onChangeText={(text) =>
                    formDataUsuario.id
                      ? ""
                      : handleChangeUsuario("sobreNome", text.toUpperCase())
                  }
                ></TextInput>
                {errors.sobreNome && (
                  <Text style={styles.labelError}>{errors.sobreNome}</Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formDataUsuario.email}
                  onChangeText={(text) =>
                    formDataUsuario.id ? "" : handleChangeUsuario("email", text)
                  }
                  onBlur={() => {
                    if (!isEmail(formDataUsuario.email)) {
                      formDataUsuario.id
                        ? ""
                        : handleChangeUsuario(
                            "email",
                            formatCPF(formDataUsuario.email),
                          );
                    }
                  }}
                />
                {errors.email && (
                  <Text style={styles.labelError}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Telefone..."
                  keyboardType="numeric"
                  value={formDataUsuario.telefone}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    handleChangeUsuario("telefone", formatted);
                  }}
                />
                {errors.telefone && (
                  <Text style={styles.labelError}>{errors.telefone}</Text>
                )}
              </View>

              {formDataUsuario.id === 0 && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.newButton,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => handleCadastrarUsuario(formDataUsuario)}
                  >
                    {loading && (
                      <ActivityIndicator
                        size="small"
                        color={colors.laranjado}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text style={styles.newButtonText}>Cadastrar Usuário</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.areaFiltros}>
            <Text style={[styles.tituloEvento, { marginBottom: 8 }]}>
              Período da estadia
            </Text>
            <View style={styles.filtroRow}>
              <Text style={styles.labelData}>Check-in</Text>
              <View style={styles.filtroDateTime}>
                <View style={styles.filtroDateField}>
                  <DatePickerComponente
                    value={checkinDate}
                    onChange={setCheckinDate}
                  />
                </View>
                <View style={styles.filtroTimeField}>
                  <TimePickerComponente
                    value={checkinTime}
                    onChange={setCheckinTime}
                    minTime={checkinMinEfetivo}
                    maxTime={CHECKIN_TIME_MAX}
                  />
                </View>
              </View>
            </View>
            {checkinHojeSemHorarios ? (
              <Text style={styles.labelError}>{MSG_SEM_HORARIOS_HOJE}</Text>
            ) : null}
            {filtroErrors.checkinHorario && !checkinHojeSemHorarios ? (
              <Text style={styles.labelError}>{filtroErrors.checkinHorario}</Text>
            ) : null}
            {filtroErrors.checkoutHorario ? (
              <Text style={styles.labelError}>{filtroErrors.checkoutHorario}</Text>
            ) : null}
            <View style={styles.filtroRow}>
              <Text style={styles.labelData}>Check-out</Text>
              <View style={styles.filtroDateTime}>
                <View style={styles.filtroDateField}>
                  <DatePickerComponente
                    value={checkoutDate}
                    onChange={setCheckoutDate}
                  />
                </View>
                <View style={styles.filtroTimeField}>
                  <TimePickerComponente
                    value={checkoutTime}
                    onChange={setCheckoutTime}
                    minTime={CHECKOUT_TIME_MIN}
                    maxTime={CHECKOUT_TIME_MAX}
                  />
                </View>
              </View>
            </View>
            {filtroErrors.datas && (
              <Text style={styles.labelError}>{filtroErrors.datas}</Text>
            )}
            <TouchableOpacity
              style={[
                styles.newButton,
                { alignSelf: "center", marginBottom: 12 },
                (buscandoDisponibilidade || checkinHojeSemHorarios) && {
                  opacity: 0.5,
                },
              ]}
              onPress={() => handleBuscarDisponibilidade()}
              disabled={buscandoDisponibilidade || checkinHojeSemHorarios}
            >
              {buscandoDisponibilidade ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.newButtonText}>Buscar disponibilidade</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.areaInfoHospedes}>
            <Text style={styles.infoHospedesTitulo}>
              ⚠️ Informações importantes
            </Text>
            <Text style={styles.infoHospedesItem}>
              • Informe a quantidade REAL de adultos e crianças que irão se
              hospedar.
            </Text>
            <Text style={styles.infoHospedesItem}>
              • Cada hóspede receberá uma pulseira individual de acesso.
            </Text>
            <Text style={styles.infoHospedesItem}>
              • Serão emitidas pulseiras apenas para as pessoas informadas na
              reserva.
            </Text>
            <Text style={[styles.infoHospedesItem, { marginBottom: 0 }]}>
              • Caso a quantidade de hóspedes seja diferente no check-in, será
              necessária a regularização da reserva conforme a tabela vigente,
              sujeita à disponibilidade.
            </Text>
          </View>

          <View style={styles.area}>
            {disponibilidadeBuscada && registrosEventoSuites.length === 0 && (
              <Text style={[styles.descricaoSuite, { textAlign: "center" }]}>
                Nenhuma suíte disponível para o período informado.
              </Text>
            )}
            {carrinho.length > 0 && (
              <View style={styles.areaCarrinho}>
                <Text style={[styles.tituloEvento, { marginBottom: 6 }]}>
                  Carrinho ({carrinho.length} suíte
                  {carrinho.length > 1 ? "s" : ""})
                </Text>
                {carrinho.map((item) => (
                  <View key={item.idEventoSuite} style={styles.itemCarrinho}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.descricaoSuite}>{item.nomeSuite}</Text>
                      <Text style={styles.descricaoSuite}>
                        {item.adultos} adulto(s)
                        {item.criancas > 0
                          ? `, ${item.criancas} criança(s)`
                          : ""}{" "}
                        — {formatCurrency(item.cotacao.totais.valorTotal)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoverDoCarrinho(item.idEventoSuite)}
                    >
                      <Feather name="trash-2" size={22} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {disponibilidadeBuscada && registrosEventoSuites.length > 0 && (
              <View
                ref={suitesListRef}
                collapsable={false}
                nativeID="pousada-suites-anchor"
                style={
                  Platform.OS === "web"
                    ? ({ scrollMarginTop: SCROLL_OFFSET_SUITES } as object)
                    : undefined
                }
              >
                {registrosEventoSuites.map((suite, index) => {
                  const noCarrinho = carrinho.some(
                    (i) => i.idEventoSuite === suite.id,
                  );
                  const emEdicao = suiteEmEdicao?.id === suite.id;
                  return (
                  <View
                    key={suite.id}
                    style={[
                      styles.areaIngressos,
                      (emEdicao || noCarrinho) && styles.suiteSelecionada,
                      index < registrosEventoSuites.length - 1 &&
                        styles.areaIngressosSpacing,
                    ]}
                  >
                    <Text style={[styles.tituloEvento, { textAlign: "center" }]}>
                      Suíte {suite.nome}
                      {noCarrinho ? " ✓" : ""}
                    </Text>
                    <View
                      style={[
                        styles.areaSuiteInfo,
                        isMobileSuiteLayout && styles.areaSuiteInfoMobile,
                      ]}
                    >
                      <View
                        style={
                          isMobileSuiteLayout
                            ? styles.imagemSuiteContainerMobile
                            : styles.imagemSuiteContainerDesktop
                        }
                      >
                        <Image
                          source={{
                            uri:
                              api.getBaseApi() + "/uploads/" + formData.imagem,
                          }}
                          style={[
                            styles.imagemSuite,
                            isMobileSuiteLayout && styles.imagemSuiteMobile,
                          ]}
                        />
                      </View>
                      <View
                        style={[
                          styles.areaDescricaoSuite,
                          isMobileSuiteLayout && styles.areaDescricaoSuiteMobile,
                        ]}
                      >
                        <Text style={styles.descricaoSuite}>
                          {suite.descricao || "Descrição não informada"}
                        </Text>
                        {(() => {
                          const { min, max } = getLimitesSuite(suite);
                          return (
                            <View style={styles.regrasPousada}>
                              <Text style={styles.regrasPousadaTitulo}>
                                Regras de ocupação
                              </Text>
                              <Text style={styles.descricaoSuite}>
                                Capacidade: {min} a {max} hóspedes
                              </Text>
                              <Text style={styles.descricaoSuite}>
                                Inclui até {min} hóspedes
                              </Text>
                              <Text style={styles.descricaoSuite}>
                                Adulto extra:{" "}
                                {formatCurrency(VALOR_ADICIONAL_ADULTO_EXTRA)}
                              </Text>
                              <Text style={styles.descricaoSuite}>
                                Criança extra:{" "}
                                {formatCurrency(VALOR_ADICIONAL_CRIANCA_EXTRA)}
                              </Text>
                            </View>
                          );
                        })()}
                        {(suite as EventoSuite & {
                          cotacao?: { valorTotal?: number };
                        }).cotacao?.valorTotal != null && (
                          <Text
                            style={[styles.descricaoSuite, { fontWeight: "bold" }]}
                          >
                            A partir de{" "}
                            {formatCurrency(
                              (
                                suite as EventoSuite & {
                                  cotacao: { valorTotal: number };
                                }
                              ).cotacao.valorTotal,
                            )}
                          </Text>
                        )}
                      </View>
                    </View>

                    {emEdicao && !noCarrinho && (() => {
                      const { min, max } = getLimitesSuite(suite);
                      const totalHospedes = adultosItem + criancasItem;
                      const podeIncrementar = totalHospedes < max;
                      const podeDecrementarAdulto =
                        adultosItem > 0 && totalHospedes - 1 >= min;
                      const podeDecrementarCrianca =
                        criancasItem > 0 && totalHospedes - 1 >= min;
                      const corDesabilitado = colors.cinza;
                      const noites =
                        (suite as EventoSuite & { noites?: number }).noites ??
                        calcularNoitesHotelaria(
                          combineDateTime(checkinDate, checkinTime),
                          combineDateTime(checkoutDate, checkoutTime),
                        );
                      const subtotal = calcularSubtotalSuitePousada(
                        suite,
                        adultosItem,
                        criancasItem,
                        noites,
                      );

                      return (
                      <View style={styles.areaCotacao}>
                        <View style={styles.filtroRow}>
                          <Text style={styles.label}>Adultos</Text>
                          <View style={styles.counterRow}>
                            <TouchableOpacity
                              disabled={!podeDecrementarAdulto}
                              onPress={() => {
                                if (podeDecrementarAdulto) {
                                  setAdultosItem(adultosItem - 1);
                                }
                              }}
                            >
                              <Feather
                                name="minus-circle"
                                size={28}
                                color={
                                  podeDecrementarAdulto
                                    ? colors.azul
                                    : corDesabilitado
                                }
                              />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{adultosItem}</Text>
                            <TouchableOpacity
                              disabled={!podeIncrementar}
                              onPress={() => {
                                if (podeIncrementar) {
                                  setAdultosItem(adultosItem + 1);
                                }
                              }}
                            >
                              <Feather
                                name="plus-circle"
                                size={28}
                                color={
                                  podeIncrementar ? colors.azul : corDesabilitado
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={styles.filtroRow}>
                          <Text style={styles.label}>Crianças</Text>
                          <View style={styles.counterRow}>
                            <TouchableOpacity
                              disabled={!podeDecrementarCrianca}
                              onPress={() => {
                                if (podeDecrementarCrianca) {
                                  setCriancasItem(criancasItem - 1);
                                }
                              }}
                            >
                              <Feather
                                name="minus-circle"
                                size={28}
                                color={
                                  podeDecrementarCrianca
                                    ? colors.azul
                                    : corDesabilitado
                                }
                              />
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{criancasItem}</Text>
                            <TouchableOpacity
                              disabled={!podeIncrementar}
                              onPress={() => {
                                if (podeIncrementar) {
                                  setCriancasItem(criancasItem + 1);
                                }
                              }}
                            >
                              <Feather
                                name="plus-circle"
                                size={28}
                                color={
                                  podeIncrementar ? colors.azul : corDesabilitado
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={[styles.descricaoSuite, { textAlign: "center" }]}>
                          {totalHospedes} de {max} hóspedes
                        </Text>
                        {subtotal ? (
                          <View style={styles.subtotalSuiteCard}>
                            <Text style={styles.subtotalSuiteTitulo}>
                              Subtotal desta suíte
                            </Text>
                            {subtotal.temExtras ? (
                              <>
                                <Text style={styles.subtotalSuiteLinha}>
                                  {noites > 1
                                    ? `Valor base (${noites} diárias): `
                                    : "Valor base: "}
                                  {formatCurrency(subtotal.suitePreco)}
                                </Text>
                                {subtotal.adultosExtras > 0 ? (
                                  <Text style={styles.subtotalSuiteLinha}>
                                    {noites > 1
                                      ? `Adultos extras: ${subtotal.adultosExtras} × ${noites} diárias × ${formatCurrency(VALOR_ADICIONAL_ADULTO_EXTRA)} = ${formatCurrency(subtotal.extraAdultoValor)}`
                                      : `Adultos extras: ${subtotal.adultosExtras} × ${formatCurrency(VALOR_ADICIONAL_ADULTO_EXTRA)} = ${formatCurrency(subtotal.extraAdultoValor)}`}
                                  </Text>
                                ) : null}
                                {subtotal.criancasExtras > 0 ? (
                                  <Text style={styles.subtotalSuiteLinha}>
                                    {noites > 1
                                      ? `Crianças extras: ${subtotal.criancasExtras} × ${noites} diárias × ${formatCurrency(VALOR_ADICIONAL_CRIANCA_EXTRA)} = ${formatCurrency(subtotal.extraCriancaValor)}`
                                      : `Crianças extras: ${subtotal.criancasExtras} × ${formatCurrency(VALOR_ADICIONAL_CRIANCA_EXTRA)} = ${formatCurrency(subtotal.extraCriancaValor)}`}
                                  </Text>
                                ) : null}
                                <Text style={styles.subtotalSuiteValorFinal}>
                                  {formatCurrency(subtotal.valorTotal)}
                                </Text>
                              </>
                            ) : (
                              <Text style={styles.subtotalSuiteValorFinal}>
                                Total desta suíte:{" "}
                                {formatCurrency(subtotal.valorTotal)}
                              </Text>
                            )}
                          </View>
                        ) : null}
                        <TouchableOpacity
                          style={[styles.newButton, { alignSelf: "center" }]}
                          onPress={handleAdicionarAoCarrinho}
                          disabled={adicionandoItem}
                        >
                          {adicionandoItem ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={styles.newButtonText}>
                              Adicionar ao carrinho
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setSuiteEmEdicao(null)}
                          style={{ alignSelf: "center", marginTop: 6 }}
                        >
                          <Text style={styles.descricaoSuite}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                      );
                    })()}

                    {!noCarrinho && !emEdicao && (
                      <TouchableOpacity
                        style={[styles.newButton, { alignSelf: "center" }]}
                        onPress={() => handleAbrirAdicionarSuite(suite)}
                      >
                        <Text style={styles.newButtonText}>Escolher hóspedes</Text>
                      </TouchableOpacity>
                    )}

                    <View style={{ height: 16 }} />
                  </View>
                );
              })}
              </View>
            )}

            <View style={{ height: carrinho.length > 0 ? 120 : 40 }} />
          </View>
        </ScrollView>
      </View>
      {carrinho.length > 0 && (
        <ModalResumoPousada
          itens={carrinho}
          onProximo={handleIrConferencia}
          UsuarioVenda={formDataUsuario}
        />
      )}
      <Modal
        visible={visibleMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setVisibleMsg(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setVisibleMsg(false)}
        >
          <ModalMsg onClose={() => setVisibleMsg(false)} msg={msgApi} />
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginBottom: 20,
    height: 500,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  areaIngressos: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    borderRadius: 20,
  },
  areaIngressosSpacing: {
    marginBottom: 22,
  },
  areaUsuario: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    // paddingBottom: 25,
    borderRadius: 20,
    height: 550,
    // flex: 1,
  },
  areaTitulo: {
    fontSize: 22,
    // fontWeight: "bold",
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    // flexBasis: "45%",
  },
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: width <= 1000 ? 0 : 4,
    width: width <= 1000 ? 72 : 140,
    textAlign: width <= 1000 ? "left" : "right",
    flexShrink: 0,
    // flexBasis: "45%",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    width: Platform.OS === "web" ? (width <= 1000 ? "100%" : "100%") : "100%",
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  eventDetails: {
    flexWrap: "wrap",
    // justifyContent: "center",
    width: Platform.OS === "web" ? width - 432 : -32, // Ajusta a largura conforme a tela
    // width: width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  imagem: {
    // width: "100%", // 100% para web, largura da tela para mobile
    borderRadius: 20,
    height: 110,
    width: 180,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
  areaEvento: {
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 10,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
  },
  areaStep: {
    justifyContent: "center",
    alignItems: "center",
  },
  areaTextoEvento: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  tituloEvento: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  enderecoEvento: {
    fontSize: 16,
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  grupoInput: {
    alignItems: "flex-start",
    width: "100%",
  },
  labelSucess: {
    color: colors.green,
    marginTop: -18,
    marginBottom: 18,
  },
  newButton: {
    backgroundColor: colors.azul,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: Platform.OS === "web" ? 200 : 100,
    alignItems: "center",
  },
  newButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  areaSuiteInfo: {
    flexDirection: "row",
    marginVertical: 10,
    gap: 12,
  },
  areaSuiteInfoMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "flex-start",
    width: "100%",
    gap: 0,
  },
  imagemSuite: {
    borderRadius: 20,
    height: 150,
    width: 220,
    resizeMode: "cover",
  },
  imagemSuiteContainerDesktop: {
    flexShrink: 0,
  },
  imagemSuiteContainerMobile: {
    width: "100%",
    height: 200,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: "stretch",
    overflow: "hidden",
    borderRadius: 20,
  },
  imagemSuiteMobile: {
    width: "100%",
    height: "100%",
    minHeight: 200,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 20,
  },
  areaDescricaoSuite: {
    flex: 1,
    justifyContent: "center",
  },
  areaDescricaoSuiteMobile: {
    flex: 0,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "auto",
    width: "100%",
    alignSelf: "stretch",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: 12,
    marginLeft: 0,
    paddingHorizontal: 0,
  },
  tituloDescricao: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  descricaoSuite: {
    fontSize: 16,
    color: "#555",
  },
  regrasPousada: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  regrasPousadaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 4,
  },
  areaFiltros: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 8,
    marginHorizontal: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    borderRadius: 20,
  },
  areaInfoHospedes: {
    backgroundColor: "rgba(255, 248, 210, 0.95)",
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.35)",
    width: Platform.OS === "web" ? undefined : "100%",
    alignSelf: "stretch",
  },
  infoHospedesTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 8,
  },
  infoHospedesItem: {
    fontSize: 14,
    color: "#5c4a00",
    marginBottom: 6,
    lineHeight: 20,
    flexShrink: 1,
  },
  filtroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    columnGap: width <= 1000 ? 6 : 8,
    rowGap: 4,
  },
  filtroDateTime: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: width <= 1000 ? 4 : 8,
    // Se não couber ao lado da label, quebra a linha e ocupa a largura do card
    minWidth: width <= 1000 ? 196 : 240,
  },
  filtroDateField: {
    flex: 1,
    minWidth: 118,
  },
  filtroTimeField: {
    width: width <= 1000 ? 76 : 110,
    flexShrink: 0,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "bold",
    minWidth: 28,
    textAlign: "center",
  },
  suiteSelecionada: {
    borderWidth: 2,
    borderColor: colors.azul,
  },
  areaCotacao: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  subtotalSuiteCard: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    width: "100%",
  },
  subtotalSuiteTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 8,
  },
  subtotalSuiteLinha: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  subtotalSuiteValorFinal: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.azul,
    marginTop: 4,
  },
  areaCarrinho: {
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  itemCarrinho: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
});
