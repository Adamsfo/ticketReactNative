import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import colors from "@/src/constants/colors";
import { Evento, Ingresso } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { useRoute } from "@react-navigation/native";
import ModalCortesia from "./modalCortesia";
import ModalCancelarCortesia from "./ModalCancelarCortesia";
import ModalMsg from "@/src/components/ModalMsg";
import { useAuth } from "@/src/contexts_/AuthContext";
import ListPagination from "@/src/components/ListPagination";

const { width } = Dimensions.get("window");
const PAGE_SIZE = 20;

type IngressoListMeta = {
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
};

export default function TabCortesia() {
  const route = useRoute();
  const endpointApi = "/ingresso/cortesias";
  const { id } = route.params as { id: number };
  const [registros, setRegistros] = useState<Ingresso[]>([]);
  const [registroEvento, setRegistroEvento] = useState<Evento>();
  const [visibleModalCortesia, setVisibleModalCortesia] = useState(false);
  const { user } = useAuth();
  const [modalMsg, setModalMsg] = useState(false);
  const [msg, setMsg] = useState("");
  const [pesquisaInput, setPesquisaInput] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [cortesiaParaCancelar, setCortesiaParaCancelar] =
    useState<Ingresso | null>(null);
  const requestIdRef = useRef(0);

  const data = [
    { label: "Código" },
    { label: "Setor" },
    { label: "Ingresso" },
    { label: "Nome Usuário" },
    { label: "Nome Impresso" },
    { label: "Status" },
    { label: "Reenviar via WhatsApp", isButton: true },
    { label: "Cancelar cortesia", isButton: true },
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const responseEvento = await apiGeral.getResourceById<Evento>(
          "/evento",
          id,
        );
        if (!cancelled) {
          setRegistroEvento(responseEvento as unknown as Evento);
        }
      } catch {
        if (!cancelled) {
          setRegistroEvento(undefined);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => setPesquisa(pesquisaInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [pesquisaInput]);

  const carregar = useCallback(
    async (pagina: number) => {
      const requestId = ++requestIdRef.current;
      setLoading(true);

      try {
        const response = await apiGeral.getResource<Ingresso>(endpointApi, {
          idEvento: id,
          pageSize: PAGE_SIZE,
          page: pagina,
          ...(pesquisa ? { search: pesquisa } : {}),
        });

        if (requestId !== requestIdRef.current) return;

        const registrosData = response.data ?? [];
        const meta = (response.meta ?? {}) as IngressoListMeta;

        setRegistros(registrosData);
        setPage(pagina);
        setTotalPages(Math.max(1, meta.totalPages ?? 1));
        setTotalItems(meta.totalItems ?? registrosData.length);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setRegistros([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [endpointApi, id, pesquisa],
  );

  useEffect(() => {
    setPage(1);
    carregar(1);
  }, [pesquisa, carregar]);

  const irParaPagina = useCallback(
    (novaPagina: number) => {
      const destino = Math.min(Math.max(1, novaPagina), totalPages);
      if (destino === page) return;
      carregar(destino);
    },
    [carregar, page, totalPages],
  );

  const handleModalNovo = () => {
    setVisibleModalCortesia(true);
  };

  const reenviarIngressoWhatsApp = async (idIngresso: number) => {
    await apiGeral.createResource("/enviaingressowhatsapp", {
      idIngresso,
    });
    setMsg("Ingresso reenviado com sucesso no WhatsApp " + user?.telefone);
    setModalMsg(true);
  };

  const abrirCancelamento = (item: Ingresso) => {
    setCortesiaParaCancelar(item);
    setModalCancelarVisible(true);
  };

  const fecharCancelamento = () => {
    if (modalCancelarVisible) {
      setModalCancelarVisible(false);
      setCortesiaParaCancelar(null);
    }
  };

  const confirmarCancelamento = async () => {
    if (!cortesiaParaCancelar) return;

    const ret = await apiGeral.createResource(
      `/ingresso/${cortesiaParaCancelar.id}/cancelar-cortesia`,
      {},
    );

    if (!ret.success) {
      setMsg(ret.message ?? "Não foi possível cancelar a cortesia.");
      setModalMsg(true);
      return;
    }

    setModalCancelarVisible(false);
    setCortesiaParaCancelar(null);
    setMsg("Cortesia cancelada com sucesso.");
    setModalMsg(true);

    const eraUltimoDaPagina = registros.length === 1;
    const paginaDestino =
      eraUltimoDaPagina && page > 1 ? page - 1 : page;
    await carregar(paginaDestino);
  };

  const podeCancelarCortesia = (status?: string) =>
    status === "Confirmado" || status === "Reservado";

  const listaVazia = !loading && registros.length === 0;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{registroEvento?.nome}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.area}>
          <View
            style={{
              alignItems: "flex-end",
              marginBottom:
                Platform.OS === "web" ? (width <= 1000 ? 10 : 0) : 10,
            }}
          >
            <TouchableOpacity
              style={styles.newButton}
              onPress={handleModalNovo}
            >
              <Text style={styles.newButtonText}>Novo</Text>
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.label}>Pesquisa</Text>
            <TextInput
              style={styles.input}
              multiline={Platform.OS === "web" ? false : true}
              placeholder="Pesquisar por código, usuário ou nome impresso..."
              keyboardType="default"
              value={pesquisaInput}
              onChangeText={setPesquisaInput}
            />
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.azul} />
            </View>
          ) : null}

          {listaVazia ? (
            <Text style={styles.emptyText}>Nenhuma cortesia encontrada.</Text>
          ) : null}

          {!loading && registros.length > 0 ? (
            <>
              {Platform.OS === "web" && <CustomGridTitle data={data} />}
              {registros.map((item: Ingresso, index: number) => (
                <CustomGrid
                  key={item.id ?? index}
                  data={[
                    {
                      label: data[0].label,
                      content: item.id.toString(),
                      id: item.id,
                    },
                    {
                      label: data[1].label,
                      content: item.TipoIngresso_descricao ?? "",
                      id: item.id,
                    },
                    {
                      label: data[2].label,
                      content: item.EventoIngresso_nome ?? "",
                      id: item.id,
                    },
                    {
                      label: data[3].label,
                      content: item.Usuario_nomeCompleto ?? "",
                      id: item.id,
                    },
                    {
                      label: data[4].label,
                      content: item.nomeImpresso ?? "",
                      id: item.id,
                    },
                    {
                      label: data[5].label,
                      content: item.status ?? "",
                      id: item.id,
                    },
                    {
                      id: item.id,
                      label: data[6].label,
                      iconName: "message-circle",
                      isButton: true,
                      onPress: () => reenviarIngressoWhatsApp(item.id),
                    },
                    ...(podeCancelarCortesia(item.status)
                      ? [
                          {
                            id: item.id,
                            label: data[7].label,
                            iconName: "x-circle" as const,
                            isButton: true,
                            actionBackgroundColor: "#dc3545",
                            onPress: () => abrirCancelamento(item),
                          },
                        ]
                      : []),
                  ]}
                />
              ))}
              <ListPagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                loading={loading}
                onPageChange={irParaPagina}
                itemLabelSingular="cortesia"
                itemLabelPlural="cortesias"
              />
            </>
          ) : null}
        </View>
      </ScrollView>
      <Modal visible={visibleModalCortesia} transparent animationType="fade">
        <ModalCortesia
          idEvento={id}
          onClose={() => {
            setVisibleModalCortesia(false);
            carregar(page);
          }}
        />
      </Modal>
      <Modal visible={modalCancelarVisible} transparent animationType="fade">
        <ModalCancelarCortesia
          visible={modalCancelarVisible}
          codigo={cortesiaParaCancelar?.id ?? 0}
          nomeImpresso={cortesiaParaCancelar?.nomeImpresso ?? ""}
          onClose={fecharCancelamento}
          onConfirm={confirmarCancelamento}
        />
      </Modal>
      <Modal visible={modalMsg} transparent animationType="fade">
        <ModalMsg
          onClose={() => {
            setModalMsg(false);
          }}
          msg={msg}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginBottom: 20,
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
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
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
  label: {
    color: colors.zinc,
    marginBottom: 4,
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
  loadingBox: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: colors.cinza,
    fontSize: 16,
    marginTop: 8,
    marginBottom: 8,
  },
});
