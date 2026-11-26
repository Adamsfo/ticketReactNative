import React, { useCallback, useMemo, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Evento, Ingresso, ProdutorAcesso } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import { format, parseISO, set } from "date-fns";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useRoute } from "@react-navigation/native";
import ModalCortesia from "./modalCortesia";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import formatCurrency from "@/src/components/FormatCurrency";
import { Picker } from "@react-native-picker/picker";

const { width } = Dimensions.get("window");

type RegistroPedidoJango = {
  id: number | string;
  usuario: string;
  data: string;
  valorPedido: number;
  valorEntregue: number;
  total: number;
};

type OpcaoUsuarioPedido = {
  id: string;
  usuario: string;
};

function mapRegistroPedido(item: Record<string, unknown>): RegistroPedidoJango {
  const dataBruta = item.DATA ?? item.data;
  const dataStr = String(dataBruta ?? "").replace("T00:00:00.000Z", "");

  return {
    id: (item.ID ?? item.id) as number | string,
    usuario: String(item.USUARIO ?? item.usuario ?? ""),
    data: dataStr,
    valorPedido: Number(item.VALORPEDIDO ?? item.valorPedido ?? 0),
    valorEntregue: Number(item.VALORENTREGUE ?? item.valorEntregue ?? 0),
    total: Number(item.TOTAL ?? item.total ?? 0),
  };
}

function extrairUsuariosUnicos(
  registros: RegistroPedidoJango[],
): OpcaoUsuarioPedido[] {
  const porId = new Map<string, OpcaoUsuarioPedido>();

  registros.forEach((registro) => {
    const id = String(registro.id);
    if (!porId.has(id)) {
      porId.set(id, { id, usuario: registro.usuario });
    }
  });

  return Array.from(porId.values()).sort((a, b) =>
    a.usuario.localeCompare(b.usuario, "pt-BR"),
  );
}

