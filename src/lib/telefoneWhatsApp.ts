import { Linking, Platform } from "react-native";

/**
 * Normaliza telefone brasileiro para link wa.me (somente dígitos, com DDI 55).
 * Não altera o valor armazenado — uso apenas para abertura do WhatsApp.
 */
export function normalizarTelefoneWhatsAppLink(
  telefone: string | null | undefined,
): string | null {
  const cleaned = String(telefone ?? "").replace(/\D/g, "");
  if (cleaned.length < 10) return null;

  const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  // 55 + DDD (2) + número (8 ou 9)
  if (withCountry.length < 12 || withCountry.length > 13) return null;

  return withCountry;
}

export function abrirWhatsAppCliente(
  telefone: string | null | undefined,
): boolean {
  const numero = normalizarTelefoneWhatsAppLink(telefone);
  if (!numero) return false;

  const url = `https://wa.me/${numero}`;

  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    Linking.openURL(url).catch((err) =>
      console.error("Erro ao abrir o WhatsApp", err),
    );
  }

  return true;
}
