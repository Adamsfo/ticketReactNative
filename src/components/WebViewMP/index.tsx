import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { WebView } from "react-native-webview";

const WebViewMP: React.FC = () => {
  const mapHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://sdk.mercadopago.com/js/v2"></script>
      </head>
      <body>
        <div id="cardPaymentBrick_container"></div>
        <div >teste</div>
        <script>
          const mp = new MercadoPago('TEST-98f4cccd-2514-4062-a671-68df4b579410', {
            locale: 'pt-BR'
          });
          const bricksBuilder = mp.bricks();
          const renderCardPaymentBrick = async (bricksBuilder) => {
            const settings = {
              initialization: {
                amount: 100, // valor total a ser pago
                payer: {
                  email: '',
                },
              },
              customization: {
                visual: {
                  style: {
                    theme: 'default', // | 'dark' | 'bootstrap' | 'flat'
                    customVariables: {
                    }
                  }
                },
                paymentMethods: {
                  maxInstallments: 1,
                }
              },
              callbacks: {
                onReady: () => {
                  // callback chamado quando o Brick estiver pronto
                },
                onSubmit: (cardFormData) => {
                  // callback chamado o usuário clicar no botão de submissão dos dados
                  return new Promise((resolve, reject) => {
                    fetch('/process_payment', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(cardFormData)
                    })
                      .then((response) => {
                        // receber o resultado do pagamento
                        resolve();
                      })
                      .catch((error) => {
                        // lidar com a resposta de erro ao tentar criar o pagamento
                        reject();
                      })
                  });
                },
                onError: (error) => {
                  // callback chamado para todos os casos de erro do Brick
                },
              },
            };
            window.cardPaymentBrickController = await bricksBuilder.create('cardPayment', 'cardPaymentBrick_container', settings);
          };
          renderCardPaymentBrick(bricksBuilder);
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: mapHtml }}
        style={styles.webMap}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <Text>Loading...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error: ", nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 300,
    marginVertical: 8,
  },
  webMap: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WebViewMP;
