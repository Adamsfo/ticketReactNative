import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
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
  Produtor,
  QueryParams,
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

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state, dispatch } = useCart();
  const { id } = route.params as { id: number };

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

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      // getRegistrosIngressos({ filters: { idEvento: id } });
      setFormData(data as Evento);
    }
  };

  const gerarIngressos = async () => {
    const usuarioString = await AsyncStorage.getItem("usuario");
    const usuario: Usuario = usuarioString ? JSON.parse(usuarioString) : null;

    if (state.items.length > 0) {
      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i];
        for (let j = 0; j < item.qtde; j++) {
          let json = await apiGeral.createResource<Ingresso>("/ingresso", {
            idEvento: item.eventoIngresso.idEvento,
            idEventoIngresso: item.eventoIngresso.id,
            idTipoIngresso: item.eventoIngresso.idTipoIngresso,
            idUsuario: usuario.id,
          });
          let ingresso = json.data as unknown as Ingresso;

          dispatch({
            type: "ADD_INGRESSO",
            ingresso: ingresso,
          });

          console.log("Ingresso gerado:", ingresso); // Verifique o ingresso gerado
        }
      }
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
      if (id > 0) {
        getRegistros(id);
        // getRegistrosIngressos({ filters: { idEvento: id } });
      }
    }, [id])
  );

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

  const renderTicketInputs = (item: any) => {
    return Array.from({ length: item.qtde }).map((_, index) => (
      <View key={index} style={styles.inputCard}>
        <Text style={styles.inputLabel}>Nome Completo:</Text>
        <TextInput style={styles.input} placeholder="Nome Completo" />
        <Text style={styles.inputLabel}>Email:</Text>
        <TextInput style={styles.input} placeholder="Email" />
      </View>
    ));
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
        >
          <View style={styles.areaEvento}>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + formData.imagem }}
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
            <View style={{ flexDirection: "row", flex: 1 }}>
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
                        <Text style={{ paddingHorizontal: 3, fontSize: 14 }}>
                          {item.eventoIngresso.TipoIngresso_descricao}
                        </Text>
                        <Text style={{ paddingHorizontal: 3, fontSize: 14 }}>
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
                            (item.qtde * item.eventoIngresso.preco).toFixed(2)
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
              <Text style={{ fontSize: 16 }}>
                Total Ingressos:
                <Text style={{ fontWeight: "bold", paddingLeft: 10 }}>
                  {formatCurrency(calculateTotalPreco())}
                </Text>
              </Text>
              <Text style={{ fontSize: 16 }}>
                Total Taxa:
                <Text style={{ fontWeight: "bold", paddingLeft: 10 }}>
                  {formatCurrency(calculateTotalTaxa())}
                </Text>
              </Text>
              <Text style={{ fontSize: 16 }}>
                Total incluindo taxas:
                <Text style={{ fontWeight: "bold", paddingLeft: 10 }}>
                  {formatCurrency(calculateTotal())}
                </Text>
              </Text>
            </View>
          </View>
          <TouchableOpacity>
            <Text onPress={() => gerarIngressos()}>gerar ingresso</Text>
          </TouchableOpacity>
          <View style={styles.eventDetailItem}>
            <Text style={styles.titulo}>Preencha os dados dos ingressos</Text>
            <FlatList
              data={state.ingressos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.ticketContainer}>
                  <Text style={styles.ticketTitle}>
                    {/* {item.eventoIngresso.nome} - {item.qtde} ingressos */}
                  </Text>
                  <Text style={styles.ticketTitle}> Status {item.status}</Text>
                  {renderTicketInputs(item)}
                </View>
              )}
            />
          </View>
        </ScrollView>
      </View>
      {modalVisible && <ModalResumoIngresso step={2} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? 200 : 5,
    marginLeft: Platform.OS === "web" ? 200 : 5,
    marginBottom: 20,
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
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
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
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
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
    marginRight: Platform.OS === "web" ? "30%" : 0,
    marginLeft: Platform.OS === "web" ? "30%" : 0,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
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
    marginRight: Platform.OS === "web" ? "30%" : 0,
    marginLeft: Platform.OS === "web" ? "30%" : 0,
    // paddingBottom: 25,
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
