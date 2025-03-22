import React from "react";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { Platform, Text, View } from "react-native";
import WebView from "react-native-webview";

export default function CheckoutMercadoPago() {
  const route = useRoute();
  initMercadoPago("TEST-98f4cccd-2514-4062-a671-68df4b579410", {
    locale: "pt-BR",
  });

  const customization = {
    paymentMethods: {
      ticket: "all",
      bankTransfer: "all",
      creditCard: "all",
      prepaidCard: ["all"],
      debitCard: "all",
      mercadoPago: "all",
    },
  };

  const onSubmit = async ({
    selectedPaymentMethod,
    formData,
  }: {
    selectedPaymentMethod: string;
    formData: any;
  }) => {
    // callback chamado ao clicar no botão de submissão dos dados
    return new Promise<void>((resolve, reject) => {
      fetch(api.getBaseApi() + "/pagamento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
        .then((response) => response.json())
        .then((response) => {
          // receber o resultado do pagamento
          console.log(response);
          resolve();
        })
        .catch((error) => {
          // lidar com a resposta de erro ao tentar criar o pagamento
          reject();
        });
    });
  };
  const onError = async (error: any) => {
    // callback chamado para todos os casos de erro do Brick
    console.log(error);
  };
  const onReady = async () => {
    /*
   Callback chamado quando o Brick estiver pronto.
   Aqui você pode ocultar loadings do seu site, por exemplo.
 */
  };

  return (
    <>
      {Platform.OS === "web" ? (
        <Payment
          initialization={{ amount: parseFloat("555") }}
          customization={customization}
          onSubmit={onSubmit}
          onReady={onReady}
          onError={onError}
        />
      ) : (
        <WebView
          source={{ uri: "http://192.168.18.95:8081/checkoutmp?id=23" }} // URL da rota do seu app
          style={{ flex: 1, height: 500, width: "100%" }}
          originWhitelist={["*"]}
          startInLoadingState={true}
          renderLoading={() => (
            <View>
              <Text>Carregando...</Text>
            </View>
          )}
        />
      )}
    </>
  );
}
