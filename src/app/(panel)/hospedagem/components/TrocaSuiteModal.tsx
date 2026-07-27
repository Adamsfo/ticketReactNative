import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import {
  getSuitesDisponiveisTroca,
  postTrocarSuiteReserva,
  SuiteDisponivelTroca,
  SuitesDisponiveisTrocaData,
} from "@/src/lib/hospedagemAdmin";
import { formatDateTimeHospedagem } from "@/src/lib/hospedagemOperacao";
import { CORES_STATUS_OPERACIONAL } from "@/src/lib/hospedagemOperacao";
import { useHospedagemAdminRefresh } from "../contexts/HospedagemAdminRefreshContext";

const MOTIVOS_SUGESTAO = [
  "Upgrade",
  "Solicitação do cliente",
  "Manutenção",
  "Ar-condicionado",
  "Limpeza",
  "Outro",
] as const;

type Step = "atual" | "lista" | "confirmar";

type Props = {
  visible: boolean;
  idReservaHospedagem: number | null;
  idReservaSuite?: number | null;
  onClose: () => void;
  onSucesso?: () => void;
};

/**
 * Operação própria de Troca de Suíte (não é edição de reserva).
 * Disponibilidade exclusivamente via SuiteDisponibilidadeService (API).
 */
export default function TrocaSuiteModal({
  visible,
  idReservaHospedagem,
  idReservaSuite,
  onClose,
  onSucesso,
}: Props) {
  const { notifyOperacaoConcluida } = useHospedagemAdminRefresh();
  const [step, setStep] = useState<Step>("atual");
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [contexto, setContexto] = useState<SuitesDisponiveisTrocaData | null>(
    null,
  );
  const [selecionada, setSelecionada] = useState<SuiteDisponivelTroca | null>(
    null,
  );
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!visible || !idReservaHospedagem) {
      setStep("atual");
      setContexto(null);
      setSelecionada(null);
      setMotivo("");
      setErro(null);
      setLoading(false);
      setEnviando(false);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setErro(null);
    setStep("atual");
    setSelecionada(null);
    setMotivo("");

    getSuitesDisponiveisTroca(idReservaHospedagem, idReservaSuite)
      .then((resp) => {
        if (cancelado) return;
        if (resp.success && resp.data) {
          setContexto(resp.data);
        } else {
          setErro(
            resp.message || "Não foi possível carregar suítes disponíveis.",
          );
        }
      })
      .catch(() => {
        if (!cancelado) {
          setErro("Erro ao carregar suítes disponíveis para troca.");
        }
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [visible, idReservaHospedagem, idReservaSuite]);

  const periodoLabel = useMemo(() => {
    if (!contexto) return "";
    const ini = formatDateTimeHospedagem(contexto.checkin);
    const fim = formatDateTimeHospedagem(contexto.checkout);
    return `${ini}\n↓\n${fim}`;
  }, [contexto]);

  const confirmarTroca = async () => {
    if (!idReservaHospedagem || !contexto || !selecionada) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await postTrocarSuiteReserva(idReservaHospedagem, {
        idReservaSuite: contexto.idReservaSuite,
        idEventoSuiteDestino: selecionada.idEventoSuite,
        motivo: motivo.trim() || null,
      });
      if (!resp.success) {
        setErro(resp.message || "Não foi possível trocar a suíte.");
        return;
      }
      notifyOperacaoConcluida();
      onSucesso?.();
      onClose();
    } catch {
      setErro("Erro ao trocar a suíte.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => !enviando && onClose()}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => !enviando && onClose()}
      >
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.titulo}>Trocar Suíte</Text>
            <TouchableOpacity
              onPress={() => !enviando && onClose()}
              hitSlop={12}
              disabled={enviando}
            >
              <Feather name="x" size={22} color={colors.cinza} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.azul}
              style={{ marginVertical: 24 }}
            />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
              keyboardShouldPersistTaps="handled"
            >
              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              {step === "atual" && contexto ? (
                <View style={styles.bloco}>
                  <Text style={styles.label}>Suíte atual</Text>
                  <Text style={styles.valorDestaque}>
                    {contexto.suiteAtual.nome}
                  </Text>
                  <Text style={[styles.label, { marginTop: 14 }]}>
                    Responsável
                  </Text>
                  <Text style={styles.valor}>{contexto.responsavel}</Text>
                  <Text style={[styles.label, { marginTop: 14 }]}>Período</Text>
                  <Text style={styles.valor}>{periodoLabel}</Text>
                  <TouchableOpacity
                    style={styles.btnPrimario}
                    onPress={() => setStep("lista")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.btnPrimarioTexto}>
                      Ver suítes disponíveis
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {step === "lista" && contexto ? (
                <View style={styles.bloco}>
                  <Text style={styles.subtitulo}>
                    Selecione a nova suíte (somente disponíveis)
                  </Text>
                  {contexto.suites.length === 0 ? (
                    <Text style={styles.vazio}>
                      Nenhuma suíte disponível no período desta reserva.
                    </Text>
                  ) : (
                    contexto.suites.map((suite) => (
                      <View key={suite.idEventoSuite} style={styles.suiteRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suiteNome}>{suite.nome}</Text>
                          <Text style={styles.suiteLivre}>Livre</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.btnSelecionar}
                          onPress={() => {
                            setSelecionada(suite);
                            setStep("confirmar");
                          }}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.btnSelecionarTexto}>
                            Selecionar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <TouchableOpacity
                    style={styles.btnSecundario}
                    onPress={() => setStep("atual")}
                  >
                    <Text style={styles.btnSecundarioTexto}>Voltar</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {step === "confirmar" && contexto && selecionada ? (
                <View style={styles.bloco}>
                  <Text style={styles.subtitulo}>Trocar suíte?</Text>
                  <Text style={styles.label}>De</Text>
                  <Text style={styles.valorDestaque}>
                    {contexto.suiteAtual.nome}
                  </Text>
                  <Text style={styles.seta}>↓</Text>
                  <Text style={styles.label}>Para</Text>
                  <Text style={styles.valorDestaque}>{selecionada.nome}</Text>

                  <Text style={[styles.label, { marginTop: 16 }]}>Motivo</Text>
                  <Text style={styles.hint}>(opcional)</Text>
                  <View style={styles.chips}>
                    {MOTIVOS_SUGESTAO.map((m) => {
                      const ativo = motivo === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.chip, ativo && styles.chipAtivo]}
                          onPress={() => setMotivo(m)}
                        >
                          <Text
                            style={[
                              styles.chipTexto,
                              ativo && styles.chipTextoAtivo,
                            ]}
                          >
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Descreva o motivo (opcional)"
                    placeholderTextColor={colors.cinza}
                    value={motivo}
                    onChangeText={setMotivo}
                    editable={!enviando}
                  />

                  <View style={styles.confirmRow}>
                    <TouchableOpacity
                      style={styles.btnSecundarioFlex}
                      onPress={() => setStep("lista")}
                      disabled={enviando}
                    >
                      <Text style={styles.btnSecundarioTexto}>Voltar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.btnPrimarioFlex,
                        enviando && styles.btnDesabilitado,
                      ]}
                      onPress={confirmarTroca}
                      disabled={enviando}
                      activeOpacity={0.85}
                    >
                      {enviando ? (
                        <ActivityIndicator color={colors.branco} />
                      ) : (
                        <Text style={styles.btnPrimarioTexto}>Confirmar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.branco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === "ios" ? 32 : 24,
    paddingTop: 8,
    maxHeight: "92%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titulo: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.cinza,
  },
  scroll: {
    paddingBottom: 12,
  },
  bloco: {
    paddingTop: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.cinza,
    opacity: 0.7,
    textTransform: "uppercase",
  },
  valor: {
    fontSize: 16,
    color: colors.cinza,
    marginTop: 4,
    lineHeight: 22,
  },
  valorDestaque: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.cinza,
    marginTop: 4,
  },
  seta: {
    fontSize: 20,
    color: colors.cinza,
    marginVertical: 8,
    textAlign: "center",
  },
  subtitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
    marginBottom: 12,
  },
  suiteRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 10,
  },
  suiteNome: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  suiteLivre: {
    fontSize: 13,
    color: CORES_STATUS_OPERACIONAL.livre,
    marginTop: 2,
    fontWeight: "600",
  },
  btnSelecionar: {
    backgroundColor: colors.azul,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSelecionarTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 13,
  },
  btnPrimario: {
    marginTop: 20,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimarioFlex: {
    flex: 1,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnPrimarioTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 15,
  },
  btnSecundario: {
    marginTop: 14,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnSecundarioFlex: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnSecundarioTexto: {
    color: colors.cinza,
    fontWeight: "600",
    fontSize: 15,
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  chipAtivo: {
    backgroundColor: colors.azul,
    borderColor: colors.azul,
  },
  chipTexto: {
    fontSize: 12,
    color: colors.cinza,
    fontWeight: "600",
  },
  chipTextoAtivo: {
    color: colors.branco,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    color: colors.cinza,
  },
  hint: {
    fontSize: 12,
    color: colors.cinza,
    opacity: 0.65,
    marginTop: 2,
  },
  vazio: {
    fontSize: 14,
    color: colors.cinza,
    opacity: 0.8,
    marginBottom: 8,
  },
  erro: {
    color: colors.red,
    fontSize: 13,
    marginBottom: 10,
  },
  btnDesabilitado: {
    opacity: 0.55,
  },
});
