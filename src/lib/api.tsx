import { ApiResponse, QueryParams } from "../types/geral";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Platform } from "react-native";

const BASEAPI = [
  "http://192.168.18.11:9000",
  // "http://15.229.161.174:9000",
  // "https://api.jangoingressos.com.br",
  "Homologação",
  "1.0.32",
  "https://jangoingressos.com.br/",
];

export const isAuthenticated = async (): Promise<boolean> => {
  if (Platform.OS === "web") {
    return (
      typeof window !== "undefined" && localStorage.getItem("token") !== null
    );
  } else {
    const token = await AsyncStorage.getItem("token");
    return token !== null;
  }
};

class Api {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildQueryString(params: QueryParams): string {
    const query = Object.entries(params)
      .map(([key, value]) => {
        if (typeof value === "object") {
          return `${encodeURIComponent(key)}=${encodeURIComponent(
            JSON.stringify(value)
          )}`;
        }
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join("&");
    return query ? `?${query}` : "";
  }

  public getBaseApi() {
    return BASEAPI[0];
  }

  public getBaseUrlSite() {
    return BASEAPI[3];
  }

  public async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    body?: any,
    params?: QueryParams
  ): Promise<ApiResponse<T>> {
    try {
      const token =
        Platform.OS === "web"
          ? localStorage.getItem("token") || ""
          : (await AsyncStorage.getItem("token")) || "";

      const queryString = this.buildQueryString(params || {});
      const response = await fetch(`${this.baseUrl}${endpoint}${queryString}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body && method !== "GET" ? JSON.stringify(body) : null,
      });
      let data: any;

      // Verifique se a resposta tem conteúdo antes de tentar fazer parse
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        data = await response.json();
      } else {
        data = {};
      }

      // if (response.status === 403) {
      //   if (Platform.OS === "web") {
      //     // window.location.href = "/login";
      //     window.location.href = "/";
      //   } else {
      //     // router.replace("/login");
      //     router.replace("/");
      //   }
      //   return { success: false, message: "Token inválido!" };
      // }

      if (data.status === "fail") {
        return { success: false, message: data.message };
      }

      if (method === "GET") {
        return { success: true, data: data.data, meta: data.meta };
      }

      // if (endpoint === "/login") {
      if (endpoint === "/") {
        return { success: true, data: data.data, meta: data.meta };
      }

      return { success: true, data: data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}

export const api = new Api(BASEAPI[0]); // Use o ambiente correto conforme necessário
