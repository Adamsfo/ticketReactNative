import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
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
  deleteTaxaAdicionalReserva,
  patchTaxaAdicionalReserva,
  PermissoesTaxasAdicionaisReserva,
  postTaxaAdicionalReserva,
  ReservaAdminDetalhe,
  ReservaTaxaAdicional,
} from "@/src/lib/hospedagemAdmin";
import {
  digitosCentavosParaNumero,
  digitosParaExibicaoMoeda,
  valorParaDigitosCentavos,
} from "@/src/lib/mascaraMoeda";

type Props = {
  idReservaHospedagem: number;
  taxasAdicionais: ReservaTaxaAdicional[];
  valorTaxasAdicionais?: number;
  valorSuitesReserva?: number;
  permissoes?: PermissoesTaxasAdicionaisReserva | null;
  valorTotalReserva: number;
  editandoValorSuites?: boolean;
  digitosValorSuites?: string;
  valorSuitesSalvando?: boolean;
  valorSuitesErro?: string | null;
  onIniciarEdicaoValorSuites?: () => void;
  onCancelarEdicaoValorSuites?: () => void;
  onSalvarValorSuites?: () => void;
  onAlterarDigitosValorSuites?: (digitos: string) => void;
  onDetalheAtualizado: (detalhe: ReservaAdminDetalhe) => void;
  onOperacaoConcluida?: () => void;
};

