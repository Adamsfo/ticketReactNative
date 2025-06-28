import React, { useCallback, useEffect, useState } from "react";
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
import {
  CupomPromocionalValidade,
  EventoIngresso,
  StatusEventoIngresso,
  TipoIngresso,
} from "@/src/types/geral";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import Select from "@/src/components/Select";
import formatCurrency from "@/src/components/FormatCurrency";
import CurrencyInput from "@/src/components/CurrencyInput";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import TimePickerComponente from "@/src/components/TimePickerComponente";

const { width } = Dimensions.get("window");

interface ModalMsgProps {
  id: number;
  idCupomPromocional: number;
  visible: boolean;
  onClose: () => void;
}

export default function ModalCupomPromocionalValidade({
  id,
  idCupomPromocional,
  visible,
  onClose,
}: ModalMsgProps) {
  const endpointApi = "/cupompromocionalvalidade";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState<CupomPromocionalValidade>({
    id: 0,
    idCupomPromocional: 0,
    dataInicial: new Date(),
    dataFinal: new Date(),
  });

  const handleChange = (field: any, value: string | number | Date) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      console.log(validationErrors);
      return;
    }

    if (id > 0) {
      console.log("Atualizando registro:", formData);
      await apiGeral.updateResorce<CupomPromocionalValidade>(
        endpointApi,
        formData
      );
    } else {
      await apiGeral.createResource<CupomPromocionalValidade>(
        endpointApi,
        formData
      );
    }

    onClose();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.idCupomPromocional)
      newErrors.idCupomPromocional =
        "Id Cupom Promocional Obrigatório é obrigatório.";
    // if (!formData.descricao) newErrors.descricao = "Descrição é obrigatório.";
    if (!formData.dataInicial)
      newErrors.dataInicial = "Data Inicial é obrigatório.";
    if (!formData.dataFinal) newErrors.dataFinal = "Data Final é obrigatório.";

    return newErrors;
  };

  const getRegistros = async () => {
    const response = await apiGeral.getResource<CupomPromocionalValidade>(
      endpointApi,
      {
        filters: { id },
      }
    );

    if (response.data && response.data.length > 0) {
      const registro = response.data[0] as CupomPromocionalValidade;

      console.log("Registro:", registro);

      setFormData({
        id: registro.id,
        idCupomPromocional: registro.idCupomPromocional,
        dataInicial: registro.dataInicial
          ? new Date(registro.dataInicial)
          : new Date(),
        dataFinal: registro.dataFinal
          ? new Date(registro.dataFinal)
          : new Date(),
      });
    }
  };

  useEffect(() => {
    if (visible) {
      setErrors({});
      if (id > 0) {
        console.log("passou aqui");
        getRegistros();
      } else {
        console.log("passou aqui2");
        setFormData({
          id: 0,
          idCupomPromocional: idCupomPromocional,
          dataInicial: new Date(),
          dataFinal: new Date(),
        });
      }
    }
  }, [visible, id]);

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
            <Text style={styles.title}>
              Informações da Validade do Cupom Promocional
            </Text>

            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <View style={styles.eventDetails}>
                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Data Inicial:</Text>
                  <DatePickerComponente
                    value={formData.dataInicial || ""}
                    onChange={(value) => handleChange("dataInicial", value)}
                  />
                </View>
                {errors.dataInicial && (
                  <Text style={styles.labelError}>{errors.dataInicial}</Text>
                )}
              </View>

              <View style={styles.eventDetails}>
                <View style={styles.eventDetailItem}>
                  <Text style={styles.labelData}>Data Final:</Text>
                  <DatePickerComponente
                    value={formData.dataFinal || ""}
                    onChange={(value) => handleChange("dataFinal", value)}
                  />
                </View>
                {errors.dataFinal && (
                  <Text style={styles.labelError}>{errors.dataFinal}</Text>
                )}
              </View>
            </View>

            {errors.idCupomPromocional && (
              <Text style={styles.labelError}>{errors.idCupomPromocional}</Text>
            )}
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
    paddingHorizontal: "5%",
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
    width: Platform.OS === "web" ? (width > 1000 ? "40%" : "95%") : "100%",
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
    fontWeight: "bold",
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
  inputNoEdit: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.gray,
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
    flexDirection: Platform.OS === "web" ? "row" : "column",
    marginRight: Platform.OS === "web" ? 15 : 0,
    // width: Platform.OS === "web" ? width - 432 : width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
    textAlign: "right",
  },
});
