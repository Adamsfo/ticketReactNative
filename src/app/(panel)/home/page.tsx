import React, { useState, useEffect } from "react";
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

const { width } = Dimensions.get("window");

export default function Index() {
  const [visibleMsg, setVisibleMsg] = useState(false);
  const navigation = useNavigation() as any;

  const widthCardItem = 460;

  const numColumns =
    Platform.OS === "web"
      ? Math.floor((Dimensions.get("window").width - 140) / widthCardItem)
      : 1;

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.containerImagem}>
          <Image
            source={require("../../../assets/apresentacao.png")}
            style={styles.imagem}
          />
        </View>
        <Text style={styles.titulo}>Eventos</Text>

        <FlatList
          data={[
            { id: 1, nome: "Day Use Jango" },
            { id: 2, nome: "Pousada" },
          ]}
          style={styles.listaEventos}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          renderItem={({ item }: { item: any }) => (
            <CardEvento
              data={item}
              onPress={() => {
                navigation.navigate("evento");
              }}
              widthCardItem={widthCardItem}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
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
    marginRight: Platform.OS === "web" ? 200 : 20,
    marginLeft: Platform.OS === "web" ? 200 : 20,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 3,
  },
  listaEventos: {},
  columnWrapper: {
    justifyContent: "flex-start",
  },
  containerImagem: {
    alignItems: "center",
  },
  imagem: {
    width: Platform.OS === "web" ? "60%" : "100%", // 100% para web, largura da tela para mobile
    height: Platform.OS === "web" ? 600 : 200,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
});
