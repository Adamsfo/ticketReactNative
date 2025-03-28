import React from "react";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import colors from "@/src/constants/colors";
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  Platform,
  View,
} from "react-native";

export default function Menu({ color }: { color?: string }) {
  const navigation = useNavigation() as any;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Feather name="menu" size={36} color={color ? color : colors.roxo} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("home")}>
        <Image
          source={require("../../assets/logoJangoProducoes.png")}
          style={styles.imagem}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 5,
    marginLeft: 20,
    position: "absolute",
    justifyContent: "space-around",
  },
  imagem: {
    width: Platform.OS === "web" ? 170 : 160, // 100% para web, largura da tela para mobile
    height: Platform.OS === "web" ? 45 : 40,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
});
