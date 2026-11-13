import colors from "@/src/constants/colors";
import { publicTheme } from "@/src/constants/publicTheme";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useCart } from "@/src/contexts_/CartContext";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import formatCurrency from "../FormatCurrency";

interface CounterTicketProps {
  data: any;
  variant?: "default" | "public";
}

const CounterTicket: React.FC<CounterTicketProps> = ({
  data,
  variant = "default",
}) => {
  const { state, dispatch } = useCart();
  const { isPDV } = useAuth();

  const addItemToCart = (qtde: number) => {
    if (qtde < 0) {
      return;
    }

    if (qtde === 0) {
      dispatch({ type: "REMOVE_ITEM", id: data.id });
    } else {
      if (qtde > data.qtde) {
        qtde = data.qtde;
      }
      dispatch({
        type: "ADD_ITEM",
        item: { id: data.id, qtde: qtde, eventoIngresso: data },
      });
    }
  };

  const qtde =
    state.items.find((item) => item.id === data.id)?.qtde || 0;
  const esgotado = data.ingressosConfirmados >= data.qtde;
  const esgotadoLabel = data.TipoIngresso_descricao?.includes("Ingresso")
    ? "ESGOTADO"
    : "VENDIDO";

  if (variant === "public") {
    return (
      <View style={publicStyles.row}>
        <View style={publicStyles.info}>
          {data.lote && data.lote.length > 1 ? (
            <Text style={publicStyles.lote}>{data.lote}</Text>
          ) : null}
          <View style={publicStyles.titleRow}>
            <Text style={publicStyles.nome} numberOfLines={2}>
              {data.nome}
            </Text>
            {esgotado ? (
              <View style={publicStyles.badgeSoldOut}>
                <Text style={publicStyles.badgeSoldOutText}>
                  {esgotadoLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={publicStyles.price}>
            {formatCurrency(data.valor || 0)}
          </Text>
          {data.descricao ? (
            <Text style={publicStyles.desc} numberOfLines={3}>
              {data.descricao}
            </Text>
          ) : null}
        </View>

        <View style={publicStyles.stepper}>
          <TouchableOpacity
            style={[
              publicStyles.stepBtn,
              qtde === 0 && publicStyles.stepBtnMuted,
            ]}
            onPress={() => addItemToCart(qtde - 1)}
            disabled={qtde === 0}
            accessibilityLabel="Diminuir quantidade"
          >
            <Feather name="minus" size={20} color={publicTheme.surface} />
          </TouchableOpacity>
          <Text style={publicStyles.qty}>{qtde}</Text>
          <TouchableOpacity
            style={[
              publicStyles.stepBtn,
              esgotado && publicStyles.stepBtnMuted,
            ]}
            onPress={() => {
              if (!esgotado) {
                addItemToCart(qtde + 1);
              }
            }}
            disabled={esgotado}
            accessibilityLabel="Aumentar quantidade"
          >
            <Feather name="plus" size={20} color={publicTheme.surface} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        paddingBottom: 10,
        paddingTop: 3,
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
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
            }}
          >
            {data.lote.length > 1 && (
              <View>
                <Text
                  style={{
                    fontWeight: "600",
                    paddingLeft: 5,
                    fontSize: 20,
                  }}
                >
                  {data.lote}
                </Text>
              </View>
            )}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontWeight: "600",
                  paddingLeft: 5,
                  fontSize: 20,
                  marginBottom: 2,
                }}
              >
                {data.nome}{" "}
              </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  color: colors.red,
                  fontSize: 20,
                  paddingLeft: 5,
                }}
              >
                {esgotado ? esgotadoLabel : ""}
              </Text>
            </View>
            <View>
              <Text
                style={{ fontWeight: "normal", paddingLeft: 5, fontSize: 18 }}
              >
                {isPDV && (
                  <Text
                    style={{ fontWeight: "bold", paddingLeft: 5, fontSize: 18 }}
                  >
                    {formatCurrency(data.valor)}
                  </Text>
                )}
                {!isPDV && (
                  <Text
                    style={{ fontWeight: "bold", paddingLeft: 5, fontSize: 18 }}
                  >
                    {formatCurrency(data.valor || 0)}
                  </Text>
                )}
              </Text>
            </View>
            <Text style={{ paddingLeft: 5, fontSize: 14, color: colors.zinc }}>
              {data.descricao}
            </Text>
          </View>
          <View
            style={{
              marginLeft: 10,
              alignItems: "center",
              justifyContent: "center",
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
                onPress={() => addItemToCart(qtde - 1)}
              >
                <Feather name="minus" size={28} color="white"></Feather>
              </TouchableOpacity>

              <Text style={{ fontSize: 18, marginHorizontal: 5 }}>{qtde}</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "rgb(0, 146, 250)",
                  borderRadius: 7,
                }}
                onPress={() => {
                  if (data.ingressosConfirmados < data.qtde) {
                    addItemToCart(qtde + 1);
                  }
                }}
              >
                <Feather name="plus" size={28} color="white"></Feather>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const publicStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: publicTheme.border,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  lote: {
    fontSize: 12,
    fontWeight: "700",
    color: publicTheme.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  nome: {
    fontSize: 17,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    flexShrink: 1,
  },
  badgeSoldOut: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSoldOutText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#DC2626",
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: publicTheme.primary,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: publicTheme.textSecondary,
    lineHeight: 20,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  stepBtn: {
    backgroundColor: publicTheme.accent,
    width: 40,
    height: 40,
    borderRadius: publicTheme.radiusSm,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnMuted: {
    backgroundColor: publicTheme.textMuted,
    opacity: 0.6,
  },
  qty: {
    fontSize: 18,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    minWidth: 28,
    textAlign: "center",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
