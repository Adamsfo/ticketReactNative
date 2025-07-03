import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  View,
  ScrollView,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Ingresso, IngressoTransacao, QueryParams } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import CardIngresso from "@/src/components/CardIngresso";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/ingresso";
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);
  const [registrosIngresso, setRegistrosIngresso] = useState<Ingresso[]>([]);
  const route = useRoute();

  const { idTransacao } = route.params as { idTransacao: number };

  // const getRegistros = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<Ingresso>(endpointApi, {
  //     ...params,
  //     pageSize: 200,
  //   });
  //   const registrosData = response.data ?? [];
  //   setRegistro(registrosData[0]);
  // };

  useFocusEffect(
    useCallback(() => {
      getIngressoTransacao({
        filters: { idTransacao: idTransacao },
      });
    }, [idTransacao])
  );

  const getIngressoTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<IngressoTransacao>(
      "/ingressotransacao",
      {
        ...params,
        pageSize: 200,
      }
    );
    const registrosData = response.data ?? [];

    // Buscar todos os ingressos em paralelo pelos ids
    const ingressosPromises = registrosData.map(async (transacao) => {
      const response = await apiGeral.getResource<Ingresso>(endpointApi, {
        filters: { id: transacao.idIngresso },
        pageSize: 200,
      });
      return response.data && response.data[0]
        ? (response.data[0] as Ingresso)
        : null;
    });

    const ingressos = (await Promise.all(ingressosPromises)).filter(
      (ingresso): ingresso is Ingresso => ingresso !== null
    );
    setRegistrosIngresso(ingressos);

    setRegistrosIngressoTransacao(registrosData);
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Ingressos da Compra {idTransacao}</Text>

        <FlatList
          key={`grid-${width > 600 ? "3" : "1"}`}
          data={registrosIngresso}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          numColumns={width > 600 ? 3 : 1}
          renderItem={({ item }) => (
            <CardIngresso item={item} getRegistros={getIngressoTransacao} />
          )}
        />
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
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
  },
  list: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
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
