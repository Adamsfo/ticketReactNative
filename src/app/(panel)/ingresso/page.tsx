import React, { useCallback, useState } from "react";
import { Text, StyleSheet, View, ScrollView } from "react-native";
import { Ingresso, QueryParams } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import CardIngresso from "@/src/components/CardIngresso";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";
import { publicTheme } from "@/src/constants/publicTheme";

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
    }, [qrcode]),
  );

  return (
    <PublicShopLayout>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.titulo}>Seu ingresso</Text>
        <PublicShopSection>
          {registro ? <CardIngresso item={registro} /> : null}
        </PublicShopSection>
      </ScrollView>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 48,
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
    textAlign: "center",
    color: publicTheme.textPrimary,
  },
});
