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
import ImageUploader from "@/src/components/ImageUploader";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import formatCurrency from "@/src/components/FormatCurrency";
import { useRoute } from "@react-navigation/native";
import { Modal } from "react-native-paper";
import ModalEventoIngresso from "./modalEventoIngresso";
import { useNavigation } from "@react-navigation/native";
import WebMap from "@/src/components/WebMap";
import AddressPicker from "@/src/components/AddressPicker";
import Select from "@/src/components/Select";

const { width } = Dimensions.get("window");

export default function Index() {
  const route = useRoute();
  const { id } = route.params as { id: number };
  const endpointApi = "/evento";
  const navigation = useNavigation() as any;
  const endpointApiIngressos = "/eventoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [modalEventoIngressoVisible, setModalEventoIngressoVisible] =
    useState(false);
  const [idEventoIngresso, setIdEventoIngresso] = useState(0);
  const [itemsProdutor, setItemsProdutor] = useState<
    { value: number; label: string }[]
  >([]);

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

  const dataEventoIngressos = [
    { label: "Tipo", content: "" },
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
      console.log("validationErrors", validationErrors);
      return;
    }

    if (id > 0) {
      await apiGeral.updateResorce<Evento>(endpointApi, formData);
    } else {
      await apiGeral.createResource<Evento>(endpointApi, formData);
    }

    navigation.navigate("meusevento");
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    if (!formData.descricao) newErrors.descricao = "Descrição é obrigatório.";
    if (!formData.data_hora_inicio)
      newErrors.data_hora_inicio = "Data Inicio é obrigatório.";
    if (!formData.data_hora_fim)
      newErrors.data_hora_fim = "Data Fim é obrigatório.";
    if (!formData.idProdutor) newErrors.idProdutor = "Produtor é obrigatório.";
    if (!formData.endereco) newErrors.endereco = "Endereço é obrigatório.";
    if (!formData.latitude) newErrors.endereco = "Latitude é obrigatório.";
    if (!formData.latitude) newErrors.endereco = "Longitude é obrigatório.";

    return newErrors;
  };

  const getRegistros = async (id: number) => {
    await getRegistrosProdutor();
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      getRegistrosIngressos({ filters: { idEvento: id } });
      setFormData(data as Evento);
    } else {
      formData.id = 0;
      formData.nome = "";
      formData.descricao = "";
      formData.imagem = "";
      formData.data_hora_inicio = new Date();
      formData.data_hora_fim = new Date();
      formData.endereco = "";
      formData.idUsuario = 0;
      formData.idProdutor = 0;
      formData.mapa = "";
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setRegistrosEventoIngressos([]);
        await getRegistros(id);
      };
      fetchData();
    }, [id])
  );

  const handleModalEdit = (id: number) => {
    setIdEventoIngresso(id);
    setModalEventoIngressoVisible(true);
  };

  const handleModalNovo = () => {
    setIdEventoIngresso(0);
    setModalEventoIngressoVisible(true);
  };

  const handleCloseModalEventoIngresso = () => {
    setModalEventoIngressoVisible(false);
    getRegistrosIngressos({ filters: { idEvento: id } });
  };

  const onClose = () => {
    navigation.navigate("meusevento");
  };

  const handleSaveLocation = (location: {
    latitude: number;
    longitude: number;
    endereco: string;
  }) => {
    formData.latitude = location.latitude.toString();
    formData.longitude = location.longitude.toString();
    formData.endereco = location.endereco;
  };

  const getRegistrosProdutor = async () => {
    const response = await apiGeral.getResource<Produtor>("/produtor");

    const registrosData = (response.data ?? []).map((record: Produtor) => ({
      value: record.id,
      label: record.nome,
    }));

    setItemsProdutor(registrosData);
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
          {id > 0 && (
            <View style={{ marginBottom: 16 }}>
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
                        content: item.TipoIngresso_descricao?.toString() || "",
                        id: item.id,
                      },
                      {
                        label: dataEventoIngressos[1].label,
                        content: item.nome,
                        id: item.id,
                      },
                      {
                        label: dataEventoIngressos[2].label,
                        content: formatCurrency(item.preco),
                        id: item.id,
                      },
                      {
                        label: dataEventoIngressos[3].label,
                        content: formatCurrency(item.taxaServico),
                        id: item.id,
                      },
                      {
                        label: dataEventoIngressos[4].label,
                        content: formatCurrency(item.valor),
                        id: item.id,
                      },
                      {
                        label: dataEventoIngressos[5].label,
                        content: item.status,
                        id: item.id,
                      },
                    ]}
                  />
                )
              )}
              <View
                style={{ flexDirection: "row", justifyContent: "flex-end" }}
              >
                <TouchableOpacity
                  style={[styles.buttonNovoItem]}
                  onPress={handleModalNovo}
                >
                  <Text style={styles.buttonText}>Novo</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
          <ModalEventoIngresso
            id={idEventoIngresso}
            idEvento={id}
            visible={modalEventoIngressoVisible}
            onClose={handleCloseModalEventoIngresso}
          />
        </ScrollView>
      </View>
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
    fontSize: 16,
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
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  buttonNovoItem: {
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginLeft: 10,
  },
});
