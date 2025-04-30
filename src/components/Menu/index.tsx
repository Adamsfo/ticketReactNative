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
        <Feather name="menu" size={33} color={color ? color : colors.roxo} />
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
    marginTop: 7,
    marginLeft: 10,
    position: "absolute",
    justifyContent: "space-around",
  },
  imagem: {
    width: Platform.OS === "web" ? 100 : 100, 
    height: Platform.OS === "web" ? 38 : 38,
    resizeMode: "cover", 
    
  },
});
