import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Evento } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO } from "date-fns";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Evento[]>([]);
  const [id, setid] = useState(0);
  const navigation = useNavigation() as any;

  const data = [
    { label: "Nome" },
    { label: "Inicio" },
    { label: "Fim" },
    { label: "Status" },
  ];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<Evento>(endpointApi, {
      order: "desc",
      pageSize: 100,
    });
    const registrosData = response.data ?? [];

    setRegistros(registrosData);
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
    navigation.navigate("meuseventoedit", { id: 0 });
  };

  const handleCloseModal = () => {
    setRegistros([]);
    setVisibleModal(false);
    getRegistros();
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={styles.linearGradient}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Meus Eventos</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.area}>
            {Platform.OS === "web" && <CustomGridTitle data={data} />}
            {registros.map((item: Evento, index: number) => (
              <CustomGrid
                key={index}
                onItemPress={handleModalEdit}
                data={[
                  {
                    label: data[0].label,
                    content: item.nome,
                    id: item.id,
                  },
                  {
                    label: data[1].label,
                    content: format(
                      parseISO(item.data_hora_inicio.toString()),
                      "dd/MM/yyyy HH:mm:ss"
                    ),
                    id: item.id,
                  },
                  {
                    label: data[2].label,
                    content: format(
                      parseISO(item.data_hora_fim.toString()),
                      "dd/MM/yyyy HH:mm:ss"
                    ),
                    id: item.id,
                  },
                  {
                    label: data[2].label,
                    content: item.status ?? "",
                    id: item.id,
                  },
                ]}
              />
            ))}
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity
                style={styles.newButton}
                onPress={handleModalNovo}
              >
                <Text style={styles.newButtonText}>Novo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginHorizontal: Platform.OS === "web" ? 200 : 20,
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
