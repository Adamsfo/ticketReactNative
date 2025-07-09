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
import { format, parseISO, set } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useRoute } from "@react-navigation/native";
import ModalCortesia from "./modalCortesia";
import DatePickerComponente from "@/src/components/DatePickerComponente";

const { width } = Dimensions.get("window");

export default function TabIngressos() {
  const route = useRoute();
  const endpointApi = "/dadosingressos";
  const { id } = route.params as { id: number };
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<any[]>([]);
  const [registroEvento, setRegistroEvento] = useState<Evento>();
  const navigation = useNavigation() as any;
  const [visibleModalCortesia, setVisibleModalCortesia] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFinal, setDataFinal] = useState<Date>(new Date());
  const [resumoPorSetor, setResumoPorSetor] = useState<Record<string, number>>(
    {}
  );
  const [resumoPorSetorDisponivel, setResumoPorSetorDisponivel] = useState<
    Record<string, number>
  >({});
  const { user } = useAuth();

  const data = [
    { label: "Data" },
    { label: "Setor" },
    { label: "Ingressos Utilizados" },
  ];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<any>(endpointApi, {
      idEvento: id,
      dataInicio: format(dataInicio.toString(), "yyyy-MM-dd"),
      dataFim: format(dataFinal.toString(), "yyyy-MM-dd"),
    });

    const registrosData = response.data ?? [];
    console.log("Response Ingressos", registrosData);

    setRegistros(registrosData);

    const resumo = registrosData.reduce((acc: Record<string, number>, item) => {
      const setor = item.EventoIngresso?.nome ?? "Sem setor";
      acc[setor] = (acc[setor] || 0) + Number(item.quantidade || 0);
      return acc;
    }, {});

    setResumoPorSetor(resumo);

    const responseDisponiveis = await apiGeral.getResource<any>("/ingresso", {
      filters: { idEvento: id, status: "Confirmado" },
      pageSize: 1000,
    });

    console.log("Response Ingressos Disponíveis", responseDisponiveis);

    const registrosDataDisponivel = responseDisponiveis.data ?? [];
    // console.log("Response Ingressos", registrosData);

    const resumoDisponivel = registrosDataDisponivel.reduce(
      (acc: Record<string, number>, item) => {
        const setor = item.EventoIngresso_nome ?? "Sem setor";
        acc[setor] = (acc[setor] || 0) + 1;
        return acc;
      },
      {}
    );

    console.log("Response Ingressos", registrosData);

    setResumoPorSetorDisponivel(resumoDisponivel);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal, dataInicio, dataFinal])
  );

  const handleModalEdit = (id: number) => {
    navigation.navigate("meuseventoedit", { id });
  };

  const handleModalNovo = () => {
    setVisibleModalCortesia(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Ingressos</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.area}>
          {/* <View
            style={{
              alignItems: "flex-end",
              marginBottom:
                Platform.OS === "web" ? (width <= 1000 ? 10 : 0) : 10,
            }}
          ></View> */}
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.labelData}>Data Inicial:</Text>
                <DatePickerComponente
                  value={dataInicio}
                  onChange={setDataInicio}
                />
              </View>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.labelData}>Data Final:</Text>
                <DatePickerComponente
                  value={dataFinal}
                  onChange={setDataFinal}
                />
              </View>
            </View>
          </View>
          {Platform.OS === "web" && <CustomGridTitle data={data} />}
          {registros.map((item: any, index: number) => (
            <CustomGrid
              key={index}
              // onItemPress={handleModalEdit}
              data={[
                {
                  label: data[0].label,
                  content: format(parseISO(item.data.toString()), "dd/MM/yyyy"),
                  id: item.id,
                },
                {
                  label: data[1].label,
                  content: item.EventoIngresso.nome ?? "",
                  id: item.id,
                },
                {
                  label: data[2].label,
                  content: item.quantidade ?? "",
                  id: item.id,
                },
              ]}
            />
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
            Resumo utilizados por setor
          </Text>
          {Object.entries(resumoPorSetor).map(([setor, total], index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{setor}</Text>
              <Text style={{ fontWeight: "600" }}>{total}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
            Resumo disponível por setor
          </Text>
          {Object.entries(resumoPorSetorDisponivel).map(
            ([setor, total], index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ fontWeight: "600" }}>{setor}</Text>
                <Text style={{ fontWeight: "600" }}>{total}</Text>
              </View>
            )
          )}
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
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
    textAlign: "right",
    height: 45,
    lineHeight: 45,
  },
});
