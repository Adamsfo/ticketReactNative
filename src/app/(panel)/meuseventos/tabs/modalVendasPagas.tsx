import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  FlatList,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Transacao } from "@/src/types/geral";
import formatCurrency from "@/src/components/FormatCurrency";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";

const { width } = Dimensions.get("window");

interface ModalMsgProps {
  onClose: () => void;
  transacoes?: Transacao[]; // Adicione o tipo correto se necessário
}

export default function ModalVendasPagas({
  onClose,
  transacoes,
}: ModalMsgProps) {
  const data = [
    { label: "Venda" },
    { label: "Ingressos" },
    { label: "Taxa" },
    { label: "Recebido" },
  ];

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity>
                {/* <Feather name="share" size={30} color="#212743" /> */}
              </TouchableOpacity>
              <Text style={styles.title}>Informação</Text>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.area}>
              <ScrollView
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator
              >
                {Platform.OS === "web" && <CustomGridTitle data={data} />}
                {transacoes &&
                  transacoes.map((item, index) => (
                    <CustomGrid
                      key={index}
                      data={[
                        {
                          id: 0,
                          label: data[0].label,
                          content: item.id.toString(),
                        },
                        {
                          id: 1,
                          label: data[1].label,
                          content: formatCurrency(item.preco),
                        },
                        {
                          id: 2,
                          label: data[2].label,
                          content: formatCurrency(
                            item.valorTaxaProcessamento ?? 0
                          ),
                        },
                        {
                          id: 3,
                          label: data[3].label,
                          content: formatCurrency(item.valorRecebido ?? 0),
                        },
                      ]}
                    />
                  ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fundo semi-transparente
  },
  container: {
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    maxHeight: "90%",
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  area: {
    // alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212743",
  },
  mensagem: {
    fontSize: 16,
    color: "#1a7a7a7",
    marginBottom: 30,
    marginTop: 10,
  },
});
