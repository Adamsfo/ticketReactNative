import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
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
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

function CardLimpeza({
  item,
  acaoLoading,
  onIniciar,
  onConcluir,
}: {
  item: LimpezaSuiteCard;
  acaoLoading: boolean;
  onIniciar: (id: number) => void;
  onConcluir: (id: number) => void;
}) {
  const cor = corStatusLimpeza(item.status);
  const podeIniciar = item.status === "Pendente";
  const podeConcluir = item.status === "EmAndamento";

  return (
    <View style={styles.card}>
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
  const [filtro, setFiltro] = useState<FiltroLimpezaSuites>("pendente");
  const [itens, setItens] = useState<LimpezaSuiteCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [acaoId, setAcaoId] = useState<number | null>(null);
  const [mensagemAcao, setMensagemAcao] = useState<string | null>(null);

  const carregar = useCallback(async (silencioso = false, filtroOverride?: FiltroLimpezaSuites) => {
    const filtroAtivo = filtroOverride ?? filtro;
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
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
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
    setMensagemAcao(null);
    setErro(null);
    try {
      const novoFiltro: FiltroLimpezaSuites =
        tipo === "iniciar" ? "em_andamento" : "concluida";
      if (tipo === "iniciar") {
        await postIniciarLimpezaSuite(id);
        setMensagemAcao("Limpeza iniciada com sucesso.");
      } else {
        await postConcluirLimpezaSuite(id);
        setMensagemAcao("Limpeza concluída com sucesso.");
      }
      setFiltro(novoFiltro);
      await carregar(true, novoFiltro);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível concluir a operação.";
      setErro(msg);
    } finally {
      setAcaoId(null);
    }
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={styles.gradient}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <ScreenContainer>
        <View style={styles.container}>
          <Text style={styles.titulo}>🧹 Limpeza das Suítes</Text>
          <Text style={styles.subtitulo}>
            Operação de limpeza — módulo independente da hospedagem.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtrosRow}
          >
            {FILTROS.map((f) => {
              const ativo = filtro === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filtroChip, ativo && styles.filtroChipAtivo]}
                  onPress={() => setFiltro(f.key)}
                >
                  <Text
                    style={[
                      styles.filtroChipTexto,
                      ativo && styles.filtroChipTextoAtivo,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.resumoRow}>
            <Text style={styles.resumoTexto}>
              {total} registro{total === 1 ? "" : "s"}
            </Text>
            <TouchableOpacity onPress={() => void carregar(true)}>
              <Feather name="refresh-cw" size={18} color={colors.azul} />
            </TouchableOpacity>
          </View>

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
              data={itens}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <CardLimpeza
                  item={item}
                  acaoLoading={acaoId === item.id}
                  onIniciar={(id) => void executarAcao(id, "iniciar")}
                  onConcluir={(id) => void executarAcao(id, "concluir")}
                />
              )}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              contentContainerStyle={{ paddingBottom: 40 }}
            />
          )}
        </View>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 4,
  },
  subtitulo: {
    color: colors.cinza,
    fontSize: 13,
    marginBottom: 12,
  },
  filtrosRow: {
    gap: 8,
    paddingBottom: 12,
  },
  filtroChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eef2f7",
    marginRight: 8,
  },
  filtroChipAtivo: {
    backgroundColor: colors.laranjado,
  },
  filtroChipTexto: {
    color: colors.cinza,
    fontWeight: "600",
    fontSize: 13,
  },
  filtroChipTextoAtivo: {
    color: colors.white,
  },
  resumoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resumoTexto: {
    color: colors.cinza,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8edf3",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  suiteNome: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  eventoNome: {
    fontSize: 12,
    color: colors.cinza,
    marginTop: 2,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTexto: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  linhaInfo: {
    marginTop: 6,
  },
  rotulo: {
    fontSize: 11,
    color: colors.cinza,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  valor: {
    fontSize: 14,
    color: colors.cinza,
    marginTop: 2,
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
    marginTop: 14,
    backgroundColor: colors.laranjado,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
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
