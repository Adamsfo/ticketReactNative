import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { Platform, Text, View, Button } from "react-native";
import WebView from "react-native-webview";
import {
  Produtor,
  QueryParams,
  Transacao,
  DadosdePagamento,
} from "@/src/types/geral";
import { useAuth } from "@/src/contexts_/AuthContext";
import { apiGeral } from "@/src/lib/geral";

export default function CheckoutMercadoPago() {
  const route = useRoute();
  const { user } = useAuth();
  const { idEvento, registroTransacao } = route.params as {
    idEvento: number;
    registroTransacao: Transacao;
  };

  initMercadoPago("TEST-98f4cccd-2514-4062-a671-68df4b579410", {
    locale: "pt-BR",
  });

  const [paymentStatus, setPaymentStatus] = useState(""); // Estado para armazenar o ID do pagamento
  const [visiblePagamento, setVisiblePagamento] = useState(true); // Estado para armazenar o ID do pagamento
  const [savedPaymentData, setSavedPaymentData] =
    useState<DadosdePagamento | null>(null); // Estado para armazenar os dados de pagamento salvos
  const [cardToken, setCardToken] = useState<string | null>(null); // Estado para armazenar o token do cartão

  useEffect(() => {
    async function fetchPaymentData(params: QueryParams) {
      const response = await apiGeral.getResource("/dadospagamento", {
        ...params,
        pageSize: 200,
      });

      const dadosPagamento = response?.data?.[0] ?? null; // Obtenha os dados de pagamento do usuário

      // Converte de string para objeto, se necessário
      let parsedDadosPagamento = dadosPagamento;
      if (typeof dadosPagamento === "string") {
        try {
          parsedDadosPagamento = JSON.parse(dadosPagamento);
        } catch (error) {
          console.error(
            "Erro ao converter dados de pagamento para objeto:",
            error
          );
        }
      }

      setSavedPaymentData(parsedDadosPagamento as DadosdePagamento); // Armazena os dados de pagamento salvos
      console.log("Dados de pagamento salvos:", parsedDadosPagamento); // Exibe os dados de pagamento salvos no console
    }

    fetchPaymentData({ filters: { idUsuario: user?.id } });
  }, []);

  const customization = {
    paymentMethods: {
      // ticket: "all",
      // bankTransfer: "all",
      creditCard: "all",
      prepaidCard: ["all"],
      debitCard: "all",
      // mercadoPago: "all",
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
        body: JSON.stringify({
          ...formData,
          idEvento,
          registroTransacao,
          idUsuario: user?.id,
        }), // Adicione o ID do usuário aqui
      })
        .then((response) => response.json())
        .then((response) => {
          // receber o resultado do pagamento
          console.log(response);
          setPaymentStatus(response.id); // Definir o estado com o ID do pagamento
          if (response.status === "approved") {
            // pagamento aprovado
            setVisiblePagamento(false); // Ocultar o componente de pagamento
          }
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

  const createCardToken = async () => {
    if (!savedPaymentData) return;

    const cardData = {
      card_number:
        savedPaymentData.card.first_six_digits +
        "******" +
        savedPaymentData.card.last_four_digits,
      expiration_month: savedPaymentData.card.expiration_month,
      expiration_year: savedPaymentData.card.expiration_year,
      security_code: "", // O código de segurança não pode ser salvo por motivos de segurança e deve ser fornecido pelo usuário
      cardholder: {
        name: savedPaymentData.card.cardholder.name,
        identification: {
          type: savedPaymentData.card.cardholder.identification.type,
          number: savedPaymentData.card.cardholder.identification.number,
        },
      },
    };

    try {
      const response = await fetch(api.getBaseApi() + "/createCardToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();
      if (data.token) {
        setCardToken(data.token);
        console.log("Novo token gerado:", data.token);
      } else {
        console.error("Erro ao gerar token de cartão:", data);
      }
    } catch (error) {
      console.error("Erro ao gerar token de cartão:", error);
    }
  };

  const startNewPayment = async () => {
    if (!savedPaymentData) return;

    if (!cardToken) {
      await createCardToken(); // Gere um novo token se não houver um token existente
    }

    // const paymentData = {
    //   transaction_amount: Number(registroTransacao.valorTotal), // Certifique-se de que seja numérico
    //   token: cardToken, // Utilize o token salvo ou recém-gerado
    //   description: "description",
    //   installments: 1,
    //   payment_method_id: savedPaymentData.payment_method_id,
    //   issuer_id: savedPaymentData.issuer_id,
    //   payer: savedPaymentData.payer,
    // };

    // try {
    //   const response = await fetch(api.getBaseApi() + "/pagamento", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(paymentData),
    //   });

    //   const result = await response.json();
    //   console.log("Novo pagamento:", result);
    //   setPaymentStatus(result.id); // Definir o estado com o ID do pagamento
    //   if (result.status === "approved") {
    //     // pagamento aprovado
    //     setVisiblePagamento(false); // Ocultar o componente de pagamento
    //   }
    // } catch (error) {
    //   console.error("Erro ao iniciar novo pagamento:", error);
    // }
  };

  return (
    <>
      {Platform.OS === "web" ? (
        <>
          {paymentStatus && (
            <StatusScreen
              initialization={{ paymentId: paymentStatus }} // Passar o ID do pagamento para o StatusScreen
              onReady={onReady}
              onError={onError}
            />
          )}
          {visiblePagamento && (
            <Payment
              initialization={{ amount: Number(registroTransacao.valorTotal) }} // Certifique-se de que seja numérico
              customization={customization}
              onSubmit={onSubmit}
              onReady={onReady}
              onError={onError}
            />
          )}
          {savedPaymentData && (
            <View>
              <Text>Informações de Pagamento Salvas:</Text>
              <Text>
                Método de Pagamento: {savedPaymentData.payment_method_id}
              </Text>
              <Text>Emissor: {savedPaymentData.issuer_id}</Text>
              <Text>
                Nome do Titular: {savedPaymentData.card?.cardholder?.name}
              </Text>
              <Text>
                CPF do Titular:{" "}
                {savedPaymentData.card?.cardholder?.identification?.number}
              </Text>
              <Text>Email do Pagador: {savedPaymentData.payer?.email}</Text>
              {/* Adicione outros dados conforme necessário */}
              <Button
                title="Iniciar Novo Pagamento"
                onPress={startNewPayment}
              />
            </View>
          )}
        </>
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
