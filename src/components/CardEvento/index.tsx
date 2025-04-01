import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Evento } from "@/src/types/geral";
import { format, parseISO } from "date-fns";
import formatCurrency from "../FormatCurrency";
import { api } from "@/src/lib/api";

const { width } = Dimensions.get("window");

interface CardEventoProps {
  data: Evento;
  onPress: () => void;
  widthCardItem: number;
}

export default function CardEvento({
  data,
  onPress,
  widthCardItem,
}: CardEventoProps) {
  return (
    <View>
      <TouchableOpacity
        style={[
          styles.item,
          {
            width:
              Platform.OS === "web"
                ? width <= 1000
                  ? "100%"
                  : widthCardItem
                : "100%",
          },
        ]}
        activeOpacity={0.5}
        onPress={onPress}
      >
        <View style={styles.cabecalho}>
          <Image
            source={require("../../assets/logoJango.png")}
            style={styles.imagemCabecalho}
          />
        </View>

        <View style={styles.viewImagem}>
          <Image
            source={{ uri: api.getBaseApi() + "/uploads/" + data.imagem }}
            style={styles.imagem}
          />
        </View>

        <View style={styles.corpo}>
          <Text style={styles.titulo} key={data.id}>
            {data.nome}
          </Text>
          <View style={{ flexDirection: "row" }}>
            <Text style={{ fontWeight: "bold" }}>Local:</Text>
            <Text style={{ fontWeight: "normal", paddingLeft: 5 }}>
              {data.endereco}
            </Text>
          </View>

          <View style={{ flexDirection: "row" }}>
            <Text style={{ fontWeight: "bold" }}>Data:</Text>
            <Text style={{ fontWeight: "normal", paddingLeft: 5 }}>
              {format(
                parseISO(data.data_hora_inicio.toString()),
                "dd/MM/yyyy HH:mm"
              )}{" "}
              a{" "}
              {format(
                parseISO(data.data_hora_fim.toString()),
                "dd/MM/yyyy HH:mm"
              )}
            </Text>
          </View>

          <Text style={{ fontWeight: "normal" }}>
            Valores a partir de{" "}
            {data.MenorValor !== undefined
              ? formatCurrency(data.MenorValor.toFixed(2))
              : "N/A"}
            .
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "column",
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginRight: 15,
    marginTop: 7,
    padding: 12,
    borderRadius: 20,
    height: 400,
  },
  titulo: {
    paddingRight: 20,
    fontSize: 26,
    marginBottom: 10,
  },
  imagemCabecalho: {
    width: Platform.OS === "web" ? 70 : 50, // 100% para web, largura da tela para mobile
    height: Platform.OS === "web" ? 40 : 40,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
  cabecalho: {
    flexDirection: "row",
  },
  imagem: {
    width: "100%", // 100% para web, largura da tela para mobile
    borderRadius: 20,
    height: Platform.OS === "web" ? 240 : 240,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
  viewImagem: {
    flex: 1,
    alignItems: "center",
  },
  corpo: {
    flexDirection: "column",
    height: "auto",
  },
});
