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
import { Ingresso, Produtor, QueryParams } from "@/src/types/geral";
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
// import QRCode from "react-native-qrcode-svg";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/ingresso";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Ingresso[]>([]);
  const { user } = useAuth();
  const [status, setStatus] = useState("Confirmado");

  const data = [{ label: "Nome", content: "Nome" }];

  const getRegistros = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Ingresso>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    let registrosData = response.data ?? [];

    console.log("Registros com QRCode:", registrosData);

    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { idUsuario: user?.id, status: "Confirmado" } });
    }, [visibleModal])
  );

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Meus Ingressos</Text>
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
              setStatus("Confirmado");
              getRegistros({
                filters: { idUsuario: user?.id, status: "Confirmado" },
              });
            }}
          >
            <Badge variant={status === "Confirmado" ? "default" : "secondary"}>
              Confirmado
            </Badge>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setStatus("Utilizado");
              getRegistros({
                filters: { idUsuario: user?.id, status: "Utilizado" },
              });
            }}
          >
            <Badge variant={status === "Utilizado" ? "default" : "secondary"}>
              Utilizado
            </Badge>
          </TouchableOpacity>
        </View>
        <FlatList
          key={`grid-${width > 600 ? "3" : "1"}`}
          data={registros}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          numColumns={width > 600 ? 3 : 1}
          renderItem={({ item }) => (
            <CardIngresso item={item} getRegistros={getRegistros} />
          )}
        />
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
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
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
});
