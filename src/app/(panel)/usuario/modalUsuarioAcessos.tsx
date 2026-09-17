import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { apiGeral } from "@/src/lib/geral";
import Select from "@/src/components/Select";
import {
  Produtor,
  ProdutorAcesso,
  TipoAcesso,
} from "@/src/types/geral";

const ENDPOINT_ACESSO = "/produtoracesso";
const ENDPOINT_PRODUTOR = "/produtor";

const TIPOS_ACESSO = [
  { value: TipoAcesso.Administrador, label: "Administrador" },
  { value: TipoAcesso.Validador, label: "Validador" },
  { value: TipoAcesso.PDV, label: "PDV" },
];

type FormAcesso = {
  idProdutor: number;
  tipoAcesso: TipoAcesso;
  cliente_chavePOS: string;
  pos_id: string;
};

const formVazio = (): FormAcesso => ({
  idProdutor: 0,
  tipoAcesso: TipoAcesso.Administrador,
  cliente_chavePOS: "",
  pos_id: "",
});

interface ModalUsuarioAcessosProps {
  idUsuario: number;
  visible: boolean;
}

export default function ModalUsuarioAcessos({
  idUsuario,
  visible,
}: ModalUsuarioAcessosProps) {
  const [acessos, setAcessos] = useState<ProdutorAcesso[]>([]);
  const [produtores, setProdutores] = useState<Produtor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormAcesso>(formVazio());

  const mapaProdutor = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of produtores) {
      if (p.id) map.set(p.id, p.nome);
    }
    return map;
  }, [produtores]);

  const itensProdutor = useMemo(
    () =>
      produtores
        .filter((p) => p.id)
        .map((p) => ({ value: p.id as number, label: p.nome })),
    [produtores],
  );

  const carregarDados = useCallback(async () => {
    if (!idUsuario) return;
    setCarregando(true);
    setErro(null);
    try {
      const [respAcessos, respProdutores] = await Promise.all([
        apiGeral.getResource<ProdutorAcesso>(ENDPOINT_ACESSO, {
          filters: { idUsuario },
          pageSize: 50,
        }),
        apiGeral.getResource<Produtor>(ENDPOINT_PRODUTOR, { pageSize: 200 }),
      ]);
      setAcessos(respAcessos.data ?? []);
      setProdutores(respProdutores.data ?? []);
    } catch {
      setErro("Não foi possível carregar os acessos do usuário.");
    } finally {
      setCarregando(false);
    }
  }, [idUsuario]);

  useEffect(() => {
    if (visible && idUsuario > 0) {
      carregarDados();
    }
  }, [visible, idUsuario, carregarDados]);

  const resetFormulario = () => {
    setForm(formVazio());
    setMostrarFormulario(false);
    setEditandoId(null);
    setErro(null);
  };

  const abrirNovo = () => {
    setForm(formVazio());
    setEditandoId(null);
    setMostrarFormulario(true);
    setErro(null);
  };

  const abrirEdicao = (acesso: ProdutorAcesso) => {
    setForm({
      idProdutor: acesso.idProdutor,
      tipoAcesso: acesso.tipoAcesso,
      cliente_chavePOS: acesso.cliente_chavePOS ?? "",
      pos_id: acesso.pos_id != null ? String(acesso.pos_id) : "",
    });
    setEditandoId(acesso.id);
    setMostrarFormulario(true);
    setErro(null);
  };

  const validarFormulario = (): string | null => {
    if (!form.idProdutor) return "Selecione o produtor.";
    if (!form.tipoAcesso) return "Selecione o tipo de acesso.";
    return null;
  };

  const montarPayload = () => {
    const payload: Record<string, unknown> = {
      idUsuario,
      idProdutor: form.idProdutor,
      tipoAcesso: form.tipoAcesso,
    };
    if (form.tipoAcesso === TipoAcesso.PDV) {
      const posTrim = form.pos_id.trim();
      payload.pos_id = posTrim ? Number(posTrim) : null;
      payload.cliente_chavePOS = form.cliente_chavePOS.trim();
    }
    return payload;
  };

  const salvarAcesso = async () => {
    const msg = validarFormulario();
    if (msg) {
      setErro(msg);
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const payload = montarPayload();
      if (editandoId) {
        await apiGeral.updateResorce(ENDPOINT_ACESSO, {
          id: editandoId,
          ...payload,
        });
      } else {
        await apiGeral.createResource(ENDPOINT_ACESSO, payload);
      }
      resetFormulario();
      await carregarDados();
    } catch (e: any) {
      setErro(
        e?.message ||
          (editandoId
            ? "Não foi possível atualizar o acesso."
            : "Não foi possível adicionar o acesso."),
      );
    } finally {
      setSalvando(false);
    }
  };

  const removerAcesso = async (id: number) => {
    setSalvando(true);
    setErro(null);
    try {
      await apiGeral.deleteResorce(ENDPOINT_ACESSO, String(id));
      if (editandoId === id) resetFormulario();
      await carregarDados();
    } catch {
      setErro("Não foi possível remover o acesso.");
    } finally {
      setSalvando(false);
    }
  };

  if (!idUsuario) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Acessos / Permissões</Text>
      <Text style={styles.sectionHint}>
        Configure os acessos operacionais via ProdutorAcesso. Usuário sem
        registros permanece cliente.
      </Text>

      {carregando ? (
        <ActivityIndicator color={colors.azul} style={{ marginVertical: 12 }} />
      ) : (
        <>
          {acessos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum acesso configurado.</Text>
          ) : (
            acessos.map((acesso) => (
              <View key={acesso.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>
                    {mapaProdutor.get(acesso.idProdutor) ||
                      `Produtor #${acesso.idProdutor}`}
                  </Text>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      onPress={() => abrirEdicao(acesso)}
                      disabled={salvando}
                      style={styles.iconButton}
                    >
                      <Feather name="edit-2" size={18} color={colors.azul} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removerAcesso(acesso.id)}
                      disabled={salvando}
                      style={styles.iconButton}
                    >
                      <Feather name="trash-2" size={18} color={colors.red} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardLine}>
                  Tipo: <Text style={styles.cardValue}>{acesso.tipoAcesso}</Text>
                </Text>
                {acesso.tipoAcesso === TipoAcesso.PDV && (
                  <>
                    <Text style={styles.cardLine}>
                      Código da Máquina:{" "}
                      <Text style={styles.cardValue}>
                        {acesso.pos_id ?? "—"}
                      </Text>
                    </Text>
                    <Text style={styles.cardLine}>
                      Chave da Máquina:{" "}
                      <Text style={styles.cardValue}>
                        {acesso.cliente_chavePOS || "—"}
                      </Text>
                    </Text>
                  </>
                )}
              </View>
            ))
          )}

          {mostrarFormulario ? (
            <View style={styles.formBox}>
              <Text style={styles.formTitle}>
                {editandoId ? "Editar acesso" : "Novo acesso"}
              </Text>

              <Text style={styles.label}>Produtor</Text>
              <Select
                items={itensProdutor}
                currentValue={form.idProdutor || null}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    idProdutor: Number(value) || 0,
                  }))
                }
              />

              <Text style={styles.label}>Tipo de acesso</Text>
              <Select
                items={TIPOS_ACESSO}
                currentValue={form.tipoAcesso}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tipoAcesso: value as TipoAcesso,
                  }))
                }
              />

              {form.tipoAcesso === TipoAcesso.PDV && (
                <>
                  <Text style={styles.label}>Código da Máquina (pos_id)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.pos_id}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, pos_id: text }))
                    }
                    placeholder="Código numérico da máquina POS"
                    keyboardType="numeric"
                  />
                  <Text style={styles.label}>
                    Chave da Máquina (cliente_chavePOS)
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.cliente_chavePOS}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, cliente_chavePOS: text }))
                    }
                    placeholder="Chave da máquina POS"
                    autoCapitalize="none"
                  />
                </>
              )}

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={resetFormulario}
                  disabled={salvando}
                >
                  <Text style={styles.buttonSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={salvarAcesso}
                  disabled={salvando}
                >
                  <Text style={styles.buttonPrimaryText}>
                    {salvando ? "Salvando..." : "Salvar acesso"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={abrirNovo}
              disabled={salvando}
            >
              <Feather name="plus" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Adicionar Acesso</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212743",
    marginBottom: 4,
  },
  sectionHint: {
    color: colors.zinc,
    marginBottom: 12,
    fontSize: 13,
  },
  emptyText: {
    color: colors.zinc,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#FAFAFA",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#212743",
    flex: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  cardLine: {
    color: colors.zinc,
    marginBottom: 2,
  },
  cardValue: {
    color: "#212743",
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.azul,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  addButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  formBox: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: "#F8FAFF",
  },
  formTitle: {
    fontWeight: "bold",
    color: "#212743",
    marginBottom: 10,
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.azul,
  },
  buttonSecondary: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  buttonPrimaryText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: "#212743",
    fontWeight: "bold",
  },
  erro: {
    color: colors.red,
    marginTop: 8,
  },
});
