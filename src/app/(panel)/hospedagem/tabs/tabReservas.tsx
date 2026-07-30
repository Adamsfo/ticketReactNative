import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  corStatusReserva,
  FiltroRapidoReserva,
  getReservasAdmin,
  labelStatusReserva,
  OrdenacaoReservas,
  ReservaAdminCard,
} from "@/src/lib/hospedagemAdmin";
import ResumoFinanceiroRecepcao from "../components/ResumoFinanceiroRecepcao";
import OrigemReservaIndicador from "../components/OrigemReservaIndicador";
import SyncStatusIndicator from "../components/SyncStatusIndicator";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";

const FILTROS: Array<{
  key: Exclude<FiltroRapidoReserva, null>;
  label: string;
}> = [
  { key: "todos", label: "Todas" },
  { key: "sync_erro", label: "Falhas sync" },
  { key: "online", label: "Online" },
  { key: "atendente", label: "Atendente" },
  { key: "hoje", label: "Hoje" },
  { key: "confirmadas", label: "Confirmadas" },
  { key: "canceladas", label: "Canceladas" },
  { key: "expiradas", label: "Expiradas" },
  { key: "checkout_realizado", label: "Check-out realizado" },
  { key: "aguardando_pagamento", label: "Aguardando pagamento" },
];

const ORDENACOES: Array<{ key: OrdenacaoReservas; label: string }> = [
  { key: "recentes", label: "Mais recentes" },
  { key: "antigas", label: "Mais antigas" },
  { key: "checkin", label: "Check-in" },
  { key: "checkout", label: "Check-out" },
  { key: "nome", label: "Nome" },
];

function formatHoraParte(iso: string): { data: string; hora: string } {
  try {
    return {
      data: formatInTimeZone(parseISO(String(iso)), "America/Cuiaba", "dd/MM"),
      hora: formatInTimeZone(parseISO(String(iso)), "America/Cuiaba", "HH:mm"),
    };
  } catch {
    try {
      const d = parseISO(String(iso));
      return { data: format(d, "dd/MM"), hora: format(d, "HH:mm") };
    } catch {
      return { data: "--/--", hora: "--:--" };
    }
  }
}

