import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import {
  DiaCalendarioSuites,
  FiltroSuiteOperacional,
  getSuitesOperacionais,
  IndicadoresDiaCalendario,
  MetaCalendarioSuites,
  SuiteOperacionalCard,
  ReservaAdminDetalhe,
} from "@/src/lib/hospedagemAdmin";
import { dotsIndicadoresCalendario } from "@/src/constants/hospedagemStatusColors";
import ReservaOperacaoSheet from "../components/ReservaOperacaoSheet";
import {
  BadgeHospedeChegou,
  PainelHospedeChegou,
} from "../components/HospedeChegouDestaque";
import PainelStatusLimpezaSuite from "../components/PainelStatusLimpezaSuite";
import ResumoFinanceiroRecepcao from "../components/ResumoFinanceiroRecepcao";
import OrigemReservaIndicador, {
  labelChipOrigemReserva,
} from "../components/OrigemReservaIndicador";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import {
  badgeStatusOperacional,
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  isAguardandoAcomodacaoCard,
} from "@/src/lib/hospedagemStatusOperacional";
import { ReservaOperacaoRef } from "@/src/lib/hospedagemOperacao";
import { obterSaldoPendenteExibicao } from "@/src/lib/hospedagemPagamentoRecepcao";
import { useReceberSaldoHospedagem } from "../contexts/ReceberSaldoHospedagemContext";
import { useHospedagemDesktopLayout } from "../useHospedagemDesktopLayout";

const TZ = "America/Cuiaba";

function textoAtualizadoHa(lastRefreshAt: number, agora: number): string {
  const seg = Math.max(0, Math.floor((agora - lastRefreshAt) / 1000));
  if (seg < 5) return "Atualizado agora";
  if (seg < 60) return `Atualizado há ${seg} s`;
  const min = Math.floor(seg / 60);
  if (min < 60) return `Atualizado há ${min} min`;
  const h = Math.floor(min / 60);
  return `Atualizado há ${h} h`;
}

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

const FILTROS: Array<{ key: FiltroSuiteOperacional; label: string }> = [
  { key: "todas", label: "Todas" },
  { key: "livres", label: "Livres" },
  { key: "ocupadas", label: "Hospedadas" },
  { key: "checkin_hoje", label: "Check-in" },
  { key: "checkout_hoje", label: "Check-out" },
  { key: "aguardando_pagamento", label: "Aguardando pagamento" },
  { key: "manutencao", label: "Manutenção" },
  { key: "bloqueadas", label: "Bloqueadas" },
];

function hojeStrCuiaba(): string {
  return formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
}

function mesDeData(data: string): string {
  return data.slice(0, 7);
}

