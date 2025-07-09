import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  Modal,
} from "react-native";
import { format, parseISO, set } from "date-fns";
import { useNavigation, useRoute } from "@react-navigation/native";

import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import CustomGridTitle from "@/src/components/CustomGridTitle";
import CustomGrid from "@/src/components/CustomGrid";
import DatePickerComponente from "@/src/components/DatePickerComponente";

import { Evento, Transacao } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useAuth } from "@/src/contexts_/AuthContext";
import ModalCortesia from "./modalCortesia";
import colors from "@/src/constants/colors";
import { useFocusEffect } from "expo-router";
import formatCurrency from "@/src/components/FormatCurrency";
import ModalVendasPagas from "./modalVendasPagas";

const { width } = Dimensions.get("window");

export default function TabFinanceiro() {
  const route = useRoute();
  const endpointApi = "/dadostransacoespagas";
  const { id } = route.params as { id: number };
  const [visibleModal, setVisibleModal] = useState(false);
  const [registros, setRegistros] = useState<any[]>([]);
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFinal, setDataFinal] = useState<Date>(new Date());
  const [resumoPorDataSetor, setResumoPorDataSetor] = useState<
    Record<string, { quantidade: number; valor: number; taxa: number }>
  >({});
  const [totalGeral, setTotalGeral] = useState<{
    preco: number;
    valorRecebido: number;
    valorTaxaProcessamento: number;
  }>({ preco: 0, valorRecebido: 0, valorTaxaProcessamento: 0 });
  const navigation = useNavigation() as any;
  const [visibleModalVendasPagas, setVisibleModalVendasPagas] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const { user } = useAuth();

  const data = [
    { label: "Data" },
    { label: "Valor Ingressos" },
    { label: "Taxa Processamento" },
    { label: "Valor Recebido" },
    { label: "Quantidade de Vendas" },
    { label: "Analisar Vendas", isButton: true },
  ];

  const getRegistros = async () => {
    console.log("Fetching registros for financeiro...");
    const response = await apiGeral.getResource<any>(endpointApi, {
      idEvento: id,
      dataInicio: format(dataInicio.toString(), "yyyy-MM-dd"),
      dataFim: format(dataFinal.toString(), "yyyy-MM-dd"),
    });

    const registrosData = response.data ?? [];

    // ✅ filtra para remover o item com data === "Total"
    const registrosSemTotal = registrosData.filter(
      (item: any) => item.data !== "Total"
    );

    // ✅ filtra para remover o item com data === "Total"
    const registrosTotal = registrosData.filter(
      (item: any) => item.data === "Total"
    );

    console.log("Registros total:", registrosTotal);
    setTotalGeral(registrosTotal[0]);

    setRegistros(registrosSemTotal);
  };

  useFocusEffect(
    useCallback(() => {
      getRegistros();
    }, [visibleModal, dataInicio, dataFinal])
  );

  const handleVerVendas = (transcoes: any) => {
    console.log("Ver Vendas Pagas", transcoes);
    setTransacoes(transcoes);
    setVisibleModalVendasPagas(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Financeiro</Text>

      <ScrollView>
        <View style={styles.area}>
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
          </View>

          {Platform.OS === "web" && <CustomGridTitle data={data} />}
          {registros.map((item, index) => (
            <CustomGrid
              key={index}
              data={[
                {
                  id: 0,
                  label: data[0].label,
                  content: format(parseISO(item.data.toString()), "dd/MM/yyyy"),
                },
                {
                  id: 1,
                  label: data[1].label,
                  content: formatCurrency(item.preco.toFixed(2)),
                },
                {
                  id: 2,
                  label: data[2].label,
                  content: formatCurrency(
                    item.valorTaxaProcessamento.toFixed(2)
                  ),
                },
                {
                  id: 3,
                  label: data[3].label,
                  content: formatCurrency(item.valorRecebido.toFixed(2)),
                },
                {
                  id: 4,
                  label: data[4].label,
                  content: item.transacoes.length,
                },
                {
                  id: 5,
                  label: data[5].label,
                  iconName: "check-square",
                  isButton: true,
                  onPress: () => handleVerVendas(item.transacoes),
                },
              ]}
            />
          ))}

          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>Resumo</Text>
            <Text style={{ marginTop: 15, fontWeight: "bold" }}>
              Total Ingressos:{" "}
              <Text style={{ marginTop: 15, fontWeight: "600" }}>
                {formatCurrency(totalGeral.preco.toFixed(2))}
              </Text>
            </Text>
            <Text style={{ marginTop: 15, fontWeight: "bold" }}>
              Total Taxa Processamento:{" "}
              <Text style={{ marginTop: 15, fontWeight: "600" }}>
                {formatCurrency(totalGeral.valorTaxaProcessamento.toFixed(2))}
              </Text>
            </Text>
            <Text style={{ marginTop: 15, fontWeight: "bold" }}>
              Total Recebido:{" "}
              <Text style={{ marginTop: 15, fontWeight: "600" }}>
                {formatCurrency(totalGeral.valorRecebido.toFixed(2))}
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={visibleModalVendasPagas} transparent animationType="fade">
        <ModalVendasPagas
          onClose={() => setVisibleModalVendasPagas(false)}
          transacoes={transacoes}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 25,
    paddingTop: 15,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
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
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 75,
    textAlign: "right",
    height: 45,
    lineHeight: 45,
  },
});
