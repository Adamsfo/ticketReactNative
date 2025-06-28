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
import { CupomPromocional, ProdutorAcesso } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/src/contexts_/AuthContext";
import formatCurrency from "@/src/components/FormatCurrency";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/cupompromocional";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<CupomPromocional[]>([]);
  const [id, setid] = useState(0);
  const navigation = useNavigation() as any;
  const { isProdutor, user } = useAuth();

  const data = [
    { label: "Nome" },
    { label: "Tipo Desconto" },
    { label: "Valor" },
    { label: "Alterar", isButton: true },
  ];

  const getRegistros = async () => {
    if (isProdutor) {
      const responseProdutor = await apiGeral.getResource<ProdutorAcesso>(
        "/produtoracesso",
        {
          filters: { idUsuario: user?.id },
          pageSize: 1,
        }
      );

      const produtor = responseProdutor.data?.[0];

      const response = await apiGeral.getResource<CupomPromocional>(
        endpointApi,
        {
          filters: { idProdutor: produtor?.idProdutor },
          order: "desc",
          pageSize: 100,
        }
      );
      const registrosData = response.data ?? [];

      setRegistros(registrosData);
    } else {
      const response = await apiGeral.getResource<CupomPromocional>(
        endpointApi,
        {
          order: "desc",
          pageSize: 100,
        }
      );
      const registrosData = response.data ?? [];

      setRegistros(registrosData);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal])
  );

  const handleModalEdit = (id: number) => {
    navigation.navigate("cupompromocionaledit", { id });
  };

  const handleModalNovo = () => {
    navigation.navigate("cupompromocionaledit", { id: 0 });
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
        <Text style={styles.titulo}>Cupom Promocional</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.area}>
            {Platform.OS === "web" && <CustomGridTitle data={data} />}
            {registros.map((item: CupomPromocional, index: number) => (
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
                    content: item.tipoDesconto ?? "",
                    id: item.id,
                  },
                  {
                    label: data[2].label,
                    content:
                      item.tipoDesconto === "Fixo"
                        ? formatCurrency(item.valorDesconto.toFixed(2))
                        : item.valorDesconto.toString(),
                    id: item.id,
                  },
                  {
                    label: data[3].label,
                    // content: formatCurrency(item.valorTotal.toString()),
                    id: item.id,
                    iconName: "check-square",
                    isButton: true,
                    onPress: handleModalEdit,
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
    // marginHorizontal: Platform.OS === "web" ? 200 : 20,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "600",
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
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
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
