import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import {
  corBarraReservaAgenda,
  HOSPEDAGEM_STATUS_COLORS,
} from "@/src/constants/hospedagemStatusColors";
import ReservaOperacaoSheet from "../components/ReservaOperacaoSheet";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";
import { useNovaReservaRecepcao } from "../contexts/NovaReservaRecepcaoContext";
import {
  AGENDA_DAY_WIDTH,
  AGENDA_HEADER_HEIGHT,
  AGENDA_ROW_HEIGHT,
  AGENDA_SUITE_COL_WIDTH,
  addMes,
  AgendaRange,
  BarraAgendaReserva,
  buildDiasVisiveis,
  calcularGeometriaBarra,
  carregarDadosAgenda,
  hojeStrCuiaba,
  labelDiaCurto,
  labelDiaSemana,
  labelMesAno,
  mesDeData,
  SlotDisponivelAgenda,
  slotsDisponiveisDaAgenda,
} from "@/src/lib/hospedagemAgenda";
import { DiaCalendarioSuites, SuiteOperacionalCard } from "@/src/lib/hospedagemAdmin";
import { ReservaOperacaoRef } from "@/src/lib/hospedagemOperacao";

const RANGES: Array<{ key: AgendaRange; label: string }> = [
  { key: 7, label: "7 dias" },
  { key: 15, label: "15 dias" },
  { key: 30, label: "30 dias" },
];

const LEGENDA: Array<{ cor: string; label: string }> = [
  { cor: HOSPEDAGEM_STATUS_COLORS.livre, label: "Livre" },
  { cor: HOSPEDAGEM_STATUS_COLORS.hospedada, label: "Hospedada" },
  { cor: HOSPEDAGEM_STATUS_COLORS.checkInHoje, label: "Check-in" },
  { cor: HOSPEDAGEM_STATUS_COLORS.checkOutHoje, label: "Check-out" },
  { cor: HOSPEDAGEM_STATUS_COLORS.bloqueada, label: "Bloqueada / Manutenção" },
];

function alturaListaAgenda(): number {
  const { height } = Dimensions.get("window");
  return Math.max(240, height - (Platform.OS === "web" ? 340 : 400));
}

function BarraReserva({
  barra,
  diasVisiveis,
  onPress,
}: {
  barra: BarraAgendaReserva;
  diasVisiveis: string[];
  onPress: () => void;
}) {
  const geom = calcularGeometriaBarra(barra.inicio, barra.fim, diasVisiveis);
  if (!geom) return null;

  const cor = corBarraReservaAgenda(barra.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.barra,
        {
          left: geom.left,
          width: geom.width,
          backgroundColor: cor,
        },
      ]}
    >
      <Text style={styles.barraTexto} numberOfLines={1}>
        {barra.responsavel || barra.suiteNome}
      </Text>
    </TouchableOpacity>
  );
}

function DiaDisponivelSlot({
  slot,
  dayIndex,
  onPress,
}: {
  slot: SlotDisponivelAgenda;
  dayIndex: number;
  onPress: () => void;
}) {
  const meia = slot.modo === "meia";
  const half = AGENDA_DAY_WIDTH / 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityLabel={`Disponível para reservar em ${slot.data} (check-in a partir das 16:00)`}
      style={[
        styles.diaDisponivel,
        meia
          ? {
              left: dayIndex * AGENDA_DAY_WIDTH + half + 1,
              width: half - 4,
            }
          : {
              left: dayIndex * AGENDA_DAY_WIDTH + 4,
              width: AGENDA_DAY_WIDTH - 8,
            },
      ]}
    />
  );
}

