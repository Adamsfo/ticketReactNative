import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ImageSourcePropType,
} from "react-native";
import { logEvent } from "../GoogleAnalytics/analytics";
import { publicTheme } from "@/src/constants/publicTheme";

interface CardParceiroProps {
  imagem: ImageSourcePropType;
  widthCardItem: number;
  link: string;
  nome: string;
}

export default function CardParceiro({
  imagem,
  widthCardItem,
  link,
  nome,
}: CardParceiroProps) {
  const handleClick = () => {
    // 🔹 Dispara evento GA
    logEvent("click_parceiro", {
      parceiro: nome ?? "desconhecido",
      destino: link ?? "",
    });

    // 🔹 Executa ação
    if (link) window.open(link, "_blank");
  };

  return (
    <TouchableOpacity
      // style={[styles.card, { width: widthCardItem }]}
      style={[styles.card, { maxWidth: widthCardItem }]}
      activeOpacity={0.85}
      onPress={handleClick}
    >
      <View style={styles.imageContainer}>
        <Image source={imagem} style={styles.image} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusLg,
    margin: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: publicTheme.border,
    ...Platform.select({
      web: {
        shadowColor: publicTheme.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      default: {
        elevation: 3,
      },
    }),
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
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
    width: Platform.OS === "web" ? 70 : 60,
    height: 45,
    resizeMode: "stretch",
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
