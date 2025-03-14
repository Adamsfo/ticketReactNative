import React, { useCallback, useEffect, useState } from "react";
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
  StatusEventoIngresso,
  TipoIngresso,
} from "@/src/types/geral";
import { SafeAreaView } from "react-native-safe-area-context";
import QuillEditorWeb from "@/src/components/QuillEditorWeb";
import QuillEditorMobile from "@/src/components/QuillEditorMobile";
import Select from "@/src/components/Select";
import formatCurrency from "@/src/components/FormatCurrency";
import CurrencyInput from "@/src/components/CurrencyInput";

interface ModalMsgProps {
  id: number;
  idEvento: number;
  visible: boolean;
  onClose: () => void;
}

export default function ModalEventoIngresso({
  id,
  idEvento,
  visible,
  onClose,
}: ModalMsgProps) {
  const endpointApi = "/eventoingresso";
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const itensStatus = [
    { value: "Ativo", label: "Ativo" },
    { value: "Oculto", label: "Oculto" },
    { value: "Finalizado", label: "Finalizado" },
  ];

  const handleChange = (field: any, value: string | number) => {
    if (field === "preco") {
      let taxa = parseFloat(
        value.toString().replace("R$ ", "").replace(",", ".")
      );
      const taxaCalculada = ((taxa * 5) / 100).toFixed(2).toString();
      taxa = parseFloat(taxaCalculada);
      const valor = taxa + parseFloat(value.toString().replace("R$ ", ""));
      setFormData({ ...formData, taxaServico: taxa, [field]: value, valor });
    } else {
      setFormData({ ...formData, [field]: value });
    }
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
    if (!formData.idTipoIngresso)
      newErrors.idTipoIngresso = "Tipo de Ingresso é obrigatório.";
    if (!formData.lote) newErrors.lote = "Lote é obrigatório.";
    if (!formData.qtde) newErrors.qtde = "Quantidade é obrigatório.";
    if (!formData.preco) newErrors.preco = "Valor é obrigatório.";
    if (!formData.taxaServico) newErrors.taxaServico = "Taxa é obrigatório.";
    if (!formData.valor) newErrors.valor = "Valor de venda é obrigatório.";

    return newErrors;
  };

  const getRegistros = async () => {
    const response = await apiGeral.getResourceById<EventoIngresso>(
      endpointApi,
      id
    );

    const registro = response as EventoIngresso;
    setFormData({
      id: registro.id,
      nome: registro.nome,
      descricao: registro.descricao,
      idTipoIngresso: registro.idTipoIngresso,
      idEvento: registro.idEvento,
      qtde: registro.qtde,
      preco: registro.preco,
      taxaServico: registro.taxaServico,
      valor: registro.valor,
      lote: registro.lote,
      status: registro.status,
    });
  };

  useEffect(() => {
    if (visible) {
      setErrors({});
      if (id > 0) {
        getRegistrosTipoIngresso();
        getRegistros();
      } else {
        setFormData({
          id: 0,
          nome: "",
          descricao: "",
          idTipoIngresso: 0,
          idEvento: idEvento,
          qtde: 0,
          preco: 0,
          taxaServico: 0,
          valor: 0,
          lote: "",
          status: "Oculto" as StatusEventoIngresso,
        });
      }
    }
  }, [visible, id]);

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
            <View
              style={{
                flexDirection: Platform.OS === "web" ? "row" : "column",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.title}>Informações do Ingresso</Text>
              <Select
                items={itensStatus}
                currentValue={formData.status}
                onValueChange={(text) => handleChange("status", text)}
              ></Select>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.label}>Tipo</Text>
              <Select
                items={itemsTipoIngresso}
                currentValue={formData.idTipoIngresso}
                onValueChange={(text) => handleChange("idTipoIngresso", text)}
              ></Select>
              {errors.idTipoIngresso && (
                <Text style={styles.labelError}>{errors.idTipoIngresso}</Text>
              )}
            </View>

            <View>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                multiline={Platform.OS === "web" ? false : true}
                placeholder="Exemplo: Adulto, Criança, Inteiro, Meia..."
                keyboardType="default"
                value={formData.nome}
                onChangeText={(text) => handleChange("nome", text)}
              ></TextInput>
              {errors.nome && (
                <Text style={styles.labelError}>{errors.nome}</Text>
              )}
            </View>

            <View style={{ flexDirection: "row" }}>
              <View>
                <Text style={styles.label}>Lote</Text>
                <TextInput
                  style={styles.input}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: Lote 1..."
                  keyboardType="default"
                  value={formData.lote}
                  onChangeText={(text) => handleChange("lote", text)}
                ></TextInput>
                {errors.lote && (
                  <Text style={styles.labelError}>{errors.lote}</Text>
                )}
              </View>

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.label}>Quantidade</Text>
                <TextInput
                  style={styles.input}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: 100"
                  keyboardType="default"
                  value={formData.qtde.toString()}
                  onChangeText={(text) => handleChange("qtde", text)}
                ></TextInput>
                {errors.qtde && (
                  <Text style={styles.labelError}>{errors.qtde}</Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row" }}>
              <View>
                <Text style={styles.label}>Valor</Text>
                <TextInput
                  style={styles.input}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: 60,00"
                  keyboardType="numeric"
                  value={formatCurrency(formData.preco)}
                  onChangeText={(text) =>
                    handleChange(
                      "preco",
                      text.replace("R$ ", "").replace(",", ".")
                    )
                  }
                ></TextInput>
                {errors.preco && (
                  <Text style={styles.labelError}>{errors.preco}</Text>
                )}
              </View>

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.label}>Taxa</Text>
                <TextInput
                  style={styles.inputNoEdit}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: 5,00"
                  keyboardType="numeric"
                  editable={false}
                  value={formatCurrency(formData.taxaServico)}
                ></TextInput>
                {errors.taxaServico && (
                  <Text style={styles.labelError}>{errors.taxaServico}</Text>
                )}
              </View>

              <View style={{ marginLeft: 10 }}>
                <Text style={styles.label}>Valor de Venda</Text>
                <TextInput
                  style={styles.inputNoEdit}
                  editable={false}
                  multiline={Platform.OS === "web" ? false : true}
                  placeholder="Exemplo: 5,00"
                  keyboardType="numeric"
                  value={formatCurrency(formData.valor)}
                ></TextInput>
                {errors.valor && (
                  <Text style={styles.labelError}>{errors.valor}</Text>
                )}
              </View>
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
});
