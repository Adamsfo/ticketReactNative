import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  QueryParams,
  Transacao,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state } = useCart();
  const { idEvento, registroTransacao } = route.params as {
    idEvento: number;
    registroTransacao: Transacao;
  };

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
  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [modalVisible, setModalVisible] = useState(true);

  const data = [{ label: "Nome", content: "Nome" }];

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
    }
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
      if (idEvento > 0) {
        getRegistros(idEvento);
      }
    }, [idEvento])
  );

  const zerarItem = (id: number) => {
    console.log("zerarItem");
    const reg = registrosEventoIngressos.map((ingresso) => {
      if (ingresso.id === id) {
        ingresso.qtde = 0;
      }
      return ingresso;
    });

    setRegistrosEventoIngressos([]);
    setRegistrosEventoIngressos(reg);
  };

  const calculateTotalPreco = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.preco;
      }, 0)
      .toFixed(2);
  };

  const calculateTotalTaxa = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.taxaServico;
      }, 0)
      .toFixed(2);
  };

  const calculateTotal = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.valor;
      }, 0)
      .toFixed(2);
  };

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
        <Text style={styles.titulo}>Pagamento</Text>

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
                <View>
                  <Text
                    style={[
                      styles.titulo,
                      { marginLeft: 10, textAlign: "left", fontSize: 22 },
                    ]}
                  >
                    {formData.nome}
                  </Text>
                  <Text style={{ marginLeft: 10, fontSize: 16 }}>
                    {formData.endereco}
                  </Text>
                </View>
              </View>

              <View style={styles.areaResumo}>
                <Text style={styles.titulo}>Resumo</Text>
                <View>
                  <FlatList
                    data={state.items}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 3,
                          marginHorizontal: 5,
                          // flex: 1,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                            }}
                          >
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
                              {item.eventoIngresso.TipoIngresso_descricao}
                            </Text>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {item.eventoIngresso.nome}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                paddingHorizontal: 3,
                                fontSize: 14,
                              }}
                            >
                              {formatCurrency(
                                (item.qtde * item.eventoIngresso.preco).toFixed(
                                  2
                                )
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
            <View
              style={[
                styles.eventDetailItem,
                {
                  paddingBottom: 100,
                  height: "100%",
                  width: "100%",
                  borderRadius: 20,
                },
              ]}
            >
              <CheckoutMercadoPago />
            </View>
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
    width: "100%",
    borderRadius: 20,
    height: 100,
    maxWidth: 180,
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
});
