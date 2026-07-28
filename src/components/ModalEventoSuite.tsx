import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import Select from "@/src/components/Select";
import { ImageGallery, ImageGalleryPhoto } from "@/src/components/gallery";
import { apiGeral } from "@/src/lib/geral";
import {
  digitosCentavosParaNumero,
  digitosParaExibicaoMoeda,
  valorParaDigitosCentavos,
} from "@/src/lib/mascaraMoeda";
import {
  applySuitePrecoTaxaChange,
  applySuiteValorManual,
  resolveSuiteValorState,
} from "@/src/lib/suiteValorCalculator";
import { uploadsUrl } from "@/src/lib/upload";
import {
  addEventoSuiteFotos,
  createEventoSuite,
  deleteEventoSuite,
  deleteEventoSuiteFoto,
  EventoSuiteFotoDto,
  EventoSuitePrefill,
  EventoSuiteStatus,
  getEventoSuiteById,
  moverEventoSuiteFoto,
  setEventoSuiteFotoPrincipal,
  updateEventoSuite,
} from "@/src/lib/eventoSuite";
import { CupomPromocional, EventoSuite } from "@/src/types/geral";

const { width } = Dimensions.get("window");

export type ModalEventoSuiteProps = {
  id: number;
  idEvento: number;
  visible: boolean;
  onClose: () => void;
  prefill?: EventoSuitePrefill | null;
  onSaved?: (suite: EventoSuite) => void | Promise<void>;
  title?: string;
};

type PendingFoto = {
  key: string;
  arquivo: string;
  principal: boolean;
};