function CardReserva({
  item,
  onPress,
}: {
  item: ReservaAdminCard;
  onPress: () => void;
}) {
  const checkin = formatHoraParte(item.checkin);
  const checkout = formatHoraParte(item.checkout);
  const cor = corStatusReserva(item.status);
  const adultos = item.totalAdultos ?? item.adultos;
  const criancas = item.totalCriancas ?? item.criancas;
  const responsavel = item.nomeResponsavel || item.responsavel;
  const numero = item.numeroReserva || item.idReservaHospedagem || item.id;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cor }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardBody}>
          <Text style={styles.suiteNome}>{item.nomeSuite}</Text>
          <Text style={styles.reservaId}>Reserva #{numero}</Text>
          <Text style={styles.responsavel}>{responsavel}</Text>

          <OrigemReservaIndicador dados={item} variante="card" />
          {item.syncIntegracao?.uiStatus ? (
            <SyncStatusIndicator
              sync={item.syncIntegracao as any}
              compact={false}
            />
          ) : null}

          <View style={styles.periodoRow}>
            <View style={styles.periodoCol}>
              <Text style={styles.periodoData}>{checkin.data}</Text>
              <Text style={styles.periodoHora}>{checkin.hora}</Text>
            </View>
            <Text style={styles.seta}>→</Text>
            <View style={styles.periodoCol}>
              <Text style={styles.periodoData}>{checkout.data}</Text>
              <Text style={styles.periodoHora}>{checkout.hora}</Text>
            </View>
          </View>

          <Text style={styles.ocupacao}>
            {adultos} {adultos === 1 ? "adulto" : "adultos"}
            {criancas > 0
              ? `  ·  ${criancas} ${criancas === 1 ? "criança" : "crianças"}`
              : ""}
          </Text>

          <ResumoFinanceiroRecepcao dados={item} compact />

          <View style={styles.statusValorRow}>
            <View style={[styles.statusBadge, { backgroundColor: cor }]}>
              <Text style={styles.statusTexto}>
                {labelStatusReserva(item.status)}
              </Text>
            </View>
            <Text style={styles.valorTotal}>
              {formatCurrency(Number(item.valorTotal || 0))}
            </Text>
          </View>
        </View>
        <Text style={styles.chevron}>{">"}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function TabReservas() {
  const navigation = useNavigation() as any;
  const {
    refreshVersion,
    filtroSyncErroPedido,
    limparFiltroSyncErroPedido,
  } = useHospedagemAdminRefresh();
  const [buscaInput, setBuscaInput] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroRapidoReserva>("todos");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoReservas>("recentes");
  const [reservas, setReservas] = useState<ReservaAdminCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (filtroSyncErroPedido) {
      setFiltro("sync_erro");
      limparFiltroSyncErroPedido();
    }
  }, [filtroSyncErroPedido, limparFiltroSyncErroPedido]);

  useEffect(() => {
    const timer = setTimeout(() => setBusca(buscaInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [buscaInput]);

  const carregar = useCallback(
    async (pagina: number, append: boolean) => {
      const requestId = ++requestIdRef.current;
      if (pagina === 1 && !append) {
        setLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }

      try {
        const response = await getReservasAdmin({
          busca,
          filtro: filtro || "todos",
          ordenacao,
          page: pagina,
          pageSize: 20,
        });

        if (requestId !== requestIdRef.current) return;

        const lista = response.data ?? [];
        const meta = response.meta;
        setReservas((prev) => (append ? [...prev, ...lista] : lista));
        setPage(pagina);
        setHasMore(Boolean(meta?.hasMore));
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (!append) setReservas([]);
        setHasMore(false);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [busca, filtro, ordenacao],
  );

  useEffect(() => {
    carregar(1, false);
  }, [carregar]);

  useEffect(() => {
    if (refreshVersion === 0) return;
    carregar(1, false);
  }, [refreshVersion, carregar]);

  const onRefresh = () => {
    setRefreshing(true);
    carregar(1, false);
  };

  const onEndReached = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    carregar(page + 1, true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buscaBox}>
        <Feather name="search" size={20} color={colors.cinza} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar responsável, hóspede, reserva, telefone..."
          placeholderTextColor="#888"
          value={buscaInput}
          onChangeText={setBuscaInput}
        />
      </View>

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

      <FlatList
        horizontal
        data={ORDENACOES}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosScroll}
        style={styles.ordenacaoWrap}
        renderItem={({ item }) => {
          const ativo = ordenacao === item.key;
          return (
            <TouchableOpacity
              style={[styles.ordenacaoChip, ativo && styles.ordenacaoChipAtivo]}
              onPress={() => setOrdenacao(item.key)}
            >
              <Text
                style={[
                  styles.ordenacaoTexto,
                  ativo && styles.ordenacaoTextoAtivo,
                ]}
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
          <Text style={styles.estadoTexto}>Carregando reservas...</Text>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) =>
            String(item.idReservaHospedagem || item.numeroReserva || item.id)
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.35}
          ListEmptyComponent={
            <View style={styles.vazioBox}>
              <Feather name="inbox" size={48} color="#999" />
              <Text style={styles.vazio}>Nenhuma reserva encontrada.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                color={colors.azul}
              />
            ) : (
              <View style={{ height: 40 }} />
            )
          }
          renderItem={({ item }) => (
            <CardReserva
              item={item}
              onPress={() =>
                navigation.navigate("hospedagemReservaDetalhe", {
                  idReserva:
                    item.idReservaHospedagem || item.numeroReserva || item.id,
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  buscaBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  buscaInput: {
    flex: 1,
    fontSize: 15,
    color: colors.cinza,
    paddingVertical: 4,
  },
  filtrosWrap: {
    maxHeight: 48,
    marginBottom: 8,
    flexGrow: 0,
  },
  ordenacaoWrap: {
    maxHeight: 40,
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
  ordenacaoChip: {
    backgroundColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  ordenacaoChipAtivo: {
    borderColor: colors.azul,
    backgroundColor: "rgba(0,115,230,0.12)",
  },
  ordenacaoTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.cinza,
  },
  ordenacaoTextoAtivo: {
    color: colors.azul,
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
  reservaId: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  responsavel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.cinza,
    marginTop: 8,
  },
  periodoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  periodoCol: {
    minWidth: 56,
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
  statusValorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusTexto: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  valorTotal: {
    fontSize: 15,
    fontWeight: "700",
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
});
