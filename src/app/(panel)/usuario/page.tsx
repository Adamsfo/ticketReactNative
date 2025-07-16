import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Produtor,
  ProdutorAcesso,
  QueryParams,
  Usuario,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import ModalUsuario from "./modalUsuario";
import { useAuth } from "@/src/contexts_/AuthContext";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/usuario";
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<Usuario[]>([]);
  const [id, setid] = useState(0);
  const { user } = useAuth();
  const [pesquisa, setPesquisa] = useState("");

  const data = [
    { label: "email" },
    { label: "Nome" },
    { label: "Sobrenome" },
    { label: "CPF" },
    { label: "Telefone" },
    { label: "Ativo" },
    { label: "Alterar" },
  ];

  const getRegistros = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Usuario>(endpointApi, {
      ...params,
      pageSize: 10,
    });
    const registrosData = response.data ?? [];

    setRegistros(registrosData);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros({ search: pesquisa });
    }, [visibleModal, pesquisa])
  );

  const handleModalEdit = (id: number) => {
    setid(id);
    setVisibleModal(true);
  };

  const handleModalNovo = () => {
    setid(0);
    setVisibleModal(true);
  };

  const handleCloseModal = () => {
    setRegistros([]);
    setVisibleModal(false);
    getRegistros({ search: pesquisa });
  };

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <Text style={styles.titulo}>Usuários</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
        >
          <View style={styles.area}>
            <View>
              <Text style={styles.label}>Pesquisa</Text>
              <TextInput
                style={styles.input}
                multiline={Platform.OS === "web" ? false : true}
                placeholder="email..."
                keyboardType="default"
                value={pesquisa}
                onChangeText={(text) => setPesquisa(text)}
              ></TextInput>
            </View>
            {Platform.OS === "web" && <CustomGridTitle data={data} />}
            {registros.map((item: Usuario, index: number) => (
              <CustomGrid
                key={index}
                onItemPress={handleModalEdit}
                data={[
                  {
                    label: data[0].label,
                    content: item.email,
                    id: item.id ?? 0,
                  },
                  {
                    label: data[1].label,
                    content: item.nomeCompleto,
                    id: item.id ?? 0,
                  },
                  {
                    label: data[2].label,
                    content: item.sobreNome,
                    id: item.id ?? 0,
                  },
                  {
                    label: data[3].label,
                    content: item.cpf,
                    id: item.id ?? 0,
                  },
                  {
                    label: data[4].label,
                    content: item.telefone,
                    id: item.id ?? 0,
                  },
                  {
                    label: data[5].label,
                    content: item.ativo ? "Sim" : "Não",
                    id: item.id ?? 0,
                  },
                  {
                    label: data[6].label,
                    // content: formatCurrency(item.valorTotal.toString()),
                    id: item.id ?? 0,
                    iconName: "check-square",
                    isButton: true,
                    onPress: handleModalEdit,
                  },
                ]}
              />
            ))}
            {/* <View style={{ alignItems: "flex-end" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.azul,
                  borderRadius: 5,
                  padding: 10,
                  marginTop: 10,
                  width: Platform.OS === "web" ? 200 : 100,
                  alignItems: "center",
                }}
                onPress={handleModalNovo}
              >
                <Text style={{ color: "white", fontWeight: "bold" }}>Novo</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ModalUsuario
            id={id}
            visible={visibleModal}
            onClose={handleCloseModal}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? 200 : 20,
    // marginLeft: Platform.OS === "web" ? 200 : 20,
    marginBottom: 20,
    height: 500,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 25,
    paddingLeft: 25,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  areaTitulo: {
    fontSize: 22,
    // fontWeight: "bold",
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    // flexBasis: "45%",
  },
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
    // flexBasis: "45%",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  eventDetails: {
    flexWrap: "wrap",
    // justifyContent: "center",
    width: Platform.OS === "web" ? width - 432 : -32, // Ajusta a largura conforme a tela
    // width: width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
});
