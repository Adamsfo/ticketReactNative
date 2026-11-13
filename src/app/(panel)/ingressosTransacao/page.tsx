import React, { useCallback, useState } from "react";
import { Text, StyleSheet, View, FlatList, useWindowDimensions } from "react-native";
import { Ingresso, IngressoTransacao, QueryParams } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import CardIngresso from "@/src/components/CardIngresso";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import { publicTheme } from "@/src/constants/publicTheme";

export default function Index() {
  const endpointApi = "/ingresso";
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);
  const [registrosIngresso, setRegistrosIngresso] = useState<Ingresso[]>([]);
  const route = useRoute();
  const { width } = useWindowDimensions();

  const { idTransacao } = route.params as { idTransacao: number };

  useFocusEffect(
    useCallback(() => {
      getIngressoTransacao({
        filters: { idTransacao: idTransacao },
      });
    }, [idTransacao]),
  );

  const getIngressoTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<IngressoTransacao>(
      "/ingressotransacao",
      {
        ...params,
        pageSize: 200,
      },
    );
    const registrosData = response.data ?? [];

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
      (ingresso): ingresso is Ingresso => ingresso !== null,
    );
    setRegistrosIngresso(ingressos);

    setRegistrosIngressoTransacao(registrosData);
  };

  const numColumns = width >= 900 ? 2 : 1;

  return (
    <PublicShopLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Ingressos da compra #{idTransacao}</Text>
        <Text style={styles.subtitle}>
          {registrosIngresso.length}{" "}
          {registrosIngresso.length === 1 ? "ingresso" : "ingressos"}
        </Text>

        <FlatList
          key={`grid-${numColumns}`}
          data={registrosIngresso}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? styles.columnWrap : undefined}
          renderItem={({ item }) => (
            <CardIngresso item={item} getRegistros={getIngressoTransacao} />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Carregando ingressos…</Text>
          }
        />
      </View>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 12,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  list: {
    gap: 16,
    paddingBottom: 32,
  },
  columnWrap: {
    gap: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: publicTheme.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: publicTheme.textSecondary,
    marginBottom: 20,
  },
  empty: {
    textAlign: "center",
    color: publicTheme.textMuted,
    marginTop: 24,
  },
});
