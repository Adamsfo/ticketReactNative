import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  deleteServicoSuiteReserva,
  patchServicoSuiteReserva,
  PermissoesServicosSuite,
  postServicoSuiteReserva,
  ReservaAdminDetalhe,
  ReservaSuiteServicoAdicional,
} from "@/src/lib/hospedagemAdmin";
import {
  digitosCentavosParaNumero,
  digitosParaExibicaoMoeda,
  valorParaDigitosCentavos,
} from "@/src/lib/mascaraMoeda";

type SuiteComServicos = ReservaAdminDetalhe["suites"][number];

type Props = {
  idReservaHospedagem: number;
  suites: SuiteComServicos[];
  permissoes?: PermissoesServicosSuite | null;
  valorTotalReserva: number;
  onDetalheAtualizado: (detalhe: ReservaAdminDetalhe) => void;
  onOperacaoConcluida?: () => void;
};

type ModalServicoState = {
  idReservaSuite: number;
  suiteNome: string;
  idServico?: number;
  descricao: string;
  digitosValor: string;
};

function extrairDetalheResposta(
  payload: unknown,
  idReservaEsperado: number,
): ReservaAdminDetalhe | null {
  if (!payload || typeof payload !== "object") return null;
  const envelope = payload as {
    success?: boolean;
    data?: ReservaAdminDetalhe;
  };
  const candidato =
    envelope.data &&
    typeof envelope.data === "object" &&
    (envelope.data.id != null || envelope.data.idReservaHospedagem != null)
      ? envelope.data
      : (payload as ReservaAdminDetalhe);
  const idResposta = Number(
    candidato.idReservaHospedagem ?? candidato.id ?? 0,
  );
  if (
    !Number.isFinite(idResposta) ||
    idResposta <= 0 ||
    idResposta !== idReservaEsperado
  ) {
    return null;
  }
  return candidato;
}

