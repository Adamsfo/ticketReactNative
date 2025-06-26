import React, { useCallback, useEffect, useState } from "react";
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
  Status,
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
import ModalEventoIngresso from "../modalEventoIngresso";
import { useNavigation } from "@react-navigation/native";
import AddressPicker from "@/src/components/AddressPicker";
import Select from "@/src/components/Select";
import { useAuth } from "@/src/contexts_/AuthContext";
import Footer from "@/src/components/Footer";

const { width } = Dimensions.get("window");

export default function MeusEventosInfo() {
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
  const { user } = useAuth();

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
    status: "Ativo" as Status,
  });

  const dataEventoIngressos = [
    { label: "Setor", content: "" },
    { label: "Título", content: "" },
    { label: "Valor a Receber", content: "" },
    { label: "Taxa", content: "" },
    { label: "Valor Venda", content: "" },
    { label: "Quantidade", content: "" },
    { label: "Status", content: "" },
    { label: "Cupom Promocional", content: "" },
  ];

  const itensStatus = [
    { value: "Ativo", label: "Ativo" },
    { value: "Oculto", label: "Oculto" },
    { value: "Finalizado", label: "Finalizado" },
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
    console.log("entrou");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      console.log("validationErrors", validationErrors);
      return;
    }

    if (id > 0) {
      await apiGeral.updateResorce<Evento>(endpointApi, formData);
      navigation.navigate("meusevento");
    } else {
      const ret = await apiGeral.createResource<Evento>(endpointApi, formData);
      navigation.navigate("meuseventonewingresso", { id: ret.data.id });
    }
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
    console.log("id", id);
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      getRegistrosIngressos({ filters: { idEvento: id } });
      // setFormData(data as Evento);
      formData.id = data.id;
      formData.nome = data.nome;
      formData.imagem = data.imagem;
      formData.data_hora_inicio = data.data_hora_inicio;
      formData.data_hora_fim = data.data_hora_fim;
      formData.endereco = data.endereco;
      formData.idUsuario = data.idUsuario;
      formData.idProdutor = data.idProdutor;
      formData.mapa = data.mapa;
      formData.status = data.status;
      formData.latitude = data.latitude;
      formData.longitude = data.longitude;
      formData.descricao = data.descricao;
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
      getRegistrosProdutor();

      const fetchData = async () => {
        setRegistrosEventoIngressos([]);
        await getRegistros(id);
      };

      if (id > 0) {
        fetchData();
      }
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
    console.log("getRegistrosProdutor");
    const response = await apiGeral.getResource<Produtor>("/produtor");

    const registrosData = (response.data ?? []).map((record: Produtor) => ({
      value: record.id,
      label: record.nome,
    }));

    setItemsProdutor(registrosData);
  };

  return (
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
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.label}>Status</Text>
          <Select
            items={itensStatus}
            currentValue={formData.status ?? ""}
            onValueChange={(text) => handleChange("status", text)}
          ></Select>
        </View>

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
          {errors.nome && <Text style={styles.labelError}>{errors.nome}</Text>}
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
            marginBottom: 45,
            flex: 1,
            minHeight: Platform.OS === "web" ? 200 : 350,
          }}
        >
          <SafeAreaView style={{ height: "100%" }}>
            <Text style={styles.label}>Informações</Text>
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
          <Text style={styles.label}>Mapa do Evento</Text>
          <ImageUploader
            value={formData.mapa || ""}
            onChange={(value) => handleChange("mapa", value)}
          />
        </View>

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
                      content: item.qtde.toString(),
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[6].label,
                      content: item.status,
                      id: item.id,
                    },
                    {
                      label: dataEventoIngressos[7].label,
                      content: item.CupomPromocional_nome || "",
                      id: item.id,
                    },
                  ]}
                />
              )
            )}
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                style={[styles.buttonNovoItem]}
                onPress={handleModalNovo}
              >
                <Text style={styles.buttonText}>Novo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View>
          <Text style={styles.label}>Localização</Text>
          <AddressPicker
            onSave={handleSaveLocation}
            initialAddress={formData.endereco}
          />
        </View>

        {(itemsProdutor.length > 0 || user?.id === 1) && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Produtor</Text>
            <Select
              items={itemsProdutor}
              currentValue={formData.idProdutor}
              onValueChange={(text) => handleChange("idProdutor", text)}
            ></Select>
            {errors.idProdutor && (
              <Text style={styles.labelError}>{errors.idProdutor}</Text>
            )}
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
            <Text style={styles.buttonText}>
              {id > 0 ? "Salvar" : "Proximo"}{" "}
            </Text>
          </TouchableOpacity>
        </View>
        <ModalEventoIngresso
          id={idEventoIngresso}
          idEvento={id}
          visible={modalEventoIngressoVisible}
          onClose={handleCloseModalEventoIngresso}
        />
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
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
    // marginTop: 7,
    paddingRight: 25,
    paddingLeft: 25,
    // paddingTop: 15,
    // marginRight: Platform.OS === "web" ? 200 : 0,
    // marginLeft: Platform.OS === "web" ? 200 : 0,
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
    fontSize: 16,
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
