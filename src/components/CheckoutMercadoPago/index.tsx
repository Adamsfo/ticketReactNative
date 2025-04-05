import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { Platform, Text, View } from "react-native";
import WebView from "react-native-webview";
import {
  DadosdePagamento,
  Produtor,
  QueryParams,
  Transacao,
  UsuarioMetodoPagamento,
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

  // useEffect(() => {
  //   async function fetchPaymentData(params: QueryParams) {
  //     const response = await apiGeral.getResource("/dadospagamento", {
  //       ...params,
  //       pageSize: 200,
  //     });

  //     const dadosPagamento = (response?.data?.[0] ??
  //       null) as unknown as DadosdePagamento; // Obtenha os dados de pagamento do usuário

  //     setSavedPaymentData(dadosPagamento); // Armazena os dados de pagamento salvos
  //     console.log("Dados de pagamento salvos:", dadosPagamento); // Exibe os dados de pagamento salvos no console
  //   }

  //   fetchPaymentData({ filters: { idUsuario: user?.id } });
  // }, []);

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

  return (
    <>
      {Platform.OS === "web" ? (
        <>
          {visiblePagamento && (
            <Payment
              initialization={{ amount: registroTransacao.valorTotal }}
              customization={customization}
              onSubmit={onSubmit}
              onReady={onReady}
              onError={onError}
            />
          )}
          {paymentStatus && (
            <StatusScreen
              initialization={{ paymentId: paymentStatus }} // Passar o ID do pagamento para o StatusScreen
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
