import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import formatCurrency from "@/src/components/FormatCurrency";
import colors from "@/src/constants/colors";
import {
  COR_RECEBIDO,
  COR_SALDO_PENDENTE,
  DadosFinanceirosReserva,
  deveExibirFinanceiroRecepcao,
  labelFormaPagamentoRecepcao,
  obterSaldoPendenteExibicao,
} from "@/src/lib/hospedagemPagamentoRecepcao";

type Props = {
  dados: DadosFinanceirosReserva | null | undefined;
  /** Exibe botão para quitar saldo (check-in / sheet). */
  mostrarReceberSaldo?: boolean;
  onReceberSaldo?: () => void;
  compact?: boolean;
};

/**
 * Resumo financeiro da recepção (somente ATENDENTE + saldo > 0).
 * Mesma regra em Suítes, Agenda/Sheet, Detalhes e Check-in.
 */
export default function ResumoFinanceiroRecepcao({
  dados,
  mostrarReceberSaldo = false,
  onReceberSaldo,
  compact = false,
}: Props) {
  if (!deveExibirFinanceiroRecepcao(dados) || !dados) {
    return null;
  }

  const valorPago = Number(dados.valorPago ?? 0);
  const saldo = obterSaldoPendenteExibicao(dados);
  const forma =
    dados.formaPagamentoLabel ||
    labelFormaPagamentoRecepcao(dados.formaPagamentoRecepcao);

  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      {valorPago > 0.009 ? (
        <Text style={[styles.recebido, compact && styles.textoCompact]}>
          Recebido:{forma ? ` ${forma}` : ""} {formatCurrency(valorPago)}
        </Text>
      ) : null}
      <Text style={[styles.pendente, compact && styles.textoCompact]}>
        {valorPago > 0.009
          ? `Falta receber: ${formatCurrency(saldo)}`
          : `💰 Saldo: ${formatCurrency(saldo)}`}
      </Text>
      {mostrarReceberSaldo && onReceberSaldo ? (
        <TouchableOpacity
          style={styles.btnReceber}
          onPress={(e) => {
            // Evita abrir o card/sheet ao tocar no botão (Agenda das Suítes).
            (e as { stopPropagation?: () => void })?.stopPropagation?.();
            onReceberSaldo();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.btnReceberTexto}>Receber Saldo</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 10,
    gap: 2,
  },
  boxCompact: {
    marginTop: 8,
  },
  recebido: {
    fontSize: 14,
    fontWeight: "700",
    color: COR_RECEBIDO,
  },
  pendente: {
    fontSize: 14,
    fontWeight: "700",
    color: COR_SALDO_PENDENTE,
  },
  textoCompact: {
    fontSize: 13,
  },
  btnReceber: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: colors.azul,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnReceberTexto: {
    color: colors.branco,
    fontWeight: "700",
    fontSize: 13,
  },
});
