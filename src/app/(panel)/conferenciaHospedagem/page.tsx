import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import colors from "@/src/constants/colors";
import PublicShopLayout from "@/src/components/public/PublicShopLayout";
import PublicShopSection from "@/src/components/public/PublicShopSection";
import { checkoutScreenStyles as cs } from "@/src/components/public/checkoutScreenStyles";
import { publicTheme } from "@/src/constants/publicTheme";
import { api } from "@/src/lib/api";
import { Evento, Transacao } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import ModalMsg from "@/src/components/ModalMsg";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useCart } from "@/src/contexts_/CartContext";
import {
  chaveSuitesHospedagem,
  useHospedagem,
} from "@/src/contexts_/HospedagemContext";
import { checkoutReserva } from "@/src/lib/reservaSuite";
import {
  criarHospedesIniciais,
  calcularIdadeEmAnos,
  formatarIdadeAnos,
  IDADE_MAXIMA_CRIANCA_HOSPEDAGEM,
  MSG_CRIANCA_ACIMA_IDADE,
  HospedesSuiteForm,
  hospedesSuiteParaCheckout,
  validarHospedes,
} from "@/src/lib/hospedagemHospedes";
import { useFocusEffect } from "expo-router";
import AceitePoliticaHospedagem from "@/src/components/AceitePoliticaHospedagem";

const { width } = Dimensions.get("window");

