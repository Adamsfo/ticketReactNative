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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  Produtor,
  QueryParams,
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

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const navigation = useNavigation() as any;
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
  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [modalVisible, setModalVisible] = useState(true);

  const data = [{ label: "Nome", content: "Nome" }];

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      getRegistrosIngressos({ filters: { idEvento: id } });
      setFormData(data as Evento);
    }
  };
  const getRegistrosIngressos = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    setRegistrosEventoIngressos(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      if (id > 0) {
        getRegistros(id);
        getRegistrosIngressos({ filters: { idEvento: id } });
      }
    }, [id])
  );

  // Filtrar os diferentes TipoIngresso_descricao
  const tipoIngressoDescricoes = Array.from(
    new Set(
      registrosEventoIngressos.map(
        (ingresso) => ingresso.TipoIngresso_descricao
      )
    )
  );

  const handleCloseModal = () => {
    setModalVisible(false);
  };

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

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.areaStep}>
          <StepIndicator currentStep={1} />
        </View>
        <Text style={styles.titulo}>Ingressos</Text>

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

          <View style={styles.area}>
            {tipoIngressoDescricoes.map((descricao, index) => (
              <Accordion
                key={index}
                title={descricao || "Descrição indisponível"}
              >
                {registrosEventoIngressos
                  .filter(
                    (ingresso) => ingresso.TipoIngresso_descricao === descricao
                  )
                  .map((ingresso, idx) => (
                    // <Text key={idx}>{ingresso.nome}</Text>
                    <View key={ingresso.id} style={{ flexDirection: "column" }}>
                      <CounterTicket data={ingresso} />
                    </View>
                  ))}
              </Accordion>
            ))}
            <View style={{ height: 100 }}></View>
          </View>
        </ScrollView>
      </View>
      {modalVisible && <ModalResumoIngresso zerarItem={zerarItem} step={1} />}
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
    // fontWeight: "bold",
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    // flexBasis: "45%",
  },
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
    // flexBasis: "45%",
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
    // justifyContent: "center",
    width: Platform.OS === "web" ? width - 432 : -32, // Ajusta a largura conforme a tela
    // width: width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  imagem: {
    width: "100%", // 100% para web, largura da tela para mobile
    borderRadius: 20,
    height: 100,
    maxWidth: 180,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
  areaEvento: {
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 10,
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
  },
  areaStep: {
    justifyContent: "center",
    alignItems: "center",
  },
});
