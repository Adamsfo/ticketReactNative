import React from "react";
import { Text, View } from "react-native";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import colors from "@/src/constants/colors";
import formatCurrency from "@/src/components/FormatCurrency";
import { ResumoPagamentoHospedagemData } from "@/src/lib/resumoPagamentoHospedagem";

function formatHospedesResumo(adultos: number, criancas: number): string {
  const partes: string[] = [];
  if (adultos > 0) {
    partes.push(`${adultos} ${adultos === 1 ? "adulto" : "adultos"}`);
  }
  if (criancas > 0) {
    partes.push(`${criancas} ${criancas === 1 ? "criança" : "crianças"}`);
  }
  return partes.join(", ");
}

function formatarDataHospedagem(valor: string): string {
  return formatInTimeZone(parseISO(valor), "America/Cuiaba", "dd/MM/yyyy HH:mm");
}

type ResumoPagamentoHospedagemProps = {
  resumo: ResumoPagamentoHospedagemData;
  /** Checkout site/link: oculta bloco financeiro detalhado (use mostrarResumoFinanceiro). */
  ocultarSubtotalETaxa?: boolean;
  /** Exibe subtotal, taxas adicionais, taxa de serviço e totais. */
  mostrarResumoFinanceiro?: boolean;
  /** Oculta linhas agregadas de taxas adicionais e taxa de serviço (subtotal/total permanecem). */
  ocultarTaxasAdicionaisETaxaServico?: boolean;
  footerExtra?: React.ReactNode;
};

function BlocoResumoFinanceiro({
  resumo,
  footerExtra,
  ocultarTaxasAdicionaisETaxaServico = false,
}: {
  resumo: ResumoPagamentoHospedagemData;
  footerExtra?: React.ReactNode;
  ocultarTaxasAdicionaisETaxaServico?: boolean;
}) {
  const temTaxasAdicionais =
    resumo.valorTaxasAdicionais > 0.009 || resumo.taxasAdicionais.length > 0;

  return (
    <View
      style={{
        flexDirection: "column",
        alignItems: "flex-end",
        paddingRight: 8,
        marginTop: 8,
      }}
    >
      <Text style={{ fontSize: 16, paddingBottom: 3 }}>
        Subtotal das suítes:{" "}
        <Text style={{ fontWeight: "bold" }}>
          {formatCurrency(resumo.subtotalGeral)}
        </Text>
      </Text>
      {ocultarTaxasAdicionaisETaxaServico
        ? resumo.taxasAdicionais.map((taxa) => (
            <Text
              key={taxa.id || `${taxa.descricao}-${taxa.ordem}`}
              style={{ fontSize: 15, paddingBottom: 2 }}
            >
              {taxa.descricao}:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {formatCurrency(taxa.valor)}
              </Text>
            </Text>
          ))
        : temTaxasAdicionais
          ? (
              <>
                {resumo.taxasAdicionais.map((taxa) => (
                  <Text
                    key={taxa.id || `${taxa.descricao}-${taxa.ordem}`}
                    style={{ fontSize: 15, paddingBottom: 2 }}
                  >
                    {taxa.descricao}:{" "}
                    <Text style={{ fontWeight: "bold" }}>
                      {formatCurrency(taxa.valor)}
                    </Text>
                  </Text>
                ))}
                <Text style={{ fontSize: 16, paddingBottom: 3 }}>
                  Taxas adicionais:{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {formatCurrency(resumo.valorTaxasAdicionais)}
                  </Text>
                </Text>
              </>
            )
          : null}
      {ocultarTaxasAdicionaisETaxaServico ? null : (
        <Text style={{ fontSize: 16, paddingBottom: 3 }}>
          Taxa de serviço:{" "}
          {resumo.taxaServicoDesconto && resumo.taxaServicoDesconto > 0 ? (
            <Text style={{ color: colors.greenEscuro, paddingHorizontal: 5 }}>
              Desconto: {formatCurrency(resumo.taxaServicoDesconto)}
            </Text>
          ) : null}
          <Text style={{ fontWeight: "bold" }}>
            {formatCurrency(resumo.taxaServico)}
          </Text>
        </Text>
      )}
      <Text style={{ fontSize: 16, paddingBottom: 3 }}>
        Total:{" "}
        <Text style={{ fontWeight: "bold" }}>
          {formatCurrency(resumo.valorTotal)}
        </Text>
      </Text>
      {resumo.valorTotalCobranca != null &&
      Math.abs(resumo.valorTotalCobranca - resumo.valorTotal) > 0.009 ? (
        <Text style={{ fontSize: 16, paddingBottom: 3, color: colors.azul }}>
          Valor desta cobrança:{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatCurrency(resumo.valorTotalCobranca)}
          </Text>
        </Text>
      ) : null}
      {footerExtra}
    </View>
  );
}

export default function ResumoPagamentoHospedagem({
  resumo,
  ocultarSubtotalETaxa = false,
  mostrarResumoFinanceiro = false,
  ocultarTaxasAdicionaisETaxaServico = false,
  footerExtra,
}: ResumoPagamentoHospedagemProps) {
  const exibirFinanceiro = mostrarResumoFinanceiro || !ocultarSubtotalETaxa;

  return (
    <View>
      <View style={{ marginHorizontal: 5, marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 6 }}>
          Período da hospedagem
        </Text>
        <Text style={{ fontSize: 14, paddingVertical: 2 }}>
          Check-in: {formatarDataHospedagem(resumo.checkin)}
        </Text>
        <Text style={{ fontSize: 14, paddingVertical: 2 }}>
          Check-out: {formatarDataHospedagem(resumo.checkout)}
        </Text>
        <Text style={{ fontSize: 14, paddingVertical: 2 }}>
          {resumo.noites} {resumo.noites === 1 ? "diária" : "diárias"}
        </Text>
      </View>

      {resumo.suites.map((suite) => (
        <View
          key={suite.nomeSuite}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 3,
            marginHorizontal: 5,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "bold" }}>
                Suíte {suite.nomeSuite}
              </Text>
              <Text style={{ fontSize: 14 }}>
                {formatHospedesResumo(suite.adultos, suite.criancas)}
              </Text>
            </View>
            <Text style={{ paddingHorizontal: 3, fontSize: 14 }}>
              {formatCurrency(suite.subtotal.toFixed(2))}
            </Text>
          </View>
        </View>
      ))}

      {exibirFinanceiro ? (
        <BlocoResumoFinanceiro
          resumo={resumo}
          footerExtra={footerExtra}
          ocultarTaxasAdicionaisETaxaServico={ocultarTaxasAdicionaisETaxaServico}
        />
      ) : (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingRight: 8,
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>Total</Text>
          <Text style={{ fontSize: 16, fontWeight: "bold" }}>
            {formatCurrency(
              resumo.valorTotalCobranca ?? resumo.valorTotal,
            )}
          </Text>
        </View>
      )}
      {!exibirFinanceiro && footerExtra ? (
        <View style={{ alignItems: "flex-end", paddingRight: 8, marginTop: 8 }}>
          {footerExtra}
        </View>
      ) : null}
    </View>
  );
}