export default function ConferenciaHospedagemPage() {
  const endpointApi = "/evento";
  const route = useRoute();
  const navigation = useNavigation() as any;
  const { idEvento } = route.params as { idEvento: number };
  const { user, isPDV } = useAuth();
  const { dispatch: dispatchCart, state: cartState } = useCart();
  const { state, dispatch } = useHospedagem();
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
  const [hospedes, setHospedes] = useState<HospedesSuiteForm[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [visibleMsg, setVisibleMsg] = useState(false);
  const [msgApi, setMsgApi] = useState("");
  const [aceitePolitica, setAceitePolitica] = useState(false);

  const chaveSuitesAtual = chaveSuitesHospedagem(state.reserva?.itens);

  const getRegistros = async (eventoId: number) => {
    if (eventoId > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, eventoId);
      const data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      setFormData(data);
    }
  };

  useEffect(() => {
    if (!state.reserva || state.reserva.itens.length === 0) {
      // Sem reserva atual: não usar navigation.replace (não existe neste navigator).
      // A tela já renderiza null; o Voltar/outra tela usa navigation.navigate.
      return;
    }
    getRegistros(idEvento);
  }, [idEvento, state.reserva]);

  // Fonte única: suítes da reserva ATUAL (só recria form quando a composição das suítes muda)
  useEffect(() => {
    if (!state.reserva?.itens?.length) {
      setHospedes([]);
      setErrors({});
      return;
    }

    const suitesAtuais = criarHospedesIniciais(state.reserva.itens);
    setHospedes(suitesAtuais);
    setErrors({});

    console.log(
      "ID TRANSAÇÃO HOSPEDAGEM ATUAL:",
      state.idTransacaoHospedagem ?? cartState.transacao?.id ?? null,
    );
    console.log(
      "ID RESERVA HOSPEDAGEM ATUAL:",
      state.idReservaHospedagem ?? null,
    );
    console.log("SUÍTES DA CONFERÊNCIA:", suitesAtuais);
  }, [chaveSuitesAtual]);

  useFocusEffect(
    useCallback(() => {
      if (!state.reserva?.itens?.length) {
        return;
      }

      const chaveReserva = chaveSuitesHospedagem(state.reserva.itens);
      setHospedes((prev) => {
        const chaveLocal = prev
          .map(
            (suite) =>
              `${suite.idEventoSuite}:${suite.nomeSuite}:${suite.adultos.length}:${suite.criancas.length}`,
          )
          .join("|");

        if (chaveLocal === chaveReserva) {
          console.log(
            "ID TRANSAÇÃO HOSPEDAGEM ATUAL:",
            state.idTransacaoHospedagem ?? cartState.transacao?.id ?? null,
          );
          console.log(
            "ID RESERVA HOSPEDAGEM ATUAL:",
            state.idReservaHospedagem ?? null,
          );
          console.log("SUÍTES DA CONFERÊNCIA:", prev);
          return prev;
        }

        const suitesAtuais = criarHospedesIniciais(state.reserva!.itens);
        console.log(
          "ID TRANSAÇÃO HOSPEDAGEM ATUAL:",
          state.idTransacaoHospedagem ?? cartState.transacao?.id ?? null,
        );
        console.log(
          "ID RESERVA HOSPEDAGEM ATUAL:",
          state.idReservaHospedagem ?? null,
        );
        console.log("SUÍTES DA CONFERÊNCIA:", suitesAtuais);
        return suitesAtuais;
      });
      setErrors({});
    }, [
      chaveSuitesAtual,
      state.reserva,
      state.idReservaHospedagem,
      state.idTransacaoHospedagem,
      cartState.transacao?.id,
    ]),
  );

  const atualizarAdulto = (
    idEventoSuite: number,
    ordem: number,
    nomeCompleto: string,
  ) => {
    setHospedes((prev) =>
      prev.map((suite) =>
        suite.idEventoSuite === idEventoSuite
          ? {
              ...suite,
              adultos: suite.adultos.map((adulto) =>
                adulto.ordem === ordem ? { ...adulto, nomeCompleto } : adulto,
              ),
            }
          : suite,
      ),
    );
  };

  const atualizarCrianca = (
    idEventoSuite: number,
    ordem: number,
    field: "nomeCompleto" | "dataNascimento",
    value: string | Date,
  ) => {
    setHospedes((prev) =>
      prev.map((suite) =>
        suite.idEventoSuite === idEventoSuite
          ? {
              ...suite,
              criancas: suite.criancas.map((crianca) =>
                crianca.ordem === ordem
                  ? {
                      ...crianca,
                      [field]:
                        field === "dataNascimento" ? (value as Date) : value,
                    }
                  : crianca,
              ),
            }
          : suite,
      ),
    );

    if (field === "dataNascimento" && value instanceof Date) {
      const idade = calcularIdadeEmAnos(value);
      const key = `${idEventoSuite}-crianca-${ordem}-nasc`;
      setErrors((prev) => {
        const next = { ...prev };
        if (idade > IDADE_MAXIMA_CRIANCA_HOSPEDAGEM) {
          next[key] = MSG_CRIANCA_ACIMA_IDADE;
        } else {
          delete next[key];
        }
        return next;
      });
    }
  };

  const handleConfirmarCheckout = useCallback(async () => {
    if (!state.reserva) return;

    const validationErrors = validarHospedes(hospedes);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setMsgApi("Preencha todos os dados dos hóspedes para continuar.");
      setVisibleMsg(true);
      return;
    }

    const idUsuario = isPDV
      ? state.reserva.usuarioVendaPdvId
      : user?.id;
    if (!idUsuario) {
      setMsgApi("Faça login para continuar.");
      setVisibleMsg(true);
      return;
    }

    if (!isPDV && !aceitePolitica) {
      setMsgApi(
        "É necessário aceitar a Política de Cancelamento, Remarcação e Alteração de Hóspedes.",
      );
      setVisibleMsg(true);
      return;
    }

    dispatch({ type: "SET_HOSPEDES", hospedes });
    setCheckoutLoading(true);

    try {
      const checkoutResp = await checkoutReserva({
        idEvento: state.reserva.idEvento,
        idUsuario,
        checkin: state.reserva.checkin,
        checkout: state.reserva.checkout,
        ...(isPDV
          ? {}
          : {
              contratacaoCliente: true,
              aceitePoliticaHospedagem: aceitePolitica,
            }),
        suites: state.reserva.itens.map((item) => {
          const suiteHospedes = hospedes.find(
            (suite) => suite.idEventoSuite === item.idEventoSuite,
          );

          return {
            idEventoSuite: item.idEventoSuite,
            adultos: item.adultos,
            criancas: item.criancas,
            hospedes: suiteHospedes
              ? hospedesSuiteParaCheckout(suiteHospedes)
              : [],
          };
        }),
      });

      const checkoutBody = checkoutResp.data as {
        data?: {
          transacao?: Transacao;
          hospedagem?: { id?: number };
        };
        transacao?: Transacao;
        hospedagem?: { id?: number };
      };

      // Capturar em variáveis locais ANTES de qualquer limpeza/navegação
      const transacaoRaw =
        checkoutBody?.data?.transacao ?? checkoutBody?.transacao;
      const idReservaHospedagem = Number(
        checkoutBody?.data?.hospedagem?.id ??
          checkoutBody?.hospedagem?.id ??
          0,
      );
      const idEventoPagamento = Number(state.reserva.idEvento);
      const idTransacaoPagamento = Number(transacaoRaw?.id);
      const tipoCompra = "hospedagem" as const;

      console.log("ID EVENTO PAGAMENTO:", idEventoPagamento);
      console.log("ID TRANSACAO PAGAMENTO:", idTransacaoPagamento);
      console.log("TIPO ID TRANSACAO:", typeof idTransacaoPagamento);

      if (
        !checkoutResp.success ||
        !idEventoPagamento ||
        !Number.isFinite(idTransacaoPagamento) ||
        idTransacaoPagamento <= 0
      ) {
        setMsgApi(
          (checkoutResp as { message?: string }).message ||
            "Erro ao confirmar reserva.",
        );
        setVisibleMsg(true);
        return;
      }

      const transacao: Transacao = {
        ...(transacaoRaw as Transacao),
        id: idTransacaoPagamento,
      };

      dispatchCart({ type: "ADD_TRANSACAO", transacao });

      if (idReservaHospedagem > 0) {
        dispatch({
          type: "SET_CHECKOUT_IDS",
          idReservaHospedagem,
          idTransacaoHospedagem: idTransacaoPagamento,
        });
      }

      console.log("ID TRANSAÇÃO HOSPEDAGEM ATUAL:", idTransacaoPagamento);
      console.log(
        "ID RESERVA HOSPEDAGEM ATUAL:",
        idReservaHospedagem > 0 ? idReservaHospedagem : null,
      );
      console.log(
        "SUÍTES DA CONFERÊNCIA:",
        state.reserva.itens.map((item) => ({
          idEventoSuite: item.idEventoSuite,
          nomeSuite: item.nomeSuite,
          adultos: item.adultos,
          criancas: item.criancas,
        })),
      );

      // Enviar somente o ID numérico (nunca o objeto)
      if (isPDV) {
        navigation.navigate("pagamentopdv", {
          idEvento: idEventoPagamento,
          registroTransacao: idTransacaoPagamento,
          tipoCompra,
        });
      } else {
        navigation.navigate("pagamento", {
          idEvento: idEventoPagamento,
          registroTransacao: idTransacaoPagamento,
          tipoCompra,
        });
      }
    } catch {
      setMsgApi("Erro ao confirmar reserva.");
      setVisibleMsg(true);
    } finally {
      setCheckoutLoading(false);
    }
  }, [
    dispatch,
    dispatchCart,
    hospedes,
    isPDV,
    navigation,
    state.reserva,
    user?.id,
    aceitePolitica,
  ]);

  if (!state.reserva) {
    return null;
  }

  return (
    <PublicShopLayout>
      <View style={cs.page}>
        <View style={cs.areaStep}>
          <StepIndicatorHospedagem currentStep={2} variant="public" />
        </View>
        <Text style={cs.screenTitle}>Conferência da hospedagem</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {formData.imagem ? (
            <PublicShopSection noPadding style={cs.eventHero}>
              <View style={cs.eventHeroRowHospedagem}>
                <Image
                  source={{
                    uri: api.getBaseApi() + "/uploads/" + formData.imagem,
                  }}
                  style={cs.imagem}
                />
                <Text style={cs.tituloEventoHospedagem} numberOfLines={2}>
                  {formData.nome}
                </Text>
              </View>
            </PublicShopSection>
          ) : null}

          <PublicShopSection>
            <Text style={styles.introText}>
              Informe os dados de cada hóspede conforme a reserva. As pulseiras
              serão emitidas somente para as pessoas cadastradas abaixo.
            </Text>
          </PublicShopSection>

          {hospedes
            .filter((suite) =>
              state.reserva?.itens.some(
                (item) => item.idEventoSuite === suite.idEventoSuite,
              ),
            )
            .map((suite) => (
              <PublicShopSection key={suite.idEventoSuite} title={suite.nomeSuite}>
                {suite.adultos.map((adulto) => (
                  <View
                    key={`adulto-${suite.idEventoSuite}-${adulto.ordem}`}
                    style={styles.hospedeCard}
                  >
                    <Text style={styles.hospedeTitulo}>
                      Adulto {adulto.ordem}
                    </Text>
                    <Text style={styles.label}>Nome completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nome completo do adulto"
                      value={adulto.nomeCompleto}
                      onChangeText={(text) =>
                        atualizarAdulto(suite.idEventoSuite, adulto.ordem, text)
                      }
                    />
                    {errors[
                      `${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`
                    ] ? (
                      <Text style={styles.labelError}>
                        {
                          errors[
                            `${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`
                          ]
                        }
                      </Text>
                    ) : null}
                  </View>
                ))}

                {suite.criancas.map((crianca) => (
                  <View
                    key={`crianca-${suite.idEventoSuite}-${crianca.ordem}`}
                    style={styles.hospedeCard}
                  >
                    <Text style={styles.hospedeTitulo}>
                      Criança {crianca.ordem}
                    </Text>
                    <Text style={styles.label}>Nome completo</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nome completo da criança"
                      value={crianca.nomeCompleto}
                      onChangeText={(text) =>
                        atualizarCrianca(
                          suite.idEventoSuite,
                          crianca.ordem,
                          "nomeCompleto",
                          text,
                        )
                      }
                    />
                    {errors[
                      `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                    ] ? (
                      <Text style={styles.labelError}>
                        {
                          errors[
                            `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                          ]
                        }
                      </Text>
                    ) : null}

                    <Text style={styles.label}>Data de nascimento</Text>
                    <View style={styles.dateRow}>
                      <View
                        style={[
                          styles.datePickerWrap,
                          errors[
                            `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                          ]
                            ? styles.datePickerWrapInvalid
                            : null,
                        ]}
                      >
                        <DatePickerComponente
                          value={crianca.dataNascimento ?? new Date()}
                          onChange={(date) =>
                            atualizarCrianca(
                              suite.idEventoSuite,
                              crianca.ordem,
                              "dataNascimento",
                              date,
                            )
                          }
                        />
                      </View>
                      {crianca.dataNascimento ? (
                        <Text style={styles.idadeTexto}>
                          {formatarIdadeAnos(
                            calcularIdadeEmAnos(crianca.dataNascimento),
                          )}
                        </Text>
                      ) : null}
                    </View>
                    {errors[
                      `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                    ] ? (
                      <Text style={styles.labelError}>
                        {
                          errors[
                            `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                          ]
                        }
                      </Text>
                    ) : null}
                  </View>
                ))}
              </PublicShopSection>
            ))}

          {!isPDV ? (
            <PublicShopSection>
              <AceitePoliticaHospedagem
                value={aceitePolitica}
                onValueChange={setAceitePolitica}
              />
            </PublicShopSection>
          ) : null}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={() =>
              navigation.navigate("pousada", { id: state.reserva!.idEvento })
            }
          >
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonSave]}
            onPress={handleConfirmarCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.laranjado}
                style={{ marginRight: 8 }}
              />
            ) : null}
            <Text style={styles.buttonText}>Próximo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={visibleMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setVisibleMsg(false)}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setVisibleMsg(false)}
        >
          <ModalMsg onClose={() => setVisibleMsg(false)} msg={msgApi} />
        </TouchableOpacity>
      </Modal>
    </PublicShopLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginBottom: 20,
  },
  areaStep: {
    marginBottom: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
    textAlign: "center",
  },
  scroll: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  introText: {
    fontSize: 14,
    color: publicTheme.textSecondary,
    lineHeight: 22,
  },
  hospedeCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: publicTheme.border,
  },
  hospedeTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: publicTheme.textPrimary,
    marginBottom: 8,
  },
  label: {
    color: publicTheme.textPrimary,
    marginBottom: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: publicTheme.border,
    borderRadius: publicTheme.radiusSm,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: publicTheme.surface,
    color: publicTheme.textPrimary,
  },
  datePickerWrap: {
    flex: 1,
    marginBottom: 0,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  datePickerWrapInvalid: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 8,
    padding: 2,
  },
  idadeTexto: {
    fontSize: 14,
    color: publicTheme.textSecondary,
    fontWeight: "600",
    minWidth: 60,
  },
  labelError: {
    color: colors.red,
    marginBottom: 8,
    fontSize: 13,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    backgroundColor: "transparent",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: publicTheme.radiusMd,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonClose: {
    backgroundColor: publicTheme.border,
  },
  buttonSave: {
    backgroundColor: publicTheme.accent,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});
