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
import * as Print from "expo-print";

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
    const registrosData = response.data ?? [];

    console.log("Registros:", registrosData);
    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { idUsuario: user?.id, status: "Confirmado" } });
    }, [visibleModal])
  );

  const handlePrint = async (item: Ingresso) => {
    const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 24px; }
          h1 { color: #333; }
          .section { margin-bottom: 16px; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>${item.Evento_nome}</h1>
        <div class="section"><span class="bold">Data:</span> ${new Date(
          item.Evento_data_hora_inicio ?? new Date().toISOString()
        ).toLocaleString()}</div>
        <div class="section"><span class="bold">Endereço:</span> ${
          item.Evento_endereco
        }</div>
        <div class="section"><span class="bold">Código do ingresso:</span> ${
          item.id
        }</div>
      </body>
    </html>
  `;

    if (Platform.OS === "web") {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    } else {
      await Print.printAsync({ html });
    }
  };

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
            <View style={styles.card}>
              {/* <Image source={{ uri: api.getBaseApi() + "/uploads/" + item.imagem }} style={styles.image} /> */}
              <Image
                source={{
                  uri: api.getBaseApi() + "/uploads/" + item.Evento_imagem,
                }}
                style={styles.image}
              />
              <View style={styles.cardContent}>
                <View style={styles.header}>
                  <Text style={styles.eventTitle}>{item.Evento_nome}</Text>
                  <Badge
                    variant={
                      item.status === "Confirmado" ? "default" : "secondary"
                    }
                  >
                    {item.status}
                  </Badge>
                </View>

                <View style={styles.row}>
                  <CalendarIcon size={16} color="#6b7280" />
                  <Text style={styles.text}>
                    {item.Evento_data_hora_inicio
                      ? new Date(
                          item.Evento_data_hora_inicio
                        ).toLocaleString() +
                        " às " +
                        new Date(item.Evento_data_hora_inicio).toLocaleString()
                      : "Data não disponível"}
                  </Text>
                </View>

                <View style={styles.row}>
                  <MapPinIcon size={16} color="#6b7280" />
                  <Text style={styles.text}>{item.Evento_endereco}</Text>
                </View>

                <View style={[styles.row, { marginTop: 8 }]}>
                  <QrCodeIcon size={16} color="#374151" />
                  <Text style={styles.code}>
                    <Text style={styles.bold}>Código:</Text> {item.id}
                  </Text>
                </View>
                <View style={[styles.row, { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handlePrint(item)}
                  >
                    <Text style={styles.buttonText}>
                      <PrinterIcon size={16} color="#fff" /> Imprimir
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>
                      <WalletIcon size={16} color="#fff" /> Wallet
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
});
