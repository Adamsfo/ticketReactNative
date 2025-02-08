import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  View,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import ModalMsg from "@/src/components/ModalMsg";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Feather } from "@expo/vector-icons";
import CounterTicket from "@/src/components/CounterTicket";

const { width } = Dimensions.get("window");

export default function Index() {
  const [visibleMsg, setVisibleMsg] = useState(false);
  const [count, setCount] = useState(0);

  const widthCardItem = 460;

  const data = [
    { key: "header", type: "header" },
    { key: "ingressos", type: "ingressos" },
    { key: "descricao", type: "descricao" },
  ];

  const renderItem = ({ item }: { item: { key: string; type: string } }) => {
    if (item.type === "header") {
      return (
        <>
          <View style={styles.containerImagem}>
            <Image
              source={require("../../../assets/eventoDayUse.png")}
              style={styles.imagem}
            />
          </View>

          <View style={styles.dadosBasicos}>
            <Text style={styles.titulo}>Day Use Jango</Text>
            <View style={{ flexDirection: "row", padding: 7 }}>
              <Text
                style={{ fontWeight: "normal", paddingLeft: 5, marginRight: 5 }}
              >
                Pesque Pague Jango
              </Text>
              <Feather name="map-pin" size={20}></Feather>
            </View>

            <View style={{ flexDirection: "row", padding: 7 }}>
              <Text style={{ fontWeight: "normal", paddingLeft: 5 }}>
                Aberto todos os dias exceto 4ª feira
              </Text>
            </View>
          </View>
        </>
      );
    } else if (item.type === "ingressos") {
      return (
        <View style={styles.dadosBasicos}>
          <Text style={styles.titulo}>Ingressos</Text>

          <FlatList
            data={[
              { id: 1, nome: "Day Use Jango" },
              { id: 2, nome: "Pousada" },
            ]}
            keyExtractor={(item) => item.id.toString()}
            numColumns={1}
            renderItem={({ item }) => (
              <View key={item.id} style={{ flexDirection: "column" }}>
                <CounterTicket data={item} />
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />

          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Text style={{ fontSize: 18 }}>Total: </Text>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>R$ 120,00</Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: "rgb(0, 146, 250)",
              borderRadius: 5,
              padding: 10,
              marginTop: 10,
              alignItems: "center",
            }}
            onPress={() => setVisibleMsg(true)}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Comprar Ingressos
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else if (item.type === "descricao") {
      return (
        <View style={styles.dadosBasicos}>
          <Text style={styles.titulo}>Descrição do Evento</Text>
          <Text style={{ fontSize: 18 }}>
            WE MAKE BETTER DAYS CARNIVAL EDITION A extravagância e a ausência da
            razão não deixam dúvidas: é tempo de We Make Better Days Carnival
            Edition! Dia 28 de fevereiro de 2025, sexta de Carnaval, o Rio de
            Janeiro se transforma no palco de um verdadeiro espetáculo prestes a
            apresentar os melhores dias já sonhados. Prontos para ver o surreal
            se tornar realidade? We Make Better Days Carnival Edition 28.02.2025
            - Rio de Janeiro Full Open Bar Dream Beyond Reality, Live The
            Surreal Evento proibido para menores de 18 anos.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <FlatList
          data={data}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
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
    marginTop: 10,
    marginBottom: 3,
  },
  containerImagem: {
    alignItems: "center",
  },
  imagem: {
    width: Platform.OS === "web" ? "60%" : "100%",
    height: Platform.OS === "web" ? 600 : 200,
    resizeMode: "cover",
  },
  dadosBasicos: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 25,
    paddingLeft: 25,
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
    paddingBottom: 25,
    borderRadius: 20,
  },
});