function LinhaSuite({
  suite,
  barras,
  diasVisiveis,
  diasCalendario,
  gridWidth,
  onBarPress,
  onDisponivelPress,
}: {
  suite: SuiteOperacionalCard;
  barras: BarraAgendaReserva[];
  diasVisiveis: string[];
  diasCalendario: DiaCalendarioSuites[];
  gridWidth: number;
  onBarPress: (barra: BarraAgendaReserva) => void;
  onDisponivelPress: (suite: SuiteOperacionalCard, data: string) => void;
}) {
  const barrasSuite = useMemo(
    () => barras.filter((b) => b.idEventoSuite === suite.idEventoSuite),
    [barras, suite.idEventoSuite],
  );

  const diasDisponiveis = useMemo(
    () =>
      slotsDisponiveisDaAgenda(
        suite.idEventoSuite,
        diasVisiveis,
        diasCalendario,
      ),
    [suite.idEventoSuite, diasVisiveis, diasCalendario],
  );

  return (
    <View style={[styles.linhaGrid, { width: gridWidth }]}>
      {diasVisiveis.map((data) => (
        <View
          key={data}
          style={[styles.celulaDia, { width: AGENDA_DAY_WIDTH }]}
        />
      ))}

      {barrasSuite.map((barra) => (
        <BarraReserva
          key={barra.id}
          barra={barra}
          diasVisiveis={diasVisiveis}
          onPress={() => onBarPress(barra)}
        />
      ))}

      {diasDisponiveis.map((slot) => {
        const idx = diasVisiveis.indexOf(slot.data);
        if (idx < 0) return null;
        return (
          <DiaDisponivelSlot
            key={`disp-${suite.idEventoSuite}-${slot.data}`}
            slot={slot}
            dayIndex={idx}
            onPress={() => onDisponivelPress(suite, slot.data)}
          />
        );
      })}
    </View>
  );
}

