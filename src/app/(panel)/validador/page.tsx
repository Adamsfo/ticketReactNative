import React, { useCallback, useState } from "react";
import { Text, StyleSheet, Platform, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Ingresso, QueryParams } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";

export default function Index() {
  const endpointApi = "/ingresso";
  const [registro, setRegistro] = useState<Ingresso>();
  const route = useRoute();

  // const getRegistros = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<Ingresso>(endpointApi, {
  //     ...params,
  //     pageSize: 200,
  //   });
  //   const registrosData = response.data ?? [];
  //   setRegistro(registrosData[0]);
  // };

  // useFocusEffect(
  //   useCallback(() => {
  //     getRegistros({ filters: { qrcode } });
  //   }, [qrcode])
  // );

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Validador</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    paddingTop: 10,
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 20,
    // maxWidth: 465,
    // width: "90%",
  },
});