type ModalTaxaState = {
  idTaxa?: number;
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

export default function TaxasAdicionaisReservaPanel({
  idReservaHospedagem,
  taxasAdicionais,
  valorTaxasAdicionais,
  valorSuitesReserva,
  permissoes,
  valorTotalReserva,
  editandoValorSuites = false,
  digitosValorSuites = "0",
  valorSuitesSalvando = false,
  valorSuitesErro = null,
  onIniciarEdicaoValorSuites,
  onCancelarEdicaoValorSuites,
  onSalvarValorSuites,
  onAlterarDigitosValorSuites,
  onDetalheAtualizado,
  onOperacaoConcluida,
}: Props) {
  const [modal, setModal] = useState<ModalTaxaState | null>(null);
  const [taxaExclusaoPendente, setTaxaExclusaoPendente] =
    useState<ReservaTaxaAdicional | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const valorSuitesUltimoPressRef = useRef(0);

  const podeAdicionar = Boolean(permissoes?.podeAdicionar);
  const podeEditar = Boolean(permissoes?.podeEditar);
  const podeExcluir = Boolean(permissoes?.podeExcluir);

  const totalTaxas =
    valorTaxasAdicionais ??
    taxasAdicionais.reduce((acc, taxa) => acc + Number(taxa.valor ?? 0), 0);
  const valorSuitesHospedagem = Number(valorSuitesReserva ?? 0);

  const onValorSuitesDuploClique = () => {
    if (!onIniciarEdicaoValorSuites || editandoValorSuites || valorSuitesSalvando) {
      return;
    }
    const agora = Date.now();
    if (agora - valorSuitesUltimoPressRef.current <= 350) {
      valorSuitesUltimoPressRef.current = 0;
      onIniciarEdicaoValorSuites();
      return;
    }
    valorSuitesUltimoPressRef.current = agora;
  };

  const abrirNovo = () => {
    setErro(null);
    setModal({
      descricao: "",
      digitosValor: "0",
    });
  };

  const abrirEditar = (taxa: ReservaTaxaAdicional) => {
    if (!taxa.id) return;
    setErro(null);
    setModal({
      idTaxa: taxa.id,
      descricao: taxa.descricao,
      digitosValor: valorParaDigitosCentavos(taxa.valor),
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
      setErro("Não foi possível atualizar as taxas adicionais.");
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
      setErro("Informe a descrição da taxa.");
      return;
    }
    if (!(valor > 0)) {
      setErro("Informe um valor maior que zero.");
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const resp = modal.idTaxa
        ? await patchTaxaAdicionalReserva(idReservaHospedagem, modal.idTaxa, {
            descricao,
            valor,
          })
        : await postTaxaAdicionalReserva(idReservaHospedagem, {
            descricao,
            valor,
          });

      if (!resp.success) {
        setErro(resp.message || "Não foi possível salvar a taxa.");
        return;
      }
      if (aplicarDetalhe(resp.data)) {
        setModal(null);
      }
    } catch {
      setErro("Não foi possível salvar a taxa.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = (taxa: ReservaTaxaAdicional) => {
    if (!taxa.id || excluindoId || salvando) return;
    setErro(null);
    setTaxaExclusaoPendente(taxa);
  };

  const cancelarExclusao = () => {
    if (excluindoId) return;
    setTaxaExclusaoPendente(null);
  };

  const executarExclusaoConfirmada = async () => {
    const taxa = taxaExclusaoPendente;
    if (!taxa?.id || excluindoId || salvando) return;
    setTaxaExclusaoPendente(null);
    await excluirTaxa(taxa);
  };

  const excluirTaxa = async (taxa: ReservaTaxaAdicional) => {
    const idTaxa = Number(taxa.id);
    if (!Number.isFinite(idTaxa) || idTaxa <= 0) {
      setErro("Taxa adicional inválida para exclusão.");
      return;
    }
    setExcluindoId(idTaxa);
    setErro(null);
    try {
      const resp = await deleteTaxaAdicionalReserva(
        idReservaHospedagem,
        idTaxa,
      );
      if (!resp.success) {
        setErro(resp.message || "Não foi possível remover a taxa.");
        return;
      }
      if (!aplicarDetalhe(resp.data)) {
        return;
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : null;
      setErro(msg || "Não foi possível remover a taxa.");
    } finally {
      setExcluindoId(null);
    }
  };

  return (
    <View style={styles.wrap}>
      {editandoValorSuites ? (
        <View style={styles.edicaoValorSuitesWrap}>
          <Text style={styles.linhaValorLabel}>Valor das suítes</Text>
          <TextInput
            style={styles.edicaoValorSuitesInput}
            value={digitosParaExibicaoMoeda(digitosValorSuites)}
            onChangeText={(texto) => {
              const only = texto.replace(/\D/g, "").slice(0, 12);
              onAlterarDigitosValorSuites?.(only || "0");
            }}
            keyboardType="number-pad"
            editable={!valorSuitesSalvando}
            autoFocus
          />
          <View style={styles.edicaoValorSuitesAcoes}>
            <TouchableOpacity
              onPress={onSalvarValorSuites}
              disabled={valorSuitesSalvando}
              hitSlop={6}
            >
              <Text style={styles.edicaoValorSuitesSalvar}>
                {valorSuitesSalvando ? "Salvando…" : "Salvar"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancelarEdicaoValorSuites}
              disabled={valorSuitesSalvando}
              hitSlop={6}
            >
              <Text style={styles.edicaoValorSuitesCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
          {valorSuitesErro ? (
            <Text style={styles.erro}>{valorSuitesErro}</Text>
          ) : null}
        </View>
      ) : Platform.OS === "web" ? (
        <Pressable
          style={styles.linhaValor}
          onPress={(event) => {
            event?.preventDefault?.();
            onValorSuitesDuploClique();
          }}
        >
          <Text style={styles.linhaValorLabel}>Valor das suítes</Text>
          <Text style={styles.linhaValorTexto}>
            {formatCurrency(valorSuitesHospedagem)}
          </Text>
        </Pressable>
      ) : (
        <Pressable style={styles.linhaValor} onPress={onValorSuitesDuploClique}>
          <Text style={styles.linhaValorLabel}>Valor das suítes</Text>
          <Text style={styles.linhaValorTexto}>
            {formatCurrency(valorSuitesHospedagem)}
          </Text>
        </Pressable>
      )}

      {podeAdicionar ? (
        <View style={styles.btnAdicionarRow}>
          <TouchableOpacity
            style={styles.btnAdicionar}
            onPress={abrirNovo}
            activeOpacity={0.85}
          >
            <Feather name="plus" size={14} color={colors.branco} />
            <Text style={styles.btnAdicionarTexto}>Adicionar taxa</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.subtituloLista}>Taxas adicionais</Text>
      {taxasAdicionais.length === 0 ? (
        <Text style={styles.vazio}>Nenhuma taxa adicional.</Text>
      ) : (
        taxasAdicionais.map((taxa) => (
          <View key={taxa.id ?? taxa.ordem} style={styles.taxaRow}>
            <View style={styles.taxaInfo}>
              <Text style={styles.taxaDescricao}>{taxa.descricao}</Text>
              <Text style={styles.taxaValor}>{formatCurrency(taxa.valor)}</Text>
            </View>
            {(podeEditar || podeExcluir) && taxa.id ? (
              <View style={styles.taxaAcoes}>
                {podeEditar ? (
                  <TouchableOpacity
                    onPress={() => abrirEditar(taxa)}
                    hitSlop={8}
                    disabled={excluindoId === taxa.id}
                  >
                    <Text style={styles.acaoEditar}>Editar</Text>
                  </TouchableOpacity>
                ) : null}
                {podeExcluir ? (
                  <TouchableOpacity
                    onPress={() => confirmarExclusao(taxa)}
                    hitSlop={8}
                    disabled={excluindoId === taxa.id}
                  >
                    {excluindoId === taxa.id ? (
                      <ActivityIndicator size="small" color="#b91c1c" />
                    ) : (
                      <Text style={styles.acaoExcluir}>Excluir</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={styles.linhaTotal}>
        <Text style={styles.totalLabel}>Total de taxas adicionais</Text>
        <Text style={styles.totalValor}>{formatCurrency(totalTaxas)}</Text>
      </View>

      <View style={styles.divisor} />

      <View style={styles.totalReservaBox}>
        <Text style={styles.totalReservaLabel}>TOTAL DA RESERVA</Text>
        <Text style={styles.totalReservaValor}>
          {formatCurrency(valorTotalReserva)}
        </Text>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Modal
        visible={taxaExclusaoPendente != null}
        transparent
        animationType="fade"
        onRequestClose={cancelarExclusao}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelarExclusao}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitulo}>Excluir taxa adicional</Text>
            <Text style={styles.confirmMensagem}>
              Deseja realmente excluir esta taxa adicional?
            </Text>
            {taxaExclusaoPendente?.descricao ? (
              <Text style={styles.confirmTaxaNome}>
                {taxaExclusaoPendente.descricao}
              </Text>
            ) : null}
            <View style={styles.modalAcoes}>
              <TouchableOpacity
                style={styles.modalBtnCancelar}
                onPress={cancelarExclusao}
                disabled={excluindoId != null}
              >
                <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnExcluir}
                onPress={() => void executarExclusaoConfirmada()}
                disabled={excluindoId != null}
              >
                {excluindoId != null ? (
                  <ActivityIndicator color={colors.branco} />
                ) : (
                  <Text style={styles.modalBtnSalvarTexto}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={modal != null}
        transparent
        animationType="fade"
        onRequestClose={fecharModal}
      >
        <Pressable style={styles.modalOverlay} onPress={fecharModal}>
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitulo}>
              {modal?.idTaxa ? "Editar taxa adicional" : "Nova taxa adicional"}
            </Text>

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
    gap: 10,
  },
  btnAdicionarRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
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
    paddingBottom: 4,
  },
  linhaValorLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  linhaValorTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  edicaoValorSuitesWrap: {
    gap: 8,
  },
  edicaoValorSuitesInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  edicaoValorSuitesAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  edicaoValorSuitesSalvar: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0073E6",
  },
  edicaoValorSuitesCancelar: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  subtituloLista: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: 4,
    marginBottom: 4,
  },
  vazio: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  divisor: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    marginTop: 8,
  },
  taxaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  taxaInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  taxaDescricao: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  taxaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  taxaAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  acaoEditar: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0073E6",
  },
  acaoExcluir: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b91c1c",
  },
  linhaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  totalValor: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  totalReservaBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
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
  confirmMensagem: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  confirmTaxaNome: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
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
    fontSize: 14,
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
  modalBtnExcluir: {
    backgroundColor: "#b91c1c",
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
