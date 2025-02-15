import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  View,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import FormattedTextEditor from "@/src/components/FormattedTextEditor";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "../../../components/QuillEditorMobile";
import ImageUploader from "@/src/components/ImageUploader";
import DateTimePicker from "@react-native-community/datetimepicker";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";
import AddressPicker from "../../../components/AddressPicker";
import CustomGrid from "@/src/components/CustomGrid";
import { Feather } from "@expo/vector-icons";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import ModalAddTipoIngresso from "./modalAdd";
import { QueryParams, TipoIngresso } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";

const { width } = Dimensions.get("window");
let timer: NodeJS.Timeout;

export default function Index() {
  const endpointApi = "/tipoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [visibleMsg, setVisibleMsg] = useState(false);
  const [count, setCount] = useState(1);
  const [registros, setRegistros] = useState<TipoIngresso[]>([]);

  const handleChange = (field: any, value: string) => {
    // setRegistros({ ...registros, [field]: value });
  };

  const data = [
    { label: "Tipo", content: "Ingresso Individual" },
    { label: "Quantidade de Ingressos", content: "1" },
  ];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<TipoIngresso>("/tipoingresso");
    const registrosData = response.data ?? [];

    console.log("Registros", registrosData);
    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [])
  );

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          {/* <View style={styles.area}> */}
          <Text style={styles.titulo}>Tipo Ingresso</Text>
          {/* </View> */}

          <ScrollView
            showsVerticalScrollIndicator={false} // Esconde a barra de rolagem vertical
            showsHorizontalScrollIndicator={false}
            style={{
              flex: 1,
              borderRadius: 8,
            }}
          >
            <View style={styles.area}>
              {Platform.OS === "web" && <CustomGridTitle data={data} />}
              {registros.map((item: TipoIngresso, index: number) => (
                <CustomGrid
                  key={index}
                  data={[
                    { label: data[0].label, content: item.descricao },
                    { label: data[1].label, content: item.qtde.toString() },
                  ]}
                />
              ))}
              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: colors.azul,
                    borderRadius: 5,
                    padding: 10,
                    marginTop: 10,
                    width: Platform.OS === "web" ? 200 : 100,
                    alignItems: "center",
                  }}
                  // onPress={() => setVisibleMsg(true)}
                  onPress={() => getRegistros()}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>
                    Novo
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ModalAddTipoIngresso
            visible={visibleMsg}
            onClose={() => setVisibleMsg(false)}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? 200 : 20,
    marginLeft: Platform.OS === "web" ? 200 : 20,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    marginLeft: Platform.OS === "web" ? 200 : 20,
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
});
