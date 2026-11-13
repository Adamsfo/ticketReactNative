import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import colors from "@/src/constants/colors";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";
import { checkoutScreenStyles as cs } from "@/src/components/public/checkoutScreenStyles";
import { publicTheme } from "@/src/constants/publicTheme";
import {
  Evento,
  EventoIngresso,
  Ingresso,
  IngressoTransacao,
  Produtor,
  QueryParams,
  Transacao,
  Usuario,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { getValorFinalUnitarioIngresso } from "@/src/lib/ingressoPricing";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Accordion from "@/src/components/Accordion";
import CounterTicket from "@/src/components/CounterTicket";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format, parseISO, set } from "date-fns";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import { Switch } from "react-native-gesture-handler";
import { useAuth } from "@/src/contexts_/AuthContext";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const navigation = useNavigation() as any;
  const { idTransacao, idEvento } = route.params as {
    idTransacao: number;
    idEvento: number;
  };
  const [cupomDesconto, setCupomDesconto] = useState<string>("");
  const [infoCupomDesconto, setInfoCupomDesconto] = useState<string | null>(
    null
  );

  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    endereco: "",
    idUsuario: 0,
    idProdutor: 0,
  });
  const [modalVisible, setModalVisible] = useState(true);
  const [registroTransacao, setRegistrosTransacao] = useState<Transacao>();
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setRegistrosTransacao(undefined);
      setRegistrosIngressoTransacao([]);
      if (idTransacao > 0) {
        setCupomDesconto("");
        setInfoCupomDesconto(null);
        getRegistros(idEvento);
        getTransacao({ filters: { id: state.transacao?.id } });
      }
    }, [idEvento, idTransacao])
  );

  const calculateTotal = () => {
    return state.items
      .reduce((total, item) => {
        return (
          total +
          item.qtde * getValorFinalUnitarioIngresso(item.eventoIngresso)
        );
      }, 0)
      .toFixed(2);
  };

  const renderTicketInputs = (item: any) => {
    const isCriança = item?.Ingresso_EventoIngresso?.nome.includes("Criança");

    return (
      <View style={styles.inputCard}>
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.label}>Nome Completo:</Text>
            {!isCriança && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={styles.label}>Preencher meus dados </Text>
                <Switch
                  trackColor={{ false: colors.cinza, true: colors.azul }}
                  thumbColor={colors.azul}
                  // ios_backgroundColor={colors.cinza}
                  onValueChange={(value) => {
                    handleChangeIngressoTransacao(
                      item.id,
                      "Ingresso_atribuirOutroUsuario",
                      value
                    );
                  }}
                  value={item.Ingresso_atribuirOutroUsuario}
                ></Switch>
              </View>
            )}
          </View>

          <TextInput
            style={styles.input}
            multiline={Platform.OS === "web" ? false : true}
            placeholder="Nome..."
            keyboardType="default"
            value={item.Ingresso_nomeImpresso || ""}
            onChangeText={(text) =>
              handleChangeIngressoTransacao(
                item.id,
                "Ingresso_nomeImpresso",
                text
              )
            }
          ></TextInput>
          {/* {errors.nome && (
                        <Text style={styles.labelError}>{errors.nome}</Text>
                      )} */}
        </View>
        {isCriança && (
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <Text style={styles.inputLabel}>Data Nascimento:</Text>
            <View>
              <DatePickerComponente
                value={new Date(item.Ingresso_dataNascimento) || new Date()}
                onChange={(value) =>
                  handleChangeIngressoTransacao(
                    item.id,
                    "Ingresso_dataNascimento",
                    value
                  )
                }
              />
            </View>
            <Text style={styles.inputLabel}>
              {" "}
              Idade: {calcularIdade(item.Ingresso_dataNascimento)} anos
            </Text>
          </View>
        )}
      </View>
    );
  };

  const handleChangeIngressoTransacao = (
    id: number,
    field: any,
    value: string | number | Date | boolean
  ) => {
    setRegistrosIngressoTransacao((prevState) =>
      prevState.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    if (field === "Ingresso_atribuirOutroUsuario") {
      setRegistrosIngressoTransacao((prevState) =>
        prevState.map((item) =>
          item.id === id
            ? {
                ...item,
                Ingresso_nomeImpresso: value === true ? user?.nomeCompleto : "",
              }
            : item
        )
      );
    }
  };

  function calcularIdade(dataNascimento: string | Date) {
    const hoje = new Date();
    if (dataNascimento === null) {
      return 0;
    }

    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  }

  const getTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Transacao>("/transacao", {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];

    setRegistrosTransacao(registrosData[0]);

    // if (registrosData[0]?.id > 0) {
    //   if (calculateTotal() !== String(registrosData[0]?.valorTotal)) {
    //     navigation.navigate("ingressos", { id: idEvento });
    //   }
    // }

    await getIngressoTransacao({
      filters: { idTransacao: state.transacao?.id },
    });
  };

  const getIngressoTransacao = async (params: QueryParams) => {
    const response = await apiGeral.getResource<IngressoTransacao>(
      "/ingressotransacao",
      {
        ...params,
        pageSize: 200,
      }
    );
    const registrosData = response.data ?? [];
    console.log("witsh", width);

    console.log("registrosData", registrosData);
    setRegistrosIngressoTransacao(registrosData);
  };

  const processarCupomDesconto = async () => {
    if (cupomDesconto.trim() != "") {
      const response = await apiGeral.createResource<any>(
        "/ingressotransacaocupomdesconto",
        {
          idTransacao: state.transacao?.id,
          nomeCupomDesconto: cupomDesconto,
        }
      );

      setInfoCupomDesconto(response.data.message || null);

      if (!response.data.message.includes("sucesso")) {
        setCupomDesconto("");
        return;
      }

      dispatch({ type: "REMOVE_TRANSACAO" });

      dispatch({
        type: "ADD_TRANSACAO",
        transacao: response.data.transacaoAtualizada,
      });

      await getTransacao({
        filters: { id: state.transacao?.id },
      });
    }
  };

  type IngressoAgrupado = IngressoTransacao & { qtde: number };

  const agruparIngressos = (
    ingressos: IngressoTransacao[]
  ): IngressoAgrupado[] => {
    const mapa = new Map<string, IngressoAgrupado>();

    ingressos.forEach((item) => {
      const chave = `${item.Ingresso_EventoIngresso?.TipoIngresso?.id}-${item.Ingresso_EventoIngresso?.nome}`;

      if (mapa.has(chave)) {
        const existente = mapa.get(chave)!;
        existente.qtde += 1;
      } else {
        mapa.set(chave, { ...item, qtde: 1 });
      }
    });

    return Array.from(mapa.values());
  };

  const ingressosAgrupados = agruparIngressos(registrosIngressoTransacao);

  const descontoCupomResumo =
    ingressosAgrupados.reduce(
      (acc, item) => acc + Number(item.precoDesconto ?? 0) * item.qtde,
      0,
    ) + Number(registroTransacao?.taxaServicoDesconto ?? 0);

  return (
    <PublicShopLayout>
      <View style={cs.page}>
        <View style={cs.areaStep}>
          <StepIndicator currentStep={2} variant="public" />
        </View>
        <Text style={cs.screenTitle}>Conferência e atribuição</Text>

        <FlatList
          data={registrosIngressoTransacao}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <PublicShopSection noPadding style={cs.eventHero}>
                <View style={cs.eventHeroRow}>
                  <Image
                    source={{
                      uri: api.getBaseApi() + "/uploads/" + formData.imagem,
                    }}
                    style={cs.imagem}
                  />
                  <Text style={cs.tituloEvento}>{formData.nome}</Text>
                </View>
              </PublicShopSection>

              <PublicShopSection title="Cupom de desconto">
                <View style={cs.cupomRow}>
                  <TextInput
                    style={cs.cupomInput}
                    multiline={Platform.OS === "web" ? false : true}
                    placeholder="Nome do desconto..."
                    keyboardType="default"
                    value={cupomDesconto}
                    onChangeText={(text) => setCupomDesconto(text)}
                    placeholderTextColor={publicTheme.textMuted}
                  />
                  <TouchableOpacity
                    style={cs.cupomBtn}
                    onPress={async () => {
                      await processarCupomDesconto();
                    }}
                  >
                    <Text style={cs.cupomBtnText}>Aplicar</Text>
                  </TouchableOpacity>
                </View>

                {infoCupomDesconto != "" && (
                  <Text
                    style={[
                      infoCupomDesconto?.includes("sucesso")
                        ? styles.labelSucesso
                        : styles.labelError,
                    ]}
                  >
                    {infoCupomDesconto}
                  </Text>
                )}
              </PublicShopSection>

              <PublicShopSection title="Resumo da compra">
                <View>
                  <FlatList<IngressoAgrupado>
                    data={ingressosAgrupados}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 3,
                          marginHorizontal: 5,
                        }}
                      >
                        <View
                          style={{
                            flex: 1,
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <View style={{ flexDirection: "row" }}>
                            <Text
                              style={{
                                paddingHorizontal: 3,
                                fontWeight: "bold",
                                fontSize: 14,
                              }}
                            >
                              {item.qtde} x
                            </Text>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {
                                item.Ingresso_EventoIngresso?.TipoIngresso
                                  ?.descricao
                              }
                            </Text>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {item.Ingresso_EventoIngresso?.nome}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{ paddingHorizontal: 3, fontSize: 14 }}
                            >
                              {formatCurrency(valorLinhaResumoComTaxa(item))}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                </View>
                <View style={{ marginTop: 8, paddingHorizontal: 5 }}>
                  {descontoCupomResumo > 0 ? (
                    <>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          paddingVertical: 4,
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>Desconto do cupom</Text>
                        <Text
                          style={{ fontSize: 16, color: colors.greenEscuro }}
                        >
                          -{" "}
                          {formatCurrency(descontoCupomResumo.toFixed(2))}
                        </Text>
                      </View>
                      <View
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: "rgba(0,0,0,0.15)",
                          marginVertical: 6,
                        }}
                      />
                    </>
                  ) : null}
                  <View style={cs.totalRow}>
                    <Text style={cs.totalLabel}>Total</Text>
                    <Text style={cs.totalValue}>
                      {formatCurrency(registroTransacao?.valorTotal ?? 0)}
                    </Text>
                  </View>
                </View>
              </PublicShopSection>
            </>
          }
          renderItem={({ item }) => (
            <View style={cs.ticketContainer}>
              <Text style={cs.ticketTitle}>
                {/* {item.Ingresso_Evento?.nome}{" "} */}
                {item.Ingresso_EventoIngresso?.TipoIngresso?.descricao}{" "}
                {item.Ingresso_EventoIngresso?.nome}
              </Text>
              <Text style={styles.label}>
                {item.Ingresso_EventoIngresso?.descricao}
              </Text>
              <Text style={styles.labelDataIngresso}>
                Válido a partir de{" "}
                {format(
                  parseISO(item.Ingresso_dataValidade?.toString()),
                  "dd/MM/yyyy"
                )}
              </Text>
              {renderTicketInputs(item)}
            </View>
          )}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </View>
      {modalVisible && (
        <ModalResumoIngresso
          step={2}
          RegistroTransacao={registroTransacao}
          IngressoTransacao={registrosIngressoTransacao}
        />
      )}
    </PublicShopLayout>
  );
}

type IngressoLinhaResumo = IngressoTransacao & {
  qtde: number;
  precoOriginal?: number | null;
  taxaServicoOriginal?: number | null;
};

/** Valor da linha no resumo (preço + taxa por unidade, antes do desconto de cupom quando houver). */
function valorLinhaResumoComTaxa(item: IngressoLinhaResumo): string {
  const precoUnit =
    item.precoOriginal != null && item.precoOriginal !== undefined
      ? Number(item.precoOriginal)
      : Number(item.preco ?? 0);
  const taxaUnit =
    item.taxaServicoOriginal != null && item.taxaServicoOriginal !== undefined
      ? Number(item.taxaServicoOriginal)
      : Number(item.taxaServico ?? 0);
  return (item.qtde * (precoUnit + taxaUnit)).toFixed(2);
}

const styles = StyleSheet.create({
  label: {
    color: colors.zinc,
    marginBottom: 4,
  },
  labelDataIngresso: {
    color: colors.red,
    marginBottom: 4,
  },
  labelData: {
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
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
  labelSucesso: {
    color: publicTheme.success,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  inputCard: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
});
