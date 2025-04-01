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

const { width } = Dimensions.get("window");

interface ModalResumoIngressoProps {
  step: number;
}

export default function ModalResumoIngresso({
  step,
}: ModalResumoIngressoProps) {
  const route = useRoute();
  const { state, dispatch } = useCart();
  const [visibleDetalhe, setVisibleDetalhe] = React.useState(false);
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };
  const [visibleMsg, setVisibleMsg] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const { user } = useAuth();

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
      if (!user?.id) {
        setMsg("Necessário cadastrar e entrar com sua conta.");
        setVisibleMsg(true);
        return;
      }

      console.log("Criando transação...");

      const response = await apiGeral.createResource<Transacao>("/transacao", {
        idUsuario: user.id,
        preco: calculatePreco(),
        taxaServico: calculateTaxa(),
        valorTotal: calculateValor(),
      });

      dispatch({
        type: "ADD_TRANSACAO",
        transacao: response.data,
      });

      console.log("Transação criada com sucesso:", response.data);
      await gerarIngressos(response.data.id);
    } catch (error) {}
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
            idUsuario: user?.id,
            idTransacao: idTransacao,
          });
          let ingresso = json.data as unknown as Ingresso;

          console.log("Ingresso gerado:", ingresso); // Verifique o ingresso gerado
        }
      }
    }

    navigation.navigate("conferencia", {
      idTransacao: idTransacao,
      idEvento: id,
    });
  };

  const handelClose = () => {
    setVisibleMsg(false);
    navigation.navigate("ingressos", { id: id });
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
                  Total: {formatCurrency(calculatePreco())} + taxas
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
                  flexDirection: "row",
                  justifyContent: "space-between",
                  // width: "100%",
                  paddingHorizontal: 30,
                }}
              >
                <Text style={styles.title}>
                  Total: {formatCurrency(calculateValor())}
                </Text>
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
                            )}
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
                navigation.navigate("evento", {
                  id: id,
                })
              }
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={() => {
                if (step === 1) {
                  handleCriarTransacao();
                }
                if (step === 2) {
                  navigation.navigate("pagamento", {
                    id: id,
                  });
                }
              }}
            >
              <Text style={styles.buttonText}>Proximo</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* <Modal visible={visibleMsg} transparent animationType="slide">
          <ModalMsg onClose={() => setVisibleMsg(false)} msg={msg} />
        </Modal> */}
        {/* {visibleMsg && ( */}
        <Modal visible={visibleMsg} transparent animationType="slide">
          <ModalLogin onClose={() => handelClose()} />
        </Modal>
        {/* )} */}
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
    fontSize: 18,
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
