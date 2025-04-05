import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  Ingresso,
  IngressoTransacao,
  Produtor,
  QueryParams,
  Transacao,
  Usuario,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Accordion from "@/src/components/Accordion";
import CounterTicket from "@/src/components/CounterTicket";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO } from "date-fns";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import { Switch } from "react-native-gesture-handler";
import { useAuth } from "@/src/contexts_/AuthContext";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation() as any;
  const { idTransacao, idEvento } = route.params as {
    idTransacao: number;
    idEvento: number;
  };

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
  const [modalVisible, setModalVisible] = useState(true);
  const [registroTransacao, setRegistrosTransacao] = useState<Transacao>();
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (idTransacao > 0) {
        getRegistros(idEvento);
        getTransacao({ filters: { id: state.transacao?.id } });
      }
    }, [idEvento, idTransacao])
  );

  const calculateTotal = () => {
    return state.items
      .reduce((total, item) => {
        return total + item.qtde * item.eventoIngresso.valor;
      }, 0)
      .toFixed(2);
  };

  const renderTicketInputs = (item: any) => {
    const isCriança = item?.Ingresso_EventoIngresso?.nome.includes("Criança");

    return (
      <View style={styles.inputCard}>
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.label}>Nome Completo:</Text>
            {!isCriança && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.label}>Preencher meus dados </Text>
                <Switch
                  trackColor={{ false: colors.cinza, true: colors.azul }}
                  thumbColor={colors.azul}
                  // ios_backgroundColor={colors.cinza}
                  onValueChange={(value) => {
                    handleChangeIngressoTransacao(
                      item.id,
                      "Ingresso_atribuirOutroUsuario",
                      value
                    );
                  }}
                  value={item.Ingresso_atribuirOutroUsuario}
                ></Switch>
              </View>
            )}
          </View>

          <TextInput
            style={styles.input}
            multiline={Platform.OS === "web" ? false : true}
            placeholder="Nome..."
            keyboardType="default"
            value={item.Ingresso_nomeImpresso || ""}
            onChangeText={(text) =>
              handleChangeIngressoTransacao(
                item.id,
                "Ingresso_nomeImpresso",
                text
              )
            }
          ></TextInput>
          {/* {errors.nome && (
                        <Text style={styles.labelError}>{errors.nome}</Text>
                      )} */}
        </View>
        {isCriança && (
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <Text style={styles.inputLabel}>Data Nascimento:</Text>
            <View>
              <DatePickerComponente
                value={new Date(item.Ingresso_dataNascimento) || new Date()}
                onChange={(value) =>
                  handleChangeIngressoTransacao(
                    item.id,
                    "Ingresso_dataNascimento",
                    value
                  )
                }
              />
            </View>
            <Text style={styles.inputLabel}>
              {" "}
              Idade: {calcularIdade(item.Ingresso_dataNascimento)} anos
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleChangeIngressoTransacao = (
    id: number,
    field: any,
    value: string | number | Date | boolean
  ) => {
    setRegistrosIngressoTransacao((prevState) =>
      prevState.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    if (field === "Ingresso_atribuirOutroUsuario") {
      setRegistrosIngressoTransacao((prevState) =>
        prevState.map((item) =>
          item.id === id
            ? {
                ...item,
                Ingresso_nomeImpresso: value === true ? user?.nomeCompleto : "",
              }
            : item
        )
      );
    }
  };

  function calcularIdade(dataNascimento: string | Date) {
    const hoje = new Date();
    if (dataNascimento === null) {
      return 0;
    }

    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  const getTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Transacao>("/transacao", {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];
    console.log("registrosData", registrosData);

    setRegistrosTransacao(registrosData[0]);

    if (registrosData[0]?.id > 0) {
      if (calculateTotal() !== String(registrosData[0]?.valorTotal)) {
        navigation.navigate("ingressos", { id: idEvento });
      }
    }

    getIngressoTransacao({
      filters: { idTransacao: state.transacao?.id },
    });
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

    setRegistrosIngressoTransacao(registrosData);
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
          <StepIndicator currentStep={2} />
        </View>
        <Text style={styles.titulo}>Conferência e atribuição</Text>

        <FlatList
          data={registrosIngressoTransacao}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
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
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.ticketContainer}>
              <Text style={styles.ticketTitle}>
                {item.Ingresso_Evento?.nome}{" "}
                {item.Ingresso_EventoIngresso?.nome}
              </Text>
              <Text style={styles.label}>
                {item.Ingresso_EventoIngresso?.descricao}
              </Text>
              <Text style={styles.labelDataIngresso}>
                Válido a partir de{" "}
                {format(
                  parseISO(item.Ingresso_dataValidade?.toString()),
                  "dd/MM/yyyy"
                )}
              </Text>
              {renderTicketInputs(item)}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>
      {modalVisible && (
        <ModalResumoIngresso
          step={2}
          RegistroTransacao={registroTransacao}
          IngressoTransacao={registrosIngressoTransacao}
        />
      )}
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
    height: 500,
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
  labelDataIngresso: {
    color: colors.red,
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
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
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
    borderRadius: 20,
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
