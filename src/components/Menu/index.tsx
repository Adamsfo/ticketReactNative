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
import { useAuth } from "@/src/contexts_/AuthContext";

type MenuProps = {
  color?: string;
  /** Cabeçalho público no fluxo do layout (sem position absolute). */
  embedded?: boolean;
};

export default function Menu({ color, embedded }: MenuProps) {
  const navigation = useNavigation() as any;
  const { user } = useAuth();

  return (
    <View style={embedded ? styles.containerEmbedded : styles.container}>
      {user && user.nomeCompleto && (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={embedded ? styles.menuButton : undefined}
          accessibilityLabel="Abrir menu"
        >
          <Feather name="menu" size={28} color={color ? color : colors.roxo} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("home")}>
        <Image
          source={require("../../assets/logoJangoIngressosSemFundo.png")}
          style={embedded ? styles.imagemEmbedded : styles.imagem}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginTop: 7,
    marginLeft: 10,
    position: "absolute",
    justifyContent: "space-around",
  },
  containerEmbedded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuButton: {
    marginRight: 4,
    padding: 4,
  },
  imagem: {
    width: Platform.OS === "web" ? 80 : 80,
    height: Platform.OS === "web" ? 65 : 65,
    marginTop: -14,
    resizeMode: "stretch",
  },
  imagemEmbedded: {
    width: Platform.OS === "web" ? 172 : 152,
    height: Platform.OS === "web" ? 58 : 54,
    resizeMode: "contain",
  },
});
