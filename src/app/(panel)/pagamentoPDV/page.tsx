import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  Ingresso,
  IngressoTransacao,
  QueryParams,
  Transacao,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import StepIndicator from "@/src/components/StepIndicator";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { useHospedagem } from "@/src/contexts_/HospedagemContext";
import { useResumoPagamentoHospedagem } from "@/src/lib/resumoPagamentoHospedagem";
import ResumoPagamentoHospedagem from "@/src/components/ResumoPagamentoHospedagem";
import { resolverRegistroTransacao } from "@/src/lib/resolverTransacao";
import { initMercadoPago } from "@mercadopago/sdk-react";
import StatusPaymentCustomizadoPOS from "@/src/components/StatusPaymentCustomizadoPOS";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts_/AuthContext";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import * as Print from "expo-print";
import html2canvas from "html2canvas";
import EscPosEncoder from "esc-pos-encoder";
import ModalMsg from "@/src/components/ModalMsg";
import QuantidadeAjustePdv from "./QuantidadeAjustePdv";

const { width } = Dimensions.get("window");

/** Máscara monetária: dígitos internos; 2 últimos = centavos. */
function digitosParaExibicaoMoeda(digitos: string): string {
  const only = (digitos || "").replace(/\D/g, "");
  const padded = only.padStart(3, "0");
  const cents = padded.slice(-2);
  const integerRaw = padded.slice(0, -2).replace(/^0+/, "") || "0";
  const integer = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${integer},${cents}`;
}

function valorParaDigitosCentavos(valor: number): string {
  const cents = Math.round(Math.max(0, valor) * 100);
  return String(cents);
}

function digitosCentavosParaNumero(digitos: string): number {
  const only = (digitos || "").replace(/\D/g, "");
  if (!only) return 0;
  return Number(only) / 100;
}

type IngressoAgrupado = IngressoTransacao & {
  qtde: number;
  chave: string;
  ids: number[];
};

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state, dispatch } = useCart();
  const { state: hospedagemState, dispatch: dispatchHospedagem } = useHospedagem();
  const { user } = useAuth();
  const [consultaPagamento, setConsultaPagamento] = useState(false);
  const [payment_uniqueid, setPaymentUniqueId] = useState("");
  const [dadosDePagamento, setDadosDePagamento] = useState<any>({});
  const {
    idEvento,
    registroTransacao: registroTransacaoParam,
    tipoCompra,
  } = route.params as {
    idEvento: number;
    registroTransacao: Transacao | number;
    tipoCompra?: string;
  };
  const registroTransacao = resolverRegistroTransacao(
    registroTransacaoParam,
    state.transacao,
  );
  const { isHospedagem, resumo: resumoHospedagem } = useResumoPagamentoHospedagem({
    tipoCompra,
    idEvento,
    registroTransacao,
    reserva: hospedagemState.reserva,
  });
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);
  /** Quantidades ajustadas só nesta tela de Pagamento PDV (chave do grupo → qtde). */
  const [qtdePorGrupo, setQtdePorGrupo] = useState<Record<string, number>>({});
  const [metodoSelecionado, setMetodoSelecionado] = useState<string | null>();
  // Ref para o iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const navigation = useNavigation() as any;
  const [msg, setMsg] = useState<string>("");
  const [visibleMsg, setVisibleMsg] = useState<boolean>(false);
  const redirecionouHospedagem = useRef(false);
  const [modalConfirmVisible, setModalConfirmVisible] = useState(false);
  const [valorEditavel, setValorEditavel] = useState<string>(""); // só dígitos (centavos)
  const [sincronizandoQuantidade, setSincronizandoQuantidade] = useState(false);
  /** Evita múltiplas aberturas de conta Jango para a mesma venda PDV nesta tela. */
  const abrirContaPdvEmAndamento = useRef(false);
  const contaJangoPdvJaProcessada = useRef<number | null>(null);

  let [transacaoAtual, setTransacaoAtual] = useState<Transacao | null>(
    registroTransacao,
  );

  useEffect(() => {
    if (registroTransacao) {
      setTransacaoAtual(registroTransacao);
    }
  }, [registroTransacao]);

  useEffect(() => {
    if (
      !isHospedagem ||
      transacaoAtual?.status !== "Pago" ||
      redirecionouHospedagem.current
    ) {
      return;
    }

    const idTransacao = Number(transacaoAtual.id);
    dispatchHospedagem({ type: "CLEAR" });
    if (Number.isFinite(idTransacao) && idTransacao > 0) {
      redirecionouHospedagem.current = true;
      navigation.navigate("reservaConfirmada", { idTransacao });
    }
  }, [isHospedagem, transacaoAtual?.status, transacaoAtual?.id, dispatchHospedagem, navigation]);

  //Jango
  // initMercadoPago(process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "", {
  //   locale: "pt-BR",
  // });

  initMercadoPago(process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "", {
    locale: "pt-BR",
  });

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

  const getRegistros = async (idEvento: number) => {
    if (idEvento > 0) {
      const response = await apiGeral.getResourceById<Evento>(
        endpointApi,
        idEvento,
      );

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);

      if (!isHospedagem) {
        await getIngressoTransacao({
          filters: { idTransacao: state.transacao?.id },
        });
      }
    }
  };

  const getIngressoTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<IngressoTransacao>(
      "/ingressotransacao",
      {
        ...params,
        pageSize: 200,
      },
    );
    const registrosData = response.data ?? [];
    // console.log("witsh", width);

    // console.log("registrosData", registrosData);
    setRegistrosIngressoTransacao(registrosData);
    setQtdePorGrupo({});
  };

  const getTransacao = async () => {
    const response = await apiGeral.getResource<Transacao>("/transacao", {
      filters: { id: state.transacao?.id },
      pageSize: 200,
    });
    const registrosData = response.data ?? [];
    console.log("transacao", registrosData[0]);

    setTransacaoAtual(registrosData[0] as Transacao);
    return registrosData[0] as Transacao;
  };

  // const getRegistrosIngressos = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<EventoIngresso>(
  //     endpointApiIngressos,
  //     { ...params, pageSize: 200 }
  //   );
  //   const registrosData = response.data ?? [];

  //   setRegistrosEventoIngressos(registrosData);
  // };

  useFocusEffect(
    useCallback(() => {
      // console.log("useFocusEffect", idEvento);
      // ✅ Resetando variáveis ao abrir a tela
      setPaymentUniqueId("");
      setDadosDePagamento({});
      setConsultaPagamento(false);
      setMetodoSelecionado(null);
      setHtmlContent("");
      setRegistrosIngressoTransacao([]);
      setQtdePorGrupo({});
      // Só libera nova abertura se a venda mudou; não resetar na mesma transação.
      const idTrxAtual = Number(registroTransacao?.id ?? 0);
      if (
        contaJangoPdvJaProcessada.current != null &&
        contaJangoPdvJaProcessada.current !== idTrxAtual
      ) {
        contaJangoPdvJaProcessada.current = null;
        abrirContaPdvEmAndamento.current = false;
      }

      if (idEvento > 0) {
        getRegistros(idEvento);
      }
      setTransacaoAtual(registroTransacao);
    }, [idEvento, registroTransacao, isHospedagem]),
  );

  const chaveGrupoIngresso = (item: IngressoTransacao) =>
    `${item.Ingresso_EventoIngresso?.id ?? item.Ingresso_EventoIngresso?.TipoIngresso?.id}-${item.Ingresso_EventoIngresso?.nome}`;

  const agruparIngressos = (
    ingressos: IngressoTransacao[],
  ): IngressoAgrupado[] => {
    const mapa = new Map<string, IngressoAgrupado>();

    ingressos.forEach((item) => {
      const chave = chaveGrupoIngresso(item);

      if (mapa.has(chave)) {
        const existente = mapa.get(chave)!;
        existente.qtde += 1;
        existente.ids.push(item.id);
      } else {
        mapa.set(chave, { ...item, qtde: 1, chave, ids: [item.id] });
      }
    });

    return Array.from(mapa.values());
  };

  const ingressosAgrupados = agruparIngressos(registrosIngressoTransacao);

  const getQtdeExibida = (item: IngressoAgrupado) =>
    qtdePorGrupo[item.chave] ?? item.qtde;

  const podeAjustarQuantidade =
    !isHospedagem &&
    !consultaPagamento &&
    transacaoAtual?.status !== "Pago" &&
    transacaoAtual?.status !== "Cancelado";

  const reduzirQuantidadeGrupo = (item: IngressoAgrupado) => {
    if (!podeAjustarQuantidade) return;
    const atual = getQtdeExibida(item);
    if (atual <= 1) return;
    setQtdePorGrupo((prev) => ({
      ...prev,
      [item.chave]: atual - 1,
    }));
  };

  const totaisPdv = (() => {
    if (isHospedagem) {
      return {
        preco: Number(registroTransacao?.preco ?? 0),
        taxaServico: Number(registroTransacao?.taxaServico ?? 0),
        taxaServicoDesconto: Number(
          registroTransacao?.taxaServicoDesconto ?? 0,
        ),
        valorTotal: Number(registroTransacao?.valorTotal ?? 0),
      };
    }

    let preco = 0;
    let taxaServico = 0;
    let taxaServicoDesconto = 0;
    let valorTotal = 0;

    for (const grupo of ingressosAgrupados) {
      const qtde = getQtdeExibida(grupo);
      const idsMantidos = grupo.ids.slice(0, qtde);
      for (const id of idsMantidos) {
        const item = registrosIngressoTransacao.find((r) => r.id === id);
        if (!item) continue;
        preco += Number(item.preco || 0);
        taxaServico += Number(item.taxaServico || 0);
        taxaServicoDesconto += Number((item as any).taxaServicoDesconto || 0);
        valorTotal += Number(item.valorTotal || 0);
      }
    }

    return { preco, taxaServico, taxaServicoDesconto, valorTotal };
  })();

  const temReducaoPendente = ingressosAgrupados.some(
    (item) => getQtdeExibida(item) < item.qtde,
  );

  const valorRecebidoAtual = Number(transacaoAtual?.valorRecebido ?? 0);
  const saldoPendenteCentavos = Math.max(
    0,
    Math.round(totaisPdv.valorTotal * 100) - Math.round(valorRecebidoAtual * 100),
  );
  const valorInformadoCentavos = Number(
    (valorEditavel || "").replace(/\D/g, "") || "0",
  );
  const valorExcedeSaldo =
    valorInformadoCentavos > saldoPendenteCentavos;
  const valorPagamentoInvalido =
    valorInformadoCentavos <= 0 || valorExcedeSaldo;
  const msgErroValorPagamento = valorExcedeSaldo
    ? `O valor informado não pode ser maior que o saldo restante (${digitosParaExibicaoMoeda(String(saldoPendenteCentavos))}).`
    : valorInformadoCentavos <= 0 && valorEditavel.length > 0
      ? "Informe um valor maior que R$ 0,00."
      : "";

  /**
   * Persiste a redução na própria Transacao / IngressoTransacao
   * imediatamente antes de confirmar o pagamento PDV.
   * Retorna a transação atualizada quando disponível.
   */
  const sincronizarQuantidadesAntesPagamento = async (): Promise<{
    ok: boolean;
    transacao?: Transacao | null;
    vendaQuitada?: boolean;
  }> => {
    if (!temReducaoPendente) {
      return { ok: true, transacao: transacaoAtual, vendaQuitada: false };
    }

    if (!registroTransacao?.id || !user?.id) {
      setMsg("Não foi possível ajustar a quantidade da transação.");
      setVisibleMsg(true);
      return { ok: false };
    }

    const itens = ingressosAgrupados
      .map((item) => ({
        idsIngressoTransacao: item.ids,
        quantidade: getQtdeExibida(item),
      }))
      .filter((item) => item.quantidade < item.idsIngressoTransacao.length);

    if (itens.length === 0) {
      return { ok: true, transacao: transacaoAtual, vendaQuitada: false };
    }

    try {
      setSincronizandoQuantidade(true);
      const response = await apiGeral.createResource(
        "/pagamentopdv/ajustarquantidade",
        {
          idTransacao: registroTransacao.id,
          idUsuarioPDV: user.id,
          itens,
        },
      );

      if (response.success === false) {
        setMsg(
          response.message ||
            "Erro ao atualizar quantidade dos ingressos.",
        );
        setVisibleMsg(true);
        return { ok: false };
      }

      const payload = (response.data as any)?.data ?? response.data;
      const transacaoAtualizada = payload?.transacao as Transacao | undefined;
      const idsRemovidos: number[] =
        payload?.idsIngressoTransacaoRemovidos ?? [];
      const vendaQuitada = Boolean(payload?.vendaQuitada);

      if (idsRemovidos.length > 0) {
        setRegistrosIngressoTransacao((prev) =>
          prev.filter((item) => !idsRemovidos.includes(item.id)),
        );
      }

      if (transacaoAtualizada) {
        setTransacaoAtual(transacaoAtualizada);
        dispatch({ type: "ADD_TRANSACAO", transacao: transacaoAtualizada });
      }

      setQtdePorGrupo({});
      return {
        ok: true,
        transacao: transacaoAtualizada ?? null,
        vendaQuitada,
      };
    } catch (error) {
      console.error("Erro ao sincronizar quantidade PDV:", error);
      setMsg("Erro ao atualizar quantidade dos ingressos.");
      setVisibleMsg(true);
      return { ok: false };
    } finally {
      setSincronizandoQuantidade(false);
    }
  };

  const fetchPagamentoPos = async () => {
    try {
      // if (consultaPagamento) return;
      // setloading(true);
      const response = await fetch(api.getBaseApi() + "/pagamentopos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valorTotal: digitosCentavosParaNumero(valorEditavel),
          // email: email,
          descricao: "Venda de Ingressos",
          idTransacao: registroTransacao?.id,
          idUsuarioPDV: user?.id,
          transaction_type:
            metodoSelecionado === "pix"
              ? 3
              : metodoSelecionado === "crédito"
                ? 2
                : 1,
        }), // Adicione o ID do usuário aqui
      });

      setConsultaPagamento(true);
      const responseData = await response.json();
      setPaymentUniqueId(responseData?.id || "");

      // setloading(false);
    } catch (error) {
      console.error("Erro ao gerar Pix:", error);
      // setloading(false);
    }
  };

  const fetchPagamentoDinheiro = async () => {
    try {
      // if (consultaPagamento) return;
      // setloading(true);
      const response = await fetch(api.getBaseApi() + "/pagamentodinheiro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idTransacao: registroTransacao?.id,
          idUsuarioPDV: user?.id,
          valorTotal: digitosCentavosParaNumero(valorEditavel),
        }), // Adicione o ID do usuário aqui
      });

      const responseData = await response.json();
      // console.log("responseData", responseData.data);
      setDadosDePagamento(responseData.data);
      setConsultaPagamento(false);
      let transacaoA = await getTransacao();

      if ((transacaoA?.valorRecebido ?? 0) >= (transacaoA?.valorTotal ?? 0)) {
        if (registroTransacao.idEvento === 4) {
          for (const item of registrosIngressoTransacao) {
            const ingresso = await getIngresso(item.idIngresso);
            await apiGeral.createResource("/validadorqrcode", {
              ingresso: ingresso.id,
            });
          }
        }

        if (registroTransacao.idEvento === 1) {
          handleAbrirConta();
        }
      }

      // setloading(false);
    } catch (error) {
      console.error("Erro ao gerar Dinheiro:", error);
      // setloading(false);
    }
  };

  const getIngresso = async (id: number) => {
    const response = await apiGeral.getResource<Ingresso>("/ingresso", {
      filters: { id },
      pageSize: 200,
    });
    // console.log("response", response);
    const registrosData = response.data ?? [];
    return registrosData[0];
  };

  const verificarStatusPagamentoPos = async () => {
    // console.log("isPolling", isPolling);

    if (!consultaPagamento) return;

    try {
      const response = await apiGeral.getResource("/consultapagamentopos", {
        // filters: { id: "107841609777" },
        // filters: { id: paymentStatusId, email },
        filters: {
          payment_uniqueid: payment_uniqueid,
        },
        pageSize: 10,
      });

      const dados: { payment_message: string } = Array.isArray(response?.data)
        ? { payment_message: "" }
        : (response?.data ?? { payment_message: "" });

      setDadosDePagamento(response.data);
      // console.log("dados", dados);

      // console.log("dadosDePagamento", dadosDePagamento);
      if (dados.payment_message === "Pago") {
        setConsultaPagamento(false);
        await getTransacao();
        if (registroTransacao.idEvento === 4) {
          for (const item of registrosIngressoTransacao) {
            const ingresso = await getIngresso(item.idIngresso);
            await apiGeral.createResource("/validadorqrcode", {
              ingresso: ingresso.id,
            });
          }
        }
        if (registroTransacao.idEvento === 1) {
          handleAbrirConta();
        }
      }
      if (
        dados.payment_message === "Cancelado/erro" ||
        dados.payment_message === "Parcial"
      ) {
        setConsultaPagamento(false);
        getTransacao();
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento POS:", error);
    }
  };

  const CancelaPagamentoPos = async () => {
    try {
      const response = await apiGeral.getResource("/cancelapagamentopos", {
        filters: {
          payment_uniqueid: payment_uniqueid,
        },
        pageSize: 10,
      });

      const dados: { payment_message: string } = Array.isArray(response?.data)
        ? { payment_message: "" }
        : (response?.data ?? { payment_message: "" });

      setDadosDePagamento(response.data);

      if (dados.payment_message === "Pago") {
        setConsultaPagamento(false);
      }
      if (dados.payment_message === "Cancelado/erro") {
        setConsultaPagamento(false);
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento POS:", error);
    }
  };

  useEffect(() => {
    if (payment_uniqueid === "" || !consultaPagamento) return;

    const interval = setInterval(() => {
      verificarStatusPagamentoPos();
    }, 2000);

    return () => clearInterval(interval);
  }, [payment_uniqueid, consultaPagamento]);

  const handlePrintIngressos = async () => {
    if (!registroTransacao || !registrosIngressoTransacao.length) return;

    let html = `
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 5px; }
          .card { border: 1px solid #ddd; padding: 7px; border-radius: 8px; max-width: 300px; margin: 10px auto; page-break-inside: avoid; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 6px; }
          .ticket { font-size: 12px; font-weight: bold; margin-bottom: 6px; }
          .image { width: 100%; max-height: 250px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; }
          .info { font-size: 12px; margin-bottom: 6px; }
          .label { font-size: 12px; font-weight: bold; }
          .qrcode { margin-left: -10px; text-align: center; }
          .id { font-size: 10px; margin-top: 6px; }
        </style>
      </head>
      <body>
  `;

    // Adiciona todos os ingressos
    for (const item of registrosIngressoTransacao) {
      const ingresso = await getIngresso(item.idIngresso);
      html += `
      <div class="card">
        <img class="image" src="${api.getBaseApi()}/uploads/${
          ingresso.Evento_imagem
        }" />
        <div class="title">${ingresso.Evento_nome}</div>
        ${
          ingresso.tipo === "Cortesia"
            ? '<div class="ticket">Cortesia</div>'
            : ""
        }
        <div class="ticket">${ingresso.TipoIngresso_descricao} ${
          ingresso.EventoIngresso_nome
        }</div>
        ${
          ingresso.nomeImpresso
            ? `<div class="ticket">${ingresso.nomeImpresso}</div>`
            : ""
        }
        <div class="info"><span class="label">Status:</span> ${
          ingresso.status
        }</div>
        <div class="info"><span class="label">Data:</span> ${formatInTimeZone(
          parseISO((ingresso.Evento_data_hora_inicio ?? "").toString()),
          "America/Cuiaba",
          "dd/MM/yyyy HH:mm",
        )}</div>
        <div class="info"><span class="label">Endereço:</span> ${
          ingresso.Evento_endereco
        }</div>
        <div class="id">Identificação: ${ingresso.id}</div>
        <div class="qrcode"><img src="${
          ingresso.qrCodeBase64
        }" width="200" /></div>
      </div>
    `;

      html += `<hr />`;
    }

    html += `</body></html>`;

    setHtmlContent(html);

    // Imprimir iframe
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.focus();
        iframeRef.current.contentWindow?.print();
      }
    }, 500);

    // if (Platform.OS === "web") {
    //   const printWindow = window.open("", "_blank");
    //   if (printWindow) {
    //     printWindow.document.write(html);
    //     printWindow.document.close();
    //     printWindow.onload = () => {
    //       printWindow.print();

    //       // setTimeout(() => {
    //       //   printWindow.close();
    //       // }, 2000);
    //     };
    //   }
    // } else {
    //   await Print.printAsync({ html });
    // }
  };

  const validarIngressos = async () => {
    if (!registroTransacao || !registrosIngressoTransacao.length) return;

    setMsg("Ingressos validados com sucesso!");
    setVisibleMsg(true);
  };

  const zerarIngressos = async () => {
    state.items.map(async (ingresso) => {
      await dispatch({ type: "REMOVE_ITEM", id: ingresso.id });
    });
  };

  const handleAbrirConta = async () => {
    const idTransacao = Number(registroTransacao?.id ?? state.transacao?.id);
    if (!idTransacao || !user?.id) {
      console.log("[PDV abrirConta FE] abortado — sem idTransacao/user", {
        idTransacao,
        userId: user?.id,
      });
      return;
    }

    if (contaJangoPdvJaProcessada.current === idTransacao) {
      console.log("[PDV abrirConta FE] já processada nesta sessão", {
        idTransacao,
        motivo: "reexecução local",
      });
      return;
    }

    if (abrirContaPdvEmAndamento.current) {
      console.log("[PDV abrirConta FE] já em andamento — ignorando chamada paralela", {
        idTransacao,
      });
      return;
    }

    try {
      abrirContaPdvEmAndamento.current = true;
      console.log("[PDV abrirConta FE] início", {
        idTransacao,
        idPagamento: payment_uniqueid || null,
        idUsuarioPDV: user.id,
      });

      const response = await apiGeral.createResource("/pagamentopdv/abrirconta", {
        idTransacao,
        idUsuarioPDV: user.id,
      });

      if (response.success === false) {
        console.log("[PDV abrirConta FE] falha", {
          idTransacao,
          idPagamento: payment_uniqueid || null,
          message: response.message,
        });
        setMsg(response.message || "Erro ao abrir conta.");
        setVisibleMsg(true);
        return;
      }

      const payload = (response.data as any)?.data ?? response.data;
      contaJangoPdvJaProcessada.current = idTransacao;

      console.log("[PDV abrirConta FE] sucesso", {
        idTransacao,
        idPagamento: payload?.idPagamento ?? payment_uniqueid ?? null,
        reutilizada: payload?.reutilizada,
        idVendaJango: payload?.idVendaJango,
        message: payload?.message,
        motivo: payload?.reutilizada ? "conta reutilizada / reexecução" : "conta criada",
      });

      setMsg(
        payload?.message ||
          "Conta aberta e ingressos utilizados com sucesso!",
      );
      setVisibleMsg(true);
    } catch (error) {
      console.log("[PDV abrirConta FE] erro", error);
      setMsg("Erro ao abrir conta.");
      setVisibleMsg(true);
    } finally {
      abrirContaPdvEmAndamento.current = false;
    }
  };

  // Redução com total == recebido: quita automaticamente no fluxo já existente (payment_status 4).
  useEffect(() => {
    const deveQuitar =
      !isHospedagem &&
      transacaoAtual?.status !== "Pago" &&
      transacaoAtual?.status !== "Cancelado" &&
      !consultaPagamento &&
      !sincronizandoQuantidade &&
      temReducaoPendente &&
      saldoPendenteCentavos === 0;

    if (!deveQuitar) return;

    let cancelado = false;

    (async () => {
      const resultado = await sincronizarQuantidadesAntesPagamento();
      if (cancelado || !resultado.ok) return;

      let transacaoA = resultado.transacao ?? null;
      if (!transacaoA || transacaoA.status !== "Pago") {
        transacaoA = await getTransacao();
      }
      if (cancelado) return;

      if (transacaoA?.status === "Pago" || resultado.vendaQuitada) {
        setDadosDePagamento({
          payment_uniqueid: 0,
          payment_status: 4,
          payment_message: "Pagamento realizado em Dinheiro",
          created_at: new Date().toISOString(),
        });
        setConsultaPagamento(false);
        setMetodoSelecionado(null);

        if ((transacaoA?.valorRecebido ?? 0) >= (transacaoA?.valorTotal ?? 0)) {
          if (registroTransacao?.idEvento === 4) {
            for (const item of registrosIngressoTransacao) {
              const ingresso = await getIngresso(item.idIngresso);
              if (ingresso?.status === "Cancelado") continue;
              await apiGeral.createResource("/validadorqrcode", {
                ingresso: ingresso.id,
              });
            }
          }
          if (registroTransacao?.idEvento === 1) {
            await handleAbrirConta();
          }
        }
      }
    })();

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    saldoPendenteCentavos,
    temReducaoPendente,
    isHospedagem,
    transacaoAtual?.status,
    consultaPagamento,
  ]);

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.areaStep}>
          {isHospedagem ? (
            <StepIndicatorHospedagem currentStep={3} />
          ) : (
            <StepIndicator currentStep={3} />
          )}
        </View>
        <Text style={styles.titulo}>Pagamento PDV</Text>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSave,
            { alignSelf: "center", marginTop: 16 },
          ]}
          onPress={async () => {
            if (consultaPagamento) {
              setMsg("Aguarde o término do pagamento atual.");
              setVisibleMsg(true);
              return;
            }
            await zerarIngressos();
            dispatch({ type: "REMOVE_TRANSACAO" });
            navigation.navigate("ingressos", {
              id: registroTransacao.idEvento,
            });
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Nova Venda</Text>
        </TouchableOpacity>

        <FlatList
          data={ingressosAgrupados}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.areaEvento}>
                <Image
                  source={{
                    uri: api.getBaseApi() + "/uploads/" + formData.imagem,
                  }}
                  style={styles.imagem}
                />
                <View style={styles.areaTextoEvento}>
                  <Text style={styles.tituloEvento}>{formData.nome}</Text>
                  {/* <Text style={styles.enderecoEvento}>{formData.endereco}</Text> */}
                </View>
              </View>

              <View style={styles.areaResumo}>
                <Text style={styles.titulo}>Resumo</Text>
                {isHospedagem && resumoHospedagem ? (
                  <ResumoPagamentoHospedagem
                    resumo={resumoHospedagem}
                    footerExtra={
                      <Text
                        style={{
                          fontSize: 18,
                          color: colors.greenEscuro,
                          fontWeight: "bold",
                          marginTop: 6,
                        }}
                      >
                        Valor Recebido:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {formatCurrency(transacaoAtual?.valorRecebido ?? 0)}
                        </Text>
                      </Text>
                    }
                  />
                ) : (
                  <>
                    <View>
                      <FlatList<IngressoAgrupado>
                        data={ingressosAgrupados}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                          const qtdeExibida = getQtdeExibida(item);
                          return (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 3,
                              marginHorizontal: 5,
                            }}
                          >
                            <View
                              style={{
                                flex: 1,
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  flexShrink: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <QuantidadeAjustePdv
                                  quantidade={qtdeExibida}
                                  disabled={!podeAjustarQuantidade}
                                  onReduzir={() => reduzirQuantidadeGrupo(item)}
                                />
                                <Text
                                  style={{ paddingHorizontal: 3, fontSize: 14 }}
                                >
                                  {
                                    item.Ingresso_EventoIngresso?.TipoIngresso
                                      ?.descricao
                                  }
                                </Text>
                                <Text
                                  style={{ paddingHorizontal: 3, fontSize: 14 }}
                                >
                                  {item.Ingresso_EventoIngresso?.nome}
                                </Text>
                                {item.precoDesconto ? (
                                  <Text
                                    style={{
                                      paddingHorizontal: 3,
                                      fontSize: 14,
                                      color: colors.greenEscuro,
                                    }}
                                  >
                                    Desconto:{" "}
                                    {formatCurrency(
                                      (
                                        item.precoDesconto * qtdeExibida
                                      ).toFixed(2),
                                    )}
                                  </Text>
                                ) : null}
                              </View>
                              <View>
                                <Text
                                  style={{ paddingHorizontal: 3, fontSize: 14 }}
                                >
                                  {formatCurrency(
                                    (item.preco * qtdeExibida).toFixed(2),
                                  )}
                                </Text>
                              </View>
                            </View>
                          </View>
                          );
                        }}
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-end",
                        paddingRight: 8,
                      }}
                    >
                      <Text style={{ fontSize: 16, paddingBottom: 3 }}>
                        Total Ingressos:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {formatCurrency(totaisPdv.preco)}
                        </Text>
                      </Text>
                      <Text style={{ fontSize: 16, paddingBottom: 3 }}>
                        Total Taxa:{" "}
                        {totaisPdv.taxaServicoDesconto > 0 && (
                            <Text
                              style={{
                                color: colors.greenEscuro,
                                paddingHorizontal: 5,
                              }}
                            >
                              Desconto:{" "}
                              {formatCurrency(totaisPdv.taxaServicoDesconto)}
                            </Text>
                          )}
                        <Text style={{ fontWeight: "bold" }}>
                          {formatCurrency(totaisPdv.taxaServico)}
                        </Text>
                      </Text>
                      <Text style={{ fontSize: 16 }}>
                        Total incluindo taxas:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {formatCurrency(totaisPdv.valorTotal)}
                        </Text>
                      </Text>
                      <Text
                        style={{
                          fontSize: 18,
                          color: colors.greenEscuro,
                          fontWeight: "bold",
                        }}
                      >
                        Valor Recebido:{" "}
                        <Text style={{ fontWeight: "bold" }}>
                          {formatCurrency(transacaoAtual?.valorRecebido ?? 0)}
                        </Text>
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}
          renderItem={({ item: data }) => (
            // <Text>{data.Ingresso_EventoIngresso?.nome}</Text>
            <View>
              {/* <Text>{data.Ingresso_EventoIngresso?.nome}</Text> */}
            </View>
          )}
          ListFooterComponent={() => (
            <>
              <Text style={styles.sectionTitle}>
                Escolha o método de pagamento
              </Text>

              <View style={styles.paymentMethodsContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "crédito" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("crédito")}
                >
                  <Feather name="credit-card" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Crédito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "débito" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("débito")}
                >
                  <Feather name="credit-card" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Débito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "pix" && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("pix")}
                >
                  <Feather name="hash" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>PIX</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "Dinheiro" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("Dinheiro")}
                >
                  <Feather name="check" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Dinheiro</Text>
                </TouchableOpacity>
              </View>

              {consultaPagamento && (
                <View style={styles.confirmContainer}>
                  <Text style={styles.confirmButtonText}>
                    Aguarde enviando dados do pagamento...
                  </Text>
                </View>
              )}

              {consultaPagamento && (
                <ActivityIndicator
                  size="large"
                  color={colors.azul}
                  style={{ marginTop: 20 }}
                />
              )}

              {/* {dadosDePagamento.payment_status === 4 && idEvento >= 1 && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonSave,
                    { alignSelf: "center", marginTop: 16 },
                  ]}
                  onPress={() => validarIngressos()}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Validar Ingressos
                  </Text>
                </TouchableOpacity>
              )} */}

              {metodoSelecionado &&
                // dadosDePagamento?.payment_status != 4 &&
                transacaoAtual.status != "Pago" && (
                  <View style={styles.confirmContainer}>
                    <TouchableOpacity
                      style={[
                        styles.confirmButton,
                        {
                          backgroundColor: consultaPagamento
                            ? colors.red
                            : colors.azul,
                        },
                      ]}
                      onPress={() => {
                        if (!consultaPagamento) {
                          setDadosDePagamento({});
                          setValorEditavel(
                            valorParaDigitosCentavos(
                              Math.max(
                                0,
                                totaisPdv.valorTotal -
                                  (transacaoAtual?.valorRecebido ?? 0),
                              ),
                            ),
                          );
                          setModalConfirmVisible(true);
                        } else {
                          CancelaPagamentoPos();
                        }
                      }}
                    >
                      <Text style={styles.confirmButtonText}>
                        {consultaPagamento
                          ? "Cancelar Pagamento"
                          : "Confirmar " + metodoSelecionado}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {dadosDePagamento.payment_status && (
                <StatusPaymentCustomizadoPOS
                  data={dadosDePagamento}
                  idUsuario={registroTransacao?.idUsuario}
                />
              )}

              {dadosDePagamento.payment_status === 4 && idEvento >= 1 && (
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonSave,
                    { alignSelf: "center", marginTop: 16 },
                  ]}
                  onPress={() => handlePrintIngressos()}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    Imprimir Ingresso
                  </Text>
                </TouchableOpacity>
              )}

              {Platform.OS === "web" && htmlContent ? (
                <div
                  style={{
                    width: "100%",
                    minHeight: 500, // altura mínima
                    border: "none",
                    marginTop: 20,
                    position: "relative",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Ingressos"
                    srcDoc={htmlContent}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                    onLoad={() => {
                      if (iframeRef.current) {
                        const doc =
                          iframeRef.current.contentDocument ||
                          iframeRef.current.contentWindow?.document;
                        if (doc) {
                          // pega a altura total do body interno
                          const body = doc.body;
                          const html = doc.documentElement;
                          const height = Math.max(
                            body.scrollHeight,
                            body.offsetHeight,
                            html.clientHeight,
                            html.scrollHeight,
                            html.offsetHeight,
                          );
                          iframeRef.current.style.height = height + "px";
                        }
                      }
                    }}
                  />
                </div>
              ) : null}
            </>
          )}
        />
        <Modal visible={visibleMsg} transparent animationType="fade">
          <ModalMsg msg={msg} onClose={() => setVisibleMsg(false)} />
        </Modal>

        <Modal visible={modalConfirmVisible} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 12,
                width: "85%",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
              >
                Confirmar pagamento
              </Text>

              {/* <Text style={{ marginBottom: 5 }}>Valor:</Text> */}
              {/* 
              <TextInput
                value={valorEditavel.toString()}
                onChangeText={(text) => {
                  const numeric = text.replace(",", ".");
                  setValorEditavel(String(numeric));
                }}
                keyboardType="numeric"
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 18,
                  marginBottom: 15,
                }}
              /> */}

              <View style={{ marginBottom: 15 }}>
                <Text style={styles.label}>Valor</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      marginBottom: msgErroValorPagamento ? 6 : 0,
                    },
                    valorExcedeSaldo && { borderColor: colors.red },
                  ]}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: R$ 60,00"
                  keyboardType="numeric"
                  value={digitosParaExibicaoMoeda(valorEditavel)}
                  onChangeText={(text) => {
                    const digitos = text.replace(/\D/g, "");
                    setValorEditavel(digitos);
                  }}
                ></TextInput>
                {msgErroValorPagamento ? (
                  <Text style={styles.erroValorModal}>
                    {msgErroValorPagamento}
                  </Text>
                ) : null}
              </View>

              <Text style={{ marginBottom: 15 }}>
                Método:{" "}
                <Text style={{ fontWeight: "bold" }}>{metodoSelecionado}</Text>
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ccc",
                    padding: 12,
                    borderRadius: 8,
                    flex: 1,
                    marginRight: 5,
                  }}
                  onPress={() => setModalConfirmVisible(false)}
                  disabled={sincronizandoQuantidade}
                >
                  <Text style={{ textAlign: "center" }}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: colors.azul,
                    padding: 12,
                    borderRadius: 8,
                    flex: 1,
                    marginLeft: 5,
                    opacity:
                      sincronizandoQuantidade || valorPagamentoInvalido
                        ? 0.5
                        : 1,
                  }}
                  disabled={sincronizandoQuantidade || valorPagamentoInvalido}
                  onPress={async () => {
                    const valorConfirmado =
                      digitosCentavosParaNumero(valorEditavel);
                    const valorConfirmadoCentavos = Math.round(
                      valorConfirmado * 100,
                    );

                    if (!valorEditavel || valorConfirmadoCentavos <= 0) {
                      setMsg("Informe um valor maior que R$ 0,00.");
                      setVisibleMsg(true);
                      return;
                    }

                    if (valorConfirmadoCentavos > saldoPendenteCentavos) {
                      setMsg(
                        `O valor informado não pode ser maior que o saldo restante (${digitosParaExibicaoMoeda(String(saldoPendenteCentavos))}).`,
                      );
                      setVisibleMsg(true);
                      return;
                    }

                    const sincronizado =
                      await sincronizarQuantidadesAntesPagamento();
                    if (!sincronizado.ok) {
                      return;
                    }

                    if (
                      sincronizado.vendaQuitada ||
                      sincronizado.transacao?.status === "Pago"
                    ) {
                      setModalConfirmVisible(false);
                      setDadosDePagamento({
                        payment_uniqueid: 0,
                        payment_status: 4,
                        payment_message:
                          "Venda quitada após ajuste de quantidade",
                        created_at: new Date().toISOString(),
                      });
                      setConsultaPagamento(false);
                      setMetodoSelecionado(null);
                      return;
                    }

                    setModalConfirmVisible(false);

                    if (metodoSelecionado === "Dinheiro") {
                      await fetchPagamentoDinheiro();
                    } else {
                      await fetchPagamentoPos();
                    }
                  }}
                >
                  <Text style={{ color: "#fff", textAlign: "center" }}>
                    {sincronizandoQuantidade ? "Atualizando..." : "Confirmar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      {/* {modalVisible && <ModalResumoIngresso step={2} />} */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    // marginBottom: 20,
    // height: 500,
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
  areaTitulo: {
    fontSize: 22,
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
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
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  erroValorModal: {
    color: colors.red,
    fontSize: 13,
    marginTop: 0,
    marginBottom: 0,
    flexWrap: "wrap",
  },
  eventDetails: {
    flexWrap: "wrap",
    width: Platform.OS === "web" ? width - 432 : -32,
  },
  eventDetailItem: {
    flexDirection: "column",
    paddingRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    paddingLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
  },
  imagem: {
    // width: "100%",
    borderRadius: 20,
    height: 110,
    width: 180,
    resizeMode: "cover",
  },
  areaEvento: {
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
  },
  areaStep: {
    justifyContent: "center",
    alignItems: "center",
  },
  areaResumo: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    borderRadius: 20,
    flex: 1,
  },
  ticketContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.branco,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 5,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputCard: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  paymentMethodButton: {
    alignItems: "center",
    backgroundColor: "#999",
    padding: 15,
    borderRadius: 12,
    width: 100,
    // gap: 10,
    marginBottom: 10,
  },
  paymentMethodSelected: {
    backgroundColor: colors.azul,
  },
  paymentMethodText: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: colors.azul,
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
});
