import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/src/constants/colors";
import { getSuitesOperacionais, SuiteOperacionalCard } from "@/src/lib/hospedagemAdmin";
import { postCriarLimpezaManualSuite } from "@/src/lib/limpezaSuites";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSucesso: () => void;
};

function suiteComLimpezaAberta(suite: SuiteOperacionalCard): boolean {
  const status = suite.statusLimpezaSuite;
  return status === "Pendente" || status === "EmAndamento";
}

export default function ModalAdicionarLimpezaSuite({
  visible,
  onClose,
  onSucesso,
}: Props) {
  const [suites, setSuites] = useState<SuiteOperacionalCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<number | null>(null);

  const suitesDisponiveis = useMemo(
    () =>
      suites
        .filter((suite) => !suiteComLimpezaAberta(suite))
        .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [suites],
  );

  const carregarSuites = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const resp = await getSuitesOperacionais({ filtro: "todas" });
      setSuites(resp.data ?? []);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível carregar as suítes.";
      setErro(msg);
      setSuites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setSelecionada(null);
      setErro(null);
      return;
    }
    void carregarSuites();
  }, [visible, carregarSuites]);

  const confirmar = async () => {
    if (!selecionada || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await postCriarLimpezaManualSuite(selecionada);
      onSucesso();
      onClose();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Não foi possível criar a limpeza.";
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.titulo}>Adicionar suíte para limpeza</Text>
          <Text style={styles.subtitulo}>
            Selecione uma suíte ativa sem limpeza pendente ou em andamento.
          </Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.laranjado}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={suitesDisponiveis}
              keyExtractor={(item) => String(item.idEventoSuite)}
              style={styles.lista}
              ListEmptyComponent={
                <Text style={styles.vazio}>
                  Nenhuma suíte disponível para limpeza manual.
                </Text>
              }
              renderItem={({ item }) => {
                const ativa = selecionada === item.idEventoSuite;
                return (
                  <TouchableOpacity
                    style={[styles.item, ativa && styles.itemAtivo]}
                    onPress={() => setSelecionada(item.idEventoSuite)}
                  >
                    <Text style={styles.itemNome}>{item.nome}</Text>
                    {item.eventoNome ? (
                      <Text style={styles.itemEvento}>{item.eventoNome}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={onClose}
              disabled={salvando}
            >
              <Text style={styles.botaoSecundarioTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.botaoPrimario,
                (!selecionada || salvando) && styles.botaoDisabled,
              ]}
              onPress={() => void confirmar()}
              disabled={!selecionada || salvando}
            >
              <Text style={styles.botaoPrimarioTexto}>
                {salvando ? "Salvando..." : "Confirmar"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: colors.branco,
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.cinza,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
  },
  loader: {
    marginVertical: 24,
  },
  lista: {
    maxHeight: 320,
    marginBottom: 8,
  },
  item: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  itemAtivo: {
    borderColor: colors.azul,
    backgroundColor: "#eff6ff",
  },
  itemNome: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.cinza,
  },
  itemEvento: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  vazio: {
    textAlign: "center",
    color: colors.cinza,
    paddingVertical: 24,
  },
  erro: {
    color: "#c0392b",
    marginBottom: 8,
    textAlign: "center",
  },
  acoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  botaoSecundario: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoSecundarioTexto: {
    color: colors.cinza,
    fontWeight: "600",
  },
  botaoPrimario: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.laranjado,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoPrimarioTexto: {
    color: colors.white,
    fontWeight: "700",
  },
  botaoDisabled: {
    opacity: 0.6,
  },
});
