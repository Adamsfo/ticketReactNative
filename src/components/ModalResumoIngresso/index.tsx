import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  FlatList,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "../FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ingresso,
  IngressoTransacao,
  QueryParams,
  Transacao,
  Usuario,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import ModalMsg from "../ModalMsg";
import Login from "@/src/app/(auth)/singin/page";
import { apiAuth } from "@/src/lib/auth";
import ModalLogin from "@/src/app/(auth)/singin/ModalLogin";
import { useAuth } from "@/src/contexts_/AuthContext";
import { Switch } from "react-native-gesture-handler";
import ModalCondicoesCompra from "../ModalCondicoesCompra";

const { width } = Dimensions.get("window");

interface ModalResumoIngressoProps {
  step: number;
  RegistroTransacao?: Transacao;
  IngressoTransacao?: IngressoTransacao[];
  UsuarioVenda?: Usuario;
}

export default function ModalResumoIngresso({
  step,
  RegistroTransacao,
  IngressoTransacao,
  UsuarioVenda,
}: ModalResumoIngressoProps) {
  const route = useRoute();
  const { state, dispatch } = useCart();
  const [visibleDetalhe, setVisibleDetalhe] = React.useState(false);
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };
  const [visibleLogin, setVisibleLogin] = React.useState(false);
  const [visibleMsg, setVisibleMsg] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const { user, isPDV } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [aceiteCompra, setAceiteCompra] = React.useState(false);
  const [visibleCondicoesCompra, setVisibleCondicoesCompra] =
    React.useState(false);

  const removeItemFromCart = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", id });
  };

  const calculatePreco = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.preco;
      }, 0)
      .toFixed(2);
  };

  const calculateValor = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.valor;
      }, 0)
      .toFixed(2);
  };

  const calculateTaxa = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.taxaServico;
      }, 0)
      .toFixed(2);
  };

  const handleCriarTransacao = async () => {
    try {
      dispatch({ type: "REMOVE_TRANSACAO" });

      if (!user?.id) {
        setVisibleLogin(true);
        return;
      }

      if (state.items.length === 0) {
        setMsg("Não existe ingresso no carrinho.");
        setVisibleMsg(true);
        return;
      }

      if (isPDV && !UsuarioVenda?.id) {
        setMsg("Não existe cliente selecionado para a venda.");
        setVisibleMsg(true);
        return;
      }

      setLoading(true);

      const response = await apiGeral.createResource<Transacao>("/transacao", {
        idUsuario: isPDV ? UsuarioVenda?.id : user.id,
        preco: calculatePreco(),
        taxaServico: calculateTaxa(),
        valorTotal: calculateValor(),
        idEvento: state.items[0].eventoIngresso.idEvento,
      });

      dispatch({
        type: "ADD_TRANSACAO",
        transacao: response.data,
      });

      await gerarIngressos(response.data.id);
    } catch (error) {
      setLoading(false);
    }
  };

  const gerarIngressos = async (idTransacao: number) => {
    if (state.items.length > 0) {
      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i];
        for (let j = 0; j < item.qtde; j++) {
          let json = await apiGeral.createResource<Ingresso>("/ingresso", {
            idEvento: item.eventoIngresso.idEvento,
            idEventoIngresso: item.eventoIngresso.id,
            idTipoIngresso: item.eventoIngresso.idTipoIngresso,
            idUsuario: isPDV ? UsuarioVenda?.id : user?.id,
            idTransacao: idTransacao,
          });
          let ingresso = json.data as unknown as Ingresso;
        }
      }
    }

    setLoading(false);

    navigation.navigate("conferencia", {
      idTransacao: idTransacao,
      idEvento: id,
    });
  };

  const handelCloseLogin = () => {
    setVisibleLogin(false);
    navigation.navigate("ingressos", { id: id });
  };

  const handelCloseMsg = () => {
    setVisibleMsg(false);
  };

  const handelCloseCondicoesCompra = () => {
    setVisibleCondicoesCompra(false);
  };

  const handlePagamento = async () => {
    try {
      if (!user?.id) {
        setVisibleLogin(true);
        return;
      }

      if (!(IngressoTransacao ?? [])[0]) {
        setMsg("Não existe ingresso para este evento.");
        setVisibleMsg(true);
        return;
      }

      if (!aceiteCompra) {
        setMsg("Aceitar condições de compra para continuar.");
        setVisibleMsg(true);
        return;
      }

      if (
        IngressoTransacao &&
        IngressoTransacao.some((ingresso) => !ingresso.Ingresso_nomeImpresso)
      ) {
        setMsg("Necessário informar nome para todos os ingresso.");
        setVisibleMsg(true);
        return;
      }

      setLoading(true);

      //atualizar os ingressos
      for (let i = 0; i < (IngressoTransacao ?? []).length; i++) {
        const item = (IngressoTransacao ?? [])[i];
        console.log("item", item);
        await apiGeral.updateResorce<Ingresso>("/ingressonome", {
          id: item.idIngresso,
          nomeImpresso: item.Ingresso_nomeImpresso,
        });
      }

      navigation.navigate("pagamento", {
        idEvento: IngressoTransacao?.[0]?.Ingresso_Evento?.id ?? 0,
        registroTransacao: RegistroTransacao,
      });

      setLoading(false);
    } catch (error) {}
  };

  const handlePagamentoPDV = async () => {
    try {
      if (!user?.id) {
        setVisibleLogin(true);
        return;
      }

      if (!(IngressoTransacao ?? [])[0]) {
        setMsg("Não existe ingresso para este evento.");
        setVisibleMsg(true);
        return;
      }

      // if (!aceiteCompra) {
      //   setMsg("Aceitar condições de compra para continuar.");
      //   setVisibleMsg(true);
      //   return;
      // }

      // if (
      //   IngressoTransacao &&
      //   IngressoTransacao.some((ingresso) => !ingresso.Ingresso_nomeImpresso)
      // ) {
      //   setMsg("Necessário informar nome para todos os ingresso.");
      //   setVisibleMsg(true);
      //   return;
      // }

      setLoading(true);

      //atualizar os ingressos
      // for (let i = 0; i < (IngressoTransacao ?? []).length; i++) {
      //   const item = (IngressoTransacao ?? [])[i];
      //   console.log("item", item);
      //   await apiGeral.updateResorce<Ingresso>("/ingressonome", {
      //     id: item.idIngresso,
      //     nomeImpresso: item.Ingresso_nomeImpresso,
      //   });
      // }

      navigation.navigate("pagamentopdv", {
        idEvento: IngressoTransacao?.[0]?.Ingresso_Evento?.id ?? 0,
        registroTransacao: RegistroTransacao,
      });

      setLoading(false);
    } catch (error) {}
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={{ flex: 1 }}></View>
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View
            style={[
              styles.header,
              {
                paddingVertical: 3,
              },
            ]}
          >
            <TouchableOpacity></TouchableOpacity>
          </View>

          <View style={styles.area}>
            {step === 1 && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  // width: "100%",
                  paddingHorizontal: 30,
                }}
              >
                <Text style={styles.title}>
                  Total:{" "}
                  {formatCurrency(calculatePreco()) +
                    " (+ Taxa: " +
                    formatCurrency(calculateTaxa()) +
                    ")"}
                </Text>
                <TouchableOpacity
                  onPress={() => setVisibleDetalhe(!visibleDetalhe)}
                >
                  <Feather
                    style={{ paddingLeft: 20 }}
                    name={
                      visibleDetalhe ? "arrow-down-circle" : "arrow-up-circle"
                    }
                    size={30}
                    color={colors.azul}
                  />
                </TouchableOpacity>
              </View>
            )}
            {step === 2 && (
              <View
                style={{
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  // paddingHorizontal: 30,
                }}
              >
                <Text style={styles.title}>
                  Total:{" "}
                  {formatCurrency(RegistroTransacao?.valorTotal ?? "0.00")}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    // paddingHorizontal: 30,
                  }}
                >
                  <Switch
                    trackColor={{ false: colors.cinza, true: colors.azul }}
                    thumbColor={colors.azul}
                    // ios_backgroundColor={colors.cinza}
                    onValueChange={(value) => {
                      setAceiteCompra(!aceiteCompra);
                    }}
                    value={aceiteCompra}
                  ></Switch>
                  <Text
                    style={[styles.title, { paddingLeft: 8, marginTop: -2 }]}
                  >
                    Li e aceito as condições de compra
                    <Feather
                      name="info"
                      size={20}
                      color={colors.azul}
                      style={{ paddingLeft: 5 }}
                      onPress={() => {
                        setVisibleCondicoesCompra(true);
                      }}
                    />
                  </Text>
                </View>
              </View>
            )}
            {visibleDetalhe && (
              <View style={{ flexDirection: "row" }}>
                <FlatList
                  data={state.items}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 3,
                        marginHorizontal: 5,
                      }}
                    >
                      <View>
                        <View
                          style={{
                            flexDirection: "row",
                          }}
                        >
                          <Text
                            style={{
                              paddingHorizontal: 3,
                              fontWeight: "bold",
                              fontSize: 14,
                            }}
                          >
                            {item.qtde} x
                          </Text>
                          <Text style={{ paddingHorizontal: 3, fontSize: 14 }}>
                            {item.eventoIngresso.TipoIngresso_descricao}
                          </Text>
                          <Text style={{ paddingHorizontal: 3, fontSize: 14 }}>
                            {item.eventoIngresso.nome}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              paddingHorizontal: 3,
                              fontWeight: "bold",
                              fontSize: 14,
                            }}
                          >
                            {formatCurrency(
                              (item.qtde * item.eventoIngresso.preco).toFixed(2)
                            ) +
                              " (+ Taxa: " +
                              formatCurrency(
                                (
                                  item.qtde * item.eventoIngresso.taxaServico
                                ).toFixed(2)
                              ) +
                              ")"}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end", flex: 1 }}>
                        <TouchableOpacity
                          style={[styles.button, styles.buttonRemove]}
                          onPress={() => removeItemFromCart(item.id)}
                        >
                          <Text style={[styles.buttonTextRemove]}>Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
          <View style={[styles.footer, { paddingTop: 10 }]}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() =>
                navigation.navigate("ingressos", {
                  id: RegistroTransacao?.idEvento,
                })
              }
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={() => {
                if (step === 1) {
                  handleCriarTransacao();
                }
                if (step === 2) {
                  if (isPDV) {
                    handlePagamentoPDV();
                  } else {
                    handlePagamento();
                  }
                }
              }}
              disabled={loading}
            >
              {loading && (
                <ActivityIndicator
                  size="small"
                  color={colors.laranjado}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal visible={visibleLogin} transparent animationType="slide">
          <ModalLogin onClose={() => handelCloseLogin()} />
        </Modal>
        <Modal
          visible={visibleMsg}
          transparent
          animationType="fade"
          onRequestClose={handelCloseMsg}
        >
          <TouchableWithoutFeedback onPress={handelCloseMsg}>
            <View style={{ flex: 1 }}>
              <ModalMsg onClose={handelCloseMsg} msg={msg} />
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal
          visible={visibleCondicoesCompra}
          transparent
          animationType="fade"
          onRequestClose={handelCloseCondicoesCompra}
        >
          <TouchableWithoutFeedback onPress={handelCloseCondicoesCompra}>
            <View style={{ flex: 1 }}>
              <ModalCondicoesCompra
                onClose={handelCloseCondicoesCompra}
                idEvento={id}
              />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    // borderTopLeftRadius: 10,
    // borderTopRightRadius: 10,
    borderRadius: 20,
    paddingBottom: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.cinza,
  },
  modal: {
    position: "absolute",
    left: Platform.OS === "web" ? (width <= 1000 ? "5%" : "35%") : "5%", // Centraliza horizontalmente
    right: Platform.OS === "web" ? (width <= 1000 ? "5%" : "35%") : "5%", // Centraliza horizontalmente
    bottom: 15,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "transparent",
    // width: Platform.OS === "web" ? 500 : "80%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderRadius: 8,
    paddingHorizontal: 10,
    // marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  buttonRemove: {
    backgroundColor: colors.branco,
  },
  buttonTextRemove: {
    color: colors.azul,
    fontWeight: "bold",
  },
});
