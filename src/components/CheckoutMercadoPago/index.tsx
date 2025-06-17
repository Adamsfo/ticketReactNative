import React, { useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import { initMercadoPago, Payment, StatusScreen } from "@mercadopago/sdk-react";
import {
  Platform,
  Text,
  View,
  Button,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
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
import { TextInput } from "react-native-gesture-handler";
import colors from "@/src/constants/colors";
import { Switch } from "react-native-gesture-handler";
import * as Device from "expo-device";
import * as Application from "expo-application";
import DeviceIdWeb from "../DeviceIdWeb";
import StatusPaymentCustomizado from "../StatusPaymentCustomizado";

type InstallmentOption = {
  installments: number;
  installment_amount: number;
  total_amount: number;
  installment_rate: number;
};

type InstallmentResponse = {
  payer_costs: InstallmentOption[];
};

//Jango
// const MP_PUBLIC_KEY = "APP_USR-8ccbd791-ea60-4e70-a915-a89fd05f5c23"; // Chave pública do Mercado Pago

//Tanz
const MP_PUBLIC_KEY = "APP_USR-499790e3-36ba-4f0d-8b54-a05c499ad93c"; // Chave pública do Mercado Pago

export default function CheckoutMercadoPago() {
  const route = useRoute();
  const { user } = useAuth();
  const { idEvento, email, registroTransacao } = route.params as {
    idEvento: number;
    email?: string;
    registroTransacao: Transacao;
  };

  initMercadoPago(MP_PUBLIC_KEY, {
    locale: "pt-BR",
  });

  const [paymentStatusId, setPaymentStatusId] = useState(""); // Estado para armazenar o ID do pagamento
  // const [paymentStatusId, setPaymentStatusId] = useState("107841609777"); // Estado para armazenar o ID do pagamento
  const [cpfCardSalvo, setCpfCardSalvo] = useState(""); // Estado para armazenar o CPF do cartão salvo
  const [visiblePagamento, setVisiblePagamento] = useState(false); // Estado para armazenar o ID do pagamento
  const [visiblePagamentoCartaoSalvo, setVisiblePagamentoCartaoSalvo] =
    useState(false); // Estado para armazenar o ID do pagamento
  const [savedPaymentData, setSavedPaymentData] = useState<any | null>(null); // Estado para armazenar os dados de pagamento salvos
  const [cardToken, setCardToken] = useState<string | null>(null); // Estado para armazenar o token do cartão
  const [installments, setInstallments] = useState<number>(1); // Estado para armazenar o número de parcelas
  const [installmentOptions, setInstallmentOptions] = useState<any | null>(
    null
  );
  const [loading, setloading] = useState(false);
  const [salvarCartao, setSalvarCartao] = useState(true); // Estado para armazenar se o cartão deve ser salvo ou não
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [payment_methodCardSaved, setPaymentMethodCardSaved] = useState<
    string | null
  >(null); // Estado para armazenar o método de pagamento do cartão salvo
  const [CVV, setCVV] = useState<string>(""); // Estado para armazenar o CVV do cartão
  const [error, setError] = useState<string>(""); // Estado para armazenar erros
  const [consultaPagamento, setConsultaPagamento] = useState(false);
  const [dadosDePagamento, setDadosDePagamento] = useState({} as any);

  useEffect(() => {
    async function fetchPaymentData(params: QueryParams) {
      const response = await apiGeral.getResource("/cardscustomer", {
        ...params,
        pageSize: 20000,
      });

      const dadosCards = response?.data ?? null; // Obtenha os dados de pagamento do usuário

      if (!dadosCards) {
        setVisiblePagamento(true);
      }
      setVisiblePagamentoCartaoSalvo(true);

      setSavedPaymentData(dadosCards); // Armazena os dados de pagamento salvos
    }

    if (user) {
      fetchPaymentData({ filters: { email: user?.email } });
    } else {
      // ajsutar qdo nao ticar cartao retornar novo cartao
      fetchPaymentData({ filters: { email: email } });
    }
  }, []);

  useEffect(() => {
    if (paymentStatusId === "" || !consultaPagamento) return;

    const interval = setInterval(() => {
      verificarStatusPagamentoPix();
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentStatusId, consultaPagamento]);

  useEffect(() => {
    if (paymentStatusId === "") return;

    setConsultaPagamento(true);
  }, [paymentStatusId]);

  const verificarStatusPagamentoPix = async () => {
    // console.log("isPolling", isPolling);

    if (!consultaPagamento) return;

    try {
      const response = await apiGeral.getResource("/consultapagamento", {
        // filters: { id: "107841609777" },
        // filters: { id: paymentStatusId, email },
        filters: { id: paymentStatusId, email: user?.email || email },
        pageSize: 10,
      });

      const dados: { status: string } = Array.isArray(response?.data)
        ? { status: "" }
        : response?.data ?? { status: "" };

      setDadosDePagamento(response.data);

      if (dados.status === "approved") {
        setConsultaPagamento(false);
        setVisiblePagamentoCartaoSalvo(false); // Ocultar o componente de pagamento
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento PIX:", error);
    }
  };

  const customization = {
    visual: {
      hideFormTitle: true,
      // hidePaymentButton: true,
    },
    paymentMethods: {
      // ticket: "all",
      // bankTransfer: "all",
      creditCard: "all",
      prepaidCard: ["all"],
      // debitCard: "all",
      // mercadoPago: "all",
      // maxInstallments: 3,
    },
  };

  const buscarParcelas = async (bin: string, payment_method_id: string) => {
    try {
      const amount = Number(registroTransacao?.valorTotal ?? 0);

      const response = await apiGeral.getResource("/buscarparcelas", {
        filters: { bin, payment_method_id, amount },
        pageSize: 20000,
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
          salvarCartao,
          idTransacao: registroTransacao.id,
          idUsuario: user?.id,
          deviceId,
        }), // Adicione o ID do usuário aqui
      })
        .then((response) => response.json())
        .then((response) => {
          // receber o resultado do pagamento
          setPaymentStatusId(response.id); // Definir o estado com o ID do pagamento
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

  const enviarPagamentoCartaoSalvo = async () => {
    setError(""); // Limpar erros antes de enviar o pagamento
    // callback chamado ao clicar no botão de submissão dos dados
    if (!cardToken) {
      console.error("Token do cartão não está definido.");
      return;
    }

    if (CVV.trim() === "") {
      console.error("CVV não pode estar vazio.");
      return;
    }

    setloading(true); // Iniciar o carregamento
    return new Promise<void>((resolve, reject) => {
      fetch(api.getBaseApi() + "/pagamentocardsalvo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idTransacao: registroTransacao.id,
          transaction_amount: registroTransacao.valorTotal,
          token: cardToken,
          installments,
          payment_method_id: payment_methodCardSaved,
          deviceId,
          cvv: CVV, // Adicionar o CVV do cartão
          payer: {
            email: user?.email || email || "", // Garantir que o email seja uma string
            identification: { type: "CPF", number: cpfCardSalvo },
          },
        }), // Adicione o ID do usuário aqui
      })
        .then((response) => response.json())
        .then((response) => {
          // receber o resultado do pagamento
          setPaymentStatusId(response.id); // Definir o estado com o ID do pagamento
          if (response.status === "approved") {
            // pagamento aprovado
            setVisiblePagamentoCartaoSalvo(false); // Ocultar o componente de pagamento
          }

          if (response.error) {
            setError(response.error); // Definir o erro se houver
          }
          setloading(false); // Parar o carregamento
          resolve();
        })
        .catch((error) => {
          setloading(false); // Parar o carregamento
          // lidar com a resposta de erro ao tentar criar o pagamento
          reject();
        });
    });
  };

  if (deviceId === null) {
    if (Platform.OS === "web") {
      return (
        <View style={{ flex: 1 }}>
          <DeviceIdWeb setDeviceId={setDeviceId} />
          <View
            style={{
              // flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator
              size="large"
              color={colors.azul}
            ></ActivityIndicator>
            <Text style={{ justifyContent: "center" }}>
              Carregando formas de pagamento
            </Text>
          </View>
        </View>
      );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {Platform.OS === "web" ? (
        <View style={{ flex: 1, height: 500, width: "100%" }}>
          {/* <TouchableOpacity onPress={() => getDeviceId()}>
            <Text>get{deviceId}</Text>
          </TouchableOpacity> */}
          {/* {!deviceId && (
            <View
              style={{
                // flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator
                size="large"
                color={colors.azul}
              ></ActivityIndicator>
              <Text style={{ justifyContent: "center" }}>
                Carregando formas de pagamento
              </Text>
            </View>
          )} */}

          {/* <DeviceIdWeb setDeviceId={setDeviceId} /> */}
          {/* <Text>deviceid:{deviceId}</Text> */}

          {visiblePagamentoCartaoSalvo && registroTransacao && deviceId && (
            <CartaoCreditoSelector
              savedPaymentData={savedPaymentData}
              installmentOptions={installmentOptions}
              setCardToken={setCardToken}
              setInstallments={setInstallments}
              buscarParcelas={buscarParcelas}
              setVisiblePagamento={setVisiblePagamento}
              visiblePagamento={visiblePagamento}
              registroTransacao={registroTransacao}
              email={user?.email || email || ""} // Garantir que o email seja uma string
              setPaymentStatusId={setPaymentStatusId} // Passar a função para definir o ID do pagamento
              setCpfCardSalvo={setCpfCardSalvo} // Passar a função para definir o CPF do cartão salvo
              enviarPagamentoCartaoSalvo={enviarPagamentoCartaoSalvo} // Passar a função para enviar o pagamento do cartão salvo
              loading={loading} // Passar o estado de carregamento
              setPaymentMethodCardSaved={setPaymentMethodCardSaved} // Passar a função para definir o método de pagamento do cartão salvo
              setCVV={setCVV} // Passar a função para definir o CVV do cartão
              CVV={CVV} // Passar o estado do CVV do cartão
              error={error} // Passar o estado de erro
              installments={installments} // Passar o número de parcelas selecionadas
            />
          )}

          {consultaPagamento && (
            <ActivityIndicator
              size="large"
              color={colors.azul}
              style={{ marginTop: 15 }}
            />
          )}

          {dadosDePagamento && dadosDePagamento.status && (
            <StatusPaymentCustomizado data={dadosDePagamento} />
          )}

          {visiblePagamento && (
            <View style={styles.container}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text>Salvar cartão para compras futuras </Text>
                <Switch
                  trackColor={{ false: colors.cinza, true: colors.azul }}
                  thumbColor={colors.azul}
                  onValueChange={() => {
                    setSalvarCartao(!salvarCartao);
                  }}
                  value={salvarCartao}
                ></Switch>
              </View>
              <Payment
                initialization={{
                  amount: Number(registroTransacao?.valorTotal ?? 0),
                  payer: {
                    email: user ? user.email : email, // Email enviado manualmente, campo no checkout será omitido
                  },
                }} // Certifique-se de que seja numérico
                customization={customization}
                onSubmit={onSubmit}
                onReady={onReady}
                onError={onError}
              />
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            height: 800,
            width: "100%",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <WebView
            source={{
              uri: `http://192.168.18.95:8081/checkoutmp?idEvento=${idEvento}&email=${
                user?.email
              }&registroTransacao=${encodeURIComponent(
                JSON.stringify(registroTransacao)
              )}`,
            }}
            style={{ flex: 1 }}
            originWhitelist={["*"]}
            startInLoadingState={true}
            renderLoading={() => (
              <View>
                <Text>Carregando...</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.branco,
    borderRadius: 12,
  },
});
