import React, { useState, useEffect } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  View,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import Menu from "@/src/components/Menu";
import ModalMsg from "@/src/components/ModalMsg";
import CardEvento from "@/src/components/CardEvento";
import { FlatList } from "react-native-gesture-handler";
import colors from "@/src/constants/colors";
import FloatingMenu from "@/src/components/FloatingMenu";
import BarMenu from "@/src/components/BarMenu";

export default function Index() {
  const [visibleMsg, setVisibleMsg] = useState(false);
  const widthCardItem = 400;

  const numColumns =
    Platform.OS === "web"
      ? Math.floor(Dimensions.get("window").width / widthCardItem)
      : 1;

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Titulo</Text>

        <FlatList
          data={[
            { id: 1, nome: "Day Use 1" },
            { id: 2, nome: "Day Use 2" },
            { id: 3, nome: "Day Use 3" },
            { id: 4, nome: "Day Use 4" },
            { id: 5, nome: "Day Use 5" },
            { id: 6, nome: "Day Use 6" },
            { id: 7, nome: "Day Use 7" },
            { id: 8, nome: "Day Use 8" },
            { id: 9, nome: "Day Use 9" },
            { id: 10, nome: "Day Use 10" },
            { id: 11, nome: "Day Use 11" },
            { id: 12, nome: "Day Use 12" },
            { id: 13, nome: "Day Use 13" },
            { id: 14, nome: "Day Use 14" },
            { id: 15, nome: "Evento 15" },
            { id: 16, nome: "Evento 16" },
          ]}
          style={styles.listaEventos}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          // columnWrapperStyle={
          //   Platform.OS === "web" ? styles.columnWrapper : null
          // }
          renderItem={({ item }: { item: any }) => (
            <CardEvento
              data={item}
              onPress={() => {
                setVisibleMsg(true);
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
    marginRight: 40,
    marginBottom: 20,
    marginLeft: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
  },
  listaEventos: {},
  columnWrapper: {
    justifyContent: "flex-start",
  },
});
