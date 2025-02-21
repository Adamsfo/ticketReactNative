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
import { Evento, Produtor } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO } from "date-fns";
import ModalMeusEventos from "./modalMeusEventos";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Evento[]>([]);
  const [id, setid] = useState(0);

  const data = [{ label: "Nome" }, { label: "Inicio" }, { label: "Fim" }];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<Evento>(endpointApi);
    const registrosData = response.data ?? [];

    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal])
  );

  const handleModalEdit = (id: number) => {
    setid(id);
    setVisibleModal(true);
  };

  const handleModalNovo = () => {
    setid(0);
    setVisibleModal(true);
  };

  const handleCloseModal = () => {
    setRegistros([]);
    setVisibleModal(false);
    getRegistros();
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Meus Eventos</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
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
                      parseISO(
                        item.data_hora_inicio
                          .toString()
                          .replace(" ", "T")
                          .replace("Z", "")
                      ),
                      "dd/MM/yyyy HH:mm:ss"
                    ),
                    id: item.id,
                  },
                  {
                    label: data[1].label,
                    content: format(
                      parseISO(
                        item.data_hora_fim
                          .toString()
                          .replace(" ", "T")
                          .replace("Z", "")
                      ),
                      "dd/MM/yyyy HH:mm:ss"
                    ),
                    id: item.id,
                  },
                ]}
              />
            ))}
            <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.azul,
                  borderRadius: 5,
                  padding: 10,
                  marginTop: 10,
                  width: Platform.OS === "web" ? 200 : 100,
                  alignItems: "center",
                }}
                onPress={handleModalNovo}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Novo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ModalMeusEventos
          id={id}
          visible={visibleModal}
          onClose={handleCloseModal}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? 200 : 20,
    marginLeft: Platform.OS === "web" ? 200 : 20,
    marginBottom: 20,
    height: 500,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    marginLeft: Platform.OS === "web" ? 200 : 20,
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 25,
    paddingLeft: 25,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  areaTitulo: {
    fontSize: 22,
    // fontWeight: "bold",
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    // flexBasis: "45%",
  },
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
    // flexBasis: "45%",
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
});
