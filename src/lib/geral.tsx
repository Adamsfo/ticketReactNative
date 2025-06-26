import {
  ApiResponse,
  Cidade,
  ClienteFornecedor,
  Empresa,
  QueryParams,
} from "../types/geral";
import { api } from "../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

class ApiGeral {
  // Método genérico para buscar recursos
  public async getResourceById<T>(
    endpoint: string,
    id: number
  ): Promise<ApiResponse<T[]>> {
    const request = await api.request<T[]>(
      `${endpoint}?filters={"id":"${id}"}`,
      "GET"
    );
    const registro = request.data && (request.data[0] as T);

    if (!registro) {
      throw new Error(`${endpoint} não encontrado(a)`);
    }

    return registro;
  }

  public async getResourceByUidTicket<T>(
    uid: string
  ): Promise<ApiResponse<T[]>> {
    const request = await api.request<T[]>(
      `/ticket?filters={"uid":"${uid}"}`,
      "GET"
    );
    const registro = request.data && (request.data[0] as T);

    if (!registro) {
      throw new Error(`ticket não encontrado(a)`);
    }

    return registro;
  }

  // Método genérico para buscar recursos
  public async getResource<T>(
    endpoint: string,
    params?: QueryParams
  ): Promise<ApiResponse<T[]>> {
    return await api.request<T[]>(endpoint, "GET", null, params);
  }

  // Método genérico para criar um recurso
  public async createResource<T>(
    endpoint: string,
    data: any
  ): Promise<ApiResponse> {
    const usuario = JSON.parse((await AsyncStorage.getItem("usuario")) || "{}");

    // Só adiciona idUsuario se não estiver presente em data
    const requestData = {
      ...data,
      ...(data?.idUsuario == null && { idUsuario: usuario.id }),
    };

    return api.request<T>(endpoint, "POST", requestData);
  }

  public async updateResorce<T>(
    endpoint: string,
    data: any
  ): Promise<ApiResponse> {
    return await api.request<T>(endpoint + `/${data.id}`, "PUT", data);
  }

  public async deleteResorce<T>(
    endpoint: string,
    id: string
  ): Promise<ApiResponse> {
    return await api.request<T>(endpoint + `/${id}`, "DELETE");
  }

  public async iniciarTorneio<T>(id: string): Promise<ApiResponse> {
    return await api.request<T>("/torneio/iniciar", "POST");
  }

  public async pararTorneio<T>(id: string): Promise<ApiResponse> {
    return await api.request<T>("/torneio/parar", "POST");
  }
}

export const apiGeral = new ApiGeral();