function labelMesAno(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${MESES_PT[(m || 1) - 1]}/${y}`;
}

function addMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, (m || 1) - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function diasDoMes(mes: string): string[] {
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const dia = String(i + 1).padStart(2, "0");
    return `${mes}-${dia}`;
  });
}

function dataNoMes(mes: string, dataAtual: string): string {
  const diaAtual = Number(dataAtual.slice(8, 10));
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(y, m, 0).getDate();
  const dia = Math.min(Math.max(diaAtual, 1), ultimo);
  return `${mes}-${String(dia).padStart(2, "0")}`;
}

function IndicadoresDots({
  indicadores,
}: {
  indicadores?: IndicadoresDiaCalendario | null;
}) {
  const dots = dotsIndicadoresCalendario(indicadores);

  return (
    <View style={styles.dotsRow}>
      {dots.map((d) => (
        <View key={d.key} style={[styles.dot, { backgroundColor: d.cor }]} />
      ))}
    </View>
  );
}

const CALENDARIO_SELECAO_BORDA = "#1976D2";

function DiaCalendarioChip({
  label,
  selecionado,
  indicadores,
  onPress,
  estiloExtra,
}: {
  label: string;
  selecionado: boolean;
  indicadores?: IndicadoresDiaCalendario | null;
  onPress: () => void;
  estiloExtra?: object;
}) {
  const labelNumerico = /^\d+$/.test(label);
  const anim = useRef(new Animated.Value(selecionado ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selecionado ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selecionado, anim]);

  const borderWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "#FFFFFF"],
  });

  return (
    <TouchableOpacity
      style={[styles.diaChip, estiloExtra]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Animated.View
        style={[
          styles.diaChipInner,
          {
            borderWidth,
            borderColor: CALENDARIO_SELECAO_BORDA,
            backgroundColor,
          },
        ]}
      >
        <Text
          style={[
            labelNumerico ? styles.diaNum : styles.diaHojeLabel,
            selecionado &&
              (labelNumerico
                ? styles.diaNumSelecionado
                : styles.diaHojeLabelSelecionado),
          ]}
        >
          {label}
        </Text>
        <IndicadoresDots indicadores={indicadores} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function CalendarioHorizontal({
  mesVisivel,
  dataSelecionada,
  hoje,
  calendario,
  onMesAnterior,
  onMesProximo,
  onSelecionarData,
}: {
  mesVisivel: string;
  dataSelecionada: string;
  hoje: string;
  calendario?: MetaCalendarioSuites | null;
  onMesAnterior: () => void;
  onMesProximo: () => void;
  onSelecionarData: (data: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const dias = useMemo(() => diasDoMes(mesVisivel), [mesVisivel]);
  const byData = useMemo(() => {
    const map = new Map<string, DiaCalendarioSuites>();
    for (const d of calendario?.dias ?? []) {
      map.set(d.data, d);
    }
    return map;
  }, [calendario]);

  const scrollParaSelecionado = useCallback(() => {
    // +1 pelo atalho "Hoje" no início da faixa
    const idx = dias.indexOf(dataSelecionada);
    if (idx < 0 || !scrollRef.current) return;
    const x = Math.max(0, (idx + 1) * 52 - 40);
    scrollRef.current.scrollTo({ x, animated: true });
  }, [dias, dataSelecionada]);

  React.useEffect(() => {
    const t = setTimeout(scrollParaSelecionado, 50);
    return () => clearTimeout(t);
  }, [mesVisivel, dataSelecionada, scrollParaSelecionado]);

  return (
    <View style={styles.calendarioWrap}>
      <View style={styles.mesNav}>
        <TouchableOpacity
          onPress={onMesAnterior}
          style={styles.mesNavBtn}
          accessibilityLabel="Mês anterior"
        >
          <Feather name="chevron-left" size={22} color={colors.cinza} />
        </TouchableOpacity>
        <Text style={styles.mesNavTitulo}>{labelMesAno(mesVisivel)}</Text>
        <TouchableOpacity
          onPress={onMesProximo}
          style={styles.mesNavBtn}
          accessibilityLabel="Próximo mês"
        >
          <Feather name="chevron-right" size={22} color={colors.cinza} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.diasScroll}
      >
        <DiaCalendarioChip
          label="Hoje"
          selecionado={dataSelecionada === hoje}
          indicadores={byData.get(hoje)?.indicadores}
          onPress={() => onSelecionarData(hoje)}
          estiloExtra={styles.diaChipHojeAtalho}
        />

        {dias.map((data) => {
          const selecionado = data === dataSelecionada;
          const diaNum = String(Number(data.slice(8, 10)));
          const indicadores = byData.get(data)?.indicadores;

          return (
            <DiaCalendarioChip
              key={data}
              label={diaNum}
              selecionado={selecionado}
              indicadores={indicadores}
              onPress={() => onSelecionarData(data)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function horaCheckinCurta(iso: string | null | undefined): string {
  if (!iso) return "--:--";
  try {
    return formatInTimeZone(new Date(iso), TZ, "HH:mm");
  } catch {
    return "--:--";
  }
}

function dataCheckinCurta(iso: string | null | undefined): string {
  if (!iso) return "--/--";
  try {
    return formatInTimeZone(new Date(iso), TZ, "dd/MM");
  } catch {
    return "--/--";
  }
}

/** Bloco clicável com seta (>) — mesmo padrão visual dos demais cards. */
function BlocoReservaClicavel({
  titulo,
  children,
  onPress,
}: {
  titulo: string;
  children: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.blocoReserva}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.blocoReservaRow}>
        <View style={styles.blocoReservaConteudo}>
          <Text style={styles.blocoTitulo}>{titulo}</Text>
          {children}
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}

function MetaLinha({
  icon,
  children,
  strong = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <View style={styles.metaLinha}>
      <Feather name={icon} size={13} color="#667085" style={styles.metaIcon} />
      <Text
        style={[styles.metaLinhaTexto, strong && styles.metaLinhaStrong]}
        numberOfLines={1}
      >
        {children}
      </Text>
    </View>
  );
}

const MSG_CHECKIN_AGUARDA_CHECKOUT =
  "É necessário realizar o check-out do hóspede atual antes de efetuar o check-in da próxima reserva.";

/** Apresentação no card: hóspede já hospedado no dia do checkout (badge CHECKOUT_HOJE da API). */
function clienteHospedadoNoCard(item: SuiteOperacionalCard): boolean {
  return (
    String(item.statusReserva || item.status || "").toUpperCase() ===
      "HOSPEDADA" || Boolean(item.dataHoraCheckinReal)
  );
}

function labelChipAcaoOperacional(params: {
  botao: SuiteOperacionalCard["botaoPrincipal"];
  statusReserva?: string | null;
  badge: string;
  statusExibicao: string;
  ehHoje: boolean;
  modoLivreAposCheckout: boolean;
}): { label: string; cor: string } | null {
  const {
    botao,
    statusReserva,
    badge,
    statusExibicao,
    ehHoje,
    modoLivreAposCheckout,
  } = params;
  const corSecundaria =
    statusExibicao === "HOSPEDADA"
      ? CORES_STATUS_OPERACIONAL.hospedada
      : CORES_STATUS_OPERACIONAL.aguardandoAcao;

  if (modoLivreAposCheckout || botao === "nova_reserva") {
    return { label: "Nova Reserva", cor: CORES_STATUS_OPERACIONAL.livre };
  }
  if (ehHoje && !modoLivreAposCheckout && botao === "checkin") {
    return {
      label: "Realizar Check-in",
      cor: CORES_STATUS_OPERACIONAL.livre,
    };
  }
  if (ehHoje && !modoLivreAposCheckout && botao === "checkout") {
    return {
      label: "Realizar Check-out",
      cor: corSecundaria,
    };
  }
  if (
    !modoLivreAposCheckout &&
    botao === "ver_reserva" &&
    ehHoje &&
    String(statusReserva || "").toUpperCase() === "CONFIRMADA" &&
    badge === "CHECKIN_HOJE"
  ) {
    return {
      label: "Registrar Chegada",
      cor: CORES_STATUS_OPERACIONAL.livre,
    };
  }
  if (!modoLivreAposCheckout && botao === "ver_reserva") {
    return {
      label: "Ver Reserva",
      cor: corSecundaria,
    };
  }
  return null;
}

function labelAcaoProximaReserva(
  proxima: NonNullable<SuiteOperacionalCard["proximaReservaResumo"]>,
  ehHoje: boolean,
): string {
  if (ehHoje && proxima.podeCheckin) {
    return "Realizar Check-in";
  }
  const status = String(proxima.status || "").toUpperCase();
  if (ehHoje && status === "CONFIRMADA" && !proxima.podeCheckin) {
    return "Registrar Chegada";
  }
  return "Ver Reserva";
}

/** Checkout A + Check-in B no mesmo dia — blocos independentes por reservaId. */
function CardSuiteDuplaReserva({
  item,
  onAbrirReserva,
  compact = false,
  dataSelecionada,
  hoje,
}: {
  item: SuiteOperacionalCard;
  onAbrirReserva: (ref: ReservaOperacaoRef) => void;
  compact?: boolean;
  dataSelecionada: string;
  hoje: string;
}) {
  const proxima = item.proximaReservaResumo!;
  const chip = labelChipOrigemReserva({
    origemReserva: proxima.origemReserva,
    idUsuarioCriacao: proxima.idUsuarioCriacao,
    nomeUsuarioCriacao: proxima.nomeUsuarioCriacao,
  });

  const atualHospedado =
    String(item.statusReserva || "").toUpperCase() === "HOSPEDADA" ||
    Boolean(item.dataHoraCheckinReal);

  const cor = corStatusOperacionalPadrao(
    atualHospedado ? "HOSPEDADA" : "CHECKOUT_HOJE",
  );
  const badgeTexto = atualHospedado
    ? "HOSPEDADO"
    : (
        item.badgeLabel || badgeStatusOperacional("CHECKOUT_HOJE")
      ).toUpperCase();

  const abrirAtual = () => {
    if (!item.idReservaHospedagem) return;
    onAbrirReserva({
      idReservaHospedagem: item.idReservaHospedagem,
      suiteNome: item.nome,
      inicio: item.checkin,
      fim: item.checkout,
      status: item.status,
      statusReserva: item.statusReserva ?? item.status,
      dataHoraCheckinReal: item.dataHoraCheckinReal,
      responsavel: item.responsavel,
      adultos: item.adultos,
      criancas: item.criancas,
      valorTotal: item.valorHospedagem,
      valorPago: item.valorPago,
      saldoPendente: item.saldoPendente,
      idEvento: item.idEvento,
      idEventoSuite: item.idEventoSuite,
    });
  };

  const abrirProxima = () => {
    onAbrirReserva({
      idReservaHospedagem: proxima.id,
      suiteNome: item.nome,
      inicio: proxima.checkin,
      fim: proxima.checkout ?? null,
      status: proxima.status ?? "Confirmada",
      statusReserva: proxima.status ?? "Confirmada",
      responsavel: proxima.responsavel,
      idEvento: item.idEvento,
      idEventoSuite: item.idEventoSuite,
    });
  };

  const onPressCheckinProxima = () => {
    if (atualHospedado) {
      Alert.alert("Check-in bloqueado", MSG_CHECKIN_AGUARDA_CHECKOUT);
      return;
    }
    abrirProxima();
  };

  const ehHoje = dataSelecionada === hoje;
  const labelProximaAcao = labelAcaoProximaReserva(proxima, ehHoje);

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderLeftColor: cor },
      ]}
    >
      <View style={styles.cardBodyFill}>
        <View style={styles.cardHeadRow}>
          <Text
            style={[styles.suiteNome, compact && styles.suiteNomeCompact]}
            numberOfLines={1}
          >
            <Text style={{ color: cor }}>● </Text>
            {item.nome}
          </Text>
          <View
            style={[styles.badge, styles.badgeCompact, { backgroundColor: cor }]}
          >
            <Text style={styles.badgeTexto}>{badgeTexto}</Text>
          </View>
        </View>

        <BlocoReservaClicavel
          titulo={atualHospedado ? "Hospedado" : "Checkout hoje"}
          onPress={abrirAtual}
        >
          <MetaLinha icon="user" strong>
            {item.responsavel?.trim() || "Hóspede"}
          </MetaLinha>
          <MetaLinha icon="log-out">
            Sai às {horaCheckinCurta(item.checkout)}
          </MetaLinha>
        </BlocoReservaClicavel>
        {atualHospedado ? (
          <TouchableOpacity
            onPress={abrirAtual}
            activeOpacity={0.85}
            style={styles.novaReservaBtnAlign}
          >
            <View
              style={[
                styles.reservarChip,
                styles.reservarChipCompact,
                styles.reservarChipCentered,
                { backgroundColor: CORES_STATUS_OPERACIONAL.hospedada },
              ]}
            >
              <Text style={styles.reservarTexto}>Realizar Check-out</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.blocoSeparador} />

        <BlocoReservaClicavel titulo="Próxima reserva" onPress={abrirProxima}>
          <MetaLinha icon="user" strong>
            {proxima.responsavel?.trim() || "Hóspede"}
          </MetaLinha>
          <MetaLinha icon="clock">
            Check-in às {horaCheckinCurta(proxima.checkin)}
          </MetaLinha>
          {chip ? (
            <Text style={styles.blocoOrigem} numberOfLines={1}>
              {chip.texto}
            </Text>
          ) : null}
        </BlocoReservaClicavel>
        <TouchableOpacity
          onPress={onPressCheckinProxima}
          activeOpacity={0.85}
          style={styles.novaReservaBtnAlign}
        >
          <View
            style={[
              styles.reservarChip,
              styles.reservarChipCompact,
              styles.reservarChipCentered,
              { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
            ]}
          >
            <Text style={styles.reservarTexto}>{labelProximaAcao}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Checkout hoje + vaga para nova reserva — mesmo layout de Checkout + Próxima reserva. */
function CardSuiteCheckoutComNovaReserva({
  item,
  onAbrirReserva,
  onNovaReserva,
  compact = false,
}: {
  item: SuiteOperacionalCard;
  onAbrirReserva: (ref: ReservaOperacaoRef) => void;
  onNovaReserva: () => void;
  compact?: boolean;
}) {
  const cor = corStatusOperacionalPadrao("CHECKOUT_HOJE");
  const badgeTexto = (
    item.badgeLabel || badgeStatusOperacional("CHECKOUT_HOJE")
  ).toUpperCase();

  return (
    <View
      style={[
        styles.card,
        compact && styles.cardCompact,
        { borderLeftColor: cor },
      ]}
    >
      <View style={styles.cardBodyFill}>
        <View style={styles.cardHeadRow}>
          <Text
            style={[styles.suiteNome, compact && styles.suiteNomeCompact]}
            numberOfLines={1}
          >
            <Text style={{ color: cor }}>● </Text>
            {item.nome}
          </Text>
          <View
            style={[styles.badge, styles.badgeCompact, { backgroundColor: cor }]}
          >
            <Text style={styles.badgeTexto}>{badgeTexto}</Text>
          </View>
        </View>

        <BlocoReservaClicavel
          titulo="Checkout hoje"
          onPress={() => {
            if (!item.idReservaHospedagem) return;
            onAbrirReserva({
              idReservaHospedagem: item.idReservaHospedagem,
              suiteNome: item.nome,
              inicio: item.checkin,
              fim: item.checkout,
              status: item.status,
              statusReserva: item.statusReserva ?? item.status,
              dataHoraCheckinReal: item.dataHoraCheckinReal,
              responsavel: item.responsavel,
              adultos: item.adultos,
              criancas: item.criancas,
              valorTotal: item.valorHospedagem,
              valorPago: item.valorPago,
              saldoPendente: item.saldoPendente,
              idEvento: item.idEvento,
              idEventoSuite: item.idEventoSuite,
            });
          }}
        >
          <MetaLinha icon="user" strong>
            {item.responsavel?.trim() || "Hóspede"}
          </MetaLinha>
          <MetaLinha icon="log-out">
            Sai às {horaCheckinCurta(item.checkout)}
          </MetaLinha>
        </BlocoReservaClicavel>

        <View style={styles.blocoSeparador} />

        <View style={styles.blocoReserva}>
          <View style={styles.blocoReservaRow}>
            <View style={styles.blocoReservaConteudo}>
              <Text style={styles.blocoTitulo}>
                Disponível para nova reserva hoje
              </Text>
              <TouchableOpacity
                onPress={onNovaReserva}
                activeOpacity={0.85}
                style={styles.novaReservaBtnAlign}
              >
                <View
                  style={[
                    styles.reservarChip,
                    styles.reservarChipCompact,
                    styles.reservarChipCentered,
                    { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                  ]}
                >
                  <Text style={styles.reservarTexto}>Nova Reserva</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function CardSuite({
  item,
  onPress,
  onAbrirReserva,
  onNovaReserva,
  filtroAtivo,
  dataSelecionada,
  hoje,
  compact = false,
  desktopLayout = false,
  horarioChegadaPorReserva = {},
}: {
  item: SuiteOperacionalCard;
  onPress: () => void;
  onAbrirReserva: (ref: ReservaOperacaoRef) => void;
  onNovaReserva: () => void;
  filtroAtivo: FiltroSuiteOperacional;
  dataSelecionada: string;
  hoje: string;
  compact?: boolean;
  desktopLayout?: boolean;
  horarioChegadaPorReserva?: Record<number, string>;
}) {
  const { openReceberSaldo } = useReceberSaldoHospedagem();

  const ehHoje = dataSelecionada === hoje;
  const badgeApi = (item.badge || "").toUpperCase();
  const modoLivreAposCheckout =
    filtroAtivo === "livres" &&
    item.disponivelHojeAposCheckout === true &&
    item.acoesDisponiveis?.reservar === true;

  const statusExibicao = (
    modoLivreAposCheckout ? "LIVRE" : badgeApi || item.status || "LIVRE"
  ) as string;

  const isCheckoutHoje =
    badgeApi === "CHECKOUT_HOJE" ||
    item.checkoutHoje === true ||
    item.status === "CheckOutHoje" ||
    statusExibicao === "CHECKOUT_HOJE";

  const clienteHospedado = clienteHospedadoNoCard(item);
  const azaleiaHospedadaCheckoutHoje =
    clienteHospedado && isCheckoutHoje;

  const modoDupla =
    Boolean(item.modoDuplaReserva) &&
    Boolean(item.proximaReservaResumo?.id) &&
    Boolean(item.idReservaHospedagem) &&
    item.proximaReservaResumo!.id !== item.idReservaHospedagem &&
    isCheckoutHoje;

  if (modoDupla) {
    return (
      <CardSuiteDuplaReserva
        item={item}
        onAbrirReserva={onAbrirReserva}
        compact={compact}
        dataSelecionada={dataSelecionada}
        hoje={hoje}
      />
    );
  }

  /** CHECKOUT HOJE sem outra entrada no mesmo dia → layout Checkout + Nova Reserva. */
  const modoCheckoutComNovaReserva =
    isCheckoutHoje &&
    Boolean(item.idReservaHospedagem) &&
    dataSelecionada >= hoje &&
    item.bloqueadaPorCheckinNaData !== true &&
    !azaleiaHospedadaCheckoutHoje;

  if (modoCheckoutComNovaReserva) {
    return (
      <CardSuiteCheckoutComNovaReserva
        item={item}
        onAbrirReserva={onAbrirReserva}
        onNovaReserva={onNovaReserva}
        compact={compact}
      />
    );
  }

  const aguardandoAcomodacao = isAguardandoAcomodacaoCard({
    statusReserva: item.statusReserva ?? item.status,
    dataHoraCheckinReal: item.dataHoraCheckinReal,
    botaoPrincipal: item.botaoPrincipal,
    podeCheckin: item.acoesDisponiveis?.checkin,
  });

  const statusVisual = azaleiaHospedadaCheckoutHoje
    ? "HOSPEDADA"
    : statusExibicao;

  const cor = corStatusOperacionalPadrao(statusVisual);
  const dataHoraChegadaReal =
    item.idReservaHospedagem != null
      ? horarioChegadaPorReserva[item.idReservaHospedagem]
      : undefined;
  const badgeTexto = aguardandoAcomodacao
    ? "HÓSPEDE CHEGOU"
    : azaleiaHospedadaCheckoutHoje
      ? "HOSPEDADO"
      : modoLivreAposCheckout
        ? "LIVRE"
        : (item.badgeLabel || badgeStatusOperacional(statusExibicao)).toUpperCase();

  const botao = item.botaoPrincipal;
  const chipAcao = labelChipAcaoOperacional({
    botao,
    statusReserva: item.statusReserva ?? item.status,
    badge: statusExibicao,
    statusExibicao,
    ehHoje,
    modoLivreAposCheckout,
  });

  const livre =
    statusExibicao === "LIVRE" || statusExibicao === "Livre";
  const proxima = item.proximaReservaResumo;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.cardCompact,
        desktopLayout && styles.cardDesktopPin,
        { borderLeftColor: cor },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.cardBodyFill,
          desktopLayout && styles.cardBodyFillDesktop,
        ]}
      >
        <View style={styles.cardHeadRow}>
          <Text
            style={[styles.suiteNome, compact && styles.suiteNomeCompact]}
            numberOfLines={1}
          >
            <Text style={{ color: cor }}>● </Text>
            {item.nome}
          </Text>
          {aguardandoAcomodacao ? (
            <BadgeHospedeChegou compact={compact} />
          ) : (
            <View
              style={[
                styles.badge,
                compact && styles.badgeCompact,
                { backgroundColor: cor },
              ]}
            >
              <Text style={styles.badgeTexto} numberOfLines={1}>
                {badgeTexto}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.cardContent,
            desktopLayout && styles.cardContentDesktop,
          ]}
        >          {livre ? (
            <>
              <Text style={styles.livreTituloCompact} numberOfLines={2}>
                {item.mensagemDisponibilidade || "Disponível para reserva"}
              </Text>
              {item.mensagemDisponibilidadeSecundaria ? (
                <Text style={styles.metaSecundario} numberOfLines={1}>
                  {item.mensagemDisponibilidadeSecundaria}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {item.responsavel ? (
                <MetaLinha icon="user" strong>
                  {item.responsavel}
                </MetaLinha>
              ) : null}
              <OrigemReservaIndicador dados={item} variante="card" />
              {aguardandoAcomodacao ? (
                <>
                  <PainelHospedeChegou
                    dataHoraChegadaReal={dataHoraChegadaReal}
                    compact={compact}
                  />
                  {item.statusLimpezaSuite ? (
                    <PainelStatusLimpezaSuite
                      status={item.statusLimpezaSuite}
                      compact={compact}
                    />
                  ) : null}
                </>
              ) : statusExibicao === "CHECKIN_HOJE" && item.checkin ? (
                <MetaLinha icon="log-in">
                  Entra às {horaCheckinCurta(item.checkin)}
                </MetaLinha>
              ) : null}
              {statusExibicao === "CHECKOUT_HOJE" && item.checkout ? (
                <MetaLinha icon="log-out">
                  Sai às {horaCheckinCurta(item.checkout)}
                </MetaLinha>
              ) : null}
              {azaleiaHospedadaCheckoutHoje ? (
                <>
                  <View style={styles.blocoSeparador} />
                  <Text style={styles.blocoTitulo}>
                    {(
                      item.mensagemDisponibilidadeSecundaria ||
                      "Disponível após o check-out"
                    ).toUpperCase()}
                  </Text>
                </>
              ) : null}
              {(statusExibicao === "HOSPEDADA" ||
                statusExibicao === "RESERVADA") &&
              (item.checkin || item.checkout) ? (
                <MetaLinha icon="calendar">
                  {[
                    item.checkin ? dataCheckinCurta(item.checkin) : null,
                    item.checkout ? dataCheckinCurta(item.checkout) : null,
                  ]
                    .filter(Boolean)
                    .join(" → ")}
                </MetaLinha>
              ) : null}
              {item.mensagemDisponibilidade &&
              statusExibicao !== "CHECKOUT_HOJE" &&
              statusExibicao !== "CHECKIN_HOJE" &&
              !aguardandoAcomodacao ? (
                <Text style={styles.metaSecundario} numberOfLines={1}>
                  {item.mensagemDisponibilidade}
                </Text>
              ) : null}
              {statusExibicao === "CHECKOUT_HOJE" &&
              (proxima?.responsavel || proxima?.checkin) ? (
                <>
                  <Text style={styles.proximaLabel}>Próxima</Text>
                  {proxima.responsavel ? (
                    <MetaLinha icon="calendar">{proxima.responsavel}</MetaLinha>
                  ) : null}
                  {proxima.checkin ? (
                    <MetaLinha icon="clock">
                      {horaCheckinCurta(proxima.checkin)}
                    </MetaLinha>
                  ) : null}
                </>
              ) : null}
              {!compact ? (
                <ResumoFinanceiroRecepcao
                  dados={{
                    ...item,
                    valorTotal: item.valorHospedagem ?? item.valorTotal,
                  }}
                  compact
                  mostrarReceberSaldo={statusExibicao === "CHECKIN_HOJE"}
                  onReceberSaldo={
                    statusExibicao === "CHECKIN_HOJE"
                      ? () => {
                          if (!item.idReservaHospedagem) return;
                          const dados = {
                            ...item,
                            valorTotal: item.valorHospedagem ?? item.valorTotal,
                          };
                          openReceberSaldo({
                            idReservaHospedagem: item.idReservaHospedagem,
                            saldoPendente: obterSaldoPendenteExibicao(dados),
                            valorTotal: dados.valorTotal,
                            valorPago: item.valorPago,
                            suiteNome: item.nome,
                            responsavel: item.responsavel,
                          });
                        }
                      : undefined
                  }
                />
              ) : null}
            </>
          )}
        </View>

        {chipAcao ? (
          <View
            style={
              desktopLayout ? styles.cardAcaoFooterDesktop : undefined
            }
          >
            <View
              style={[
                styles.reservarChip,
                styles.reservarChipCompact,
                (desktopLayout || chipAcao.label === "Nova Reserva") &&
                  styles.reservarChipCentered,
                { backgroundColor: chipAcao.cor },
              ]}
            >
              <Text style={styles.reservarTexto}>{chipAcao.label}</Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.chipSpacer,
              desktopLayout && styles.chipSpacerDesktop,
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TabSuites() {
  const navigation = useNavigation() as any;
  const { openNovaReserva } = useNovaReservaRecepcao();
  const { suiteColumns } = useHospedagemDesktopLayout();
  const cardsCompactos = suiteColumns > 1;
  /** Desktop (≥3 cols / ≥1200px): botões fixos na base do card. */
  const desktopLayout = suiteColumns >= 3;
  const hoje = useMemo(() => hojeStrCuiaba(), []);
  const [dataReferencia, setDataReferencia] = useState(hoje);
  const [mesVisivel, setMesVisivel] = useState(() => mesDeData(hoje));
  const [filtro, setFiltro] = useState<FiltroSuiteOperacional>("todas");
  const [suites, setSuites] = useState<SuiteOperacionalCard[]>([]);
  const [calendario, setCalendario] = useState<MetaCalendarioSuites | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metaMsg, setMetaMsg] = useState<string | null>(null);
  const [reservaOperacao, setReservaOperacao] =
    useState<ReservaOperacaoRef | null>(null);
  const [horarioChegadaPorReserva, setHorarioChegadaPorReserva] = useState<
    Record<number, string>
  >({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const { refreshVersion, requestRefresh, lastRefreshAt } =
    useHospedagemAdminRefresh();
  const [agoraTick, setAgoraTick] = useState(() => Date.now());

  useEffect(() => {
    if (lastRefreshAt == null) return;
    const id = setInterval(() => setAgoraTick(Date.now()), 5_000);
    return () => clearInterval(id);
  }, [lastRefreshAt]);

  const carregar = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const response = await getSuitesOperacionais({
          filtro,
          data: dataReferencia,
          mes: mesVisivel,
        });
        setSuites(response.data ?? []);
        setCalendario(response.meta?.calendario ?? null);
        setMetaMsg(response.meta?.mensagem ?? null);
      } catch {
        setSuites([]);
        setCalendario(null);
        setMetaMsg(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filtro, dataReferencia, mesVisivel],
  );

  useFocusEffect(
    useCallback(() => {
      carregar(false);
    }, [carregar]),
  );

  useEffect(() => {
    if (refreshVersion === 0) return;
    carregar(true);
  }, [refreshVersion, carregar]);

  const abrirReserva = (ref: ReservaOperacaoRef) => {
    if (!ref.idReservaHospedagem) return;
    setReservaOperacao(ref);
    setSheetVisible(true);
  };

  const abrirSuite = (item: SuiteOperacionalCard) => {
    // Modo duplo / checkout+nova reserva: só pelos blocos (nunca ambíguo pelo card).
    if (
      item.modoDuplaReserva &&
      item.proximaReservaResumo?.id &&
      item.idReservaHospedagem &&
      item.proximaReservaResumo.id !== item.idReservaHospedagem
    ) {
      return;
    }

    const badge = String(item.badge || item.status || "").toUpperCase();
    const checkoutComNovaReserva =
      (badge === "CHECKOUT_HOJE" ||
        item.status === "CheckOutHoje" ||
        item.checkoutHoje === true) &&
      Boolean(item.idReservaHospedagem) &&
      (item.acoesDisponiveis?.reservar === true ||
        item.botaoPrincipal === "nova_reserva" ||
        item.disponivelHojeAposCheckout === true);
    if (checkoutComNovaReserva) {
      return;
    }

    const livreParaReservar = item.acoesDisponiveis?.reservar === true;

    if (livreParaReservar && item.idEvento) {
      openNovaReserva({
        idEvento: item.idEvento,
        idEventoSuite: item.idEventoSuite ?? item.id,
        checkinDate: dataReferencia,
      });
      return;
    }

    if (item.idReservaHospedagem) {
      abrirReserva({
        idReservaHospedagem: item.idReservaHospedagem,
        suiteNome: item.nome,
        inicio: item.checkin,
        fim: item.checkout,
        status: item.status,
        statusReserva: item.statusReserva ?? item.status,
        dataHoraCheckinReal: item.dataHoraCheckinReal,
        responsavel: item.responsavel,
        adultos: item.adultos,
        criancas: item.criancas,
        valorTotal: item.valorHospedagem,
        valorPago: item.valorPago,
        saldoPendente: item.saldoPendente,
        idEvento: item.idEvento,
        idEventoSuite: item.idEventoSuite,
      });
      return;
    }
    navigation.navigate("hospedagemSuiteDetalhe", {
      idEventoSuite: item.idEventoSuite || item.id,
      dataReferencia,
    });
  };

  const irMes = (delta: number) => {
    const novoMes = addMes(mesVisivel, delta);
    setMesVisivel(novoMes);
    setDataReferencia(dataNoMes(novoMes, dataReferencia));
  };

  return (
    <View style={styles.container}>
      <CalendarioHorizontal
        mesVisivel={mesVisivel}
        dataSelecionada={dataReferencia}
        hoje={hoje}
        calendario={calendario}
        onMesAnterior={() => irMes(-1)}
        onMesProximo={() => irMes(1)}
        onSelecionarData={(data) => {
          setDataReferencia(data);
          setMesVisivel(mesDeData(data));
        }}
      />

      <View style={styles.filtrosRow}>
        <FlatList
          horizontal
          data={FILTROS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtrosScroll}
          style={styles.filtrosWrap}
          renderItem={({ item }) => {
            const ativo = filtro === item.key;
            return (
              <TouchableOpacity
                style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
                onPress={() => setFiltro(item.key)}
              >
                <Text
                  style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <View style={styles.refreshBox}>
          {lastRefreshAt != null ? (
            <Text style={styles.refreshMeta} numberOfLines={1}>
              {textoAtualizadoHa(lastRefreshAt, agoraTick)}
            </Text>
          ) : null}
          <TouchableOpacity
            style={[
              styles.refreshBtn,
              refreshing && styles.refreshBtnDisabled,
            ]}
            onPress={() => {
              if (refreshing) return;
              requestRefresh();
            }}
            disabled={refreshing}
            accessibilityLabel="Atualizar agora"
            // @ts-expect-error title = tooltip no web
            title={Platform.OS === "web" ? "Atualizar agora" : undefined}
            hitSlop={8}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={colors.azul} />
            ) : (
              <Feather name="refresh-cw" size={18} color={colors.azul} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.estadoBox}>
          <ActivityIndicator size="large" color={colors.azul} />
          <Text style={styles.estadoTexto}>Carregando suítes...</Text>
        </View>
      ) : (
        <FlatList
          key={`suites-cols-${suiteColumns}`}
          data={suites}
          keyExtractor={(item) => String(item.idEventoSuite || item.id)}
          numColumns={suiteColumns}
          columnWrapperStyle={
            suiteColumns > 1 ? styles.columnWrapper : undefined
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => carregar(true)}
            />
          }
          ListEmptyComponent={
            <View style={styles.vazioBox}>
              <Feather name="home" size={48} color="#999" />
              <Text style={styles.vazio}>
                {metaMsg || "Nenhuma suíte encontrada."}
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 40 }} />}
          renderItem={({ item }) => (
            <View
              style={[
                suiteColumns > 1 ? styles.gridItem : undefined,
                desktopLayout && styles.gridItemDesktop,
              ]}
            >
              <CardSuite
                item={item}
                filtroAtivo={filtro}
                dataSelecionada={dataReferencia}
                hoje={hoje}
                compact={cardsCompactos}
                desktopLayout={desktopLayout}
                horarioChegadaPorReserva={horarioChegadaPorReserva}
                onPress={() => abrirSuite(item)}
                onAbrirReserva={abrirReserva}
                onNovaReserva={() => {
                  if (!item.idEvento) return;
                  openNovaReserva({
                    idEvento: item.idEvento,
                    idEventoSuite: item.idEventoSuite ?? item.id,
                    checkinDate: dataReferencia,
                  });
                }}
              />
            </View>
          )}
        />
      )}

      <ReservaOperacaoSheet
        reserva={reservaOperacao}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        dataReferencia={dataReferencia}
        onDetalheAtualizado={(detalhe: ReservaAdminDetalhe) => {
          const id = detalhe.idReservaHospedagem ?? detalhe.id;
          if (id && detalhe.dataHoraChegadaReal) {
            setHorarioChegadaPorReserva((prev) => ({
              ...prev,
              [id]: detalhe.dataHoraChegadaReal!,
            }));
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  calendarioWrap: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    paddingTop: 8,
    paddingBottom: 10,
    marginBottom: 10,
  },
  mesNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 6,
  },
  mesNavBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  mesNavTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  diasScroll: {
    paddingHorizontal: 2,
    alignItems: "center",
  },
  diaChip: {
    width: 48,
    marginRight: 4,
    alignItems: "center",
  },
  diaChipInner: {
    width: 48,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 11,
  },
  diaChipHojeAtalho: {
    marginRight: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,0,0,0.12)",
    paddingRight: 4,
  },
  diaHojeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.cinza,
  },
  diaHojeLabelSelecionado: {
    fontWeight: "600",
  },
  diaNum: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.cinza,
  },
  diaNumSelecionado: {
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 8,
    marginTop: 4,
    gap: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  filtrosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  filtrosWrap: {
    flex: 1,
    maxHeight: 48,
    flexGrow: 1,
  },
  filtrosScroll: {
    paddingRight: 8,
    alignItems: "center",
  },
  refreshBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 2,
    flexShrink: 0,
  },
  refreshMeta: {
    fontSize: 11,
    color: "#888",
    maxWidth: 110,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshBtnDisabled: {
    opacity: 0.55,
  },
  filtroChip: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    minHeight: 40,
    justifyContent: "center",
  },
  filtroChipAtivo: {
    backgroundColor: colors.azul,
  },
  filtroTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
  },
  filtroTextoAtivo: {
    color: colors.branco,
  },
  listaContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    flex: 1,
    minHeight: 148,
  },
  cardCompact: {
    paddingVertical: 10,
    paddingHorizontal: 11,
    marginBottom: 0,
    borderRadius: 12,
    minHeight: 156,
  },
  cardDesktopPin: {
    alignSelf: "stretch",
    height: "100%",
  },
  columnWrapper: {
    gap: 10,
    alignItems: "stretch",
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    minWidth: 0,
  },
  gridItemDesktop: {
    alignSelf: "stretch",
  },
  cardHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  cardBodyFill: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardBodyFillDesktop: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardContent: {
    flexGrow: 1,
    gap: 2,
  },
  cardContentDesktop: {
    flex: 1,
    flexGrow: 1,
    minHeight: 0,
  },
  cardAcaoFooterDesktop: {
    width: "100%",
    alignItems: "center",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardBody: {
    flex: 1,
    paddingRight: 8,
  },
  chevron: {
    fontSize: 28,
    fontWeight: "300",
    color: "#999",
    paddingLeft: 4,
  },
  chevronDesktop: {
    fontSize: 22,
  },
  suiteNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
    flex: 1,
    minWidth: 0,
  },
  suiteNomeCompact: {
    fontSize: 14,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: "48%",
  },
  badgeCompact: {
    marginTop: 0,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    flexShrink: 0,
  },
  badgeTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 10,
    letterSpacing: 0.2,
  },
  livreTitulo: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
  },
  livreTituloCompact: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#475467",
    lineHeight: 18,
  },
  metaLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  metaIcon: {
    marginTop: 1,
  },
  metaLinhaTexto: {
    flex: 1,
    fontSize: 13,
    color: "#475467",
  },
  metaLinhaStrong: {
    fontWeight: "700",
    color: colors.cinza,
    fontSize: 14,
  },
  metaSecundario: {
    marginTop: 2,
    fontSize: 12,
    color: "#667085",
  },
  proximaLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "700",
    color: "#98A2B3",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipSpacer: {
    minHeight: 28,
  },
  chipSpacerDesktop: {
    minHeight: 38,
  },
  reservarChipCompact: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 30,
    borderRadius: 9,
    alignSelf: "flex-start",
  },
  proximaBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  proximaTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.4,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  proximaNome: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
  },
  proximaHora: {
    marginTop: 2,
    fontSize: 14,
    color: "#555",
  },
  proximaChip: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  proximaChipAtendente: {
    backgroundColor: "rgba(0, 115, 230, 0.12)",
  },
  proximaChipSite: {
    backgroundColor: "rgba(2, 122, 58, 0.12)",
  },
  proximaChipTextoAtendente: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0073E6",
  },
  proximaChipTextoSite: {
    fontSize: 11,
    fontWeight: "700",
    color: "#027a3a",
  },
  blocoReserva: {
    marginTop: 10,
  },
  blocoReservaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  blocoReservaConteudo: {
    flex: 1,
    paddingRight: 8,
    gap: 2,
  },
  blocoTitulo: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  blocoNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  blocoMeta: {
    fontSize: 14,
    color: "#555",
  },
  blocoOrigem: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  blocoSeparador: {
    marginTop: 12,
    marginBottom: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#d1d5db",
  },
  checkoutHint: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },
  reservarChip: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.greenEscuro,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  reservarChipCentered: {
    alignSelf: "center",
  },
  novaReservaBtnAlign: {
    alignSelf: "center",
  },
  reservarTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  responsavel: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  destaqueHora: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: "700",
    color: colors.cinza,
  },
  periodoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  periodoCol: {
    minWidth: 64,
  },
  periodoLabel: {
    fontSize: 11,
    color: "#777",
    fontWeight: "600",
    marginBottom: 2,
  },
  periodoData: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  periodoHora: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  seta: {
    fontSize: 18,
    color: colors.azul,
    fontWeight: "700",
  },
  ocupacao: {
    marginTop: 12,
    fontSize: 14,
    color: "#555",
  },
  valor: {
    marginTop: 12,
    fontSize: 13,
    color: "#555",
  },
  valorNumero: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  estadoBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 40,
  },
  estadoTexto: {
    marginTop: 12,
    fontSize: 15,
    color: colors.cinza,
  },
  vazioBox: {
    alignItems: "center",
    marginTop: 56,
    paddingHorizontal: 12,
  },
  vazio: {
    textAlign: "center",
    marginTop: 12,
    fontSize: 15,
    color: colors.cinza,
  },
});
