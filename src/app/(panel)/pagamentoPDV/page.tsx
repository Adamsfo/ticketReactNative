import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  IngressoTransacao,
  QueryParams,
  Transacao,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import StepIndicator from "@/src/components/StepIndicator";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { initMercadoPago } from "@mercadopago/sdk-react";
import StatusPaymentCustomizadoPOS from "@/src/components/StatusPaymentCustomizadoPOS";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/src/contexts_/AuthContext";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state } = useCart();
  const { user } = useAuth();
  const [consultaPagamento, setConsultaPagamento] = useState(false);
  const [payment_uniqueid, setPaymentUniqueId] = useState("");
  const [dadosDePagamento, setDadosDePagamento] = useState<any>({});
  const { idEvento, registroTransacao } = route.params as {
    idEvento: number;
    registroTransacao: Transacao;
  };
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);
  const [metodoSelecionado, setMetodoSelecionado] = useState<string | null>();

  //Jango
  // initMercadoPago("APP_USR-8ccbd791-ea60-4e70-a915-a89fd05f5c23", {
  //   locale: "pt-BR",
  // });

  //Tanz
  initMercadoPago("APP_USR-499790e3-36ba-4f0d-8b54-a05c499ad93c", {
    locale: "pt-BR",
  });

  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    endereco: "",
    idUsuario: 0,
    idProdutor: 0,
  });

  const getRegistros = async (idEvento: number) => {
    if (idEvento > 0) {
      const response = await apiGeral.getResourceById<Evento>(
        endpointApi,
        idEvento
      );

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);

      getIngressoTransacao({
        filters: { idTransacao: state.transacao?.id },
      });
    }
  };

  const getIngressoTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<IngressoTransacao>(
      "/ingressotransacao",
      {
        ...params,
        pageSize: 200,
      }
    );
    const registrosData = response.data ?? [];
    console.log("witsh", width);

    console.log("registrosData", registrosData);
    setRegistrosIngressoTransacao(registrosData);
  };

  // const getRegistrosIngressos = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<EventoIngresso>(
  //     endpointApiIngressos,
  //     { ...params, pageSize: 200 }
  //   );
  //   const registrosData = response.data ?? [];

  //   setRegistrosEventoIngressos(registrosData);
  // };

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect", idEvento);
      // ✅ Resetando variáveis ao abrir a tela
      setPaymentUniqueId("");
      setDadosDePagamento({});
      setConsultaPagamento(false);
      setMetodoSelecionado(null);

      if (idEvento > 0) {
        getRegistros(idEvento);
      }
    }, [idEvento])
  );

  type IngressoAgrupado = IngressoTransacao & { qtde: number };

  const agruparIngressos = (
    ingressos: IngressoTransacao[]
  ): IngressoAgrupado[] => {
    const mapa = new Map<string, IngressoAgrupado>();

    ingressos.forEach((item) => {
      const chave = `${item.Ingresso_EventoIngresso?.TipoIngresso?.id}-${item.Ingresso_EventoIngresso?.nome}`;

      if (mapa.has(chave)) {
        const existente = mapa.get(chave)!;
        existente.qtde += 1;
      } else {
        mapa.set(chave, { ...item, qtde: 1 });
      }
    });

    return Array.from(mapa.values());
  };

  const ingressosAgrupados = agruparIngressos(registrosIngressoTransacao);

  const fetchPagamentoPos = async () => {
    try {
      // if (consultaPagamento) return;
      // setloading(true);
      const response = await fetch(api.getBaseApi() + "/pagamentopos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          valorTotal: Number(registroTransacao?.valorTotal),
          // email: email,
          descricao: "Venda de Ingressos",
          idTransacao: registroTransacao?.id,
          idUsuarioPDV: user?.id,
          transaction_type:
            metodoSelecionado === "pix"
              ? 3
              : metodoSelecionado === "crédito"
              ? 2
              : 1,
        }), // Adicione o ID do usuário aqui
      });

      setConsultaPagamento(true);
      const responseData = await response.json();
      setPaymentUniqueId(responseData?.id || "");

      // setloading(false);
    } catch (error) {
      console.error("Erro ao gerar Pix:", error);
      // setloading(false);
    }
  };

  const fetchPagamentoDinheiro = async () => {
    try {
      // if (consultaPagamento) return;
      // setloading(true);
      const response = await fetch(api.getBaseApi() + "/pagamentodinheiro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idTransacao: registroTransacao?.id,
          idUsuarioPDV: user?.id,
        }), // Adicione o ID do usuário aqui
      });

      const responseData = await response.json();
      console.log("responseData", responseData.data);
      setDadosDePagamento(responseData.data);
      setConsultaPagamento(false);

      // setloading(false);
    } catch (error) {
      console.error("Erro ao gerar Dinheiro:", error);
      // setloading(false);
    }
  };

  const verificarStatusPagamentoPos = async () => {
    // console.log("isPolling", isPolling);

    if (!consultaPagamento) return;

    try {
      const response = await apiGeral.getResource("/consultapagamentopos", {
        // filters: { id: "107841609777" },
        // filters: { id: paymentStatusId, email },
        filters: {
          payment_uniqueid: payment_uniqueid,
        },
        pageSize: 10,
      });

      const dados: { payment_message: string } = Array.isArray(response?.data)
        ? { payment_message: "" }
        : response?.data ?? { payment_message: "" };

      setDadosDePagamento(response.data);
      console.log("dados", dados);

      if (dados.payment_message === "Pago") {
        setConsultaPagamento(false);
      }
      if (dados.payment_message === "Cancelado/erro") {
        setConsultaPagamento(false);
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento POS:", error);
    }
  };

  const CancelaPagamentoPos = async () => {
    try {
      const response = await apiGeral.getResource("/cancelapagamentopos", {
        filters: {
          payment_uniqueid: payment_uniqueid,
        },
        pageSize: 10,
      });

      const dados: { payment_message: string } = Array.isArray(response?.data)
        ? { payment_message: "" }
        : response?.data ?? { payment_message: "" };

      setDadosDePagamento(response.data);

      if (dados.payment_message === "Pago") {
        setConsultaPagamento(false);
      }
      if (dados.payment_message === "Cancelado/erro") {
        setConsultaPagamento(false);
      }
    } catch (error) {
      console.log("Erro ao verificar status do pagamento POS:", error);
    }
  };

  useEffect(() => {
    if (payment_uniqueid === "" || !consultaPagamento) return;

    const interval = setInterval(() => {
      verificarStatusPagamentoPos();
    }, 5000);

    return () => clearInterval(interval);
  }, [payment_uniqueid, consultaPagamento]);

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.areaStep}>
          <StepIndicator currentStep={3} />
        </View>
        <Text style={styles.titulo}>Pagamento PDV</Text>

        <FlatList
          data={registroTransacao ? [registroTransacao] : []}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <View style={styles.areaEvento}>
                <Image
                  source={{
                    uri: api.getBaseApi() + "/uploads/" + formData.imagem,
                  }}
                  style={styles.imagem}
                />
                <View style={styles.areaTextoEvento}>
                  <Text style={styles.tituloEvento}>{formData.nome}</Text>
                  {/* <Text style={styles.enderecoEvento}>{formData.endereco}</Text> */}
                </View>
              </View>

              <View style={styles.areaResumo}>
                <Text style={styles.titulo}>Resumo</Text>
                <View>
                  <FlatList<IngressoAgrupado>
                    data={ingressosAgrupados}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 3,
                          marginHorizontal: 5,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View style={{ flexDirection: "row" }}>
                            <Text
                              style={{
                                paddingHorizontal: 3,
                                fontWeight: "bold",
                                fontSize: 14,
                              }}
                            >
                              {item.qtde} x
                            </Text>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {
                                item.Ingresso_EventoIngresso?.TipoIngresso
                                  ?.descricao
                              }
                            </Text>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {item.Ingresso_EventoIngresso?.nome}
                            </Text>
                            {item.precoDesconto ? (
                              <Text
                                style={{
                                  paddingHorizontal: 3,
                                  fontSize: 14,
                                  color: colors.greenEscuro,
                                }}
                              >
                                Desconto:{" "}
                                {formatCurrency(
                                  (item.precoDesconto * item.qtde).toFixed(2)
                                )}
                              </Text>
                            ) : null}
                          </View>
                          <View>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {formatCurrency(
                                (item.preco * item.qtde).toFixed(2)
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                </View>
                <View
                  style={{
                    flexDirection: "column",
                    alignItems: "flex-end",
                    paddingRight: 8,
                  }}
                >
                  <Text style={{ fontSize: 16, paddingBottom: 3 }}>
                    Total Ingressos:{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {formatCurrency(registroTransacao?.preco ?? 0)}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 16, paddingBottom: 3 }}>
                    Total Taxa:{" "}
                    {registroTransacao?.taxaServicoDesconto &&
                      registroTransacao?.taxaServicoDesconto > 0 && (
                        <Text
                          style={{
                            color: colors.greenEscuro,
                            paddingHorizontal: 5,
                          }}
                        >
                          Desconto:{" "}
                          {formatCurrency(
                            registroTransacao?.taxaServicoDesconto ?? 0
                          )}
                        </Text>
                      )}
                    <Text style={{ fontWeight: "bold" }}>
                      {formatCurrency(registroTransacao?.taxaServico ?? 0)}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 16 }}>
                    Total incluindo taxas:{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {formatCurrency(registroTransacao?.valorTotal ?? 0)}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
          )}
          renderItem={() => (
            <>
              <Text style={styles.sectionTitle}>
                Escolha o método de pagamento
              </Text>

              <View style={styles.paymentMethodsContainer}>
                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "crédito" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("crédito")}
                >
                  <Feather name="credit-card" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Crédito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "débito" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("débito")}
                >
                  <Feather name="credit-card" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Débito</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "pix" && styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("pix")}
                >
                  <Feather name="hash" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>PIX</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.paymentMethodButton,
                    metodoSelecionado === "Dinheiro" &&
                      styles.paymentMethodSelected,
                  ]}
                  onPress={() => setMetodoSelecionado("Dinheiro")}
                >
                  <Feather name="check" size={28} color="#fff" />
                  <Text style={styles.paymentMethodText}>Dinheiro</Text>
                </TouchableOpacity>
              </View>

              {consultaPagamento && (
                <View style={styles.confirmContainer}>
                  <Text style={styles.confirmButtonText}>
                    Aguarde enviando dados do pagamento...
                  </Text>
                </View>
              )}

              {consultaPagamento && (
                <ActivityIndicator
                  size="large"
                  color={colors.azul}
                  style={{ marginTop: 20 }}
                />
              )}

              {dadosDePagamento.payment_status && (
                <StatusPaymentCustomizadoPOS
                  data={dadosDePagamento}
                  idUsuario={registroTransacao?.idUsuario}
                />
              )}

              {metodoSelecionado && dadosDePagamento?.payment_status != 4 && (
                <View style={styles.confirmContainer}>
                  <TouchableOpacity
                    style={[
                      styles.confirmButton,
                      {
                        backgroundColor: consultaPagamento
                          ? colors.red
                          : colors.azul,
                      },
                    ]}
                    onPress={() => {
                      if (!consultaPagamento) {
                        if (metodoSelecionado === "Dinheiro") {
                          fetchPagamentoDinheiro();
                        } else {
                          fetchPagamentoPos();
                        }
                      } else {
                        CancelaPagamentoPos();
                      }
                    }}
                  >
                    <Text style={styles.confirmButtonText}>
                      {consultaPagamento
                        ? "Cancelar Pagamento"
                        : "Confirmar " + metodoSelecionado}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        />
      </View>
      {/* {modalVisible && <ModalResumoIngresso step={2} />} */}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    // marginBottom: 20,
    // height: 500,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  areaTitulo: {
    fontSize: 22,
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  eventDetails: {
    flexWrap: "wrap",
    width: Platform.OS === "web" ? width - 432 : -32,
  },
  eventDetailItem: {
    flexDirection: "column",
    paddingRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    paddingLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
  },
  imagem: {
    // width: "100%",
    borderRadius: 20,
    height: 110,
    width: 180,
    resizeMode: "cover",
  },
  areaEvento: {
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
  },
  areaStep: {
    justifyContent: "center",
    alignItems: "center",
  },
  areaResumo: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "30%") : 0,
    borderRadius: 20,
    flex: 1,
  },
  ticketContainer: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.branco,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "20%") : 5,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputCard: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  areaTextoEvento: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  tituloEvento: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  enderecoEvento: {
    fontSize: 16,
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  paymentMethodsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  paymentMethodButton: {
    alignItems: "center",
    backgroundColor: "#999",
    padding: 15,
    borderRadius: 12,
    width: 100,
    // gap: 10,
    marginBottom: 10,
  },
  paymentMethodSelected: {
    backgroundColor: colors.azul,
  },
  paymentMethodText: {
    marginTop: 8,
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  confirmButton: {
    backgroundColor: colors.azul,
    paddingVertical: 14,
    paddingHorizontal: 35,
    borderRadius: 10,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
