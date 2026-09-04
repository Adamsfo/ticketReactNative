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
    return await api.request<Usuario[]>("/usuario", "GET", null, params);
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
    tipo: string,
    login: boolean = false
  ): Promise<ApiResponse> {
    return api.request("/enviacodigoativacao", "POST", { info, tipo, login });
  }

  public async geraCodigoLogin(
    info: string,
    tipo: string,
    login: boolean = false
  ): Promise<ApiResponse> {
    return api.request("/geracodigologin", "POST", { info, tipo, login });
  }

  public async varificaAtivarConta(
    info: string,
    codigo: string,
    id: number
  ): Promise<ApiResponse> {
    return api.request("/verificaativaconta", "POST", { info, codigo, id });
  }

  public async loginCodigo(
    info: string,
    codigo: string,
    id: number
  ): Promise<ApiResponse> {
    return api.request("/loginemailcodigo", "POST", { info, codigo, id });
  }

  /** Magic login: POST /reserva/:token/autenticar — armazena JWT como o login normal. */
  public async autenticarReservaPublica(
    tokenReserva: string,
  ): Promise<ApiResponse<{ data: string }>> {
    const tokenLimpo = String(tokenReserva || "").trim();
    if (!tokenLimpo) {
      return { success: false, message: "Token inválido." };
    }

    const req = await api.request<{ data: string }>(
      `/reserva/${encodeURIComponent(tokenLimpo)}/autenticar`,
      "POST",
      {},
    );

    if (!req.success || !req.data?.data) {
      return {
        success: false,
        message: req.message || "Não foi possível autenticar pelo link.",
      };
    }

    const jwt = String(req.data.data);
    if (Platform.OS === "web") {
      localStorage.setItem("token", jwt);
    } else {
      await AsyncStorage.setItem("token", jwt);
    }

    return { success: true, data: req.data };
  }

  /** Lê JWT armazenado e retorna Usuario ativo (mesma rotina pós-login). */
  public async carregarUsuarioDaSessaoArmazenada(): Promise<Usuario | null> {
    const jwt =
      Platform.OS === "web"
        ? localStorage.getItem("token") || ""
        : (await AsyncStorage.getItem("token")) || "";

    if (!jwt) {
      return null;
    }

    const response = await this.getUsurioToken<Usuario>(jwt);
    if (
      !response ||
      typeof response !== "object" ||
      !("id" in response) ||
      !(response as Usuario).ativo
    ) {
      return null;
    }

    await AsyncStorage.setItem("usuario", JSON.stringify(response));
    return response as Usuario;
  }
}

export const apiAuth = new ApiAuth(); // Use o ambiente correto conforme necessário
