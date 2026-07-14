import React from "react";
import {
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "../FormatCurrency";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";
import ModalMsg from "../ModalMsg";
import ModalLogin from "@/src/app/(auth)/singin/ModalLogin";
import { useAuth } from "@/src/contexts_/AuthContext";
import { CotacaoReservaSuite } from "@/src/lib/reservaSuite";
import { Usuario } from "@/src/types/geral";

const { width } = Dimensions.get("window");

function formatHospedesResumo(adultos: number, criancas: number): string {
  const partes: string[] = [];
  if (adultos > 0) {
    partes.push(`${adultos} ${adultos === 1 ? "adulto" : "adultos"}`);
  }
  if (criancas > 0) {
    partes.push(`${criancas} ${criancas === 1 ? "criança" : "crianças"}`);
  }
  return partes.join(", ");
}

export type ItemCarrinhoHospedagem = {
  idEventoSuite: number;
  nomeSuite: string;
  adultos: number;
  criancas: number;
  cotacao: CotacaoReservaSuite;
};

interface ModalResumoPousadaProps {
  itens: ItemCarrinhoHospedagem[];
  onProximo: () => void;
  UsuarioVenda?: Usuario;
}

export default function ModalResumoPousada({
  itens,
  onProximo,
  UsuarioVenda,
}: ModalResumoPousadaProps) {
  const route = useRoute();
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };
  const [visibleDetalhe, setVisibleDetalhe] = React.useState(false);
  const [visibleLogin, setVisibleLogin] = React.useState(false);
  const [visibleMsg, setVisibleMsg] = React.useState(false);
  const [msg, setMsg] = React.useState("");
  const { user, isPDV } = useAuth();

  if (itens.length === 0) {
    return null;
  }

  const valorTotal = itens.reduce(
    (sum, item) => sum + Number(item.cotacao.totais.valorTotal),
    0,
  );
  const noites = itens[0]?.cotacao.noites ?? 0;

  const handleProximo = () => {
    if (!user?.id) {
      setVisibleLogin(true);
      return;
    }
    if (isPDV && !UsuarioVenda?.id) {
      setMsg("Não existe cliente selecionado para a venda.");
      setVisibleMsg(true);
      return;
    }
    onProximo();
  };

  const handelCloseLogin = () => {
    setVisibleLogin(false);
    navigation.navigate("pousada", { id });
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback>
          <View style={{ flex: 1 }} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.area}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingHorizontal: 30,
              }}
            >
              <Text style={styles.title}>
                Total: {formatCurrency(valorTotal)}
              </Text>
              <TouchableOpacity
                onPress={() => setVisibleDetalhe(!visibleDetalhe)}
              >
                <Feather
                  style={{ paddingLeft: 20 }}
                  name={
                    visibleDetalhe ? "arrow-down-circle" : "arrow-up-circle"
                  }
                  size={30}
                  color={colors.azul}
                />
              </TouchableOpacity>
            </View>
            {visibleDetalhe && (
              <ScrollView
                style={{ maxHeight: 180, width: "100%", paddingHorizontal: 20 }}
              >
                <Text style={styles.detailLine}>{noites} noite(s)</Text>
                {itens.map((item) => (
                  <View key={item.idEventoSuite} style={{ marginBottom: 8 }}>
                    <Text style={[styles.detailLine, { fontWeight: "bold" }]}>
                      {item.nomeSuite}
                    </Text>
                    <Text style={styles.detailLine}>
                      {formatHospedesResumo(item.adultos, item.criancas)} —{" "}
                      {formatCurrency(item.cotacao.totais.valorTotal)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
          <View style={[styles.footer, { paddingTop: 10 }]}>
            <TouchableOpacity
              style={[styles.button, styles.buttonClose]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave]}
              onPress={handleProximo}
            >
              <Text style={styles.buttonText}>Próximo</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Modal visible={visibleLogin} transparent animationType="slide">
          <ModalLogin onClose={() => handelCloseLogin()} />
        </Modal>
        <Modal
          visible={visibleMsg}
          transparent
          animationType="fade"
          onRequestClose={() => setVisibleMsg(false)}
        >
          <TouchableWithoutFeedback onPress={() => setVisibleMsg(false)}>
            <View style={{ flex: 1 }}>
              <ModalMsg onClose={() => setVisibleMsg(false)} msg={msg} />
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    width: "100%",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  area: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.cinza,
  },
  detailLine: {
    fontSize: 14,
    color: colors.cinza,
    marginBottom: 4,
  },
  modal: {
    position: "absolute",
    left: Platform.OS === "web" ? (width <= 1000 ? "5%" : "35%") : "5%",
    right: Platform.OS === "web" ? (width <= 1000 ? "5%" : "35%") : "5%",
    bottom: 15,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
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
