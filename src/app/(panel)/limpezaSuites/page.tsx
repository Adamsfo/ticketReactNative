import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import ScreenContainer from "@/src/components/ScreenContainer";
import colors from "@/src/constants/colors";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemOperacao";
import {
  FiltroLimpezaSuites,
  getLimpezasSuites,
  labelStatusLimpeza,
  LimpezaSuiteCard,
  postConcluirLimpezaSuite,
  postIniciarLimpezaSuite,
} from "@/src/lib/limpezaSuites";
import { useHospedagemDesktopLayout } from "../hospedagem/useHospedagemDesktopLayout";

const AUTO_REFRESH_MS = 15_000;

const FILTROS: Array<{ key: FiltroLimpezaSuites; label: string }> = [
  { key: "pendente", label: "Pendente" },
  { key: "em_andamento", label: "Em andamento" },
  { key: "concluida", label: "Concluída" },
];

function corStatusLimpeza(status: string): string {
  switch (status) {
    case "Pendente":
      return "#e67e22";
    case "EmAndamento":
      return "#0073E6";
    case "Concluida":
      return "#027a3a";
    default:
      return colors.cinza;
  }
}

function LinhaInfo({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor?: string | null;
}) {
  if (!valor) return null;
  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

function CardLimpeza({
  item,
  acaoLoading,
  onIniciar,
  onConcluir,
  gradeMultiCol,
}: {
  item: LimpezaSuiteCard;
  acaoLoading: boolean;
  onIniciar: (id: number) => void;
  onConcluir: (id: number) => void;
  gradeMultiCol?: boolean;
}) {
  const cor = corStatusLimpeza(item.status);
  const podeIniciar = item.status === "Pendente";
  const podeConcluir = item.status === "EmAndamento";

  return (
    <View
      style={[
        styles.card,
        gradeMultiCol && styles.cardGradeMultiCol,
        { borderLeftColor: cor },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.suiteNome}>{item.nomeSuite ?? "Suíte"}</Text>
          {item.eventoNome ? (
            <Text style={styles.eventoNome}>{item.eventoNome}</Text>
          ) : null}
        </View>
        <View style={[styles.badge, { backgroundColor: cor }]}>
          <Text style={styles.badgeTexto}>
            {labelStatusLimpeza(item.status).toUpperCase()}
          </Text>
        </View>
      </View>

      <LinhaInfo rotulo="Hóspede" valor={item.hospede} />
      <LinhaInfo
        rotulo="Reserva"
        valor={item.numeroReserva ? `#${item.numeroReserva}` : null}
      />
      <LinhaInfo
        rotulo="Check-out da reserva"
        valor={
          item.dataHoraCheckoutRealizado
            ? formatDateTimeHospedagem(item.dataHoraCheckoutRealizado)
            : item.checkout
              ? formatDateTimeHospedagem(item.checkout)
              : null
        }
      />
      <LinhaInfo
        rotulo="Início da limpeza"
        valor={
          item.dataHoraInicio
            ? formatDateTimeHospedagem(item.dataHoraInicio)
            : "—"
        }
      />
      <LinhaInfo
        rotulo="Conclusão da limpeza"
        valor={
          item.dataHoraFim ? formatDateTimeHospedagem(item.dataHoraFim) : "—"
        }
      />
      {item.usuarioInicio ? (
        <LinhaInfo rotulo="Iniciado por" valor={item.usuarioInicio} />
      ) : null}
      {item.usuarioFim ? (
        <LinhaInfo rotulo="Concluído por" valor={item.usuarioFim} />
      ) : null}

      {podeIniciar ? (
        <TouchableOpacity
          style={[styles.botaoAcao, acaoLoading && styles.botaoAcaoDisabled]}
          disabled={acaoLoading}
          onPress={() => onIniciar(item.id)}
        >
          <Text style={styles.botaoAcaoTexto}>INICIAR LIMPEZA</Text>
        </TouchableOpacity>
      ) : null}

      {podeConcluir ? (
        <TouchableOpacity
          style={[
            styles.botaoAcao,
            styles.botaoAcaoConcluir,
            acaoLoading && styles.botaoAcaoDisabled,
          ]}
          disabled={acaoLoading}
          onPress={() => onConcluir(item.id)}
        >
          <Text style={styles.botaoAcaoTexto}>CONCLUIR LIMPEZA</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function LimpezaSuitesPage() {
  const { isDesktop, suiteColumns, contentMaxWidth } = useHospedagemDesktopLayout();
  const desktopLayout = suiteColumns >= 3;
  const [filtro, setFiltro] = useState<FiltroLimpezaSuites>("pendente");
  const [itens, setItens] = useState<LimpezaSuiteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [acaoId, setAcaoId] = useState<number | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState<string | null>(null);
  const requisicaoEmAndamentoRef = useRef(false);
  const acaoEmAndamentoRef = useRef(false);

  const carregar = useCallback(async (silencioso = false, filtroOverride?: FiltroLimpezaSuites) => {
    if (requisicaoEmAndamentoRef.current) return;

    const filtroAtivo = filtroOverride ?? filtro;
    requisicaoEmAndamentoRef.current = true;
    if (!silencioso) setLoading(true);
    setErro(null);
    try {
      const resp = await getLimpezasSuites({
        filtro: filtroAtivo,
        page: 1,
        pageSize: 50,
      });
      setItens(resp.data ?? []);
      setTotal(resp.meta?.total ?? resp.data?.length ?? 0);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível carregar as limpezas.";
      setErro(msg);
      setItens([]);
      setTotal(0);
    } finally {
      requisicaoEmAndamentoRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro]);

  const carregarAuto = useCallback(() => {
    if (acaoEmAndamentoRef.current) return;
    void carregar(true);
  }, [carregar]);

  useFocusEffect(
    useCallback(() => {
      void carregar(true);
      const timer = setInterval(() => carregarAuto(), AUTO_REFRESH_MS);
      return () => clearInterval(timer);
    }, [carregar, carregarAuto]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void carregar(true);
  };

  const executarAcao = async (
    id: number,
    tipo: "iniciar" | "concluir",
  ) => {
    setAcaoId(id);
    acaoEmAndamentoRef.current = true;
    setMensagemAcao(null);
    setErro(null);
    let sucesso = false;
    let novoFiltro: FiltroLimpezaSuites | null = null;
    try {
      novoFiltro =
        tipo === "iniciar" ? "em_andamento" : "concluida";
      if (tipo === "iniciar") {
        await postIniciarLimpezaSuite(id);
        setMensagemAcao("Limpeza iniciada com sucesso.");
      } else {
        await postConcluirLimpezaSuite(id);
        setMensagemAcao("Limpeza concluída com sucesso.");
      }
      setFiltro(novoFiltro);
      sucesso = true;
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível concluir a operação.";
      setErro(msg);
    } finally {
      setAcaoId(null);
      acaoEmAndamentoRef.current = false;
    }
    if (sucesso && novoFiltro) {
      while (requisicaoEmAndamentoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      await carregar(true, novoFiltro);
    }
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={styles.gradient}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <ScreenContainer
        style={[
          styles.screen,
          isDesktop && { maxWidth: contentMaxWidth, width: "100%", alignSelf: "center" },
        ]}
      >
        <View style={styles.container}>
          <Text style={styles.titulo}>🧹 Limpeza das Suítes</Text>
          <Text style={styles.subtitulo}>
            Operação de limpeza — módulo independente da hospedagem.
          </Text>

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
                      style={[
                        styles.filtroTexto,
                        ativo && styles.filtroTextoAtivo,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => void carregar(true)}
              accessibilityLabel="Atualizar lista"
              hitSlop={8}
            >
              <Feather name="refresh-cw" size={18} color={colors.azul} />
            </TouchableOpacity>
          </View>

          <Text style={styles.resumoTexto}>
            {total} registro{total === 1 ? "" : "s"}
          </Text>

          {mensagemAcao ? (
            <Text style={styles.sucesso}>{mensagemAcao}</Text>
          ) : null}

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.laranjado}
              style={{ marginTop: 32 }}
            />
          ) : erro ? (
            <Text style={styles.erro}>{erro}</Text>
          ) : itens.length === 0 ? (
            <Text style={styles.vazio}>
              Nenhuma limpeza encontrada para este filtro.
            </Text>
          ) : (
            <FlatList
              key={`limpeza-cols-${suiteColumns}`}
              data={itens}
              keyExtractor={(item) => String(item.id)}
              numColumns={suiteColumns}
              columnWrapperStyle={
                suiteColumns > 1 ? styles.columnWrapper : undefined
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listaContent}
              renderItem={({ item }) => (
                <View
                  style={[
                    suiteColumns > 1 ? styles.gridItem : undefined,
                    desktopLayout && styles.gridItemDesktop,
                  ]}
                >
                  <CardLimpeza
                    item={item}
                    acaoLoading={acaoId === item.id}
                    gradeMultiCol={suiteColumns > 1}
                    onIniciar={(id) => void executarAcao(id, "iniciar")}
                    onConcluir={(id) => void executarAcao(id, "concluir")}
                  />
                </View>
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={<View style={{ height: 40 }} />}
            />
          )}
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  screen: {
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: colors.cinza,
  },
  subtitulo: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 10,
  },
  filtrosRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  resumoTexto: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  listaContent: {
    paddingBottom: 24,
    flexGrow: 1,
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
  cardGradeMultiCol: {
    marginBottom: 0,
    minHeight: 156,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  suiteNome: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  eventoNome: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexShrink: 0,
  },
  badgeTexto: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  linhaInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
    paddingVertical: 2,
  },
  rotulo: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flexShrink: 0,
    minWidth: 108,
  },
  valor: {
    fontSize: 13,
    color: colors.cinza,
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },
  erro: {
    color: "#c0392b",
    marginTop: 24,
    textAlign: "center",
  },
  vazio: {
    color: colors.cinza,
    marginTop: 24,
    textAlign: "center",
  },
  sucesso: {
    color: "#027a3a",
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  botaoAcao: {
    marginTop: 10,
    backgroundColor: colors.laranjado,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  botaoAcaoConcluir: {
    backgroundColor: colors.greenEscuro,
  },
  botaoAcaoDisabled: {
    opacity: 0.6,
  },
  botaoAcaoTexto: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.4,
  },
});