export default function TabPedidosJango() {
  const route = useRoute();
  const endpointApi = "/pedidosusuariojango";
  const { id } = route.params as { id: number };
  const [visibleModal, setVisibleModal] = useState(false);
  const [registrosOriginais, setRegistrosOriginais] = useState<
    RegistroPedidoJango[]
  >([]);
  const [registroEvento, setRegistroEvento] = useState<Evento>();
  const navigation = useNavigation() as any;
  const [visibleModalCortesia, setVisibleModalCortesia] = useState(false);
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFinal, setDataFinal] = useState<Date>(new Date());
  const [idUsuarioFiltro, setIdUsuarioFiltro] = useState<string>("");
  // const [resumoPorSetor, setResumoPorSetor] = useState<Record<string, number>>(
  //   {}
  // );
  const [resumoPorSetorDisponivel, setResumoPorSetorDisponivel] = useState<
    Record<string, number>
  >({});
  const { user } = useAuth();

  const data = [
    { label: "Código" },
    { label: "Usuário" },
    { label: "Data" },
    { label: "Valor Pedido" },
    { label: "Valor Entregue" },
    { label: "Total" },
  ];

  const opcoesUsuario = useMemo(
    () => extrairUsuariosUnicos(registrosOriginais),
    [registrosOriginais],
  );

  const registrosExibidos = useMemo(() => {
    if (idUsuarioFiltro === "") {
      return registrosOriginais;
    }
    return registrosOriginais.filter(
      (item) => String(item.id) === idUsuarioFiltro,
    );
  }, [registrosOriginais, idUsuarioFiltro]);

  const getRegistros = useCallback(async () => {
    const response = await apiGeral.getResource<any>(endpointApi, {
      idEvento: id,
      dataInicio: format(dataInicio.toString(), "yyyy-MM-dd"),
      dataFim: format(dataFinal.toString(), "yyyy-MM-dd"),
    });

    console.log("Response Ingressos Full", response);

    const registrosData = response.data ?? [];
    console.log("Response Ingressos", registrosData);
    const registrosAjustados = registrosData.map((item: any) =>
      mapRegistroPedido(item as Record<string, unknown>),
    );

    console.log("Registros Ajustados", registrosAjustados);

    setRegistrosOriginais(registrosAjustados);
    setIdUsuarioFiltro((atual) => {
      if (atual === "") {
        return atual;
      }
      const aindaExiste = registrosAjustados.some(
        (item) => String(item.id) === atual,
      );
      return aindaExiste ? atual : "";
    });

    // const resumo = registrosAjustados.reduce(
    //   (acc: Record<string, number>, item) => {
    //     const setor = item.EventoIngresso?.nome ?? "Sem setor";
    //     acc[setor] = (acc[setor] || 0) + Number(item.quantidade || 0);
    //     return acc;
    //   },
    //   {}
    // );

    // setResumoPorSetor(resumo);
  }, [dataInicio, dataFinal, id]);

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal, dataInicio, dataFinal, getRegistros]),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Ingressos</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.area}>
          {/* <View
            style={{
              alignItems: "flex-end",
              marginBottom:
                Platform.OS === "web" ? (width <= 1000 ? 10 : 0) : 10,
            }}
          ></View> */}
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.labelData}>Data Inicial:</Text>
                <DatePickerComponente
                  value={dataInicio}
                  onChange={setDataInicio}
                />
              </View>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.labelData}>Data Final:</Text>
                <DatePickerComponente
                  value={dataFinal}
                  onChange={setDataFinal}
                />
              </View>
            </View>

            <View style={styles.eventDetails}>
              <View style={styles.eventDetailItem}>
                <Text style={styles.labelData}>Usuário:</Text>
                <Picker
                  selectedValue={idUsuarioFiltro}
                  onValueChange={(value) =>
                    setIdUsuarioFiltro(String(value ?? ""))
                  }
                  style={styles.pickerUsuario}
                >
                  <Picker.Item label="Todos" value="" />
                  {opcoesUsuario.map((op) => (
                    <Picker.Item
                      key={op.id}
                      label={op.usuario}
                      value={op.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>
          {Platform.OS === "web" && <CustomGridTitle data={data} />}
          {registrosExibidos.map((item: RegistroPedidoJango, index: number) => (
            <CustomGrid
              key={index}
              // onItemPress={handleModalEdit}
              data={[
                {
                  label: data[0].label,
                  content: item?.id ?? "",
                  id: item.id,
                },
                {
                  label: data[1].label,
                  content: item?.usuario.toString() ?? "",
                  id: item.id,
                },
                {
                  label: data[2].label,
                  content: format(parseISO(item.data.toString()), "dd/MM/yyyy"),
                  id: item.id,
                },
                {
                  label: data[3].label,
                  content: formatCurrency(item.valorPedido.toFixed(2)),
                  id: item.id,
                },
                {
                  label: data[4].label,
                  content: formatCurrency(item.valorEntregue.toFixed(2)),
                  id: item.id,
                },
                {
                  label: data[5].label,
                  content: formatCurrency(item.total.toFixed(2)),
                  id: item.id,
                },
              ]}
            />
          ))}
        </View>

        {/* <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
            Resumo utilizados por setor
          </Text>
          {Object.entries(resumoPorSetor).map(([setor, total], index) => (
            <View
              key={index}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <Text style={{ fontWeight: "600" }}>{setor}</Text>
              <Text style={{ fontWeight: "600" }}>{total}</Text>
            </View>
          ))}
        </View> */}
        {/* <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
            Resumo disponível por setor
          </Text>
          {Object.entries(resumoPorSetorDisponivel).map(
            ([setor, total], index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 5,
                }}
              >
                <Text style={{ fontWeight: "600" }}>{setor}</Text>
                <Text style={{ fontWeight: "600" }}>{total}</Text>
              </View>
            )
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>Total Geral</Text>
            <Text style={{ fontWeight: "bold" }}>
              {Object.values(resumoPorSetorDisponivel).reduce(
                (a, b) => a + b,
                0
              )}
            </Text>
          </View>
        </View> */}
      </ScrollView>
      <Modal visible={visibleModalCortesia} transparent animationType="fade">
        <ModalCortesia
          idEvento={id}
          onClose={() => {
            setVisibleModalCortesia(false);
            getRegistros();
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  linearGradient: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 10 : "10%") : 10,
    marginBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  // scrollViewContent: {
  //   flexGrow: 1,
  // },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
    // marginRight: Platform.OS === "web" ? 200 : 0,
    // marginLeft: Platform.OS === "web" ? 200 : 0,
  },
  eventDetails: {
    flexWrap: "wrap",
    width: Platform.OS === "web" ? width - 432 : -32,
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  newButton: {
    backgroundColor: colors.azul,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: Platform.OS === "web" ? 200 : 100,
    alignItems: "center",
  },
  newButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
    textAlign: "right",
    height: 45,
    lineHeight: 45,
  },
  pickerUsuario: {
    flex: 1,
    height: 45,
    minWidth: Platform.OS === "web" ? 200 : undefined,
  },
});