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
  CupomPromocional,
  CupomPromocionalValidade,
  Produtor,
  QueryParams,
  Status,
  TipoDesconto,
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
import { useNavigation } from "@react-navigation/native";
import AddressPicker from "@/src/components/AddressPicker";
import Select from "@/src/components/Select";
import { useAuth } from "@/src/contexts_/AuthContext";
import { Badge } from "@/src/components/Badge";
import ModalCupomPromocionalValidade from "./modalCupomPromocionalValidade";

const { width } = Dimensions.get("window");

export default function Index() {
  const route = useRoute();
  const { id } = route.params as { id: number };
  const [idCupomPromocionalValidade, setIdCupomPromocionalValidade] =
    useState(0);
  const endpointApi = "/cupompromocional";
  const navigation = useNavigation() as any;
  const endpointApiValidade = "/cupompromocionalvalidade";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [registrosValidade, setRegistrosValidade] = useState<
    CupomPromocionalValidade[]
  >([]);

  const [itemsProdutor, setItemsProdutor] = useState<
    { value: number; label: string }[]
  >([]);

  const [
    modalVisibleCupomPromocionalValidade,
    setModalVisibleCupomPromocionalValidade,
  ] = useState(false);

  const { user } = useAuth();

  const [formData, setFormData] = useState<CupomPromocional>({
    id: 0,
    nome: "",
    idProdutor: 0,
    tipoDesconto: "Percentual" as TipoDesconto,
    valorDesconto: 0,
  });

  const titleItensGrid = [
    { label: "Data Inicial", content: "" },
    { label: "Data Final", content: "" },
    { label: "Alterar", isButton: true },
  ];

  // const itensStatus = [
  //   { value: "Ativo", label: "Ativo" },
  //   { value: "Oculto", label: "Oculto" },
  //   { value: "Finalizado", label: "Finalizado" },
  // ];

  const handleChange = (field: any, value: string | number | Date) => {
    setFormData({ ...formData, [field]: value });
  };

  const getRegistrosValidade = async (params: QueryParams) => {
    const response = await apiGeral.getResource<CupomPromocionalValidade>(
      endpointApiValidade,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    setRegistrosValidade(registrosData);
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
      await apiGeral.updateResorce<CupomPromocional>(endpointApi, formData);
    } else {
      const ret = await apiGeral.createResource<CupomPromocional>(
        endpointApi,
        formData
      );
    }

    navigation.navigate("cupompromocional");
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome) newErrors.nome = "Nome é obrigatório.";
    if (!formData.idProdutor) newErrors.descricao = "Produtor é obrigatório.";
    if (!formData.tipoDesconto)
      newErrors.tipoDesconto = "Tipo desconto é obrigatório.";
    if (!formData.valorDesconto)
      newErrors.valorDesconto = "Valor é obrigatório.";

    return newErrors;
  };

  const getRegistros = async (id: number) => {
    console.log("id", id);
    if (id > 0) {
      const response = await apiGeral.getResourceById<CupomPromocional>(
        endpointApi,
        id
      );

      let data = response as unknown as CupomPromocional;

      getRegistrosValidade({ filters: { idCupomPromocional: id } });
      // setFormData(data as Evento);
      formData.id = data.id;
      formData.nome = data.nome;
      formData.idProdutor = data.idProdutor;
      formData.tipoDesconto = data.tipoDesconto || "Percentual";
      formData.valorDesconto = data.valorDesconto || 0;
    } else {
      formData.id = 0;
      formData.nome = "";
      formData.idProdutor = 0;
      formData.tipoDesconto = "Percentual" as TipoDesconto;
      formData.valorDesconto = 0;
    }
  };

  useFocusEffect(
    useCallback(() => {
      getRegistrosProdutor();

      const fetchData = async () => {
        setRegistrosValidade([]);
        await getRegistros(id);
      };

      if (id > 0) {
        fetchData();
      } else {
        formData.id = 0;
        formData.nome = "";
        formData.idProdutor = 0;
        formData.tipoDesconto = "Percentual" as TipoDesconto;
        formData.valorDesconto = 0;
      }
    }, [id])
  );

  const onClose = () => {
    navigation.navigate("cupompromocional");
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

  const handleModalEdit = (id: number) => {
    console.log("handleModalEdit", id);
    setIdCupomPromocionalValidade(id);
    setModalVisibleCupomPromocionalValidade(true);
  };

  const handleCloseModalEventoIngresso = () => {
    setModalVisibleCupomPromocionalValidade(false);
    getRegistrosValidade({ filters: { idCupomPromocional: id } });
  };

  const handleModalNovo = () => {
    setIdCupomPromocionalValidade(0);
    setModalVisibleCupomPromocionalValidade(true);
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Informações do Cupom Promocional</Text>

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

          {/* <Text style={styles.label}>Data e Hora</Text>
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
          </View> */}

          {id > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>
                Data Validade do Cupom Promocional
              </Text>
              {Platform.OS === "web" && (
                <CustomGridTitle data={titleItensGrid} />
              )}
              {registrosValidade.map(
                (item: CupomPromocionalValidade, index: number) => (
                  <CustomGrid
                    key={index}
                    onItemPress={handleModalEdit}
                    data={[
                      {
                        label: titleItensGrid[0].label,
                        content: format(
                          parseISO(item.dataInicial.toString()),
                          "dd/MM/yyyy"
                        ),
                        id: item.id,
                      },
                      {
                        label: titleItensGrid[1].label,
                        content: format(
                          parseISO(item.dataFinal.toString()),
                          "dd/MM/yyyy"
                        ),
                        id: item.id,
                      },
                      {
                        label: titleItensGrid[2].label,
                        // content: formatCurrency(item.valorTotal.toString()),
                        id: item.id,
                        iconName: "check-square",
                        isButton: true,
                        onPress: handleModalEdit,
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

          <Text style={styles.label}>Tipo de Desconto</Text>
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                handleChange("tipoDesconto", "Percentual");
              }}
            >
              <Badge
                variant={
                  formData.tipoDesconto === "Percentual"
                    ? "default"
                    : "secondary"
                }
              >
                Percentual
              </Badge>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                handleChange("tipoDesconto", "Fixo");
              }}
            >
              <Badge
                variant={
                  formData.tipoDesconto === "Fixo" ? "default" : "secondary"
                }
              >
                Fixo
              </Badge>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            multiline={Platform.OS === "web" ? false : true}
            placeholder="Valor do Desconto..."
            keyboardType="default"
            value={
              formData.tipoDesconto === "Fixo"
                ? formatCurrency(
                    formData.valorDesconto.toString().replace("R$ ", "")
                  )
                : formData.valorDesconto.toString()
            }
            onChangeText={(text) =>
              handleChange(
                "valorDesconto",
                text.replace("R$ ", "").replace(",", ".")
              )
            }
          ></TextInput>

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
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ModalCupomPromocionalValidade
            id={idCupomPromocionalValidade}
            idCupomPromocional={id}
            visible={modalVisibleCupomPromocionalValidade}
            onClose={handleCloseModalEventoIngresso}
          ></ModalCupomPromocionalValidade>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginHorizontal:
      Platform.OS === "web" ? (width > 1000 ? "15%" : "5%") : "5%",
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
