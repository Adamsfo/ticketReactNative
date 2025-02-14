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
import AddressPicker from "../../../components/AddressPicker";
import CustomGrid from "@/src/components/CustomGrid";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Index() {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [count, setCount] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });
  const handleChange = (field: any, value: string) => {
    setFormData({ ...formData, [field]: value });
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
              <CustomGrid />
              <CustomGrid />
            </View>

            <View style={styles.area}>
              <Text style={styles.areaTitulo}>Principais informações</Text>

              <View>
                <Text style={styles.label}>
                  Descrição{" "}
                  <Text
                    style={{ fontSize: 10, color: colors.red, marginLeft: 8 }}
                  >
                    Informação: Ingresso Individual, Bistro, Camarote
                  </Text>
                </Text>
                <TextInput
                  style={styles.input}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Ingresso Individual..."
                  keyboardType="default"
                  value={formData.nome}
                  onChangeText={(text) => handleChange("nome", text)}
                ></TextInput>
                {errors.nome && (
                  <Text style={styles.labelError}>{errors.nome}</Text>
                )}
              </View>

              <View style={{ alignContent: "flex-start" }}>
                <Text style={styles.label}>
                  Quantidade de Ingressos{" "}
                  <Text
                    style={{ fontSize: 10, color: colors.red, marginLeft: 8 }}
                  >
                    Informação: Ingresso Individual quantidade 1, caso bistro ou
                    camarote informe a quantidade correspondente
                  </Text>
                </Text>
                <View style={{ marginLeft: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgb(0, 146, 250)",
                        borderRadius: 5,
                      }}
                      onPress={() => setCount(count + 1)}
                    >
                      <Feather name="plus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, marginHorizontal: 5 }}>
                      {count}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgb(0, 146, 250)",
                        borderRadius: 5,
                      }}
                      onPress={() => setCount(count - 1)}
                    >
                      <Feather name="minus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
