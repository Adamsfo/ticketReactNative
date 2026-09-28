import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import ScreenContainer from "@/src/components/ScreenContainer";
import DatePickerComponente from "@/src/components/DatePickerComponente";
import formatCurrency from "@/src/components/FormatCurrency";
import colors from "@/src/constants/colors";
import {
  CaixaGatewayResumo,
  CaixaResumo,
  CaixaValores,
  fetchCaixaResumo,
} from "@/src/lib/caixa";
import { useAuth } from "@/src/contexts_/AuthContext";

function LinhaValor({
  label,
  valores,
  destaque,
}: {
  label: string;
  valores: CaixaValores;
  destaque?: boolean;
}) {
  return (
    <View style={[styles.linha, destaque && styles.linhaDestaque]}>
      <Text style={[styles.colOrigem, destaque && styles.textoDestaque]}>
        {label}
      </Text>
      <Text style={[styles.colValor, destaque && styles.textoDestaque]}>
        {formatCurrency(valores.totalVendido)}
      </Text>
      <Text style={[styles.colValor, destaque && styles.textoDestaque]}>
        {formatCurrency(valores.totalRecebido)}
      </Text>
    </View>
  );
}

function BlocoPdv({ pdv }: { pdv: CaixaValores }) {
  return (
    <View style={styles.bloco}>
      <Text style={styles.tituloGateway}>PDV</Text>
      <View style={styles.cabecalhoTabela}>
        <Text style={[styles.colOrigem, styles.cabecalhoTexto]} />
        <Text style={[styles.colValor, styles.cabecalhoTexto]}>
          Total vendido
        </Text>
        <Text style={[styles.colValor, styles.cabecalhoTexto]}>
          Total recebido
        </Text>
      </View>
      <LinhaValor label="Caixa PDV" valores={pdv} destaque />
    </View>
  );
}

function BlocoGateway({
  titulo,
  bloco,
}: {
  titulo: string;
  bloco: CaixaGatewayResumo;
}) {
  return (
    <View style={styles.bloco}>
      <Text style={styles.tituloGateway}>{titulo}</Text>
      <View style={styles.cabecalhoTabela}>
        <Text style={[styles.colOrigem, styles.cabecalhoTexto]}>Origem</Text>
        <Text style={[styles.colValor, styles.cabecalhoTexto]}>
          Total vendido
        </Text>
        <Text style={[styles.colValor, styles.cabecalhoTexto]}>
          Total recebido
        </Text>
      </View>
      <LinhaValor label="Ingressos" valores={bloco.ingressos} />
      <LinhaValor label="Hospedagem" valores={bloco.hospedagem} />
      <LinhaValor
        label={
          titulo === "TEF" ? "TOTAL TEF" : "TOTAL MERCADO PAGO"
        }
        valores={bloco.total}
        destaque
      />
    </View>
  );
}

export default function CaixaPage() {
  const { isAdministrador, isProdutor } = useAuth();
  const podeAcessarCaixa = isAdministrador || isProdutor;
  const [dataInicio, setDataInicio] = useState(new Date());
  const [dataFinal, setDataFinal] = useState(new Date());
  const [resumo, setResumo] = useState<CaixaResumo | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!podeAcessarCaixa) return;
    setCarregando(true);
    setErro(null);
    try {
      const data = await fetchCaixaResumo({
        dataInicio: format(dataInicio, "yyyy-MM-dd"),
        dataFim: format(dataFinal, "yyyy-MM-dd"),
      });
      setResumo(data);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "Não foi possível carregar o caixa.";
      setErro(msg);
      setResumo(null);
    } finally {
      setCarregando(false);
    }
  }, [dataInicio, dataFinal, podeAcessarCaixa]);

  useFocusEffect(
    useCallback(() => {
      if (podeAcessarCaixa) {
        carregar();
      }
    }, [carregar, podeAcessarCaixa])
  );

  if (!podeAcessarCaixa) {
    return (
      <LinearGradient
        colors={[colors.branco, colors.laranjado]}
        style={styles.gradient}
      >
        <StatusBarPage style="dark" />
        <BarMenu />
        <ScreenContainer style={styles.screen}>
          <View style={styles.centro}>
            <Text style={styles.erro}>
              Acesso restrito ao administrador ou produtor.
            </Text>
          </View>
        </ScreenContainer>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={styles.gradient}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <ScreenContainer style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.conteudo}
        >
          <Text style={styles.subtitulo}>
            Faturamento do período por meio de recebimento (TEF, Mercado Pago e
            PDV).
          </Text>

          <View style={styles.filtros}>
            <View style={styles.filtroItem}>
              <Text style={styles.filtroLabel}>Data inicial</Text>
              <DatePickerComponente
                value={dataInicio}
                onChange={setDataInicio}
              />
            </View>
            <View style={styles.filtroItem}>
              <Text style={styles.filtroLabel}>Data final</Text>
              <DatePickerComponente
                value={dataFinal}
                onChange={setDataFinal}
              />
            </View>
            <TouchableOpacity
              style={styles.botaoFiltrar}
              onPress={carregar}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botaoFiltrarTexto}>Filtrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          {resumo ? (
            <>
              <BlocoGateway titulo="TEF" bloco={resumo.tef} />
              <BlocoGateway titulo="MERCADO PAGO" bloco={resumo.mercadoPago} />
              {resumo.pdv ? <BlocoPdv pdv={resumo.pdv} /> : null}
              <View style={styles.bloco}>
                <Text style={styles.tituloGateway}>TOTAL GERAL</Text>
                <View style={styles.cabecalhoTabela}>
                  <Text style={[styles.colOrigem, styles.cabecalhoTexto]} />
                  <Text style={[styles.colValor, styles.cabecalhoTexto]}>
                    Total vendido
                  </Text>
                  <Text style={[styles.colValor, styles.cabecalhoTexto]}>
                    Total recebido
                  </Text>
                </View>
                <LinhaValor
                  label="Geral"
                  valores={resumo.totalGeral}
                  destaque
                />
              </View>
            </>
          ) : null}
        </ScrollView>
      </ScreenContainer>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  screen: {
    marginTop: Platform.OS === "web" ? 80 : 120,
  },
  scroll: { flex: 1 },
  conteudo: {
    padding: 16,
    paddingBottom: 32,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  subtitulo: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
    lineHeight: 20,
  },
  filtros: {
    flexDirection: Platform.OS === "web" ? "row" : "column",
    flexWrap: "wrap",
    gap: 12,
    alignItems: Platform.OS === "web" ? "flex-end" : "stretch",
    marginBottom: 20,
  },
  filtroItem: { flex: Platform.OS === "web" ? 1 : undefined, minWidth: 160 },
  filtroLabel: { fontSize: 13, marginBottom: 4, color: "#333" },
  botaoFiltrar: {
    backgroundColor: colors.azul ?? "#1565c0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  botaoFiltrarTexto: { color: "#fff", fontWeight: "600" },
  bloco: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  tituloGateway: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#222",
  },
  cabecalhoTabela: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 6,
    marginBottom: 4,
  },
  cabecalhoTexto: { fontWeight: "600", fontSize: 12, color: "#666" },
  linha: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  linhaDestaque: {
    backgroundColor: "#f5f8fc",
    marginTop: 4,
    borderBottomWidth: 0,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  colOrigem: { flex: 1.2, fontSize: 14, color: "#333" },
  colValor: { flex: 1, fontSize: 14, textAlign: "right", color: "#333" },
  textoDestaque: { fontWeight: "700" },
  erro: { color: "#c62828", marginBottom: 12 },
  centro: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
});
