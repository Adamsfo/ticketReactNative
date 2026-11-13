import React, { useCallback, useState } from "react";
import {
  Text,
  Platform,
  Dimensions,
  View,
  FlatList,
  Image,
} from "react-native";
import colors from "@/src/constants/colors";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";
import { checkoutScreenStyles as cs } from "@/src/components/public/checkoutScreenStyles";
import {
  Evento,
  EventoIngresso,
  IngressoTransacao,
  QueryParams,
  Transacao,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { useHospedagem } from "@/src/contexts_/HospedagemContext";
import { useResumoPagamentoHospedagem } from "@/src/lib/resumoPagamentoHospedagem";
import ResumoPagamentoHospedagem from "@/src/components/ResumoPagamentoHospedagem";
import { initMercadoPago } from "@mercadopago/sdk-react";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";
import SimularPagamentoDev from "@/src/components/SimularPagamentoDev";
import {
  extrairIdTransacao,
  resolverRegistroTransacao,
} from "@/src/lib/resolverTransacao";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const route = useRoute();
  const { state } = useCart();
  const { state: hospedagemState } = useHospedagem();
  const {
    idEvento,
    registroTransacao: registroTransacaoParam,
    tipoCompra,
    resumoHospedagemBootstrap,
  } = route.params as {
    idEvento: number;
    registroTransacao: Transacao | number;
    tipoCompra?: string;
    resumoHospedagemBootstrap?: import("@/src/lib/resumoPagamentoHospedagem").ResumoPagamentoHospedagemData;
  };
  const registroTransacao = resolverRegistroTransacao(
    registroTransacaoParam,
    state.transacao,
  );
  const idTransacaoAtual = extrairIdTransacao(
    registroTransacaoParam,
    state.transacao,
  );
  const { isHospedagem, resumo: resumoHospedagem } = useResumoPagamentoHospedagem({
    tipoCompra,
    idEvento,
    registroTransacao,
    reserva: hospedagemState.reserva,
    resumoBootstrap: resumoHospedagemBootstrap ?? null,
  });
  const [registrosIngressoTransacao, setRegistrosIngressoTransacao] = useState<
    IngressoTransacao[]
  >([]);

  //Jango
  // initMercadoPago(process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "", {
  //   locale: "pt-BR",
  // });

  initMercadoPago(process.env.EXPO_PUBLIC_MP_PUBLIC_KEY || "", {
    locale: "pt-BR",
  });

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

  const getRegistros = async (idEvento: number) => {
    if (idEvento > 0) {
      const response = await apiGeral.getResourceById<Evento>(
        endpointApi,
        idEvento
      );

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data as Evento);

      if (!isHospedagem) {
        getIngressoTransacao({
          filters: { idTransacao: state.transacao?.id },
        });
      }
    }
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

  // const getRegistrosIngressos = async (params: QueryParams) => {
  //   const response = await apiGeral.getResource<EventoIngresso>(
  //     endpointApiIngressos,
  //     { ...params, pageSize: 200 }
  //   );
  //   const registrosData = response.data ?? [];

  //   setRegistrosEventoIngressos(registrosData);
  // };

  useFocusEffect(
    useCallback(() => {
      console.log("useFocusEffect", idEvento);
      if (idEvento > 0) {
        getRegistros(idEvento);
      }
    }, [idEvento, isHospedagem])
  );

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
          {isHospedagem ? (
            <StepIndicatorHospedagem currentStep={3} variant="public" />
          ) : (
            <StepIndicator currentStep={3} variant="public" />
          )}
        </View>
        <Text style={cs.screenTitle}>Pagamento</Text>

        <FlatList
          data={registroTransacao ? [registroTransacao] : []}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <PublicShopSection noPadding style={cs.eventHero}>
                <View
                  style={
                    isHospedagem
                      ? cs.eventHeroRowHospedagem
                      : cs.eventHeroRow
                  }
                >
                  <Image
                    source={{
                      uri: api.getBaseApi() + "/uploads/" + formData.imagem,
                    }}
                    style={cs.imagem}
                  />
                  <Text
                    style={
                      isHospedagem
                        ? cs.tituloEventoHospedagem
                        : cs.tituloEvento
                    }
                    numberOfLines={isHospedagem ? 1 : undefined}
                  >
                    {formData.nome}
                  </Text>
                </View>
              </PublicShopSection>

              <PublicShopSection title="Resumo financeiro">
                {isHospedagem && resumoHospedagem ? (
                  <ResumoPagamentoHospedagem
                    resumo={resumoHospedagem}
                    ocultarSubtotalETaxa
                    mostrarResumoFinanceiro
                    ocultarTaxasAdicionaisETaxaServico
                  />
                ) : (
                  <>
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
                            <Text style={{ fontSize: 16 }}>
                              Desconto do cupom
                            </Text>
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
                  </>
                )}
              </PublicShopSection>

              <PublicShopSection title="Forma de pagamento">
                <CheckoutMercadoPago />
                <SimularPagamentoDev
                  idTransacao={idTransacaoAtual ?? registroTransacao?.id}
                  tipoCompra={tipoCompra}
                />
              </PublicShopSection>
            </View>
          )}
          renderItem={() => null}
          ListFooterComponent={<View style={{ height: 48 }} />}
        />
      </View>
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

