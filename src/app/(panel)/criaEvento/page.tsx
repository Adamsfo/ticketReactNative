import React, { useState } from "react";
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
import AddressPicker from "@/src/components/AddressPicker";

const { width } = Dimensions.get("window");

export default function Index() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  const [content, setContent] = useState("");

  const handleChange = (field: any, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEditorChange = (html: string) => {
    console.log("Editor content:", html);
  };

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
          <Text style={styles.titulo}>Crie seu Evento</Text>
          {/* </View> */}

          <ScrollView
            style={{
              flex: 1,
              borderRadius: 8,
            }}
          >
            <View style={styles.area}>
              <Text style={styles.areaTitulo}>Principais informações</Text>

              <View>
                <Text style={styles.label}>Nome do evento</Text>
                <TextInput
                  style={styles.input}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Nome do evento..."
                  keyboardType="default"
                  value={formData.nome}
                  onChangeText={(text) => handleChange("nome", text)}
                ></TextInput>
                {errors.nome && (
                  <Text style={styles.labelError}>{errors.nome}</Text>
                )}
              </View>

              <View>
                <Text style={styles.label}>Imagem do evento</Text>
                <ImageUploader />
              </View>

              <View
                style={{
                  marginBottom: 16,
                  flex: 1,
                  minHeight: Platform.OS === "web" ? 200 : 350,
                }}
              >
                <SafeAreaView style={{ height: "100%" }}>
                  <Text>Descrição </Text>
                  {Platform.OS === "web" ? (
                    <QuillEditorWeb />
                  ) : (
                    <QuillEditorMobile />
                  )}
                </SafeAreaView>
                {errors.descricao && (
                  <Text style={styles.labelError}>{errors.descricao}</Text>
                )}
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Data Inicio do Evento:</Text>
                  <DatePickerComponente />
                </View>
                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Hora Inicio do Evento:</Text>
                  <TimePickerComponente />
                </View>

                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Data Fim do Evento:</Text>
                  <DatePickerComponente />
                </View>
                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Hora Fim do Evento:</Text>
                  <TimePickerComponente />
                </View>
                {errors.nomeCompleto && (
                  <Text style={styles.labelError}>{errors.descricao}</Text>
                )}
              </View>
            </View>

            <View style={styles.area}>
              <Text style={styles.areaTitulo}>Localização do Evento</Text>
              <AddressPicker />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
