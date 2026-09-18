import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import Footer from "@/src/components/Footer";
import { Badge } from "@/src/components/Badge";
import MinhaReservaCard from "@/src/components/minhasReservas/MinhaReservaCard";
import ModalMsg from "@/src/components/ModalMsg";
import ModalMsgSimNao from "@/src/components/ModalMsgSimNao";
import formatCurrency from "@/src/components/FormatCurrency";
import RemarcarReservaModal from "@/src/components/minhasReservas/RemarcarReservaModal";
import AcaoIndisponivelModal from "@/src/components/minhasReservas/AcaoIndisponivelModal";
import {
  resolverMensagemBloqueioCancelamento,
  resolverMensagemBloqueioRemarcacao,
  TITULO_BLOQUEIO_CANCELAMENTO,
  TITULO_BLOQUEIO_REMARCACAO,
} from "@/src/lib/minhasReservasAcoes";
import {
  cancelarMinhaReserva,
  formatarMensagemResultadoCancelamentoMinhaReserva,
  FiltroStatusMinhasReservas,
  getMinhaReservaDetalhe,
  getMinhasReservas,
  MinhaReservaCard as MinhaReservaCardType,
  MinhaReservaDetalhe,
} from "@/src/lib/reservaSuite";

const { width } = Dimensions.get("window");

const FILTROS: Array<{ key: FiltroStatusMinhasReservas; label: string }> = [
  { key: "confirmadas", label: "Confirmadas" },
  { key: "hospedadas", label: "Hospedadas" },
  { key: "canceladas", label: "Canceladas" },
];

function mensagemVazia(status: FiltroStatusMinhasReservas): string {
  switch (status) {
    case "confirmadas":
      return "Você ainda não possui reservas confirmadas.";
    case "hospedadas":
      return "Você ainda não possui reservas hospedadas.";
    case "canceladas":
      return "Você ainda não possui reservas canceladas.";
    default:
      return "Você ainda não possui reservas nesta categoria.";
  }
}

