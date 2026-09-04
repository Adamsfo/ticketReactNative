import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "expo-router";
import { parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import StepIndicatorHospedagem from "@/src/components/StepIndicatorHospedagem";
import {
  getReservaPublicaPorToken,
  putHospedesReservaPublicaPorToken,
} from "@/src/lib/hospedagemAdmin";
import {
  corStatusReserva,
  labelStatusReserva,
} from "@/src/lib/hospedagemAdmin";
import {
  calcularIdadeEmAnos,
  formatarIdadeAnos,
  hospedesFormParaSalvarPublico,
  hospedesReservaPublicaParaForm,
  HospedesSuiteForm,
  IDADE_MAXIMA_CRIANCA_HOSPEDAGEM,
  MSG_CRIANCA_ACIMA_IDADE,
  ReservaPublicaSuiteApi,
  validarHospedes,
} from "@/src/lib/hospedagemHospedes";
import { useAuth } from "@/src/contexts_/AuthContext";
import { useCart } from "@/src/contexts_/CartContext";
import { apiAuth } from "@/src/lib/auth";
import { Transacao } from "@/src/types/geral";

const { width } = Dimensions.get("window");

function formatDateTime(iso: string): string {
  try {
    return formatInTimeZone(
      parseISO(String(iso)),
      "America/Cuiaba",
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return String(iso);
  }
}

/**
 * Página pública /reserva/TOKEN — resume a reserva, magic login e pagamento.
 */
export default function ReservaPublicaPage() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { user, setAuth } = useAuth();
  const { dispatch: dispatchCart } = useCart();
  const params = (route.params || {}) as { token?: string };

  const tokenFromUrl = (() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const match = window.location.pathname.match(/\/reserva\/([^/?#]+)/i);
      if (match?.[1]) return match[1];
    }
    return "";
  })();

  const token = String(params.token || tokenFromUrl || "").trim();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [conflitoConta, setConflitoConta] = useState<string | null>(null);
  const [avisoAutenticacao, setAvisoAutenticacao] = useState<string | null>(
    null,
  );
  const [magicLoginOk, setMagicLoginOk] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [hospedes, setHospedes] = useState<HospedesSuiteForm[]>([]);
  const [hospedesErrors, setHospedesErrors] = useState<Record<string, string>>(
    {},
  );
  const [salvandoHospedes, setSalvandoHospedes] = useState(false);

  const userRef = useRef(user);
  const setAuthRef = useRef(setAuth);
  userRef.current = user;
  setAuthRef.current = setAuth;

  const carregamentoEmAndamentoRef = useRef(false);
  const magicLoginTentadoParaTokenRef = useRef<string | null>(null);
  const hospedesInicializadosParaTokenRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setErro("Link inválido.");
        setData(null);
        setLoading(false);
        return;
      }

      if (carregamentoEmAndamentoRef.current) {
        return;
      }

      let ativo = true;
      carregamentoEmAndamentoRef.current = true;

      if (hospedesInicializadosParaTokenRef.current !== token) {
        magicLoginTentadoParaTokenRef.current = null;
      }

      const tentarMagicLogin = async (reservaData: any) => {
        setConflitoConta(null);
        setAvisoAutenticacao(null);

        const idUsuarioReserva = Number(reservaData?.cliente?.idUsuario);
        const usuarioAtual = userRef.current?.id
          ? userRef.current
          : await apiAuth.carregarUsuarioDaSessaoArmazenada();

        if (
          usuarioAtual?.id &&
          Number.isFinite(idUsuarioReserva) &&
          idUsuarioReserva > 0 &&
          Number(usuarioAtual.id) !== idUsuarioReserva
        ) {
          setConflitoConta(
            "Este link pertence a outra conta. Para pagar com segurança, saia da conta atual e abra o link novamente, ou entre com a conta correta.",
          );
          setMagicLoginOk(false);
          return;
        }

        if (
          usuarioAtual?.id &&
          Number.isFinite(idUsuarioReserva) &&
          idUsuarioReserva > 0 &&
          Number(usuarioAtual.id) === idUsuarioReserva
        ) {
          if (!userRef.current?.id) {
            setAuthRef.current(usuarioAtual);
          }
          setMagicLoginOk(true);
          return;
        }

        if (magicLoginTentadoParaTokenRef.current === token) {
          const usuarioSessao =
            await apiAuth.carregarUsuarioDaSessaoArmazenada();
          if (
            usuarioSessao?.id &&
            Number.isFinite(idUsuarioReserva) &&
            idUsuarioReserva > 0 &&
            Number(usuarioSessao.id) === idUsuarioReserva
          ) {
            if (!userRef.current?.id) {
              setAuthRef.current(usuarioSessao);
            }
            setMagicLoginOk(true);
          }
          return;
        }

        magicLoginTentadoParaTokenRef.current = token;

        const authResp = await apiAuth.autenticarReservaPublica(token);
        if (!authResp.success) {
          setAvisoAutenticacao(
            authResp.message ||
              "Não foi possível iniciar sua sessão para pagamento.",
          );
          setMagicLoginOk(false);
          return;
        }

        const usuario = await apiAuth.carregarUsuarioDaSessaoArmazenada();
        if (!usuario?.id || !usuario.ativo) {
          setAvisoAutenticacao(
            "Não foi possível recuperar sua conta para pagamento.",
          );
          setMagicLoginOk(false);
          return;
        }

        setAuthRef.current(usuario);
        setMagicLoginOk(true);
      };

      (async () => {
        setLoading(true);
        setErro(null);
        setConflitoConta(null);
        setAvisoAutenticacao(null);

        try {
          const resp = await getReservaPublicaPorToken(token);
          if (!ativo) {
            return;
          }

          if (!resp.success || !resp.data) {
            setErro(resp.message || "Reserva não encontrada.");
            setData(null);
            return;
          }

          setData(resp.data);

          if (hospedesInicializadosParaTokenRef.current !== token) {
            setHospedes(
              hospedesReservaPublicaParaForm(
                (resp.data.suites || []) as ReservaPublicaSuiteApi[],
              ),
            );
            setHospedesErrors({});
            hospedesInicializadosParaTokenRef.current = token;
          }

          await tentarMagicLogin(resp.data);
        } catch {
          if (!ativo) {
            return;
          }
          setErro("Erro ao carregar a reserva.");
          setData(null);
        } finally {
          if (ativo) {
            setLoading(false);
          }
          carregamentoEmAndamentoRef.current = false;
        }
      })();

      return () => {
        ativo = false;
      };
    }, [token]),
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
      setHospedesErrors((prev) => {
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

  const handlePagar = async () => {
    if (conflitoConta || !magicLoginOk || salvandoHospedes) {
      return;
    }
    if (data?.expirada || data?.status === "Expirada" || !data?.podePagar) {
      return;
    }

    const validationErrors = validarHospedes(hospedes);
    setHospedesErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSalvandoHospedes(true);
    try {
      const saveResp = await putHospedesReservaPublicaPorToken(
        token,
        hospedesFormParaSalvarPublico(hospedes),
      );
      if (!saveResp.success) {
        setErro(saveResp.message || "Erro ao salvar os dados dos hóspedes.");
        return;
      }
    } catch {
      setErro("Erro ao salvar os dados dos hóspedes.");
      return;
    } finally {
      setSalvandoHospedes(false);
    }

    const registroApi = data?.pagamento?.registroTransacao;
    const idTransacao = Number(registroApi?.id);
    if (!Number.isFinite(idTransacao) || idTransacao <= 0) {
      return;
    }
    if (!data?.pagamento?.idEvento) {
      return;
    }

    if (registroApi && typeof registroApi === "object") {
      const transacao: Transacao = {
        ...(registroApi as Transacao),
        id: idTransacao,
      };
      dispatchCart({ type: "ADD_TRANSACAO", transacao });
    }

    navigation.navigate("pagamento", {
      idEvento: Number(data.pagamento.idEvento),
      registroTransacao: idTransacao,
      tipoCompra: "hospedagem",
    });
  };

  const status = data?.status || "AguardandoPagamento";
  const cor = corStatusReserva(status);
  const podeIrPagamento =
    !!data?.podePagar && magicLoginOk && !conflitoConta && !avisoAutenticacao;

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1 }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <StepIndicatorHospedagem currentStep={3} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.azul} />
              <Text style={styles.centerText}>Carregando reserva...</Text>
            </View>
          ) : erro || !data ? (
            <View style={styles.card}>
              <Text style={styles.erro}>{erro || "Reserva não encontrada."}</Text>
            </View>
          ) : (
            <>
              {conflitoConta ? (
                <View style={styles.card}>
                  <Text style={styles.erro}>{conflitoConta}</Text>
                </View>
              ) : null}
              {avisoAutenticacao ? (
                <View style={styles.card}>
                  <Text style={styles.erro}>{avisoAutenticacao}</Text>
                </View>
              ) : null}

              <View style={styles.card}>
                <Text style={styles.titulo}>
                  {data.evento?.nome || "Pousada"}
                </Text>
                <View style={[styles.badge, { backgroundColor: cor }]}>
                  <Text style={styles.badgeText}>
                    {labelStatusReserva(status)}
                  </Text>
                </View>
                <Text style={styles.label}>Cliente</Text>
                <Text style={styles.valor}>{data.cliente?.nome || "—"}</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Período</Text>
                <Text style={styles.label}>Check-in</Text>
                <Text style={styles.valor}>
                  {formatDateTime(String(data.periodo?.checkin))}
                </Text>
                <Text style={[styles.label, { marginTop: 8 }]}>Check-out</Text>
                <Text style={styles.valor}>
                  {formatDateTime(String(data.periodo?.checkout))}
                </Text>
                <Text style={[styles.valor, { marginTop: 8 }]}>
                  {data.periodo?.noites}{" "}
                  {data.periodo?.noites === 1 ? "diária" : "diárias"}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Suíte e hóspedes</Text>
                {hospedes.map((suite) => (
                  <View
                    key={`suite-${suite.idReservaSuite ?? suite.idEventoSuite}`}
                    style={styles.suiteCard}
                  >
                    <Text style={styles.suiteTitulo}>{suite.nomeSuite}</Text>
                    <Text style={styles.meta}>
                      {suite.adultos.length} adulto(s)
                      {suite.criancas.length > 0
                        ? ` · ${suite.criancas.length} criança(s)`
                        : ""}
                    </Text>

                    {suite.adultos.map((adulto) => (
                      <View
                        key={`adulto-${suite.idEventoSuite}-${adulto.ordem}`}
                        style={styles.hospedeCard}
                      >
                        <Text style={styles.hospedeTitulo}>
                          Adulto {adulto.ordem}
                        </Text>
                        <Text style={styles.inputLabel}>Nome completo</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Nome completo do adulto"
                          value={adulto.nomeCompleto}
                          onChangeText={(text) =>
                            atualizarAdulto(
                              suite.idEventoSuite,
                              adulto.ordem,
                              text,
                            )
                          }
                        />
                        {hospedesErrors[
                          `${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`
                        ] ? (
                          <Text style={styles.labelError}>
                            {
                              hospedesErrors[
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
                        <Text style={styles.inputLabel}>Nome completo</Text>
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
                        {hospedesErrors[
                          `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                        ] ? (
                          <Text style={styles.labelError}>
                            {
                              hospedesErrors[
                                `${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`
                              ]
                            }
                          </Text>
                        ) : null}

                        <Text style={styles.inputLabel}>Data de nascimento</Text>
                        <View style={styles.dateRow}>
                          <View
                            style={[
                              styles.datePickerWrap,
                              hospedesErrors[
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
                        {hospedesErrors[
                          `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                        ] ? (
                          <Text style={styles.labelError}>
                            {
                              hospedesErrors[
                                `${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`
                              ]
                            }
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                ))}
                <Text style={styles.meta}>
                  Total: {data.hospedes?.adultos || 0} adulto(s)
                  {(data.hospedes?.criancas || 0) > 0
                    ? `, ${data.hospedes.criancas} criança(s)`
                    : ""}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.secao}>Valores</Text>
                <View style={styles.row}>
                  <Text style={styles.meta}>Valor da hospedagem</Text>
                  <Text style={styles.valor}>
                    {formatCurrency(Number(data.valores?.preco ?? 0))}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.meta}>Taxa de serviço</Text>
                  <Text style={styles.valor}>
                    {formatCurrency(Number(data.valores?.taxaServico ?? 0))}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Total</Text>
                  <Text style={[styles.valor, { color: colors.azul }]}>
                    {formatCurrency(Number(data.valores?.valorTotal ?? 0))}
                  </Text>
                </View>
              </View>

              {podeIrPagamento ? (
                <TouchableOpacity
                  style={[
                    styles.btnPri,
                    salvandoHospedes ? styles.btnPriDisabled : null,
                  ]}
                  onPress={handlePagar}
                  disabled={salvandoHospedes}
                >
                  {salvandoHospedes ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPriText}>Ir para o pagamento</Text>
                  )}
                </TouchableOpacity>
              ) : data.podePagar ? (
                <View style={styles.card}>
                  <Text style={styles.meta}>
                    {loading
                      ? "Preparando pagamento..."
                      : "Aguardando autenticação para prosseguir ao pagamento."}
                  </Text>
                </View>
              ) : (
                <View style={styles.card}>
                  {data.expirada || status === "Expirada" ? (
                    <>
                      <Text style={styles.expiradaTitulo}>
                        Esta reserva expirou por falta de pagamento.
                      </Text>
                      <Text style={[styles.meta, { marginTop: 8 }]}>
                        A suíte já foi liberada para novas reservas.
                      </Text>
                      <Text style={[styles.meta, { marginTop: 8 }]}>
                        Caso ainda tenha interesse, faça uma nova reserva.
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.meta}>
                      {status === "Confirmada"
                        ? "Esta reserva já foi confirmada."
                        : "Esta reserva não está disponível para pagamento."}
                    </Text>
                  )}
                </View>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginHorizontal: Platform.OS === "web" ? (width <= 1000 ? 8 : "10%") : 8,
  },
  scroll: { paddingBottom: 24 },
  center: { alignItems: "center", marginTop: 40, gap: 12 },
  centerText: { color: colors.cinza },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.azul,
    marginBottom: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  secao: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.cinza,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  label: { fontSize: 13, fontWeight: "700", color: colors.cinza },
  valor: { fontSize: 16, fontWeight: "600", color: "#222" },
  meta: { fontSize: 14, color: colors.cinza },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  erro: { color: colors.red, textAlign: "center" },
  expiradaTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.red,
    textAlign: "center",
  },
  btnPri: {
    marginTop: 16,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPriDisabled: {
    opacity: 0.7,
  },
  btnPriText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  suiteCard: {
    marginBottom: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  suiteTitulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.azul,
    marginBottom: 4,
  },
  hospedeCard: {
    marginTop: 10,
    marginBottom: 8,
  },
  hospedeTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 10,
  },
  datePickerWrap: {
    flex: 1,
  },
  datePickerWrapInvalid: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 8,
    padding: 2,
  },
  idadeTexto: {
    fontSize: 13,
    color: colors.cinza,
    fontWeight: "600",
    minWidth: 56,
  },
  labelError: {
    color: colors.red,
    fontSize: 12,
    marginBottom: 4,
  },
});
