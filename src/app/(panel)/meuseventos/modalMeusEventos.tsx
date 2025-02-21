import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { View, TouchableWithoutFeedback, ScrollView } from "react-native";
import colors from "@/src/constants/colors";
import { apiGeral } from "@/src/lib/geral";
import { Evento, Produtor } from "@/src/types/geral";
import { useFocusEffect } from "expo-router";
import ImageUploader from "@/src/components/ImageUploader";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";

interface ModalProps {
  id: number;
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");

export default function ModalMeusEventos({ id, visible, onClose }: ModalProps) {
  const endpointApi = "/evento";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // const [count, setCount] = useState(1);
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

  const handleChange = (field: any, value: string | number) => {
    setFormData({ ...formData, [field]: value });
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

    onClose();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nome) newErrors.nome = "Descrição é obrigatório.";
    if (!formData.descricao) newErrors.descricao = "Descrição é obrigatório.";

    return newErrors;
  };

  const getRegistros = async () => {
    const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

    console.log("response", response);
    setFormData(response as Evento);
  };

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        if (id > 0) {
          getRegistros();
        } else {
          setFormData({
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
        }
      }
    }, [visible])
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity></TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={30} color="#212743" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>Informações do Evento</Text>

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
              <Text style={styles.label}>Imagem do evento</Text>
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
                <Text>Descrição do Evento</Text>
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
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    width: Platform.OS === "web" ? "60%" : "90%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    maxHeight: "90%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  content: {
    flexGrow: 1,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212743",
    marginBottom: 15,
  },
  label: {
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
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
    // flexBasis: "45%",
  },
});
