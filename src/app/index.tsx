import colors from "@/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { apiAuth } from "../lib/auth";
import { Usuario } from "../types/geral";
import { Link } from "expo-router";

export default function Index() {
  const [usuario, setUsuario] = useState<Usuario>();

  useEffect(() => {
    const fetchToken = async () => {
      let _token = await AsyncStorage.getItem("token");
      if (_token) {
        const response = await apiAuth.getUsurioToken(_token);

        console.log(response);
        if (response) {
          setUsuario(response as unknown as Usuario);
        }
      }
    };
    fetchToken();
  }, []);

  return (
    <View style={style.container}>
      <Text>Pagina Perfil</Text>
      <Text>{usuario?.nomeCompleto}</Text>
      <Text>{usuario?.email}</Text>
      <Link
        href="/(auth)/singin/page"
        style={{ marginTop: 16, textAlign: "center" }}
      >
        <Text style={{ textAlign: "center", color: colors.laranjado }}>
          Login
        </Text>
      </Link>
      {/* <ActivityIndicator size="large" color={colors.laranjado} /> */}
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
});
