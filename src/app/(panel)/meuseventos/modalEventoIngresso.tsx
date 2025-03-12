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
import {
  EventoIngresso,
  Produtor,
  StatusEventoIngresso,
  TipoIngresso,
} from "@/src/types/geral";
import { useFocusEffect } from "expo-router";
import ImageUploader from "@/src/components/ImageUploader";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import Select from "@/src/components/Select";

interface ModalMsgProps {
  id: number;
  visible: boolean;
  onClose: () => void;
}

export default function ModalEventoIngresso({
  id,
  visible,
  onClose,
}: ModalMsgProps) {
  const endpointApi = "/eventoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // const [count, setCount] = useState(1);
  const [formData, setFormData] = useState<EventoIngresso>({
    id: 0,
    nome: "",
    descricao: "",
    idTipoIngresso: 0,
    idEvento: 0,
    qtde: 0,
    preco: 0,
    taxaServico: 0,
    valor: 0,
    lote: "",
    status: "Oculto" as StatusEventoIngresso,
  });

  const [itemsTipoIngresso, setItemsTipoIngresso] = useState<
    { value: number; label: string }[]
  >([]);

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
      await apiGeral.updateResorce<EventoIngresso>(endpointApi, formData);
    } else {
      await apiGeral.createResource<EventoIngresso>(endpointApi, formData);
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
    const response = await apiGeral.getResourceById<EventoIngresso>(
      endpointApi,
      id
    );

    const registro = response as EventoIngresso;
    console.log("registro", registro);
    formData.id = registro.id;
    formData.nome = registro.nome;
    // formData.descricao = registro.descricao;
    formData.idTipoIngresso = registro.idTipoIngresso;
    formData.idEvento = registro.idEvento;
    formData.qtde = registro.qtde;
    formData.preco = registro.preco;
    formData.taxaServico = registro.taxaServico;
    formData.valor = registro.valor;
    formData.lote = registro.lote;
    formData.status = registro.status;
  };

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        if (id > 0) {
          getRegistrosTipoIngresso();
          getRegistros();
        } else {
          setFormData({
            id: 0,
            nome: "",
            descricao: "",
            idTipoIngresso: 0,
            idEvento: 0,
            qtde: 0,
            preco: 0,
            taxaServico: 0,
            valor: 0,
            lote: "",
            status: "Oculto" as StatusEventoIngresso,
          });
        }
      }
    }, [visible, id])
  );

  const getRegistrosTipoIngresso = async () => {
    const response = await apiGeral.getResource<TipoIngresso>("/tipoingresso");

    const registrosData = (response.data ?? []).map((record: TipoIngresso) => ({
      value: record.id,
      label: record.descricao,
    }));

    setItemsTipoIngresso(registrosData);
  };

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
            <Text style={styles.title}>Informações do Ingresso</Text>

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

            <View
              style={{
                marginBottom: 16,
                flex: 1,
                minHeight: Platform.OS === "web" ? 200 : 350,
              }}
            >
              <SafeAreaView style={{ height: "100%" }}>
                <Text>Descrição</Text>
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

            <View>
              <Text style={styles.label}>Tipo</Text>
              <Select
                items={itemsTipoIngresso}
                currentValue={formData.idTipoIngresso}
                onValueChange={(text) => handleChange("idTipoIngresso", text)}
              ></Select>
              {errors.nome && (
                <Text style={styles.labelError}>{errors.nome}</Text>
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
});
