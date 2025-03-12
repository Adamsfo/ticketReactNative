import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO } from "date-fns";
import ModalMeusEventos from "./modalMeusEventos";
import ImageUploader from "@/src/components/ImageUploader";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import formatCurrency from "@/src/components/FormatCurrency";
import { useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function Index() {
  const route = useRoute();
  const { id } = route.params as { id: number };
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [modalEventoIngressoVisible, setModalEventoIngressoVisible] =
    useState(false);
  const [idEventoIngresso, setIdEventoIngresso] = useState(0);

  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    local: "",
    endereco: "",
    id_usuario: 0,
    id_produtor: 0,
  });

  const dataEventoIngressos = [
    { label: "Nome", content: "" },
    { label: "Valor a Receber", content: "" },
    { label: "Taxa", content: "" },
    { label: "Valor Venda", content: "" },
    { label: "Status", content: "" },
  ];

  const handleChange = (field: any, value: string | number | Date) => {
    setFormData({ ...formData, [field]: value });
  };

  const getRegistrosIngressos = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    setRegistrosEventoIngressos(registrosData);
  };

  const handleSave = async () => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (id > 0) {
      await apiGeral.updateResorce<Evento>(endpointApi, formData);
    } else {
      await apiGeral.createResource<Evento>(endpointApi, formData);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    if (!formData.descricao) newErrors.descricao = "Descrição é obrigatório.";

    return newErrors;
  };

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      getRegistrosIngressos({ filters: { idEvento: id } });
      setFormData(data as Evento);
    } else {
      formData.nome = "";
      formData.descricao = "";
      formData.imagem = "";
      formData.data_hora_inicio = new Date();
      formData.data_hora_fim = new Date();
      formData.local = "";
      formData.endereco = "";
      formData.id_usuario = 0;
      formData.id_produtor = 0;
      formData.mapa = "";
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRegistrosEventoIngressos([]);
      getRegistros(id);
    }, [id])
  );

  const handleModalEdit = (id: number) => {
    setIdEventoIngresso(id);
    setModalEventoIngressoVisible(true);
  };

  const handleCloseModalEventoIngresso = () => {
    setModalEventoIngressoVisible(false);
    getRegistrosIngressos({ filters: { idEvento: id } });
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Informações do Evento</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
        >
          <View>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              multiline={Platform.OS === "web" ? false : true}
              placeholder="Nome..."
              keyboardType="default"
              value={formData.nome}
              onChangeText={(text) => handleChange("nome", text)}
            ></TextInput>
            {errors.nome && (
              <Text style={styles.labelError}>{errors.nome}</Text>
            )}
          </View>

          <View>
            <Text style={styles.label}>Imagem</Text>
            <ImageUploader
              value={formData.imagem || ""}
              onChange={(value) => handleChange("imagem", value)}
            />
          </View>

          <View
            style={{
              marginBottom: 16,
              flex: 1,
              minHeight: Platform.OS === "web" ? 200 : 350,
            }}
          >
            <SafeAreaView style={{ height: "100%" }}>
              <Text style={styles.label}>Descrição</Text>
              {Platform.OS === "web" ? (
                <QuillEditorWeb
                  value={formData.descricao || ""}
                  onChange={(value) => handleChange("descricao", value)}
                />
              ) : (
                <QuillEditorMobile
                  value={formData.descricao || ""}
                  onChange={(value) => handleChange("descricao", value)}
                />
              )}
            </SafeAreaView>
            {errors.descricao && (
              <Text style={styles.labelError}>{errors.descricao}</Text>
            )}
          </View>

          <Text style={styles.label}>Data e Hora</Text>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Text style={styles.labelData}>Data Inicio:</Text>
              <DatePickerComponente
                value={formData.data_hora_inicio || ""}
                onChange={(value) => handleChange("data_hora_inicio", value)}
              />
            </View>
            <View style={styles.eventDetailItem}>
              <Text style={styles.labelData}>Hora Inicio:</Text>
              <TimePickerComponente
                value={formData.data_hora_inicio || ""}
                onChange={(value) => handleChange("data_hora_inicio", value)}
              />
            </View>
            {errors.nomeCompleto && (
              <Text style={styles.labelError}>{errors.descricao}</Text>
            )}
          </View>
          <View style={styles.eventDetails}>
            <View style={styles.eventDetailItem}>
              <Text style={styles.labelData}>Data Fim:</Text>
              <DatePickerComponente
                value={formData.data_hora_fim || ""}
                onChange={(value) => handleChange("data_hora_fim", value)}
              />
            </View>
            <View style={styles.eventDetailItem}>
              <Text style={styles.labelData}>Hora Fim:</Text>
              <TimePickerComponente
                value={formData.data_hora_fim || ""}
                onChange={(value) => handleChange("data_hora_fim", value)}
              />
            </View>
            {errors.nomeCompleto && (
              <Text style={styles.labelError}>{errors.descricao}</Text>
            )}
          </View>

          <View>
            <Text style={styles.label}>Mapa</Text>
            <ImageUploader
              value={formData.mapa || ""}
              onChange={(value) => handleChange("mapa", value)}
            />
          </View>

          <View>
            <Text style={styles.label}>Ingressos</Text>
            {Platform.OS === "web" && (
              <CustomGridTitle data={dataEventoIngressos} />
            )}
            {registrosEventoIngressos.map(
              (item: EventoIngresso, index: number) => (
                <CustomGrid
                  key={index}
                  onItemPress={handleModalEdit}
                  data={[
                    {
                      label: dataEventoIngressos[0].label,
                      content: item.nome,
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[1].label,
                      content: formatCurrency(item.preco),
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[2].label,
                      content: formatCurrency(item.taxaServico),
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[3].label,
                      content: formatCurrency(item.valor),
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[4].label,
                      content: formatCurrency(item.status),
                      id: item.id,
                    },
                  ]}
                />
              )
            )}
          </View>
        </ScrollView>
      </View>
      <ModalMeusEventos
        id={idEventoIngresso}
        visible={modalEventoIngressoVisible}
        onClose={handleCloseModalEventoIngresso}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? 300 : 20,
    marginLeft: Platform.OS === "web" ? 300 : 20,
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
    paddingRight: 25,
    paddingLeft: 25,
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
    fontWeight: "bold",
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
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
    flexDirection: Platform.OS === "web" ? "row" : "column",
    width: Platform.OS === "web" ? width - 432 : width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
});
