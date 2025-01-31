import colors from "@/src/constants/colors";
import { Text, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import Menu from "@/src/components/Menu";
import ModalMsg from "@/src/components/ModalMsg";
import { useState } from "react";
import { Container, Title, ListEventos } from "./styles";
import CardEvento from "@/src/components/CardEvento";

export default function Index() {
  const [visibleMsg, setVisibleMsg] = useState(true);

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <Menu />

      <Container>
        <Title>Titulo</Title>

        <ListEventos
          data={[
            { id: 1, nome: "Evento 1" },
            { id: 2, nome: "Evento 2" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
            { id: 3, nome: "Evento 3" },
          ]}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => (
            <CardEvento
              data={item}
              onPress={() => {
                setVisibleMsg(true);
              }}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        ></ListEventos>
      </Container>

      <Modal visible={visibleMsg} transparent animationType="slide">
        <ModalMsg onClose={() => setVisibleMsg(false)} />
      </Modal>

      {/*  <Text>{usuario?.nomeCompleto}</Text>
      <Text>{usuario?.email}</Text>
      <Link
        href="/(auth)/singin/page"
        style={{ marginTop: 16, textAlign: "center" }}
      >
        <Text style={{ textAlign: "center", color: colors.laranjado }}>
          Login
        </Text>
      </Link> */}
      {/* <ActivityIndicator size="large" color={colors.laranjado} /> */}
    </LinearGradient>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