export default function TabAgenda() {
  const navigation = useNavigation() as any;
  const { openNovaReserva } = useNovaReservaRecepcao();
  const hoje = useMemo(() => hojeStrCuiaba(), []);
  const [dataInicio, setDataInicio] = useState(hoje);
  const [mesVisivel, setMesVisivel] = useState(() => mesDeData(hoje));
  const [range, setRange] = useState<AgendaRange>(15);
  const [suites, setSuites] = useState<SuiteOperacionalCard[]>([]);
  const [barras, setBarras] = useState<BarraAgendaReserva[]>([]);
  const [diasCalendario, setDiasCalendario] = useState<DiaCalendarioSuites[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservaOperacao, setReservaOperacao] =
    useState<ReservaOperacaoRef | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const { refreshVersion } = useHospedagemAdminRefresh();

  const hScrollRef = useRef<ScrollView>(null);
  const leftVRef = useRef<FlatList>(null);
  const bodyVRef = useRef<FlatList>(null);
  const syncingV = useRef(false);

  const diasVisiveis = useMemo(
    () => buildDiasVisiveis(dataInicio, range),
    [dataInicio, range],
  );
  const gridWidth = diasVisiveis.length * AGENDA_DAY_WIDTH;
  const listaAltura = useMemo(() => alturaListaAgenda(), []);

  const carregar = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const dados = await carregarDadosAgenda(dataInicio, range);
        setSuites(dados.suites);
        setBarras(dados.barras);
        setDiasCalendario(dados.diasCalendario);
      } catch {
        setSuites([]);
        setBarras([]);
        setDiasCalendario([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [dataInicio, range],
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

  const syncVertical = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (syncingV.current) return;
    syncingV.current = true;
    leftVRef.current?.scrollToOffset({
      offset: e.nativeEvent.contentOffset.y,
      animated: false,
    });
    syncingV.current = false;
  };

  const irMes = (delta: number) => {
    const novoMes = addMes(mesVisivel, delta);
    setMesVisivel(novoMes);
    setDataInicio(`${novoMes}-01`);
  };

  const irHoje = () => {
    setMesVisivel(mesDeData(hoje));
    setDataInicio(hoje);
  };

  const abrirBarra = (barra: BarraAgendaReserva) => {
    setReservaOperacao({
      idReservaHospedagem: barra.idReservaHospedagem,
      suiteNome: barra.suiteNome,
      inicio: barra.inicio,
      fim: barra.fim,
      status: barra.status,
      statusReserva: barra.status,
      dataHoraCheckinReal: barra.dataHoraCheckinReal ?? null,
      responsavel: barra.responsavel,
      adultos: barra.adultos,
      criancas: barra.criancas,
      valorTotal: barra.valorTotal,
      valorPago: barra.valorPago,
      saldoPendente: barra.saldoPendente,
      idEventoSuite: barra.idEventoSuite,
    });
    setSheetVisible(true);
  };

  const abrirNovaReserva = useCallback(
    (suite: SuiteOperacionalCard, checkinDate: string) => {
      if (!suite.idEvento) return;
      openNovaReserva({
        idEvento: suite.idEvento,
        idEventoSuite: suite.idEventoSuite,
        checkinDate,
      });
    },
    [openNovaReserva],
  );

  const renderSuiteNome = ({
    item,
  }: {
    item: SuiteOperacionalCard;
  }) => (
    <View style={styles.suiteNomeCell}>
      <Text style={styles.suiteNomeTexto} numberOfLines={2}>
        {item.nome}
      </Text>
    </View>
  );

  const renderLinha = ({ item }: { item: SuiteOperacionalCard }) => (
    <LinhaSuite
      suite={item}
      barras={barras}
      diasVisiveis={diasVisiveis}
      diasCalendario={diasCalendario}
      gridWidth={gridWidth}
      onBarPress={abrirBarra}
      onDisponivelPress={abrirNovaReserva}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.mesNav}>
          <TouchableOpacity
            onPress={() => irMes(-1)}
            style={styles.mesNavBtn}
            accessibilityLabel="Mês anterior"
          >
            <Feather name="chevron-left" size={22} color={colors.cinza} />
          </TouchableOpacity>
          <Text style={styles.mesNavTitulo}>{labelMesAno(mesVisivel)}</Text>
          <TouchableOpacity
            onPress={() => irMes(1)}
            style={styles.mesNavBtn}
            accessibilityLabel="Próximo mês"
          >
            <Feather name="chevron-right" size={22} color={colors.cinza} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnHoje} onPress={irHoje}>
          <Text style={styles.btnHojeTexto}>Hoje</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rangeRow}>
        {RANGES.map((r) => {
          const ativo = range === r.key;
          return (
            <TouchableOpacity
              key={r.key}
              style={[styles.rangeChip, ativo && styles.rangeChipAtivo]}
              onPress={() => setRange(r.key)}
            >
              <Text
                style={[styles.rangeTexto, ativo && styles.rangeTextoAtivo]}
              >
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.legendaRow}>
        {LEGENDA.map((item) => (
          <View key={item.label} style={styles.legendaItem}>
            <View style={[styles.legendaDot, { backgroundColor: item.cor }]} />
            <Text style={styles.legendaTexto}>{item.label}</Text>
          </View>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={styles.estadoBox}>
          <ActivityIndicator size="large" color={colors.azul} />
          <Text style={styles.estadoTexto}>Carregando agenda...</Text>
        </View>
      ) : (
        <View style={styles.timelineWrap}>
          <View style={styles.timelineRow}>
            <View style={styles.suiteCol}>
              <View style={styles.suiteHeaderCell}>
                <Text style={styles.suiteHeaderTexto}>Suíte</Text>
              </View>
              <FlatList
                ref={leftVRef}
                data={suites}
                keyExtractor={(s) => String(s.idEventoSuite)}
                renderItem={renderSuiteNome}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                style={{ height: listaAltura }}
                getItemLayout={(_, index) => ({
                  length: AGENDA_ROW_HEIGHT,
                  offset: AGENDA_ROW_HEIGHT * index,
                  index,
                })}
                ListEmptyComponent={
                  <View style={styles.suiteNomeCell}>
                    <Text style={styles.vazioTexto}>Nenhuma suíte</Text>
                  </View>
                }
              />
            </View>

            <ScrollView
              ref={hScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              bounces={false}
              style={styles.gridArea}
              contentContainerStyle={styles.gridContent}
            >
              <View style={{ width: gridWidth }}>
                <View
                  style={[
                    styles.headerDiasRow,
                    { width: gridWidth, height: AGENDA_HEADER_HEIGHT },
                  ]}
                >
                  {diasVisiveis.map((data) => {
                    const ehHoje = data === hoje;
                    return (
                      <View
                        key={data}
                        style={[
                          styles.headerDiaCell,
                          { width: AGENDA_DAY_WIDTH },
                        ]}
                      >
                        <Text
                          style={[
                            styles.headerDiaSemana,
                            ehHoje && styles.headerDiaHoje,
                          ]}
                        >
                          {labelDiaSemana(data)}
                        </Text>
                        <Text
                          style={[
                            styles.headerDiaNum,
                            ehHoje && styles.headerDiaHoje,
                          ]}
                        >
                          {labelDiaCurto(data)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <FlatList
                  ref={bodyVRef}
                  data={suites}
                  keyExtractor={(s) => String(s.idEventoSuite)}
                  renderItem={renderLinha}
                  onScroll={syncVertical}
                  scrollEventThrottle={16}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  style={{ width: gridWidth, height: listaAltura }}
                  contentContainerStyle={
                    suites.length === 0 ? styles.listaVazia : undefined
                  }
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={() => carregar(true)}
                    />
                  }
                  ListEmptyComponent={
                    <View style={[styles.linhaGrid, { width: gridWidth }]}>
                      <Text style={styles.vazioTexto}>
                        Nenhuma suíte no período
                      </Text>
                    </View>
                  }
                  initialNumToRender={12}
                  maxToRenderPerBatch={16}
                  windowSize={8}
                  getItemLayout={(_, index) => ({
                    length: AGENDA_ROW_HEIGHT,
                    offset: AGENDA_ROW_HEIGHT * index,
                    index,
                  })}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      <ReservaOperacaoSheet
        reserva={reservaOperacao}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        dataReferencia={hoje}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 8,
  },
  mesNav: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
    minWidth: 120,
    textAlign: "center",
  },
  btnHoje: {
    backgroundColor: colors.branco,
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 4,
  },
  btnHojeTexto: {
    color: colors.azul,
    fontWeight: "700",
    fontSize: 14,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  rangeChip: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  rangeChipAtivo: {
    backgroundColor: colors.azul,
  },
  rangeTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.cinza,
  },
  rangeTextoAtivo: {
    color: colors.branco,
  },
  legendaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  legendaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  legendaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 4,
  },
  legendaTexto: {
    fontSize: 11,
    color: "#777",
    fontWeight: "500",
  },
  timelineWrap: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 14,
    overflow: "hidden",
  },
  timelineRow: {
    flex: 1,
    flexDirection: "row",
  },
  suiteCol: {
    width: AGENDA_SUITE_COL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.line,
  },
  suiteHeaderCell: {
    height: AGENDA_HEADER_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  suiteHeaderTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777",
    textTransform: "uppercase",
  },
  suiteNomeCell: {
    height: AGENDA_ROW_HEIGHT,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  suiteNomeTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.cinza,
  },
  gridArea: {
    flex: 1,
  },
  gridContent: {
    flexGrow: 1,
  },
  headerDiasRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerDiaCell: {
    alignItems: "center",
    justifyContent: "center",
  },
  headerDiaSemana: {
    fontSize: 10,
    fontWeight: "600",
    color: "#888",
    textTransform: "uppercase",
  },
  headerDiaNum: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.cinza,
    marginTop: 2,
  },
  headerDiaHoje: {
    color: colors.azul,
  },
  linhaGrid: {
    height: AGENDA_ROW_HEIGHT,
    position: "relative",
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    backgroundColor: colors.branco,
  },
  celulaDia: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(0,0,0,0.04)",
    height: "100%",
    backgroundColor: colors.branco,
  },
  diaDisponivel: {
    position: "absolute",
    top: 10,
    height: 32,
    borderRadius: 8,
    backgroundColor: HOSPEDAGEM_STATUS_COLORS.livre,
    zIndex: 3,
  },
  barra: {
    position: "absolute",
    top: 10,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 6,
    minWidth: 16,
    zIndex: 2,
  },
  barraTexto: {
    color: colors.branco,
    fontSize: 11,
    fontWeight: "700",
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
  vazioTexto: {
    textAlign: "center",
    color: colors.cinza,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  listaVazia: {
    flexGrow: 1,
  },
});
