import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import formatCurrency from "../FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";

interface CounterTicketProps {
  data: any;
}

const CounterTicket: React.FC<CounterTicketProps> = ({ data }) => {
  // const [count, setCount] = useState(0);
  const { state, dispatch } = useCart();

  const addItemToCart = (qtde: number) => {
    if (qtde < 0) {
      return;
    }
    if (qtde === 0) {
      dispatch({ type: "REMOVE_ITEM", id: data.id });
    } else {
      dispatch({
        type: "ADD_ITEM",
        item: { id: data.id, qtde: qtde, eventoIngresso: data },
      });
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 7,
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
      }}
    >
      <View key={data.id} style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            <View>
              <Text
                style={{ fontWeight: "normal", paddingLeft: 5, fontSize: 18 }}
              >
                {data.nome}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontWeight: "normal", paddingLeft: 5, fontSize: 18 }}
              >
                {formatCurrency(data.preco)}
              </Text>
            </View>
          </View>
          <View
            style={{
              marginLeft: 10,
              alignItems: "center",
              justifyContent: "flex-start", // Alinha os itens no topo
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "rgb(0, 146, 250)",
                  borderRadius: 7,
                }}
                onPress={() =>
                  addItemToCart(
                    (state.items.find((item) => item.id === data.id)?.qtde ||
                      0) - 1
                  )
                }
              >
                <Feather name="minus" size={28} color="white"></Feather>
              </TouchableOpacity>

              <Text style={{ fontSize: 18, marginHorizontal: 5 }}>
                {state.items.find((item) => item.id === data.id)?.qtde || 0}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "rgb(0, 146, 250)",
                  borderRadius: 7,
                }}
                onPress={() =>
                  addItemToCart(
                    (state.items.find((item) => item.id === data.id)?.qtde ||
                      0) + 1
                  )
                }
              >
                <Feather name="plus" size={28} color="white"></Feather>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={{ paddingLeft: 5, fontSize: 14, color: colors.zinc }}>
          {data.descricao}
        </Text>
      </View>
      {/* <View>
        <View
          style={{
            marginLeft: 10,
            alignItems: "center",
            justifyContent: "flex-start", // Alinha os itens no topo
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: "rgb(0, 146, 250)",
                borderRadius: 5,
              }}
              onPress={() => setCount(count + 1)}
            >
              <Feather name="plus" size={28} color="white"></Feather>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, marginHorizontal: 5 }}>{count}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: "rgb(0, 146, 250)",
                borderRadius: 5,
              }}
              onPress={() => setCount(count - 1)}
            >
              <Feather name="minus" size={28} color="white"></Feather>
            </TouchableOpacity>
          </View>
        </View>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
  counterText: {
    fontSize: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default CounterTicket;