export default function MinhasReservasPage() {
  const navigation = useNavigation() as any;
  const [status, setStatus] = useState<FiltroStatusMinhasReservas>("confirmadas");
  const [reservas, setReservas] = useState<MinhaReservaCardType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [reservaCancelar, setReservaCancelar] =
    useState<MinhaReservaCardType | null>(null);
  const [modalConfirmarCancelamento, setModalConfirmarCancelamento] =
    useState(false);
  const [modalMsg, setModalMsg] = useState(false);
  const [msgModal, setMsgModal] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const [modalRemarcar, setModalRemarcar] = useState(false);
  const [reservaRemarcar, setReservaRemarcar] =
    useState<MinhaReservaDetalhe | null>(null);
  const [abrindoRemarcacao, setAbrindoRemarcacao] = useState(false);
  const [modalBloqueio, setModalBloqueio] = useState<{
    titulo: string;
    mensagem: string;
  } | null>(null);
  const requestIdRef = useRef(0);

  const formatarCheckin = (valor: string) => {
    try {
      return formatInTimeZone(
        parseISO(String(valor)),
        "America/Cuiaba",
        "dd/MM/yyyy 'às' HH:mm",
      );
    } catch {
      return String(valor);
    }
  };

  const carregar = useCallback(
    async (pagina: number, append: boolean, filtro: FiltroStatusMinhasReservas) => {
      const requestId = ++requestIdRef.current;

      if (!append) {
        setLoading(true);
        setErro(null);
        if (!append && pagina === 1) {
          setReservas([]);
        }
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await getMinhasReservas({
          status: filtro,
          page: pagina,
          pageSize: 20,
        });

        if (requestId !== requestIdRef.current) return;

        if (!response.success) {
          throw new Error(response.message || "Erro ao carregar reservas");
        }

        const lista = response.data ?? [];
        const meta = response.meta;

        setReservas((prev) => (append ? [...prev, ...lista] : lista));
        setPage(pagina);
        setHasMore(Boolean(meta?.hasMore));
        setErro(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        if (!append) {
          setReservas([]);
          setHasMore(false);
          setErro("Não foi possível carregar suas reservas. Tente novamente.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      carregar(1, false, status);
    }, [status, carregar]),
  );

  const trocarFiltro = (novoStatus: FiltroStatusMinhasReservas) => {
    if (novoStatus === status) return;
    setReservas([]);
    setHasMore(false);
    setErro(null);
    setLoading(true);
    setStatus(novoStatus);
  };

  const onEndReached = () => {
    if (loading || loadingMore || erro || !hasMore) return;
    carregar(page + 1, true, status);
  };

  const abrirCancelamento = (item: MinhaReservaCardType) => {
    if (!item.podeCancelar) {
      setModalBloqueio({
        titulo: TITULO_BLOQUEIO_CANCELAMENTO,
        mensagem: resolverMensagemBloqueioCancelamento(item.motivoBloqueio),
      });
      return;
    }

    setReservaCancelar(item);
    setModalConfirmarCancelamento(true);
  };

  const abrirRemarcacao = async (item: MinhaReservaCardType) => {
    if (abrindoRemarcacao) return;

    const remarcacaoPendente = Boolean(item.remarcacao?.remarcacaoPendente);
    if (!remarcacaoPendente && !item.podeRemarcar) {
      setModalBloqueio({
        titulo: TITULO_BLOQUEIO_REMARCACAO,
        mensagem: resolverMensagemBloqueioRemarcacao(
          item.motivoBloqueioRemarcacao ?? item.remarcacao?.motivoBloqueio,
        ),
      });
      return;
    }

    setAbrindoRemarcacao(true);
    try {
      const response = await getMinhaReservaDetalhe(item.id);
      if (!response.success || !response.data) {
        setMsgModal(
          response.message || "Não foi possível abrir a remarcação.",
        );
        setModalMsg(true);
        return;
      }
      setReservaRemarcar(response.data);
      setModalRemarcar(true);
    } catch {
      setMsgModal("Não foi possível abrir a remarcação.");
      setModalMsg(true);
    } finally {
      setAbrindoRemarcacao(false);
    }
  };

  const confirmarCancelamento = async () => {
    if (!reservaCancelar || cancelando) return;

    setCancelando(true);
    try {
      const response = await cancelarMinhaReserva(reservaCancelar.id);
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Não foi possível cancelar a reserva.",
        );
      }

      setMsgModal(
        formatarMensagemResultadoCancelamentoMinhaReserva(response.data),
      );
      setModalMsg(true);
      setModalConfirmarCancelamento(false);
      setReservaCancelar(null);
      carregar(1, false, status);
    } catch (error: any) {
      setMsgModal(
        error?.message || "Não foi possível cancelar a reserva. Tente novamente.",
      );
      setModalMsg(true);
    } finally {
      setCancelando(false);
    }
  };

  const renderConteudo = () => {
    if (loading) {
      return (
        <View style={styles.estadoBox}>
          <ActivityIndicator size="large" color={colors.azul} />
          <Text style={styles.estadoTexto}>Carregando reservas...</Text>
        </View>
      );
    }

    if (erro) {
      return (
        <View style={styles.estadoBox}>
          <Feather name="alert-circle" size={40} color={colors.laranjado} />
          <Text style={styles.estadoTexto}>{erro}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => carregar(1, false, status)}
          >
            <Text style={styles.retryTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={reservas}
        keyExtractor={(item) => String(item.id)}
        style={styles.lista}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listaContent,
          reservas.length === 0 && styles.listaVazia,
          width > 900 && styles.listaDesktop,
        ]}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.35}
        ListEmptyComponent={
          <View style={styles.estadoBox}>
            <Feather name="inbox" size={48} color="#999" />
            <Text style={styles.estadoTexto}>{mensagemVazia(status)}</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={{ marginVertical: 16 }}
              color={colors.azul}
            />
          ) : (
            <View style={{ height: 24 }} />
          )
        }
        renderItem={({ item }) => (
          <MinhaReservaCard
            item={item}
            onPress={() =>
              navigation.navigate("minhasReservaDetalhe", {
                idReserva: item.id,
              })
            }
            onCancelar={() => abrirCancelamento(item)}
            onRemarcar={() => abrirRemarcacao(item)}
          />
        )}
      />
    );
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Minhas Reservas</Text>

        <View style={styles.filtrosRow}>
          {FILTROS.map((filtro) => (
            <TouchableOpacity
              key={filtro.key}
              onPress={() => trocarFiltro(filtro.key)}
            >
              <Badge variant={status === filtro.key ? "default" : "secondary"}>
                {filtro.label}
              </Badge>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.area}>{renderConteudo()}</View>
      </View>
      <Footer />

      <Modal visible={modalConfirmarCancelamento} transparent animationType="fade">
        <ModalMsgSimNao
          onClose={() => {
            if (cancelando) return;
            setModalConfirmarCancelamento(false);
            setReservaCancelar(null);
          }}
          onConfirm={confirmarCancelamento}
          msg={
            reservaCancelar
              ? `Cancelar reserva #${reservaCancelar.numeroReserva}?\n\nCheck-in:\n${formatarCheckin(reservaCancelar.checkin)}\n\nValor pago:\n${formatCurrency(Number(reservaCancelar.valorPago || 0))}\n\nDevolução:\n${reservaCancelar.percentualDevolucao ?? "—"}%\n\nValor a devolver:\n${formatCurrency(Number(reservaCancelar.valorDevolucao || 0))}`
              : ""
          }
        />
      </Modal>

      <Modal visible={modalMsg} transparent animationType="fade">
        <ModalMsg onClose={() => setModalMsg(false)} msg={msgModal} />
      </Modal>

      <AcaoIndisponivelModal
        visible={Boolean(modalBloqueio)}
        titulo={modalBloqueio?.titulo ?? ""}
        mensagem={modalBloqueio?.mensagem ?? ""}
        onClose={() => setModalBloqueio(null)}
      />

      {reservaRemarcar ? (
        <RemarcarReservaModal
          visible={modalRemarcar}
          reserva={reservaRemarcar}
          onClose={() => {
            setModalRemarcar(false);
            setReservaRemarcar(null);
          }}
          onSucesso={() => {
            setModalRemarcar(false);
            setReservaRemarcar(null);
            setMsgModal("Remarcação realizada com sucesso.");
            setModalMsg(true);
            carregar(1, false, status);
          }}
        />
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    paddingTop: 10,
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  filtrosRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    paddingBottom: 8,
  },
  listaVazia: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listaDesktop: {
    maxWidth: 900,
    alignSelf: "center",
    width: "100%",
  },
  estadoBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 12,
  },
  estadoTexto: {
    fontSize: 15,
    color: colors.cinza,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: colors.azul,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryTexto: {
    color: "#fff",
    fontWeight: "600",
  },
});
