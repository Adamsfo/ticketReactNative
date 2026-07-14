import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import StatusBarPage from "@/src/components/StatusBarPage";
import BarMenu from "@/src/components/BarMenu";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import {
  getReservaConfirmada,
  ReservaConfirmadaApi,
} from "@/src/lib/reservaSuite";
import {
  calcularIdadeEmAnos,
  formatarIdadeAnos,
} from "@/src/lib/hospedagemHospedes";

const { width } = Dimensions.get("window");

function toIsoString(valor: string | Date): string {
  if (valor instanceof Date) {
    return valor.toISOString();
  }
  return String(valor);
}

function formatarDataHoraHospedagem(valor: string | Date): string {
  const iso = toIsoString(valor);
  try {
    return formatInTimeZone(
      parseISO(iso),
      "America/Cuiaba",
      "dd/MM/yyyy 'às' HH:mm",
    );
  } catch {
    return iso;
  }
}

function labelTipoHospede(tipo: string): string {
  if (tipo === "Crianca" || tipo === "crianca") {
    return "Criança";
  }
  return "Adulto";
}

function formatarOcupacao(adultos: number, criancas: number): string {
  const partes: string[] = [];
  if (adultos > 0) {
    partes.push(`${adultos} ${adultos === 1 ? "adulto" : "adultos"}`);
  }
  if (criancas > 0) {
    partes.push(`${criancas} ${criancas === 1 ? "criança" : "crianças"}`);
  }
  return partes.join(" • ");
}

function SecaoHeaderSucesso({ numeroReserva }: { numeroReserva: number }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.tituloSucesso}>
        ✓ Pagamento realizado com sucesso!
      </Text>
      <Text style={styles.subtituloSucesso}>Sua reserva foi confirmada.</Text>
      <Text style={styles.numeroReserva}>Número da reserva: #{numeroReserva}</Text>
    </View>
  );
}

function SecaoPeriodoHospedagem({
  checkin,
  checkout,
  noites,
}: {
  checkin: string;
  checkout: string;
  noites: number;
}) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>PERÍODO DA HOSPEDAGEM</Text>
      <Text style={styles.rotulo}>Check-in:</Text>
      <Text style={styles.valor}>{formatarDataHoraHospedagem(checkin)}</Text>
      <Text style={[styles.rotulo, { marginTop: 10 }]}>Check-out:</Text>
      <Text style={styles.valor}>{formatarDataHoraHospedagem(checkout)}</Text>
      <Text style={[styles.valor, { marginTop: 10 }]}>
        {noites} {noites === 1 ? "diária" : "diárias"}
      </Text>
    </View>
  );
}

