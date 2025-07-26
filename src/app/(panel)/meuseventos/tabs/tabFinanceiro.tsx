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

type DiaAgrupado = {
  data: string;
  preco: number;
  valorRecebido: number;
  valorTaxaProcessamento: number;
  taxaServico?: number;
  transacoes: any[];
};

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

  // Agrupar as transações por gateway e tipo
  function agruparPorGatewayETipo(dados: DiaAgrupado[]) {
    const resultado: Record<
      string,
      Record<
        string,
        {
          preco: number;
          valorRecebido: number;
          valorTaxaProcessamento: number;
          taxaServico: number;
          quantidade: number;
        }
      >
    > = {};

    dados.forEach((dia) => {
      dia.transacoes.forEach((tx) => {
        const gateway = tx.gatewayPagamento || "Desconhecido";
        const tipo = tx.tipoPagamento || "Outro";

        if (!resultado[gateway]) resultado[gateway] = {};
        if (!resultado[gateway][tipo]) {
          resultado[gateway][tipo] = {
            preco: 0,
            valorRecebido: 0,
            valorTaxaProcessamento: 0,
            taxaServico: 0,
            quantidade: 0,
          };
        }

        resultado[gateway][tipo].preco += Number(tx.preco);
        resultado[gateway][tipo].taxaServico += Number(tx.taxaServico);
        resultado[gateway][tipo].valorRecebido += Number(tx.valorRecebido);
        resultado[gateway][tipo].valorTaxaProcessamento += Number(
          tx.valorTaxaProcessamento
        );

        resultado[gateway][tipo].quantidade += 1;
      });
    });

    return resultado;
  }

  const agrupado = agruparPorGatewayETipo(registros);

  // Agrupar as transações por gateway e tipo
  function agruparPorGateway(dados: DiaAgrupado[]) {
    const resultado: Record<
      string,
      {
        preco: number;
        valorRecebido: number;
        valorTaxaProcessamento: number;
        taxaServico: number;
        quantidade: number;
      }
    > = {};

    dados.forEach((dia) => {
      dia.transacoes.forEach((tx) => {
        const gateway = tx.gatewayPagamento || "Desconhecido";

        if (!resultado[gateway]) {
          resultado[gateway] = {
            preco: 0,
            valorRecebido: 0,
            valorTaxaProcessamento: 0,
            taxaServico: 0,
            quantidade: 0,
          };
        }

        resultado[gateway].preco += Number(tx.preco);
        resultado[gateway].taxaServico += Number(tx.taxaServico);
        resultado[gateway].valorRecebido += Number(tx.valorRecebido);
        resultado[gateway].valorTaxaProcessamento += Number(
          tx.valorTaxaProcessamento
        );

        resultado[gateway].quantidade += 1;
      });
    });

    return resultado;
  }

  const agrupadoGat = agruparPorGateway(registros);

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

        <Text style={{ fontWeight: "bold", fontSize: 18, marginTop: 20 }}>
          Detalhado por forma pagamento
        </Text>

        <View>
          {Object.entries(agrupado).map(([gateway, tipos]) => (
            <View style={{ marginTop: 20 }} key={gateway}>
              <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                {gateway}:
              </Text>
              <View style={{ marginLeft: 25 }}>
                {Object.entries(tipos).map(([tipo, resumo]) => (
                  <View
                    style={{ marginTop: 5, flexDirection: "column" }}
                    key={tipo}
                  >
                    <Text style={{ marginTop: 5, fontWeight: "bold" }}>
                      💳 {tipo}{" "}
                    </Text>

                    <Text style={{ marginTop: 5, fontWeight: "600" }}>
                      {"       "}
                      Ingressos: {formatCurrency(resumo.preco.toFixed(2))}
                    </Text>
                    {resumo.valorTaxaProcessamento > 0 && (
                      <Text style={{ marginTop: 5, fontWeight: "600" }}>
                        {"       "}
                        Taxa Processamento:{" "}
                        {formatCurrency(
                          resumo.valorTaxaProcessamento.toFixed(2)
                        )}
                      </Text>
                    )}

                    <Text style={{ marginTop: 5, fontWeight: "600" }}>
                      {"       "}
                      Taxa Serviço:{" "}
                      {formatCurrency(resumo.taxaServico.toFixed(2))}
                    </Text>

                    <Text style={{ marginTop: 5, fontWeight: "600" }}>
                      {"       "}
                      Recebido:{" "}
                      {formatCurrency(resumo.valorRecebido.toFixed(2))}
                    </Text>
                    {/* <strong></strong> {tipo} —<strong> Total:</strong> R${" "}
                    {resumo.preco.toFixed(2)} —<strong> Recebido:</strong> R${" "}
                    {resumo.valorRecebido.toFixed(2)} —<strong> Taxa:</strong>{" "}
                    R$ {resumo.valorTaxaProcessamento.toFixed(2)} —
                    <strong> Qtd:</strong> {resumo.quantidade} */}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Text style={{ fontWeight: "bold", fontSize: 18, marginTop: 20 }}>
          Resumido
        </Text>

        <View>
          {Object.entries(agrupadoGat).map(([gateway]) => (
            <View style={{ marginTop: 20 }} key={gateway}>
              <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                {gateway}:
              </Text>
              <View style={{ marginLeft: 25 }}>
                <View
                  style={{ marginTop: 5, flexDirection: "column" }}
                  key={gateway}
                >
                  <Text style={{ marginTop: 5, fontWeight: "600" }}>
                    {"       "}
                    Ingressos:{" "}
                    {formatCurrency(agrupadoGat[gateway].preco.toFixed(2))}
                  </Text>
                  <Text style={{ marginTop: 5, fontWeight: "600" }}>
                    {"       "}
                    Taxa Serviço:{" "}
                    {formatCurrency(
                      agrupadoGat[gateway].taxaServico.toFixed(2)
                    )}
                  </Text>
                  <Text style={{ marginTop: 5, fontWeight: "600" }}>
                    {"       "}
                    Recebido:{" "}
                    {formatCurrency(
                      agrupadoGat[gateway].valorRecebido.toFixed(2)
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ))}
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
