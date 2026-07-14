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
  footerExtra?: React.ReactNode;
};

export default function ResumoPagamentoHospedagem({
  resumo,
  footerExtra,
}: ResumoPagamentoHospedagemProps) {
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

      <View
        style={{
          flexDirection: "column",
          alignItems: "flex-end",
          paddingRight: 8,
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 16, paddingBottom: 3 }}>
          Subtotal:{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatCurrency(resumo.subtotalGeral)}
          </Text>
        </Text>
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
        <Text style={{ fontSize: 16 }}>
          Total:{" "}
          <Text style={{ fontWeight: "bold" }}>
            {formatCurrency(resumo.valorTotal)}
          </Text>
        </Text>
        {footerExtra}
      </View>
    </View>
  );
}
