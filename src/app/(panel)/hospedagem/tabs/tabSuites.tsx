import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  DiaCalendarioSuites,
  FiltroSuiteOperacional,
  getSuitesOperacionais,
  IndicadoresDiaCalendario,
  MetaCalendarioSuites,
  SuiteOperacionalCard,
} from "@/src/lib/hospedagemAdmin";
import { dotsIndicadoresCalendario } from "@/src/constants/hospedagemStatusColors";
import ReservaOperacaoSheet from "../components/ReservaOperacaoSheet";
import ResumoFinanceiroRecepcao from "../components/ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "../components/OrigemReservaIndicador";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import {
  badgeStatusOperacional,
  CORES_STATUS_OPERACIONAL,
  corStatusOperacionalPadrao,
  formatHoraHospedagem,
  getStatusOperacionalSuite,
} from "@/src/lib/hospedagemStatusOperacional";
import { ReservaOperacaoRef } from "@/src/lib/hospedagemOperacao";

const TZ = "America/Cuiaba";

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

function formatParte(iso?: string | null): { data: string; hora: string } {
  if (!iso) return { data: "--/--", hora: "--:--" };
  try {
    return {
      data: formatInTimeZone(parseISO(String(iso)), TZ, "dd/MM"),
      hora: formatInTimeZone(parseISO(String(iso)), TZ, "HH:mm"),
    };
  } catch {
    return { data: "--/--", hora: "--:--" };
  }
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

function CardSuite({
  item,
  onPress,
  filtroAtivo,
  dataReferencia,
}: {
  item: SuiteOperacionalCard;
  onPress: () => void;
  filtroAtivo: FiltroSuiteOperacional;
  dataReferencia: string;
}) {
  const statusOp = getStatusOperacionalSuite({
    statusOperacional: item.status,
    statusReserva: item.statusReserva,
    checkin: item.checkin,
    checkout: item.checkout,
    dataHoraCheckinReal: item.dataHoraCheckinReal,
    dataReferencia,
  });

  // No filtro "Livres", check-out hoje entra como disponível para venda
  const livreAposCheckout =
    filtroAtivo === "livres" && statusOp === "CHECKOUT_HOJE";

  const statusExibicao = livreAposCheckout ? "LIVRE" : statusOp;
  const cor = corStatusOperacionalPadrao(statusExibicao);
  const badgeTexto = badgeStatusOperacional(statusExibicao);

  const horaEntrada = formatHoraHospedagem(
    item.dataHoraCheckinReal || item.checkin,
  );
  const horaCheckout = formatHoraHospedagem(item.checkout);
  const checkout = formatParte(item.checkout);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardBody}>
          <Text style={styles.suiteNome}>
            <Text style={{ color: cor }}>● </Text>
            {item.nome}
          </Text>

          <View style={[styles.badge, { backgroundColor: cor }]}>
            <Text style={styles.badgeTexto}>{badgeTexto}</Text>
          </View>

          {statusExibicao === "LIVRE" ? (
            <>
              <Text style={styles.livreTitulo}>
                {livreAposCheckout
                  ? item.mensagemDisponibilidade ||
                    "Disponível para nova reserva após 13:00"
                  : "Disponível para reserva"}
              </Text>
              {livreAposCheckout ? (
                <Text style={styles.disponivelSecundario}>
                  {item.mensagemDisponibilidadeSecundaria ||
                    "Disponível após o check-out"}
                </Text>
              ) : null}
              <View style={styles.reservarChip}>
                <Text style={styles.reservarTexto}>Nova Reserva</Text>
              </View>
            </>
          ) : statusExibicao === "CHECKIN_HOJE" ? (
            <>
              {item.responsavel ? (
                <Text style={styles.responsavel}>{item.responsavel}</Text>
              ) : null}
              <OrigemReservaIndicador dados={item} variante="card" />
              <Text style={styles.destaqueHora}>
                {item.mensagemDisponibilidade || "Entrada prevista às 16:00"}
              </Text>
              <ResumoFinanceiroRecepcao
                dados={{
                  ...item,
                  valorTotal: item.valorHospedagem ?? item.valorTotal,
                }}
                compact
                mostrarReceberSaldo
              />
              <View
                style={[
                  styles.reservarChip,
                  { backgroundColor: CORES_STATUS_OPERACIONAL.livre },
                ]}
              >
                <Text style={styles.reservarTexto}>Realizar Check-in</Text>
              </View>
            </>
          ) : statusExibicao === "HOSPEDADA" ? (
            <>
              {item.responsavel ? (
                <Text style={styles.responsavel}>{item.responsavel}</Text>
              ) : null}
              <OrigemReservaIndicador dados={item} variante="card" />
              <Text style={styles.destaqueHora}>
                {item.mensagemDisponibilidade || `Entrou às ${horaEntrada}`}
              </Text>
              <Text style={styles.disponivelSecundario}>
                {item.mensagemDisponibilidadeSecundaria ||
                  `Sai em ${checkout.data} às 13:00`}
              </Text>
              <ResumoFinanceiroRecepcao
                dados={{
                  ...item,
                  valorTotal: item.valorHospedagem ?? item.valorTotal,
                }}
                compact
              />
              <View
                style={[
                  styles.reservarChip,
                  { backgroundColor: CORES_STATUS_OPERACIONAL.hospedada },
                ]}
              >
                <Text style={styles.reservarTexto}>Ver Reserva</Text>
              </View>
            </>
          ) : statusExibicao === "CHECKOUT_HOJE" ? (
            <>
              {item.responsavel ? (
                <Text style={styles.responsavel}>{item.responsavel}</Text>
              ) : null}
              <OrigemReservaIndicador dados={item} variante="card" />
              <Text style={styles.destaqueHora}>
                {item.mensagemDisponibilidade || `Sai às ${horaCheckout}`}
              </Text>
              <Text style={styles.disponivelSecundario}>
                Disponível após o check-out.
              </Text>
              <ResumoFinanceiroRecepcao
                dados={{
                  ...item,
                  valorTotal: item.valorHospedagem ?? item.valorTotal,
                }}
                compact
              />
              <View
                style={[
                  styles.reservarChip,
                  { backgroundColor: CORES_STATUS_OPERACIONAL.aguardandoAcao },
                ]}
              >
                <Text style={styles.reservarTexto}>Realizar Check-out</Text>
              </View>
            </>
          ) : (
            <>
              {item.responsavel ? (
                <Text style={styles.responsavel}>{item.responsavel}</Text>
              ) : null}
              <OrigemReservaIndicador dados={item} variante="card" />
              {item.mensagemDisponibilidade ? (
                <Text style={styles.livreTitulo}>
                  {item.mensagemDisponibilidade}
                </Text>
              ) : null}
              <ResumoFinanceiroRecepcao
                dados={{
                  ...item,
                  valorTotal: item.valorHospedagem ?? item.valorTotal,
                }}
                compact
              />
              {item.valorHospedagem != null ? (
                <Text style={styles.valor}>
                  Valor{" "}
                  <Text style={styles.valorNumero}>
                    {formatCurrency(Number(item.valorHospedagem))}
                  </Text>
                </Text>
              ) : null}
            </>
          )}
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabSuites() {
  const navigation = useNavigation() as any;
  const { openNovaReserva } = useNovaReservaRecepcao();
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
  const [sheetVisible, setSheetVisible] = useState(false);
  const { refreshVersion } = useHospedagemAdminRefresh();

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

  const abrirSuite = (item: SuiteOperacionalCard) => {
    const statusOp = getStatusOperacionalSuite({
      statusOperacional: item.status,
      statusReserva: item.statusReserva,
      checkin: item.checkin,
      checkout: item.checkout,
      dataHoraCheckinReal: item.dataHoraCheckinReal,
      dataReferencia,
    });

    const livreParaReservar =
      statusOp === "LIVRE" ||
      (filtro === "livres" && statusOp === "CHECKOUT_HOJE");

    if (livreParaReservar && item.idEvento) {
      openNovaReserva({
        idEvento: item.idEvento,
        checkinDate: dataReferencia,
      });
      return;
    }

    if (item.idReservaHospedagem) {
      setReservaOperacao({
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
        idEvento: item.idEvento,
        idEventoSuite: item.idEventoSuite,
      });
      setSheetVisible(true);
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

      {loading && !refreshing ? (
        <View style={styles.estadoBox}>
          <ActivityIndicator size="large" color={colors.azul} />
          <Text style={styles.estadoTexto}>Carregando suítes...</Text>
        </View>
      ) : (
        <FlatList
          data={suites}
          keyExtractor={(item) => String(item.idEventoSuite || item.id)}
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
            <CardSuite
              item={item}
              filtroAtivo={filtro}
              dataReferencia={dataReferencia}
              onPress={() => abrirSuite(item)}
            />
          )}
        />
      )}

      <ReservaOperacaoSheet
        reserva={reservaOperacao}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        dataReferencia={dataReferencia}
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
  filtrosWrap: {
    maxHeight: 48,
    marginBottom: 10,
    flexGrow: 0,
  },
  filtrosScroll: {
    paddingRight: 8,
    alignItems: "center",
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  suiteNome: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
  },
  livreTitulo: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
  },
  disponivelSecundario: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
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
