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

function isWebMobile(): boolean {
  if (typeof navigator === "undefined") return false;

  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function montarUrlWhatsAppWaMe(
  telefone: string | null | undefined,
  mensagem?: string | null,
): string | null {
  const numero = normalizarTelefoneWhatsAppLink(telefone);
  if (!numero) return null;

  const texto =
    mensagem != null && String(mensagem).trim() !== ""
      ? `?text=${encodeURIComponent(String(mensagem))}`
      : "";
  return `https://wa.me/${numero}${texto}`;
}

function fecharJanelaWhatsApp(janela: Window | null | undefined) {
  if (!janela || janela.closed) return;
  try {
    janela.close();
  } catch {
    /* ignore */
  }
}

/**
 * Desktop web: abre janela em branco no gesto do usuário (antes de await),
 * para depois navegar para wa.me sem bloqueio de popup.
 * Mobile / app nativo: retorna null (usa Linking ou location.assign).
 */
export function prepararJanelaWhatsAppPosAsync(): Window | null {
  if (Platform.OS !== "web" || isWebMobile()) return null;
  if (typeof window === "undefined") return null;
  try {
    return window.open("about:blank", "_blank");
  } catch {
    return null;
  }
}

export type AbrirWhatsAppClienteOptions = {
  janelaPreAberta?: Window | null;
};

export function abrirWhatsAppCliente(
  telefone: string | null | undefined,
  mensagem?: string | null,
  options?: AbrirWhatsAppClienteOptions,
): boolean {
  const url = montarUrlWhatsAppWaMe(telefone, mensagem);
  if (!url) {
    fecharJanelaWhatsApp(options?.janelaPreAberta);
    return false;
  }

  if (Platform.OS === "web") {
    if (isWebMobile()) {
      window.location.assign(url);
    } else {
      const janela = options?.janelaPreAberta;
      if (janela && !janela.closed) {
        janela.location.href = url;
        janela.focus?.();
      } else {
        const opened = window.open(url, "_blank");
        if (!opened) return false;
      }
    }
  } else {
    Linking.openURL(url).catch((err) =>
      console.error("Erro ao abrir o WhatsApp", err),
    );
  }

  return true;
}

export type WhatsappLinkPagamentoManualPayload = {
  telefone?: string | null;
  mensagemWhatsApp: string;
  linkPagamento?: string;
};

/** Abre wa.me com a mensagem do link de pagamento (fonte: backend). */
export function abrirWhatsAppLinkPagamentoManual(
  payload: WhatsappLinkPagamentoManualPayload | null | undefined,
  options?: AbrirWhatsAppClienteOptions,
): { aberto: boolean; mensagemAviso?: string } {
  if (!payload?.mensagemWhatsApp) {
    fecharJanelaWhatsApp(options?.janelaPreAberta);
    return {
      aberto: false,
      mensagemAviso: "Dados do WhatsApp indisponíveis.",
    };
  }

  const aberto = abrirWhatsAppCliente(
    payload.telefone,
    payload.mensagemWhatsApp,
    options,
  );

  if (!aberto) {
    return {
      aberto: false,
      mensagemAviso:
        "Não foi possível abrir o WhatsApp (telefone inválido ou ausente). O link de pagamento continua disponível no detalhe da reserva.",
    };
  }

  return { aberto: true };
}
