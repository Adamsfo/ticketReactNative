import React, { useCallback, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { View, TouchableWithoutFeedback, ScrollView } from "react-native";
import colors from "@/src/constants/colors";
import { apiGeral } from "@/src/lib/geral";
import { TipoIngresso } from "@/src/types/geral";
import { useFocusEffect } from "expo-router";

interface ModalMsgProps {
  id: number;
  visible: boolean;
  onClose: () => void;
}

export default function ModalAddTipoIngresso({
  id,
  visible,
  onClose,
}: ModalMsgProps) {
  const endpointApi = "/tipoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // const [count, setCount] = useState(1);
  const [formData, setFormData] = useState<TipoIngresso>({
    id: 0,
    descricao: "",
    qtde: 0,
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
      await apiGeral.updateResorce<TipoIngresso>(endpointApi, formData);
    } else {
      await apiGeral.createResource<TipoIngresso>(endpointApi, formData);
    }

    onClose();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.descricao) newErrors.descricao = "Descrição é obrigatório.";
    if (!formData.qtde && formData.qtde < 1)
      newErrors.qtde = "Qtde não pode ser menor que 1.";

    return newErrors;
  };

  const getRegistros = async () => {
    const response = await apiGeral.getResourceById<TipoIngresso>(
      endpointApi,
      id
    );

    setFormData(response as TipoIngresso);
  };

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        if (id > 0) {
          getRegistros();
        } else {
          setFormData({ id: 0, descricao: "", qtde: 1 });
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
            <Text style={styles.title}>Informações Tipo do Ingresso</Text>
            <View>
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
                  placeholder="Ingresso Individual..."
                  keyboardType="default"
                  value={formData.descricao}
                  onChangeText={(text) => handleChange("descricao", text)}
                ></TextInput>
                {errors.descricao && (
                  <Text style={styles.labelError}>{errors.descricao}</Text>
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
                      // onPress={() => setCount(count + 1)}
                      onPress={() => handleChange("qtde", formData.qtde + 1)}
                    >
                      <Feather name="plus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, marginHorizontal: 5 }}>
                      {formData.qtde}
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgb(0, 146, 250)",
                        borderRadius: 5,
                      }}
                      onPress={() => handleChange("qtde", formData.qtde - 1)}
                    >
                      <Feather name="minus" size={28} color="white"></Feather>
                    </TouchableOpacity>
                  </View>
                  <View style={{ marginTop: 20 }}>
                    {errors.qtde && (
                      <Text style={styles.labelError}>{errors.qtde}</Text>
                    )}
                  </View>
                </View>
              </View>
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
    fontSize: 16,
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
});
