import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Evento, Ingresso, ProdutorAcesso } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useRoute } from "@react-navigation/native";
import ModalCortesia from "./modalCortesia";

const { width } = Dimensions.get("window");

export default function TabCortesia() {
  const route = useRoute();
  const endpointApi = "/ingresso";
  const { id } = route.params as { id: number };
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Ingresso[]>([]);
  const [registroEvento, setRegistroEvento] = useState<Evento>();
  const navigation = useNavigation() as any;
  const [visibleModalCortesia, setVisibleModalCortesia] = useState(false);
  const { user } = useAuth();

  const data = [
    { label: "Código" },
    { label: "Setor" },
    { label: "Ingresso" },
    { label: "Nome Usuário" },
    { label: "Nome Impresso" },
    { label: "Status" },
  ];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<Ingresso>(endpointApi, {
      filters: { idEvento: id, tipo: "Cortesia" },
      order: "desc",
      pageSize: 100,
    });
    const registrosData = response.data ?? [];

    setRegistros(registrosData);

    const responseEvento = await apiGeral.getResourceById<Evento>(
      "/evento",
      id
    );
    let data = responseEvento as unknown as Evento;

    setRegistroEvento(data);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal])
  );

  const handleModalEdit = (id: number) => {
    navigation.navigate("meuseventoedit", { id });
  };

  const handleModalNovo = () => {
    setVisibleModalCortesia(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{registroEvento?.nome}</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.area}>
          <View
            style={{
              alignItems: "flex-end",
              marginBottom:
                Platform.OS === "web" ? (width <= 1000 ? 10 : 0) : 10,
            }}
          >
            <TouchableOpacity
              style={styles.newButton}
              onPress={handleModalNovo}
            >
              <Text style={styles.newButtonText}>Novo</Text>
            </TouchableOpacity>
          </View>
          {Platform.OS === "web" && <CustomGridTitle data={data} />}
          {registros.map((item: Ingresso, index: number) => (
            <CustomGrid
              key={index}
              // onItemPress={handleModalEdit}
              data={[
                {
                  label: data[0].label,
                  content: item.id.toString(),
                  id: item.id,
                },
                {
                  label: data[1].label,
                  content: item.TipoIngresso_descricao ?? "",
                  id: item.id,
                },
                {
                  label: data[2].label,
                  content: item.EventoIngresso_nome ?? "",
                  id: item.id,
                },
                {
                  label: data[3].label,
                  content: item.Usuario_nomeCompleto ?? "",
                  id: item.id,
                },
                {
                  label: data[4].label,
                  content: item.nomeImpresso ?? "",
                  id: item.id,
                },
                {
                  label: data[5].label,
                  content: item.status ?? "",
                  id: item.id,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
      <Modal visible={visibleModalCortesia} transparent animationType="fade">
        <ModalCortesia
          idEvento={id}
          onClose={() => {
            setVisibleModalCortesia(false);
            getRegistros();
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  // scrollViewContent: {
  //   flexGrow: 1,
  // },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
    // marginRight: Platform.OS === "web" ? 200 : 0,
    // marginLeft: Platform.OS === "web" ? 200 : 0,
  },
  eventDetails: {
    flexWrap: "wrap",
    width: Platform.OS === "web" ? width - 432 : -32,
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  newButton: {
    backgroundColor: colors.azul,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: Platform.OS === "web" ? 200 : 100,
    alignItems: "center",
  },
  newButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
