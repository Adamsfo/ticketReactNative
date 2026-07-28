import { api } from "./api";

export type UploadFileInput = {
  /** Base64 puro ou data-URL */
  file: string;
  prefixo?: string;
  /** Compat ImageUploader legado */
  Codigo?: string;
  mimeType?: string;
  nomeOriginal?: string;
};

export type UploadFileResult = {
  filename: string;
};

/**
 * Cliente único de upload do app.
 * Todos os módulos devem usar este helper (não chamar /upload direto).
 */
export function uploadsUrl(filename: string | null | undefined): string | null {
  if (!filename) return null;
  const safe = String(filename).replace(/^\/+/, "").replace(/^uploads\//, "");
  if (!safe) return null;
  return `${api.getBaseApi()}/uploads/${safe}`;
}

function friendlyUploadError(err: any): string {
  const dataMsg =
    err?.response?.data?.message ||
    (typeof err?.response?.data === "string" ? err.response.data : null);
  if (dataMsg) return String(dataMsg);

  const status = err?.response?.status;
  if (status === 413) {
    return "Arquivo muito grande. Envie uma imagem menor (até 3,5 MB).";
  }
  if (status === 400) {
    return "Não foi possível enviar o arquivo. Verifique o formato e tente novamente.";
  }
  if (err?.message?.includes("Network")) {
    return "Falha de conexão ao enviar o arquivo. Verifique a internet e tente de novo.";
  }
  return err?.message || "Falha ao enviar o arquivo.";
}

export async function uploadFile(
  input: UploadFileInput,
): Promise<UploadFileResult> {
  const axios = (await import("axios")).default;
  try {
    const response = await axios.post(
      api.getBaseApi() + "/upload",
      {
        file: input.file,
        prefixo: input.prefixo,
        Codigo: input.Codigo,
        mimeType: input.mimeType,
        nomeOriginal: input.nomeOriginal,
      },
      { headers: { "Content-Type": "application/json" } },
    );

    const filename = response?.data?.filename;
    if (!filename) {
      throw new Error("Upload concluído sem nome de arquivo. Tente novamente.");
    }
    return { filename: String(filename) };
  } catch (err: any) {
    throw new Error(friendlyUploadError(err));
  }
}
