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
import { Produtor } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { CalendarIcon, MapPinIcon, QrCodeIcon } from "lucide-react-native";
import { Badge } from "@/src/components/Badge";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/produtor";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Produtor[]>([]);
  const [id, setid] = useState(0);

  const data = [{ label: "Nome", content: "Nome" }];

  const getRegistros = async () => {
    const response = await apiGeral.getResource<Produtor>(endpointApi);
    const registrosData = response.data ?? [];

    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal])
  );

  const tickets = [
    {
      id: "abc123",
      eventTitle: "Show do Coldplay - Tour 2025",
      date: "20 de Julho, 2025",
      time: "20:00",
      location: "Allianz Parque - São Paulo, SP",
      imageUrl:
        "http://192.168.18.95:9000/uploads/LogoProdutor_1741955053742.png",
      status: "válido",
    },
    {
      id: "def456",
      eventTitle: "Rock in Rio 2025 - Dia 1",
      date: "13 de Setembro, 2025",
      time: "18:00",
      location: "Parque Olímpico - Rio de Janeiro, RJ",
      imageUrl:
        "http://192.168.18.95:9000/uploads/LogoProdutor_1740145792357.png",
      status: "usado",
    },
    {
      id: "def457",
      eventTitle: "Rock in Rio 2025 - Dia 1",
      date: "13 de Setembro, 2025",
      time: "18:00",
      location: "Parque Olímpico - Rio de Janeiro, RJ",
      imageUrl:
        "http://192.168.18.95:9000/uploads/LogoProdutor_1740145792357.png",
      status: "usado",
    },
  ];

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Meus Ingressos</Text>
        <FlatList
          key={`grid-${width > 600 ? "3" : "1"}`}
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          numColumns={width > 600 ? 3 : 1}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <View style={styles.cardContent}>
                <View style={styles.header}>
                  <Text style={styles.eventTitle}>{item.eventTitle}</Text>
                  <Badge
                    variant={item.status === "válido" ? "default" : "secondary"}
                  >
                    {item.status.toUpperCase()}
                  </Badge>
                </View>

                <View style={styles.row}>
                  <CalendarIcon size={16} color="#6b7280" />
                  <Text style={styles.text}>
                    {item.date} às {item.time}
                  </Text>
                </View>

                <View style={styles.row}>
                  <MapPinIcon size={16} color="#6b7280" />
                  <Text style={styles.text}>{item.location}</Text>
                </View>

                <View style={[styles.row, { marginTop: 8 }]}>
                  <QrCodeIcon size={16} color="#374151" />
                  <Text style={styles.code}>
                    <Text style={styles.bold}>Código:</Text>{" "}
                    {item.id.toUpperCase()}
                  </Text>
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
});

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     marginTop: Platform.OS === "web" ? 80 : 120,
//     marginRight: Platform.OS === "web" ? 200 : 20,
//     marginLeft: Platform.OS === "web" ? 200 : 20,
//     marginBottom: 20,
//     height: 500,
//   },
//   titulo: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginTop: 10,
//     marginBottom: 3,
//     textAlign: "center",
//   },
//   area: {
//     backgroundColor: "rgba(255,255,255, 0.21)",
//     marginTop: 7,
//     paddingRight: 25,
//     paddingLeft: 25,
//     paddingTop: 15,
//     marginRight: Platform.OS === "web" ? 200 : 0,
//     marginLeft: Platform.OS === "web" ? 200 : 0,
//     paddingBottom: 25,
//     borderRadius: 20,
//     flex: 1,
//   },
//   areaTitulo: {
//     fontSize: 22,
//     // fontWeight: "bold",
//     marginBottom: 30,
//     color: "rgb(0, 146, 250)",
//   },
//   label: {
//     // fontSize: 16,
//     color: colors.zinc,
//     marginBottom: 4,
//     // flexBasis: "45%",
//   },
//   labelData: {
//     // fontSize: 16,
//     color: colors.zinc,
//     marginBottom: 4,
//     width: 140,
//     textAlign: "right",
//     // flexBasis: "45%",
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: colors.gray,
//     borderRadius: 8,
//     marginBottom: 18,
//     paddingHorizontal: 8,
//     paddingTop: 14,
//     paddingBottom: 14,
//   },
//   labelError: {
//     color: colors.red,
//     marginTop: -18,
//     marginBottom: 18,
//   },
//   eventDetails: {
//     flexWrap: "wrap",
//     // justifyContent: "center",
//     width: Platform.OS === "web" ? width - 432 : -32, // Ajusta a largura conforme a tela
//     // width: width - 32, // Ajusta a largura conforme a tela
//   },
//   eventDetailItem: {
//     flexDirection: "row",
//     alignItems: Platform.OS === "web" ? "flex-start" : "center",
//     marginBottom: 5,
//   },
// });
