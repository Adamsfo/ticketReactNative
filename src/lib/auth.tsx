import { router } from "expo-router";
import { ApiResponse, Login, QueryParams, Usuario } from "../types/geral";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

class ApiAuth {
  public async login(data: Login): Promise<ApiResponse> {
    const req = await api.request<ApiResponse>("/login", "POST", data);
    if (req.success && req.data) {
      if (Platform.OS === "web") {
        localStorage.setItem("token", req.data.data as string);
      } else {
        await AsyncStorage.setItem("token", req.data.data as any);
      }
      return { success: true, data: req.data };
    } else {
      return { success: false, message: req.message };
    }
  }

  // Método para registro de usuário
  public async addlogin(data: Usuario): Promise<ApiResponse> {
    return api.request("/addlogin", "POST", data);
  }

  // Método para logout
  public async logout(): Promise<void> {
    // if (Platform.OS === "web") {
    //   localStorage.removeItem("token");
    // } else {
    await AsyncStorage.removeItem("token");
    // }
  }

  //Usuario
  public async getUsuario(params?: QueryParams): Promise<ApiResponse> {
    return api.request<Usuario[]>("/usuario", "GET", null, params);
  }

  // Método get Usuario por token
  public async getUsurioToken<T>(token: string): Promise<ApiResponse<T[]>> {
    const request = await api.request<T[]>(
      `/usuario?filters={"token":"${token}"}`,
      "GET"
    );
    const registro = request.data && (request.data[0] as T);

    if (!registro) {
      return { success: false, message: "Usuário não encontrado" };
    }

    return registro;
  }
}

export const apiAuth = new ApiAuth(); // Use o ambiente correto conforme necessário
