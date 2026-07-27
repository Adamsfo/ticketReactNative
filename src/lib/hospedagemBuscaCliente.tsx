import { Usuario } from "@/src/types/geral";
import React from "react";
import { StyleSheet, Text, TextStyle } from "react-native";
import colors from "@/src/constants/colors";

/** Nome + sobrenome (estrutura atual do Usuario). */
export function nomeCompletoCliente(u: {
  nomeCompleto?: string | null;
  sobreNome?: string | null;
}): string {
  return [u.nomeCompleto, u.sobreNome]
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Relevância da busca:
 * 1) nome iniciando pelo texto
 * 2) sobrenome contendo o texto
 * 3) código / CPF / telefone (sem máscara)
 */
export function scoreRelevanciaCliente(u: Usuario, busca: string): number {
  const q = busca.trim().toLowerCase();
  if (!q) return 0;

  const nome = String(u.nomeCompleto || "")
    .trim()
    .toLowerCase();
  const sobrenome = String(u.sobreNome || "")
    .trim()
    .toLowerCase();
  const completo = nomeCompletoCliente(u).toLowerCase();
  const digits = q.replace(/\D/g, "");
  const hasLetters = /[A-Za-zÀ-ÿ]/.test(busca);

  if (!hasLetters && digits.length > 0) {
    const cpf = String(u.cpf || "").replace(/\D/g, "");
    const tel = String(u.telefone || "").replace(/\D/g, "");
    const id = String(u.id ?? "");
    const idCliente = String(u.id_cliente ?? "");
    if (id === digits || idCliente === digits) return 98;
    if (id.includes(digits) || idCliente.includes(digits)) return 92;
    if (cpf.includes(digits) || tel.includes(digits)) return 85;
  }

  if (nome.startsWith(q)) return 100;
  if (completo.startsWith(q)) return 95;
  if (sobrenome.startsWith(q)) return 88;
  if (sobrenome.includes(q)) return 75;
  if (nome.includes(q)) return 65;
  if (completo.includes(q)) return 55;
  return 10;
}

export function ordenarClientesPorRelevancia(
  lista: Usuario[],
  busca: string,
): Usuario[] {
  const q = busca.trim();
  return [...lista].sort((a, b) => {
    const diff = scoreRelevanciaCliente(b, q) - scoreRelevanciaCliente(a, q);
    if (diff !== 0) return diff;
    return nomeCompletoCliente(a).localeCompare(nomeCompletoCliente(b), "pt-BR");
  });
}

type HighlightProps = {
  text: string;
  query: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
};

/** Destaca em negrito a parte que bate com a pesquisa (case-insensitive). */
export function TextoComDestaque({
  text,
  query,
  style,
  highlightStyle,
}: HighlightProps) {
  const q = query.trim();
  if (!q || !text) {
    return <Text style={style}>{text}</Text>;
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === q.toLowerCase();
        return (
          <Text
            key={`${index}-${part}`}
            style={isMatch ? [style, styles.destaque, highlightStyle] : undefined}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  destaque: {
    fontWeight: "800",
    color: colors.azul,
  },
});
