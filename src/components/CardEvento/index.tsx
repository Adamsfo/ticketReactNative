import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { Evento } from "@/src/types/geral";
import { format, parseISO } from "date-fns";
import formatCurrency from "../FormatCurrency";
import { api } from "@/src/lib/api";
import { CalendarIcon, MapPinIcon } from "lucide-react-native";

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
    <TouchableOpacity
      // style={[styles.card, { width: widthCardItem }]}
      style={[styles.card, { maxWidth: widthCardItem }]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: api.getBaseApi() + "/uploads/" + data.imagem }}
          style={styles.image}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {data.nome}
        </Text>
        <Image
          source={require("../../assets/logoJango.png")}
          style={styles.logo}
        />

        <View style={styles.row}>
          {/* <Text style={styles.label}>Local:</Text> */}
          <MapPinIcon size={16} color="#6b7280" />
          <Text style={styles.text}>{data.endereco}</Text>
        </View>

        <View style={styles.row}>
          {/* <Text style={styles.label}>Data:</Text> */}
          <CalendarIcon size={16} color="#6b7280" />
          <Text style={styles.text}>
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

        <View style={styles.row}>
          <Text style={styles.text}>
            Valores a partir de{" "}
            {data.MenorValor !== undefined
              ? formatCurrency(data.MenorValor.toFixed(2))
              : "N/A"}
            .
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 220,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  logo: {
    position: "absolute",
    top: 10,
    right: 10,
    width: Platform.OS === "web" ? 70 : 50,
    height: 40,
    resizeMode: "contain",
    backgroundColor: "#ffffffcc",
    borderRadius: 8,
    padding: 4,
  },
  content: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    height: 140,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 6,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    flexWrap: "wrap",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    paddingLeft: 5,
    color: "#444",
    flexShrink: 1,
  },
  price: {
    marginTop: 6,
    color: "#444",
  },
  text: {
    color: "#6b7280",
    fontSize: 16,
    paddingLeft: 5,
  },
});
