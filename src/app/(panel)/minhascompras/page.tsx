import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Ingresso, Produtor, QueryParams, Transacao } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import {
  CalendarIcon,
  MapPinIcon,
  PrinterIcon,
  QrCodeIcon,
  WalletCardsIcon,
  WalletIcon,
} from "lucide-react-native";
import { Badge } from "@/src/components/Badge";
import { useAuth } from "@/src/contexts_/AuthContext";
import { api } from "@/src/lib/api";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import CardIngresso from "@/src/components/CardIngresso";
import formatCurrency from "@/src/components/FormatCurrency";
import { useNavigation } from "@react-navigation/native";
import Footer from "@/src/components/Footer";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/transacao";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Transacao[]>([]);
  const { user } = useAuth();
  const [status, setStatus] = useState("Pago");
  const navigation = useNavigation() as any;

  const data = [
    { label: "Código" },
    { label: "Data" },
    { label: "Valor" },
    { label: "Cancelar", isButton: true },
    { label: "Alterar", isButton: true },
  ];

  const getRegistros = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Transacao>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    let registrosData = response.data ?? [];

    console.log("Registros com QRCode:", registrosData);

    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { idUsuario: user?.id, status: "Pago" } });
    }, [visibleModal])
  );

  const handleModalEdit = (id: number) => {
    navigation.navigate("ingressostransacao", { idTransacao: id });
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Minhas Compras</Text>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setStatus("Pago");
              getRegistros({
                filters: { idUsuario: user?.id, status: "Pago" },
              });
            }}
          >
            <Badge variant={status === "Pago" ? "default" : "secondary"}>
              Pago
            </Badge>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setStatus("Cancelado");
              getRegistros({
                filters: { idUsuario: user?.id, status: "Cancelado" },
              });
            }}
          >
            <Badge variant={status === "Cancelado" ? "default" : "secondary"}>
              Cancelado
            </Badge>
          </TouchableOpacity>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          {registros[0] && (
            <View style={styles.area}>
              {Platform.OS === "web" && <CustomGridTitle data={data} />}
              {registros.map((item: Transacao, index: number) => (
                <CustomGrid
                  key={index}
                  onItemPress={handleModalEdit}
                  data={[
                    {
                      label: data[0].label,
                      content: item.id.toString(),
                      id: item.id,
                    },
                    {
                      label: data[1].label,
                      content: format(
                        parseISO(item.dataTransacao.toString()),
                        "dd/MM/yyyy HH:mm:ss"
                      ),
                      id: item.id,
                    },
                    {
                      label: data[2].label,
                      content: formatCurrency(item.valorTotal.toString()),
                      id: item.id,
                    },
                    {
                      label: data[3].label,
                      content: formatCurrency(item.valorTotal.toString()),
                      id: item.id,
                      iconName: "trash",
                      isButton: true,
                      onPress: (id) => console.log("Apagar", id),
                    },
                    {
                      label: data[4].label,
                      content: formatCurrency(item.valorTotal.toString()),
                      id: item.id,
                      iconName: "activity",
                      isButton: true,
                      onPress: (id) => console.log("Apagar", id),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </ScrollView>
        <Footer />
        {/* <FlatList
          key={`grid-${width > 600 ? "3" : "1"}`}
          data={registros}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          numColumns={width > 600 ? 3 : 1}
          renderItem={({ item }) => (
            // <CardIngresso item={item} getRegistros={getRegistros} />

            <Text>{item.id.toString()}</Text>
          )}
        /> */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    paddingTop: 10,
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? 200 : 0,
    // marginLeft: Platform.OS === "web" ? 200 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  list: {
    gap: 16,
  },
  card: {
    // width: width > 600 ? width / 2 - 32 : width - 32, // 2 colunas ou 1 coluna com padding
    flex: 1,
    marginBottom: 0,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f9fafb",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    marginHorizontal: 6,
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  text: {
    color: "#6b7280",
    fontSize: 14,
  },
  code: {
    fontSize: 14,
    color: "#374151",
  },
  bold: {
    fontWeight: "bold",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: colors.azul,
  },
  buttonText: {
    color: colors.branco,
    fontWeight: "600",
  },
  qr: { width: 200, height: 200, marginBottom: 10 },
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
});
