import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface CardEventoProps {
  data: { id: string; nome: string };
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
          { width: Platform.OS === "web" ? widthCardItem : "100%" },
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
            source={require("../../assets/eventoDayUse.png")}
            style={styles.imagem}
          />
        </View>

        <View style={styles.corpo}>
          <Text style={styles.titulo} key={data.id}>
            {data.nome}
          </Text>
          <Text style={{ fontWeight: "bold" }}>
            Local:
            <Text style={{ fontWeight: "normal", paddingLeft: 5 }}>
              Pesque Pague Jango
            </Text>
          </Text>

          <Text>Aberto todos os dias exceto 4ª feira</Text>

          <Text style={{ fontWeight: "normal" }}>
            Valores a partir de R$ 55,00.
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
