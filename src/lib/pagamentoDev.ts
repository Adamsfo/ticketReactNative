import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { api } from "./api";
import { ApiResponse } from "../types/geral";

export function isDevPaymentEnabled(): boolean {
  return __DEV__ || process.env.EXPO_PUBLIC_DEV_PAYMENT === "true";
}

/**
 * Dispara apenas a aprovação da transação já existente.
 * Backend reutiliza exatamente `transacaoPaga` (fluxo real pós-pagamento).
 */
export async function simularPagamentoDev(
  idTransacao: number,
): Promise<ApiResponse<{ idTransacao: number; status: string }>> {
  try {
    const token =
      Platform.OS === "web"
        ? localStorage.getItem("token") || ""
        : (await AsyncStorage.getItem("token")) || "";

    const response = await fetch(
      `${api.getBaseApi()}/pagamento/dev/aprovar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idTransacao }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.status === "fail") {
      return {
        success: false,
        message:
          data.message ||
          `Erro ao simular pagamento (HTTP ${response.status}).`,
      };
    }

    return {
      success: true,
      data: data.data ?? data,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Erro ao simular pagamento.",
    };
  }
}
