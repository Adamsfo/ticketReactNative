import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const PAGE_SIZE = 20;

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

function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push("ellipsis");
  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);

  return items;
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

function PaginacaoReservas({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const paginationItems = useMemo(
    () => buildPaginationItems(page, totalPages),
    [page, totalPages],
  );

  if (totalPages <= 1 && total === 0) {
    return null;
  }

  const podeAnterior = page > 1 && !loading;
  const podeProxima = page < totalPages && !loading;

  return (
    <View style={styles.paginacaoBox}>
      <Text style={styles.paginacaoResumo}>
        Página {page} de {Math.max(totalPages, 1)}
      </Text>
      <Text style={styles.paginacaoTotal}>
        {total} {total === 1 ? "reserva" : "reservas"}
      </Text>

      {totalPages > 1 ? (
        <View style={styles.paginacaoControles}>
          <TouchableOpacity
            style={[
              styles.paginacaoNavBtn,
              !podeAnterior && styles.paginacaoNavBtnDisabled,
            ]}
            onPress={() => onPageChange(page - 1)}
            disabled={!podeAnterior}
          >
            <Text
              style={[
                styles.paginacaoNavTexto,
                !podeAnterior && styles.paginacaoNavTextoDisabled,
              ]}
            >
              Anterior
            </Text>
          </TouchableOpacity>

          <View style={styles.paginacaoNumeros}>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <Text key={`ellipsis-${index}`} style={styles.paginacaoEllipsis}>
                  ...
                </Text>
              ) : (
                <TouchableOpacity
                  key={`page-${item}`}
                  style={[
                    styles.paginacaoNumeroBtn,
                    item === page && styles.paginacaoNumeroBtnAtivo,
                  ]}
                  onPress={() => onPageChange(item)}
                  disabled={loading || item === page}
                >
                  <Text
                    style={[
                      styles.paginacaoNumeroTexto,
                      item === page && styles.paginacaoNumeroTextoAtivo,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.paginacaoNavBtn,
              !podeProxima && styles.paginacaoNavBtnDisabled,
            ]}
            onPress={() => onPageChange(page + 1)}
            disabled={!podeProxima}
          >
            <Text
              style={[
                styles.paginacaoNavTexto,
                !podeProxima && styles.paginacaoNavTextoDisabled,
              ]}
            >
              Próxima
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
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
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
    async (pagina: number) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const response = await getReservasAdmin({
          busca,
          filtro: filtro || "todos",
          ordenacao,
          page: pagina,
          pageSize: PAGE_SIZE,
        });

        if (requestId !== requestIdRef.current) return;

        const lista = response.data ?? [];
        const meta = response.meta;
        setReservas(lista);
        setPage(pagina);
        setTotalPages(Math.max(1, meta?.totalPages ?? 1));
        setTotal(meta?.total ?? 0);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setReservas([]);
        setTotalPages(1);
        setTotal(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [busca, filtro, ordenacao],
  );

  useEffect(() => {
    setPage(1);
    carregar(1);
  }, [busca, filtro, ordenacao, carregar]);

  useEffect(() => {
    if (refreshVersion === 0) return;
    carregar(page);
  }, [refreshVersion, carregar, page]);

  const onRefresh = () => {
    setRefreshing(true);
    carregar(page);
  };

  const irParaPagina = (novaPagina: number) => {
    const destino = Math.min(Math.max(1, novaPagina), totalPages);
    if (destino === page) return;
    setPage(destino);
    carregar(destino);
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

      {!loading || refreshing ? (
        <PaginacaoReservas
          page={page}
          totalPages={totalPages}
          total={total}
          loading={loading && !refreshing}
          onPageChange={irParaPagina}
        />
      ) : null}

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
          ListEmptyComponent={
            <View style={styles.vazioBox}>
              <Feather name="inbox" size={48} color="#999" />
              <Text style={styles.vazio}>Nenhuma reserva encontrada.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 24 }} />}
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
  paginacaoBox: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 4,
  },
  paginacaoResumo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.cinza,
  },
  paginacaoTotal: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  paginacaoControles: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  paginacaoNavBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,115,230,0.08)",
  },
  paginacaoNavBtnDisabled: {
    opacity: 0.45,
  },
  paginacaoNavTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.azul,
  },
  paginacaoNavTextoDisabled: {
    color: "#888",
  },
  paginacaoNumeros: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    flex: 1,
  },
  paginacaoNumeroBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  paginacaoNumeroBtnAtivo: {
    backgroundColor: colors.azul,
  },
  paginacaoNumeroTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.cinza,
  },
  paginacaoNumeroTextoAtivo: {
    color: colors.branco,
  },
  paginacaoEllipsis: {
    fontSize: 14,
    color: "#888",
    paddingHorizontal: 4,
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
