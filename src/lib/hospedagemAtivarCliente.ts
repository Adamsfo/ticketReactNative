import { apiGeral } from "@/src/lib/geral";
import { Usuario } from "@/src/types/geral";

export type CadastroClienteHospedagemMeta = {
  criadoAgora: boolean;
};

/**
 * Ativa o usuário recém-cadastrado na Hospedagem (`ativo = true`).
 * Etapa complementar: falhas são registradas e não interrompem o fluxo.
 */
export async function ativarClienteRecemCadastradoHospedagem(
  usuario: Usuario,
  meta: CadastroClienteHospedagemMeta
): Promise<void> {
  if (!meta.criadoAgora) {
    return;
  }

  const id = Number(usuario.id);
  if (!Number.isFinite(id) || id <= 0) {
    console.error(
      "Hospedagem: cliente recém-cadastrado sem id válido para ativação.",
      usuario
    );
    return;
  }

  try {
    const resp = await apiGeral.updateResorce<Usuario>("/usuario", {
      id,
      ativo: true,
    });

    if (resp && (resp as { success?: boolean }).success === false) {
      console.error(
        "Hospedagem: falha ao ativar cliente recém-cadastrado:",
        (resp as { message?: string }).message
      );
    }
  } catch (error) {
    console.error(
      "Hospedagem: erro ao ativar cliente recém-cadastrado:",
      error
    );
  }
}