function alertMsg(title: string, message: string) {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
      { text: "Excluir", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

/** Exibe valor monetário com máscara por centavos (padrão PDV/hospedagem). */
function moneyDisplay(value: number | null | undefined) {
  return digitosParaExibicaoMoeda(
    valorParaDigitosCentavos(Number(value || 0)),
  );
}

/** Converte digitação da máscara em número (centavos → reais). */
function moneyFromInput(text: string) {
  return digitosCentavosParaNumero(
    String(text || "")
      .replace(/\D/g, "")
      .slice(0, 12),
  );
}

/** Monta formulário inicial com a regra única de Valor. */
function buildSuiteFormState(
  idEvento: number,
  source?: Partial<EventoSuite> | EventoSuitePrefill | null,
  id = 0,
): { form: EventoSuite; valorManual: boolean } {
  const money = resolveSuiteValorState({
    preco: source?.preco,
    taxaServico: source?.taxaServico,
    valor: source?.valor,
  });
  const min = Number(source?.qtdeMinimaPessoas ?? 1) || 1;
  const max = Number(source?.qtdeMaximaPessoas ?? min) || min;

  return {
    valorManual: money.valorManual,
    form: {
      id,
      nome: source?.nome ?? "",
      descricao: source?.descricao ?? "",
      idEvento: Number((source as EventoSuite)?.idEvento ?? idEvento) || idEvento,
      qtdeMinimaPessoas: min,
      qtdeMaximaPessoas: max,
      preco: money.preco,
      taxaServico: money.taxaServico,
      valor: money.valor,
      status: (source?.status as EventoSuiteStatus) || "Oculto",
      idCupomPromocional: Number(source?.idCupomPromocional ?? 0) || 0,
    },
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function ModalEventoSuite({
  id,
  idEvento,
  visible,
  onClose,
  prefill,
  onSaved,
  title,
}: ModalEventoSuiteProps) {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventoSuite>(() => {
    return buildSuiteFormState(idEvento, prefill).form;
  });
  const [valorManual, setValorManual] = useState(() => {
    return buildSuiteFormState(idEvento, prefill).valorManual;
  });
  const [itemsCupomPromocional, setItemsCupomPromocional] = useState<
    { value: number; label: string }[]
  >([]);
  const [fotos, setFotos] = useState<EventoSuiteFotoDto[]>([]);
  const [pendingFotos, setPendingFotos] = useState<PendingFoto[]>([]);
  const [suiteIdAtual, setSuiteIdAtual] = useState(id);
  const [galleryBusy, setGalleryBusy] = useState(false);

  const itensStatus = [
    { value: "Ativo", label: "Ativo" },
    { value: "Oculto", label: "Oculto" },
    { value: "Finalizado", label: "Finalizado" },
    { value: "PDV", label: "PDV" },
  ];

  const galleryPhotos: ImageGalleryPhoto[] = useMemo(() => {
    if (suiteIdAtual > 0) {
      return fotos.map((f) => ({
        key: `f-${f.id}`,
        id: f.id,
        uri: uploadsUrl(f.arquivo) || "",
        principal: f.principal,
      }));
    }
    return pendingFotos.map((p) => ({
      key: p.key,
      uri: uploadsUrl(p.arquivo) || "",
      principal: p.principal,
    }));
  }, [suiteIdAtual, fotos, pendingFotos]);

  const handleChange = (field: keyof EventoSuite | string, value: any) => {
    if (field === "valor") {
      const num = typeof value === "number" ? value : Number(value);
      const manual = applySuiteValorManual(num);
      setValorManual(manual.valorManual);
      setFormData((prev) => ({ ...prev, valor: manual.valor }));
      return;
    }

    setFormData((prev) => {
      if (field === "preco" || field === "taxaServico") {
        const num = typeof value === "number" ? value : Number(value);
        const next = applySuitePrecoTaxaChange(
          prev,
          field,
          num,
          valorManual,
        );
        return { ...prev, ...next };
      }
      if (
        field === "qtdeMinimaPessoas" ||
        field === "qtdeMaximaPessoas" ||
        field === "idCupomPromocional"
      ) {
        const num = Number(value);
        return { ...prev, [field]: Number.isFinite(num) ? num : 0 };
      }
      return { ...prev, [field]: value };
    });
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nome?.trim()) newErrors.nome = "Nome é obrigatório.";
    if (!formData.idEvento) newErrors.idEvento = "Evento é obrigatório.";
    if (!formData.qtdeMinimaPessoas || formData.qtdeMinimaPessoas < 1) {
      newErrors.qtdeMinimaPessoas = "Mínimo de pessoas é obrigatório (≥ 1).";
    }
    if (!formData.qtdeMaximaPessoas || formData.qtdeMaximaPessoas < 1) {
      newErrors.qtdeMaximaPessoas = "Máximo de pessoas é obrigatório (≥ 1).";
    }
    if (
      formData.qtdeMinimaPessoas &&
      formData.qtdeMaximaPessoas &&
      Number(formData.qtdeMaximaPessoas) < Number(formData.qtdeMinimaPessoas)
    ) {
      newErrors.qtdeMaximaPessoas =
        "Máximo deve ser maior ou igual ao mínimo.";
    }
    if (formData.preco === undefined || formData.preco === null) {
      newErrors.preco = "Preço é obrigatório.";
    }
    if (formData.taxaServico === undefined || formData.taxaServico === null) {
      newErrors.taxaServico = "Taxa é obrigatória.";
    }
    if (formData.valor === undefined || formData.valor === null) {
      newErrors.valor = "Valor é obrigatório.";
    }
    if (!formData.status) newErrors.status = "Status é obrigatório.";
    return newErrors;
  };

  const payloadFromForm = () => ({
    nome: String(formData.nome || "").trim(),
    descricao: formData.descricao || null,
    idEvento: Number(formData.idEvento || idEvento),
    qtdeMinimaPessoas: Number(formData.qtdeMinimaPessoas),
    qtdeMaximaPessoas: Number(formData.qtdeMaximaPessoas),
    preco: Number(formData.preco),
    taxaServico: Number(formData.taxaServico),
    valor: Number(formData.valor),
    status: formData.status,
    idCupomPromocional:
      !formData.idCupomPromocional || formData.idCupomPromocional === 0
        ? null
        : Number(formData.idCupomPromocional),
  });

  const syncFotosSalvas = async (idSuite: number) => {
    const lista = await getEventoSuiteById(idSuite);
    setFotos(
      Array.isArray(lista.Fotos) ? (lista.Fotos as EventoSuiteFotoDto[]) : [],
    );
  };

  const handleSave = async () => {
    if (saving || galleryBusy || loading) return;
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = payloadFromForm();
      let saved: EventoSuite;
      if (suiteIdAtual > 0) {
        saved = await updateEventoSuite(suiteIdAtual, payload);
      } else {
        saved = await createEventoSuite(payload);
        setSuiteIdAtual(saved.id);
        if (pendingFotos.length > 0) {
          try {
            const arquivos = pendingFotos.map((p) => p.arquivo);
            await addEventoSuiteFotos(saved.id, arquivos);
            const principalPending = pendingFotos.find((p) => p.principal);
            if (principalPending) {
              const lista = await getEventoSuiteById(saved.id);
              const fotosCriadas = (lista.Fotos || []) as EventoSuiteFotoDto[];
              const match = fotosCriadas.find(
                (f) => f.arquivo === principalPending.arquivo,
              );
              if (match && !match.principal) {
                await setEventoSuiteFotoPrincipal(saved.id, match.id);
              }
            }
            setPendingFotos([]);
            await syncFotosSalvas(saved.id);
          } catch (fotoErr: any) {
            alertMsg(
              "Suíte salva com aviso",
              fotoErr?.message ||
                "A suíte foi criada, mas as fotos não puderam ser anexadas. Abra novamente para tentar.",
            );
            if (onSaved) await onSaved(saved);
            onClose();
            return;
          }
        }
      }

      if (onSaved) await onSaved(saved);
      onClose();
    } catch (e: any) {
      alertMsg("Erro ao salvar", e?.message || "Falha ao salvar suíte.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (suiteIdAtual <= 0 || saving || galleryBusy) return;
    const ok = await confirmAsync(
      "Excluir suíte",
      "Confirma a exclusão física desta suíte? Se houver histórico, a exclusão será bloqueada.",
    );
    if (!ok) return;

    setSaving(true);
    try {
      await deleteEventoSuite(suiteIdAtual);
      onClose();
    } catch (e: any) {
      alertMsg(
        "Exclusão não permitida",
        e?.message ||
          "Não foi possível excluir. Altere o status para Finalizado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const onGalleryUpload = async (filenames: string[]) => {
    if (!filenames.length || saving) return;
    setGalleryBusy(true);
    try {
      if (suiteIdAtual > 0) {
        const lista = await addEventoSuiteFotos(suiteIdAtual, filenames);
        setFotos(lista);
        return;
      }
      setPendingFotos((prev) => {
        const next = [...prev];
        for (const arquivo of filenames) {
          next.push({
            key: `p-${arquivo}-${Date.now()}-${Math.random()}`,
            arquivo,
            principal: next.length === 0,
          });
        }
        return next;
      });
    } catch (e: any) {
      alertMsg("Erro no upload", e?.message || "Falha ao anexar fotos.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const onGalleryDelete = async (photo: ImageGalleryPhoto) => {
    if (galleryBusy || saving) return;
    const ok = await confirmAsync("Excluir foto", "Remover esta imagem?");
    if (!ok) return;
    setGalleryBusy(true);
    try {
      if (suiteIdAtual > 0 && photo.id != null) {
        const lista = await deleteEventoSuiteFoto(
          suiteIdAtual,
          Number(photo.id),
        );
        setFotos(lista);
      } else {
        setPendingFotos((prev) => {
          const next = prev.filter((p) => p.key !== photo.key);
          if (
            photo.principal &&
            next.length > 0 &&
            !next.some((p) => p.principal)
          ) {
            next[0] = { ...next[0], principal: true };
          }
          return next;
        });
      }
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao excluir foto.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const onGalleryPrincipal = async (photo: ImageGalleryPhoto) => {
    if (galleryBusy || saving) return;
    setGalleryBusy(true);
    try {
      if (suiteIdAtual > 0 && photo.id != null) {
        const lista = await setEventoSuiteFotoPrincipal(
          suiteIdAtual,
          Number(photo.id),
        );
        setFotos(lista);
      } else {
        setPendingFotos((prev) =>
          prev.map((p) => ({ ...p, principal: p.key === photo.key })),
        );
      }
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao marcar principal.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const onGalleryMove = async (
    photo: ImageGalleryPhoto,
    direcao: "esquerda" | "direita",
  ) => {
    if (galleryBusy || saving) return;
    setGalleryBusy(true);
    try {
      if (suiteIdAtual > 0 && photo.id != null) {
        const lista = await moverEventoSuiteFoto(
          suiteIdAtual,
          Number(photo.id),
          direcao,
        );
        setFotos(lista);
      } else {
        setPendingFotos((prev) => {
          const idx = prev.findIndex((p) => p.key === photo.key);
          if (idx < 0) return prev;
          const swap = direcao === "esquerda" ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= prev.length) return prev;
          const next = [...prev];
          const tmp = next[idx];
          next[idx] = next[swap];
          next[swap] = tmp;
          return next;
        });
      }
    } catch (e: any) {
      alertMsg("Erro", e?.message || "Falha ao reordenar.");
    } finally {
      setGalleryBusy(false);
    }
  };

  const getRegistrosCupomPromocional = async () => {
    const response = await apiGeral.getResource<CupomPromocional>(
      "/cupompromocional",
      { pageSize: 100 },
    );
    const registrosData = (response.data ?? []).map(
      (record: CupomPromocional) => ({
        value: record.id,
        label: record.nome,
      }),
    );
    setItemsCupomPromocional([
      { value: 0, label: "Nenhum Cupom selecionado" },
      ...registrosData,
    ]);
  };

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    const load = async () => {
      setErrors({});
      setLoading(true);
      setPendingFotos([]);
      setSuiteIdAtual(id);
      try {
        await getRegistrosCupomPromocional();
        if (id > 0) {
          const registro = await getEventoSuiteById(id);
          if (cancelled) return;
          const loaded = buildSuiteFormState(
            idEvento,
            {
              ...registro,
              idEvento: registro.idEvento || idEvento,
            },
            registro.id,
          );
          setValorManual(loaded.valorManual);
          setFormData(loaded.form);
          setFotos(
            Array.isArray(registro.Fotos)
              ? (registro.Fotos as EventoSuiteFotoDto[])
              : [],
          );
        } else {
          const created = buildSuiteFormState(idEvento, prefill);
          setValorManual(created.valorManual);
          setFormData(created.form);
          setFotos([]);
        }
      } catch (e: any) {
        if (!cancelled) {
          alertMsg("Erro", e?.message || "Falha ao carregar suíte.");
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, id, idEvento, JSON.stringify(prefill || null)]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback
          onPress={() => {
            if (saving || galleryBusy) return;
            onClose();
          }}
        >
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity />
            <TouchableOpacity
              onPress={onClose}
              disabled={saving || galleryBusy}
            >
              <Feather name="x" size={30} color="#212743" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={colors.azul} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>
                  {title ||
                    (suiteIdAtual > 0 ? "Editar Suíte" : "Cadastro de Suíte")}
                </Text>
                <Select
                  items={itensStatus}
                  currentValue={formData.status}
                  onValueChange={(text) => handleChange("status", text)}
                />
              </View>
              {errors.status ? (
                <Text style={styles.labelError}>{errors.status}</Text>
              ) : null}

              <Section title="Informações Gerais">
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={[styles.input, styles.inputWide]}
                  placeholder="Ex.: Suite Ouro"
                  value={formData.nome}
                  onChangeText={(text) => handleChange("nome", text)}
                />
                {errors.nome ? (
                  <Text style={styles.labelError}>{errors.nome}</Text>
                ) : null}

                <Text style={styles.label}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.inputWide, { minHeight: 72 }]}
                  multiline
                  placeholder="Informações adicionais da suíte"
                  value={formData.descricao || ""}
                  onChangeText={(text) => handleChange("descricao", text)}
                />
              </Section>

              <Section title="Capacidade">
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Qtde mínima</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(formData.qtdeMinimaPessoas ?? "")}
                      onChangeText={(text) =>
                        handleChange("qtdeMinimaPessoas", text)
                      }
                    />
                    {errors.qtdeMinimaPessoas ? (
                      <Text style={styles.labelError}>
                        {errors.qtdeMinimaPessoas}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.col, { marginLeft: 10 }]}>
                    <Text style={styles.label}>Qtde máxima</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={String(formData.qtdeMaximaPessoas ?? "")}
                      onChangeText={(text) =>
                        handleChange("qtdeMaximaPessoas", text)
                      }
                    />
                    {errors.qtdeMaximaPessoas ? (
                      <Text style={styles.labelError}>
                        {errors.qtdeMaximaPessoas}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Section>

              <Section title="Valores">
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Preço</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={moneyDisplay(formData.preco)}
                      onChangeText={(text) =>
                        handleChange("preco", moneyFromInput(text))
                      }
                    />
                    {errors.preco ? (
                      <Text style={styles.labelError}>{errors.preco}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.col, { marginLeft: 10 }]}>
                    <Text style={styles.label}>Taxa</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={moneyDisplay(formData.taxaServico)}
                      onChangeText={(text) =>
                        handleChange("taxaServico", moneyFromInput(text))
                      }
                    />
                    {errors.taxaServico ? (
                      <Text style={styles.labelError}>
                        {errors.taxaServico}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.col, { marginLeft: 10 }]}>
                    <Text style={styles.label}>Valor</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={moneyDisplay(formData.valor)}
                      onChangeText={(text) =>
                        handleChange("valor", moneyFromInput(text))
                      }
                    />
                    <Text style={styles.hint}>
                      {valorManual
                        ? "Valor definido manualmente"
                        : "Sugestão: preço + taxa (editável)"}
                    </Text>
                    {errors.valor ? (
                      <Text style={styles.labelError}>{errors.valor}</Text>
                    ) : null}
                  </View>
                </View>
              </Section>

              <Section title="Fotos da Suíte">
                <ImageGallery
                  photos={galleryPhotos}
                  uploadPrefix="Suite"
                  uploadingDisabled={saving || galleryBusy}
                  actionsDisabled={saving || galleryBusy}
                  onUploadBusyChange={setGalleryBusy}
                  hint="A foto principal será usada no site e nas reservas."
                  onUpload={onGalleryUpload}
                  onDelete={onGalleryDelete}
                  onSetPrincipal={onGalleryPrincipal}
                  onMove={onGalleryMove}
                />
              </Section>

              <Section title="Promoções">
                <Text style={styles.label}>Cupom Promocional</Text>
                <Select
                  items={itemsCupomPromocional}
                  currentValue={formData.idCupomPromocional || 0}
                  onValueChange={(text) =>
                    handleChange("idCupomPromocional", text)
                  }
                  holederFirstItem="Nenhum cupom selecionado"
                />
              </Section>
            </ScrollView>
          )}

          <View style={styles.footer}>
            {suiteIdAtual > 0 ? (
              <TouchableOpacity
                style={[styles.button, styles.buttonDanger]}
                onPress={handleDelete}
                disabled={saving || loading || galleryBusy}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Excluir</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={onClose}
                disabled={saving || galleryBusy}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSave}
                disabled={saving || loading || galleryBusy}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  container: {
    width: Platform.OS === "web" ? (width <= 1000 ? "92%" : "75%") : "94%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 20,
    maxHeight: "92%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  content: { flexGrow: 1, paddingBottom: 8 },
  loadingBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212743",
    marginBottom: 8,
  },
  section: {
    marginBottom: 18,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.azul,
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  label: {
    color: colors.zinc,
    marginBottom: 4,
    fontWeight: "bold",
  },
  hint: {
    marginTop: -12,
    marginBottom: 12,
    fontSize: 11,
    color: colors.cinza,
  },
  row: { flexDirection: "row", flexWrap: "wrap" },
  col: { marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    minWidth: 110,
  },
  inputWide: {
    maxWidth: "100%",
    width: "100%",
  },
  labelError: {
    color: colors.red,
    marginTop: -14,
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
    minWidth: 90,
    alignItems: "center",
  },
  buttonClose: { backgroundColor: "rgb(211, 211, 211)" },
  buttonSave: { backgroundColor: colors.azul },
  buttonDanger: { backgroundColor: "#B42318", marginLeft: 0 },
  buttonText: { color: "#FFF", fontWeight: "bold" },
});
