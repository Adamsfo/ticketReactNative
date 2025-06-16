import { router } from "expo-router";
import { ApiResponse, Login, QueryParams, Usuario } from "../types/geral";
import { api } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

class ApiAuth {
  public async login(data: Login): Promise<ApiResponse> {
    const req = await api.request<ApiResponse>("/login", "POST", data);
    // setAuth(req.data as Usuario); // Define o novo usuário após o login
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
      `/usuario?filters={"token":"${token}", "ativo":1}`,
      "GET"
    );
    const registro = request.data && (request.data[0] as T);

    if (!registro) {
      return { success: false, message: "Usuário não encontrado" };
    }

    return registro;
  }

  public async emailrecuperarsenha(
    email: string,
    endpoint: string
  ): Promise<ApiResponse> {
    return api.request("/emailrecuperarsenha", "POST", { email, endpoint });
  }

  public async enviaCodigoAtivacao(
    info: string,
    tipo: string
  ): Promise<ApiResponse> {
    return api.request("/enviacodigoativacao", "POST", { info, tipo });
  }

  public async varificaAtivarConta(
    info: string,
    codigo: string,
    id: number
  ): Promise<ApiResponse> {
    return api.request("/verificaativaconta", "POST", { info, codigo, id });
  }
}

export const apiAuth = new ApiAuth(); // Use o ambiente correto conforme necessário
