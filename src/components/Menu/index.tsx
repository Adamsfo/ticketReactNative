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

export default function Menu({ color }: { color?: string }) {
  const navigation = useNavigation() as any;
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      {user && user.nomeCompleto && (
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Feather name="menu" size={33} color={color ? color : colors.roxo} />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("home")}>
        <Image
          source={require("../../assets/logoJangoIngressosSemFundo.png")}
          style={styles.imagem}
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
  imagem: {
    width: Platform.OS === "web" ? 80 : 80,
    height: Platform.OS === "web" ? 65 : 65,
    marginTop: -14,
    resizeMode: "stretch",
  },
});
