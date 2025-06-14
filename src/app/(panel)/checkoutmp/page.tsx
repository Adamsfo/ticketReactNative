import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";
import { useRoute } from "@react-navigation/native";
import { Transacao } from "@/src/types/geral";

export default function Index() {
  //Jango
  // initMercadoPago("APP_USR-8ccbd791-ea60-4e70-a915-a89fd05f5c23", {
  //   locale: "pt-BR",
  // });

  //Tanz
  initMercadoPago("APP_USR-499790e3-36ba-4f0d-8b54-a05c499ad93c", {
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
