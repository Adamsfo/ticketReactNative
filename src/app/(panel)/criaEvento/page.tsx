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
import ModalMsg from "@/src/components/ModalMsg";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Feather } from "@expo/vector-icons";
import CounterTicket from "@/src/components/CounterTicket";
import FormattedTextEditor from "@/src/components/FormattedTextEditor";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import TextEditor from "@/src/components/TextEditor";

const { width } = Dimensions.get("window");

const handleHead = ({ tintColor }: { tintColor: string }) => (
  <Text style={{ color: tintColor }}>H1</Text>
);

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

  const richText = React.useRef<RichEditor | null>(null);

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        {/* <View style={styles.area}> */}
        <Text style={styles.titulo}>Crie seu Evento</Text>
        {/* </View> */}

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
            {errors.nomeCompleto && (
              <Text style={styles.labelError}>{errors.nome}</Text>
            )}
          </View>

          {/* <View> */}
          <FormattedTextEditor />
          {/* </View> */}

          {/* <View>
            <Text style={styles.label}>Descrição do evento</Text>
            <TextInput
              style={styles.input}
              multiline={true}
              placeholder="Coloque todas as informações necessárias do seu evento..."
              keyboardType="default"
              value={formData.descricao}
              onChangeText={(text) => handleChange("descricao", text)}
              numberOfLines={15}
              textAlignVertical="top"
            ></TextInput>
            {errors.nomeCompleto && (
              <Text style={styles.labelError}>{errors.descricao}</Text>
            )}
          </View> */}
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
});
