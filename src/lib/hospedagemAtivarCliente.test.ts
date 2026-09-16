import {
  ativarClienteRecemCadastradoHospedagem,
  CadastroClienteHospedagemMeta,
} from "./hospedagemAtivarCliente";
import { apiGeral } from "@/src/lib/geral";
import { Usuario } from "@/src/types/geral";

jest.mock("@/src/lib/geral", () => ({
  apiGeral: {
    updateResorce: jest.fn(),
  },
}));

const usuarioBase: Usuario = {
  id: 42,
  login: "a@b.com",
  email: "a@b.com",
  nomeCompleto: "Teste",
  sobreNome: "Cliente",
  cpf: "123.456.789-00",
};

describe("ativarClienteRecemCadastradoHospedagem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("não chama PUT quando criadoAgora é false", async () => {
    await ativarClienteRecemCadastradoHospedagem(usuarioBase, {
      criadoAgora: false,
    });

    expect(apiGeral.updateResorce).not.toHaveBeenCalled();
  });

  it("ativa com PUT /usuario quando criadoAgora é true", async () => {
    (apiGeral.updateResorce as jest.Mock).mockResolvedValue({ success: true });

    await ativarClienteRecemCadastradoHospedagem(usuarioBase, {
      criadoAgora: true,
    });

    expect(apiGeral.updateResorce).toHaveBeenCalledWith("/usuario", {
      id: 42,
      ativo: true,
    });
  });

  it("não interrompe o fluxo quando o PUT falha", async () => {
    (apiGeral.updateResorce as jest.Mock).mockRejectedValue(
      new Error("network")
    );

    await expect(
      ativarClienteRecemCadastradoHospedagem(usuarioBase, {
        criadoAgora: true,
      })
    ).resolves.toBeUndefined();
  });

  it("não ativa sem id válido", async () => {
    await ativarClienteRecemCadastradoHospedagem(
      { ...usuarioBase, id: 0 },
      { criadoAgora: true }
    );

    expect(apiGeral.updateResorce).not.toHaveBeenCalled();
  });
});
