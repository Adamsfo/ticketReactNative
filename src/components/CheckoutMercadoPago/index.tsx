import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import { Platform, Text, View, Button, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import {
  Produtor,
  QueryParams,
  Transacao,
  DadosdePagamento,
} from "@/src/types/geral";
import { useAuth } from "@/src/contexts_/AuthContext";
import { apiGeral } from "@/src/lib/geral";
import CartaoCreditoSelector from "../CartaoCreditoSelector";

type SavedCard = {
  id: string;
  first_six_digits: string;
  last_four_digits: string;
  payment_method: {
    id: string;
    name: string;
  };
};

type SavedPaymentData = {
  cards: SavedCard[];
};

type InstallmentOption = {
  installments: number;
  installment_amount: number;
  total_amount: number;
  installment_rate: number;
};

type InstallmentResponse = {
  payer_costs: InstallmentOption[];
};

const MP_PUBLIC_KEY = "APP_USR-8ccbd791-ea60-4e70-a915-a89fd05f5c23"; // Chave pública do Mercado Pago
// const MP_PUBLIC_KEY = "TEST-98f4cccd-2514-4062-a671-68df4b579410"; // Chave pública do Mercado Pago

export default function CheckoutMercadoPago() {
  const route = useRoute();
  const { user } = useAuth();
  const { idEvento, registroTransacao } = route.params as {
    idEvento: number;
    registroTransacao: Transacao;
  };

  // const { idTransacao, idEvento } = route.params as {
  //   idTransacao: number;
  //   idEvento: number;
  // };

  initMercadoPago(MP_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  // const [registroTransacao, setRegistroTransacao] = useState<Transacao>();
  const [paymentStatus, setPaymentStatus] = useState(""); // Estado para armazenar o ID do pagamento
  const [visiblePagamento, setVisiblePagamento] = useState(false); // Estado para armazenar o ID do pagamento
  const [savedPaymentData, setSavedPaymentData] = useState<any | null>(null); // Estado para armazenar os dados de pagamento salvos
  const [cardToken, setCardToken] = useState<string | null>(null); // Estado para armazenar o token do cartão
  const [installments, setInstallments] = useState<number>(1); // Estado para armazenar o número de parcelas
  const [installmentOptions, setInstallmentOptions] = useState<any | null>(
    null
  );

  useEffect(() => {
    async function fetchPaymentData(params: QueryParams) {
      const response = await apiGeral.getResource("/cardscustomer", {
        ...params,
        pageSize: 200000,
      });

      const dadosCards = response?.data ?? null; // Obtenha os dados de pagamento do usuário

      setSavedPaymentData(dadosCards); // Armazena os dados de pagamento salvos
    }

    fetchPaymentData({ filters: { email: user?.email } });
  }, []);

  // const getTransacao = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<Transacao>("/transacao", {
  //     ...params,
  //     pageSize: 200,
  //   });
  //   const registrosData = response.data ?? [];
  //   console.log("registrosData", registrosData);

  //   setRegistroTransacao(registrosData[0]);
  // };

  // useEffect(() => {
  //   if (idTransacao) {
  //     getTransacao({ filters: { id: idTransacao } });
  //   }
  // }, []);

  const customization = {
    paymentMethods: {
      // ticket: "all",
      // bankTransfer: "all",
      creditCard: "all",
      prepaidCard: ["all"],
      // debitCard: "all",
      // mercadoPago: "all",
    },
  };

  const buscarParcelas = async (bin: string, payment_method_id: string) => {
    try {
      const amount = Number(registroTransacao?.valorTotal ?? 0);

      const response = await apiGeral.getResource("/buscarparcelas", {
        filters: { bin, payment_method_id, amount },
        pageSize: 200000,
      });

      const parcelas =
        (response.data as InstallmentResponse[])?.[0]?.payer_costs || [];

      setInstallmentOptions(parcelas || []);
    } catch (err) {
      console.error("Erro ao buscar parcelas:", err);
    }
  };

  const onSubmit = async ({
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
          <CartaoCreditoSelector
            savedPaymentData={savedPaymentData}
            installmentOptions={installmentOptions}
            setCardToken={setCardToken}
            setInstallments={setInstallments}
            buscarParcelas={buscarParcelas}
            setVisiblePagamento={setVisiblePagamento}
            visiblePagamento={visiblePagamento}
          />

          {paymentStatus && (
            <StatusScreen
              initialization={{ paymentId: paymentStatus }} // Passar o ID do pagamento para o StatusScreen
              onReady={onReady}
              onError={onError}
            />
          )}
          {visiblePagamento && (
            <Payment
              initialization={{
                amount: Number(registroTransacao?.valorTotal ?? 0),
                payer: {
                  email: user?.email, // Email enviado manualmente, campo no checkout será omitido
                },
              }} // Certifique-se de que seja numérico
              customization={customization}
              onSubmit={onSubmit}
              onReady={onReady}
              onError={onError}
            />
          )}
        </>
      ) : (
        <WebView
          source={{
            uri: `http://192.168.18.95:8081/checkoutmp?idEvento=${idEvento}&registroTransacao=${JSON.stringify(
              registroTransacao
            )}`,
          }} // URL da rota do seu app
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

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
});
