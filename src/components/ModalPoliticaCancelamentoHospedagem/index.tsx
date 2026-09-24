import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  POLITICA_CANCELAMENTO_HOSPEDAGEM_SECOES,
  TITULO_POLITICA_HOSPEDAGEM,
} from "@/src/constants/politicaCancelamentoHospedagem";

interface ModalPoliticaCancelamentoHospedagemProps {
  visible: boolean;
  onClose: () => void;
}

export default function ModalPoliticaCancelamentoHospedagem({
  visible,
  onClose,
}: ModalPoliticaCancelamentoHospedagemProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <View style={{ width: 30 }} />
                <Text style={styles.titleHeader}>Informação</Text>
                <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar">
                  <Feather name="x" size={28} color="#212743" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.tituloPolitica}>
                  {TITULO_POLITICA_HOSPEDAGEM}
                </Text>
                {POLITICA_CANCELAMENTO_HOSPEDAGEM_SECOES.map((secao) => (
                  <View key={secao.titulo} style={styles.secao}>
                    <Text style={styles.secaoTitulo}>{secao.titulo}</Text>
                    {secao.paragrafos.map((paragrafo, idx) => (
                      <Text key={idx} style={styles.paragrafo}>
                        {paragrafo}
                      </Text>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 560,
    maxHeight: "85%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  titleHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212743",
  },
  scroll: {
    flexGrow: 0,
  },
  tituloPolitica: {
    fontSize: 18,
    fontWeight: "800",
    color: "#212743",
    marginBottom: 12,
  },
  secao: {
    marginBottom: 14,
  },
  secaoTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#212743",
    marginBottom: 6,
  },
  paragrafo: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 8,
  },
});