export default function ServicosAdicionaisSuitePanel({
  idReservaHospedagem,
  suites,
  permissoes,
  valorTotalReserva,
  onDetalheAtualizado,
  onOperacaoConcluida,
}: Props) {
  const [modal, setModal] = useState<ModalServicoState | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const podeAdicionar = Boolean(permissoes?.podeAdicionar);
  const podeEditar = Boolean(permissoes?.podeEditar);
  const podeExcluir = Boolean(permissoes?.podeExcluir);

  const abrirNovo = (suite: SuiteComServicos) => {
    setErro(null);
    setModal({
      idReservaSuite: suite.idReservaSuite,
      suiteNome: suite.nome,
      descricao: "",
      digitosValor: "0",
    });
  };

  const abrirEditar = (
    suite: SuiteComServicos,
    servico: ReservaSuiteServicoAdicional,
  ) => {
    setErro(null);
    setModal({
      idReservaSuite: suite.idReservaSuite,
      suiteNome: suite.nome,
      idServico: servico.id,
      descricao: servico.descricao,
      digitosValor: valorParaDigitosCentavos(servico.valor),
    });
  };

  const fecharModal = () => {
    if (salvando) return;
    setModal(null);
    setErro(null);
  };

  const aplicarDetalhe = (payload: unknown) => {
    const atualizado = extrairDetalheResposta(payload, idReservaHospedagem);
    if (!atualizado) {
      setErro("Não foi possível atualizar os serviços.");
      return false;
    }
    onDetalheAtualizado(atualizado);
    onOperacaoConcluida?.();
    return true;
  };

  const salvarModal = async () => {
    if (!modal || salvando) return;
    const descricao = modal.descricao.trim();
    const valor = digitosCentavosParaNumero(modal.digitosValor);
    if (!descricao) {
      setErro("Informe a descrição do serviço.");
      return;
    }
    if (!(valor > 0)) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const resp = modal.idServico
        ? await patchServicoSuiteReserva(
            idReservaHospedagem,
            modal.idReservaSuite,
            modal.idServico,
            { descricao, valor },
          )
        : await postServicoSuiteReserva(
            idReservaHospedagem,
            modal.idReservaSuite,
            { descricao, valor },
          );

      if (!resp.success) {
        setErro(resp.message || "Não foi possível salvar o serviço.");
        return;
      }
      if (aplicarDetalhe(resp.data)) {
        setModal(null);
      }
    } catch {
      setErro("Não foi possível salvar o serviço.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirServico = async (
    suite: SuiteComServicos,
    servico: ReservaSuiteServicoAdicional,
  ) => {
    if (excluindoId || salvando) return;
    setExcluindoId(servico.id);
    setErro(null);
    try {
      const resp = await deleteServicoSuiteReserva(
        idReservaHospedagem,
        suite.idReservaSuite,
        servico.id,
      );
      if (!resp.success) {
        setErro(resp.message || "Não foi possível remover o serviço.");
        return;
      }
      aplicarDetalhe(resp.data);
    } catch {
      setErro("Não foi possível remover o serviço.");
    } finally {
      setExcluindoId(null);
    }
  };

  if (!suites.length) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.tituloSecao}>Suítes e serviços adicionais</Text>

      {suites.map((suite, idx) => {
        const servicos = suite.servicosAdicionais ?? [];
        const valorHospedagem =
          suite.valorHospedagem ??
          Number(suite.preco ?? 0) + Number(suite.taxaServico ?? 0);
        const valorServicos =
          suite.valorServicos ??
          servicos.reduce((acc, s) => acc + Number(s.valor ?? 0), 0);
        const totalSuite =
          suite.valorTotal ?? valorHospedagem + valorServicos;

        return (
          <View key={suite.idReservaSuite} style={styles.suiteCard}>
            <View style={styles.suiteHeader}>
              <Text style={styles.suiteNome}>
                Suíte {String(idx + 1).padStart(2, "0")} — {suite.nome}
              </Text>
              {podeAdicionar ? (
                <TouchableOpacity
                  style={styles.btnAdicionar}
                  onPress={() => abrirNovo(suite)}
                  activeOpacity={0.85}
                >
                  <Feather name="plus" size={14} color={colors.branco} />
                  <Text style={styles.btnAdicionarTexto}>Adicionar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.linhaValor}>
              <Text style={styles.linhaLabel}>Hospedagem</Text>
              <Text style={styles.linhaValorTexto}>
                {formatCurrency(valorHospedagem)}
              </Text>
            </View>

            <Text style={styles.subtitulo}>Serviços adicionais</Text>
            {servicos.length === 0 ? (
              <Text style={styles.vazio}>Nenhum serviço adicional.</Text>
            ) : (
              servicos.map((servico) => (
                <View key={servico.id} style={styles.servicoRow}>
                  <View style={styles.servicoInfo}>
                    <Text style={styles.servicoDescricao}>
                      {servico.descricao}
                    </Text>
                    <Text style={styles.servicoValor}>
                      {formatCurrency(servico.valor)}
                    </Text>
                  </View>
                  {(podeEditar || podeExcluir) && (
                    <View style={styles.servicoAcoes}>
                      {podeEditar ? (
                        <TouchableOpacity
                          onPress={() => abrirEditar(suite, servico)}
                          hitSlop={8}
                          disabled={excluindoId === servico.id}
                        >
                          <Feather name="edit-2" size={16} color="#0073E6" />
                        </TouchableOpacity>
                      ) : null}
                      {podeExcluir ? (
                        <TouchableOpacity
                          onPress={() => excluirServico(suite, servico)}
                          hitSlop={8}
                          disabled={excluindoId === servico.id}
                        >
                          {excluindoId === servico.id ? (
                            <ActivityIndicator size="small" color="#b91c1c" />
                          ) : (
                            <Feather name="trash-2" size={16} color="#b91c1c" />
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  )}
                </View>
              ))
            )}

            <View style={styles.linhaValor}>
              <Text style={styles.linhaLabel}>Subtotal serviços</Text>
              <Text style={styles.linhaValorTexto}>
                {formatCurrency(valorServicos)}
              </Text>
            </View>
            <View style={styles.linhaTotalSuite}>
              <Text style={styles.totalSuiteLabel}>Total da suíte</Text>
              <Text style={styles.totalSuiteValor}>
                {formatCurrency(totalSuite)}
              </Text>
            </View>
          </View>
        );
      })}

      <View style={styles.totalReservaBox}>
        <Text style={styles.totalReservaLabel}>Total da reserva</Text>
        <Text style={styles.totalReservaValor}>
          {formatCurrency(valorTotalReserva)}
        </Text>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Modal
        visible={modal != null}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <Pressable style={styles.modalOverlay} onPress={fecharModal}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitulo}>
              {modal?.idServico ? "Editar serviço" : "Novo serviço"}
            </Text>
            {modal?.suiteNome ? (
              <Text style={styles.modalSubtitulo}>{modal.suiteNome}</Text>
            ) : null}

            <Text style={styles.inputLabel}>Descrição</Text>
            <TextInput
              style={styles.input}
              value={modal?.descricao ?? ""}
              onChangeText={(texto) =>
                setModal((prev) =>
                  prev ? { ...prev, descricao: texto } : prev,
                )
              }
              placeholder="Ex.: Decoração especial"
              editable={!salvando}
            />

            <Text style={styles.inputLabel}>Valor</Text>
            <TextInput
              style={styles.input}
              value={digitosParaExibicaoMoeda(modal?.digitosValor ?? "0")}
              onChangeText={(texto) => {
                const only = texto.replace(/\D/g, "").slice(0, 12);
                setModal((prev) =>
                  prev ? { ...prev, digitosValor: only || "0" } : prev,
                );
              }}
              keyboardType="number-pad"
              editable={!salvando}
            />

            {erro ? <Text style={styles.erroModal}>{erro}</Text> : null}

            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={fecharModal}
                disabled={salvando}
              >
                <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnSalvar}
                onPress={salvarModal}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color={colors.branco} />
                ) : (
                  <Text style={styles.modalBtnSalvarTexto}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fafbfc",
    gap: 12,
  },
  tituloSecao: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  suiteCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.branco,
    gap: 8,
  },
  suiteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  suiteNome: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  btnAdicionar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0073E6",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnAdicionarTexto: {
    color: colors.branco,
    fontSize: 12,
    fontWeight: "700",
  },
  linhaValor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linhaLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  linhaValorTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  subtitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginTop: 4,
  },
  vazio: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  servicoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  servicoInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  servicoDescricao: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  servicoValor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  servicoAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  linhaTotalSuite: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  totalSuiteLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  totalSuiteValor: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0073E6",
  },
  totalReservaBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  totalReservaLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  totalReservaValor: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0073E6",
  },
  erro: {
    fontSize: 12,
    color: "#b91c1c",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.branco,
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  modalSubtitulo: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  erroModal: {
    fontSize: 12,
    color: "#b91c1c",
  },
  modalAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  modalBtnCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modalBtnCancelarTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalBtnSalvar: {
    backgroundColor: "#0073E6",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: "center",
  },
  modalBtnSalvarTexto: {
    color: colors.branco,
    fontSize: 14,
    fontWeight: "700",
  },
});
