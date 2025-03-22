import React from "react";
import { StyleSheet, View } from "react-native";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";

export default function Index() {
  initMercadoPago("TEST-98f4cccd-2514-4062-a671-68df4b579410", {
    locale: "pt-BR",
  });

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