function SecaoSuitesEHospedes({
  suites,
  referenciaIdade,
}: {
  suites: ReservaConfirmadaApi["suites"];
  referenciaIdade: Date;
}) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>SUÍTES E HÓSPEDES</Text>
      {suites.map((suite) => (
        <View key={suite.idReservaSuite} style={styles.cardSuite}>
          <Text style={styles.suiteNome}>{suite.nome}</Text>
          <Text style={styles.suiteOcupacao}>
            {formatarOcupacao(suite.adultos, suite.criancas)}
          </Text>

          <Text style={styles.hospedesTitulo}>Hóspedes</Text>
          {suite.hospedes.map((hospede, index) => {
            const isCrianca =
              hospede.tipo === "Crianca" || hospede.tipo === "crianca";
            let idadeLabel = "";
            if (isCrianca && hospede.dataNascimento) {
              try {
                const nascimento = parseISO(
                  toIsoString(hospede.dataNascimento).slice(0, 10),
                );
                idadeLabel = formatarIdadeAnos(
                  calcularIdadeEmAnos(nascimento, referenciaIdade),
                );
              } catch {
                idadeLabel = "";
              }
            }

            return (
              <View
                key={`${suite.idReservaSuite}-${index}`}
                style={styles.hospedeItem}
              >
                <Text style={styles.hospedeTipo}>
                  {labelTipoHospede(hospede.tipo)}
                </Text>
                <Text style={styles.hospedeNome}>{hospede.nome}</Text>
                {idadeLabel ? (
                  <Text style={styles.hospedeIdade}>{idadeLabel}</Text>
                ) : null}
              </View>
            );
          })}

          <Text style={styles.suiteValor}>
            Valor da suíte: {formatCurrency(suite.preco)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function SecaoResumoPagamento({
  preco,
  taxaServico,
  valorTotal,
  status,
}: {
  preco: number;
  taxaServico: number;
  valorTotal: number;
  status: string;
}) {
  const statusConfirmada =
    status === "Confirmada" || status.toLowerCase().includes("confirm");

  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>RESUMO DO PAGAMENTO</Text>
      <View style={styles.linhaResumo}>
        <Text style={styles.resumoLabel}>Subtotal:</Text>
        <Text style={styles.resumoValor}>{formatCurrency(preco)}</Text>
      </View>
      <View style={styles.linhaResumo}>
        <Text style={styles.resumoLabel}>Taxa de serviço:</Text>
        <Text style={styles.resumoValor}>{formatCurrency(taxaServico)}</Text>
      </View>
      <View style={[styles.linhaResumo, styles.linhaTotal]}>
        <Text style={styles.totalLabel}>Total pago:</Text>
        <Text style={styles.totalValor}>{formatCurrency(valorTotal)}</Text>
      </View>
      <Text style={[styles.rotulo, { marginTop: 14 }]}>Status:</Text>
      <Text
        style={[
          styles.statusTexto,
          { color: statusConfirmada ? colors.greenEscuro : colors.cinza },
        ]}
      >
        {statusConfirmada ? "✓ Reserva confirmada" : status}
      </Text>
    </View>
  );
}

/** Espaço reservado para próximas seções (regras, documentos, mapa, contatos). */
function SecaoFuturaPlaceholder() {
  return <View style={styles.secaoFutura} />;
}

export default function ReservaConfirmadaPage() {
  const route = useRoute();
  const params = (route.params || {}) as { idTransacao?: number | string };
  const idTransacao = Number(params.idTransacao);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<ReservaConfirmadaApi | null>(null);

  const carregar = useCallback(async () => {
    if (!idTransacao || !Number.isFinite(idTransacao) || idTransacao <= 0) {
      setDados(null);
      setErro("Reserva de hospedagem não encontrada.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);

    const response = await getReservaConfirmada(idTransacao);
    if (!response.success || !response.data) {
      setDados(null);
      setErro(
        response.message || "Reserva de hospedagem não encontrada.",
      );
      setLoading(false);
      return;
    }

    setDados(response.data);
    setLoading(false);
  }, [idTransacao]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  const referenciaIdade = dados?.reserva?.checkin
    ? (() => {
        try {
          return parseISO(toIsoString(dados.reserva.checkin));
        } catch {
          return new Date();
        }
      })()
    : new Date();

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" backgroundColor={colors.branco} />
      <BarMenu />

      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {loading ? (
              <View style={styles.estadoBox}>
                <ActivityIndicator size="large" color={colors.azul} />
                <Text style={styles.estadoTexto}>
                  Carregando dados da sua reserva...
                </Text>
              </View>
            ) : erro || !dados ? (
              <View style={styles.estadoBox}>
                <Text style={styles.estadoErro}>
                  {erro || "Reserva de hospedagem não encontrada."}
                </Text>
              </View>
            ) : (
              <>
                <SecaoHeaderSucesso numeroReserva={dados.reserva.id} />
                <SecaoPeriodoHospedagem
                  checkin={toIsoString(dados.reserva.checkin)}
                  checkout={toIsoString(dados.reserva.checkout)}
                  noites={dados.reserva.noites}
                />
                <SecaoSuitesEHospedes
                  suites={dados.suites}
                  referenciaIdade={referenciaIdade}
                />
                <SecaoResumoPagamento
                  preco={dados.reserva.preco}
                  taxaServico={dados.reserva.taxaServico}
                  valorTotal={dados.reserva.valorTotal}
                  status={dados.reserva.status}
                />
                <SecaoFuturaPlaceholder />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    paddingHorizontal: Platform.OS === "web" ? (width <= 1000 ? 12 : 24) : 12,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    alignItems: "center",
  },
  content: {
    width: "100%",
    maxWidth: 560,
  },
  secao: {
    backgroundColor: "rgba(255,255,255, 0.92)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  secaoFutura: {
    minHeight: 8,
    marginBottom: 24,
  },
  tituloSucesso: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.greenEscuro,
    textAlign: "center",
  },
  subtituloSucesso: {
    fontSize: 16,
    color: colors.cinza,
    textAlign: "center",
    marginTop: 8,
  },
  numeroReserva: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    color: colors.cinza,
  },
  secaoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.cinza,
    marginBottom: 12,
  },
  rotulo: {
    fontSize: 13,
    color: colors.cinza,
    fontWeight: "600",
  },
  valor: {
    fontSize: 15,
    color: colors.cinza,
    marginTop: 2,
  },
  cardSuite: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 14,
    marginTop: 10,
  },
  suiteNome: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.cinza,
  },
  suiteOcupacao: {
    fontSize: 14,
    color: colors.cinza,
    marginTop: 4,
  },
  hospedesTitulo: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
    color: colors.cinza,
  },
  hospedeItem: {
    marginBottom: 10,
  },
  hospedeTipo: {
    fontSize: 12,
    color: colors.cinza,
    fontWeight: "600",
  },
  hospedeNome: {
    fontSize: 15,
    color: colors.cinza,
  },
  hospedeIdade: {
    fontSize: 13,
    color: colors.cinza,
  },
  suiteValor: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 8,
    color: colors.cinza,
  },
  linhaResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  linhaTotal: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  resumoLabel: {
    fontSize: 15,
    color: colors.cinza,
  },
  resumoValor: {
    fontSize: 15,
    color: colors.cinza,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  totalValor: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.cinza,
  },
  statusTexto: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },
  estadoBox: {
    backgroundColor: "rgba(255,255,255, 0.92)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minHeight: 160,
    justifyContent: "center",
  },
  estadoTexto: {
    marginTop: 12,
    fontSize: 15,
    color: colors.cinza,
    textAlign: "center",
  },
  estadoErro: {
    fontSize: 15,
    color: colors.cinza,
    textAlign: "center",
  },
});
