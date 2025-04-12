import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";
import { useRoute } from "@react-navigation/native";
import { Transacao } from "@/src/types/geral";

export default function Index() {
  initMercadoPago("TEST-98f4cccd-2514-4062-a671-68df4b579410", {
    locale: "pt-BR",
  });
  const route = useRoute();

  const { idEvento, email, registroTransacao } = route.params as {
    idEvento: number;
    email?: string;
    registroTransacao: Transacao;
  };

  // useEffect(() => {
  //   if (registroTransacao) {
  //     try {
  //       const parsed = JSON.parse(
  //         decodeURIComponent(registroTransacao as string)
  //       );
  //       setRegistroTransacao(parsed);
  //     } catch (e) {
  //       console.error("Erro ao fazer parse do registroTransacao:", e);
  //     }
  //   }
  // }, [registroTransacao]);

  return (
    <View style={styles.container}>
      <CheckoutMercadoPago />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
