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
import CardIngresso from "@/src/components/CardIngresso";

export default function Index() {
  const endpointApi = "/ingresso";
  const [registro, setRegistro] = useState<Ingresso>();
  const route = useRoute();

  const { qrcode } = route.params as { qrcode: number };

  const getRegistros = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Ingresso>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];
    setRegistro(registrosData[0]);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { qrcode } });
    }, [qrcode])
  );

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.titulo}>Ingresso</Text>
          <View style={styles.area}>
            {registro && <CardIngresso item={registro} />}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
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
