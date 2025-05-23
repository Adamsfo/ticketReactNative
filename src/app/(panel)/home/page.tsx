import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  View,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import ModalMsg from "@/src/components/ModalMsg";
import CardEvento from "@/src/components/CardEvento";
import { FlatList } from "react-native-gesture-handler";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { useNavigation } from "@react-navigation/native";
import { apiGeral } from "@/src/lib/geral";
import { Evento, EventoIngresso, QueryParams } from "@/src/types/geral";
import { useFocusEffect } from "expo-router";
import ImageCarousel from "@/src/components/ImagemCarousel";
import { api } from "@/src/lib/api";
import KeenSliderNavigation from "@/src/components/CarouselWeb";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const [visibleMsg, setVisibleMsg] = useState(false);
  const navigation = useNavigation() as any;
  const [registros, setRegistros] = useState<Evento[]>([]);
  const [imagensEvento, setImagensEvento] = useState<string[]>([]);
  const [flatListWidth, setFlatListWidth] = useState<number>(width - 10);

  const getRegistros = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Evento>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];

    for (let i = 0; i < registrosData.length; i++) {
      const precoMin = await getMenorValor({
        filters: { idEvento: registrosData[i].id, status: "Ativo" },
      });
      registrosData[i].MenorValor = precoMin;
    }

    setImagensEvento(
      registrosData
        .filter((item) => !!item.imagem)
        .map((item) => api.getBaseApi() + "/uploads/" + item.imagem)
    );
    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ filters: { status: "Ativo" } });
    }, [])
  );

  const getMenorValor = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    const precos = registrosData.map((item) => item.preco);

    const precoMin = Math.min(...precos);
    return precoMin;
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        {/* <View style={styles.containerImagem}>
          <Image
            source={require("../../../assets/apresentacao.png")}
            style={styles.imagem}
          />
        </View>
        
        <Text style={styles.titulo}>Eventos</Text> */}

        <FlatList
          data={[{}]} // dummy item para garantir render
          keyExtractor={() => "outer-list"}
          showsVerticalScrollIndicator={false}
          // contentContainerStyle={{ padding: 1 }}
          renderItem={() => (
            <FlatList
              data={registros}
              keyExtractor={(item) => item.id.toString()}
              numColumns={width > 600 ? 3 : 1}
              style={styles.listaEventos}
              showsVerticalScrollIndicator={false}
              // contentContainerStyle={{ padding:  }}
              renderItem={({ item }) => (
                <CardEvento
                  data={item}
                  onPress={() => {
                    navigation.navigate("evento", { id: item.id });
                  }}
                  widthCardItem={flatListWidth / (width > 600 ? 3 : 1) - 15}
                />
              )}
            />
          )}
          ListHeaderComponent={
            <View style={{ height: Platform.OS === "web" ? 500 : 300 }}>
              <View style={styles.containerImagem}>
                <Image
                  source={require("../../../assets/apresentacao.png")}
                  style={styles.imagem}
                />
              </View>
              {/* <ImageCarousel images={imagensEvento} /> */}
              <Text style={styles.titulo}>Eventos</Text>
            </View>
          }
        />

        {/* <FlatList
          key={`grid-${width > 600 ? "3" : "1"}`}
          data={registros}
          style={styles.listaEventos}
          keyExtractor={(item) => item.id.toString()}
          // numColumns={numColumns}
          numColumns={width > 600 ? 3 : 1}
          ListHeaderComponent={
            <>
              <View style={styles.containerImagem}>
                <Image
                  source={require("../../../assets/apresentacao.png")}
                  style={styles.imagem}
                />
              </View>
              <Text style={styles.titulo}>Eventos</Text>
            </>
          }
          renderItem={({ item }: { item: Evento }) => (
            <CardEvento
              data={item}
              onPress={() => {
                navigation.navigate("evento", { id: item.id });
              }}
              widthCardItem={flatListWidth / (width > 600 ? 3 : 1) - 15} // Ajuste a largura do card com base na largura da FlatList
            />
          )}
          contentContainerStyle={{ padding: 1 }}
          showsVerticalScrollIndicator={false}
          onLayout={(event) => {
            const { width } = event.nativeEvent.layout;
            setFlatListWidth(width);
          }}
        /> */}
      </View>

      <Modal visible={visibleMsg} transparent animationType="slide">
        <ModalMsg onClose={() => setVisibleMsg(false)} />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    // marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    // marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 3,
  },
  listaEventos: {
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
  },
  columnWrapper: {
    justifyContent: "flex-start",
  },
  containerImagem: {
    alignItems: "center",
  },
  imagem: {
    width: Platform.OS === "web" ? (width <= 1000 ? "100%" : "100%") : "100%", // 100% para web, largura da tela para mobile
    height: Platform.OS === "web" ? (width <= 1000 ? 200 : 400) : 200,
    resizeMode: "stretch", // Ajuste o modo de redimensionamento conforme necessário
  },
});
