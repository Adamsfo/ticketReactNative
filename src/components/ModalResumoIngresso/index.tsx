import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  FlatList,
  Button,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "../FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

interface ModalResumoIngressoProps {
  zerarItem: (id: number) => void;
}

export default function ModalResumoIngresso({
  zerarItem,
}: ModalResumoIngressoProps) {
  const route = useRoute();
  const { state, dispatch } = useCart();
  const [visibleDetalhe, setVisibleDetalhe] = React.useState(false);
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };

  const removeItemFromCart = (id: number) => {
    dispatch({ type: "REMOVE_ITEM", id });
    zerarItem(id);
  };

  const calculateTotal = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.preco;
      }, 0)
      .toFixed(2);
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={{ flex: 1 }}></View>
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity>
              {/* <Feather name="share" size={30} color="#212743" /> */}
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={30} color="#212743" />
          </TouchableOpacity> */}
          </View>

          <View style={styles.area}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                // width: "100%",
                paddingHorizontal: 30,
              }}
            >
              <Text style={styles.title}>
                Total: {formatCurrency(calculateTotal())} + taxas
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
          <View style={styles.footer}>
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
              onPress={() =>
                navigation.navigate("conferencia", {
                  id: id,
                })
              }
            >
              <Text style={styles.buttonText}>Proximo</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingBottom: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
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
    left: Platform.OS === "web" ? "35%" : "10%", // Centraliza horizontalmente
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "transparent",
    width: Platform.OS === "web" ? 500 : "80%",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
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
