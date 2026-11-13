import React from "react";
import { StyleSheet, View } from "react-native";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";

export default function Index() {
  initMercadoPago(process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "", {
    locale: "pt-BR",
  });

  return (
    <PublicShopLayout>
      <View style={styles.container}>
        <PublicShopSection title="Pagamento com cartão">
          <CheckoutMercadoPago />
        </PublicShopSection>
      </View>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 32,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
});
