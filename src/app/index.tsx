import colors from "@/src/constants/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SplashScreen } from "expo-router";

export default function Index({ route }: any) {
  const navigation = useNavigation() as any;
  let param = "";
  param = route.params.params;

  useEffect(() => {
    if (Platform.OS === "web") {
      const rootPortal = document.createElement("div");
      rootPortal.setAttribute("id", "root-portal");
      document.body.appendChild(rootPortal);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (param.includes("checkoutmp")) {
        const urlParams = new URLSearchParams(param);

        const idEvento = urlParams.get("idEvento");
        const email = urlParams.get("email");
        const registroTransacaoRaw = urlParams.get("registroTransacao");

        navigation.navigate("checkoutmp", {
          idEvento: idEvento,
          email: email,
          registroTransacao: JSON.parse(
            decodeURIComponent(registroTransacaoRaw as string)
          ),

          // funcionando
          // navigation.navigate("checkoutmp", {
          //   idEvento: param.split("idEvento=")[1].split("&")[0],
          //   // email: param.split("email=")[1].split("&")[0],
          //   registroTransacao: JSON.parse(
          //     decodeURIComponent(param.split("registroTransacao=")[1] as string)
          //   ),
        });
      } else if (param.includes("ingresso")) {
        const url = new URL(param);
        const urlParams = new URLSearchParams(url.search);

        const qrcode = urlParams.get("qrcode");

        navigation.navigate("ingresso", {
          qrcode: qrcode,
        });
      } else if (param.includes("redefinirsenha")) {
        const url = new URL(param);
        const urlParams = new URLSearchParams(url.search);

        const token = urlParams.get("token");

        navigation.navigate("redefinirsenha", {
          token,
        });
      } else {
        navigation.navigate("home");
      }
    }, 100);

    return () => clearTimeout(timer); // Limpa o temporizador na desmontagem do componente
  }, []);

  return (
    <View style={style.container}>
      {!param.includes("checkoutmp") ? (
        <Image
          style={style.imagem}
          source={require("../assets/logoJangoIngressosSemFundo.png")}
        />
      ) : null}
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
  imagem: {
    width: 220,
    height: 180,
    marginLeft: 20,
    resizeMode: "stretch",
  },
});
