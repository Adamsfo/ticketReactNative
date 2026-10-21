import { api } from "@/src/lib/api";
import { criarFechamentoExcepcionalAdmin } from "@/src/lib/hospedagemFechamentos";

jest.mock("@/src/lib/api", () => ({
  api: {
    request: jest.fn(),
  },
}));

const requestMock = api.request as jest.Mock;

describe("hospedagemFechamentos API", () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it("criarFechamentoExcepcionalAdmin usa POST e extrai data do body", async () => {
    const fechamento = {
      id: 1,
      idEvento: 10,
      dataInicio: "2026-12-24",
      dataFim: "2026-12-26",
      motivo: "Natal",
      ativo: true,
      idUsuarioCriacao: 1,
      idUsuarioAtualizacao: 1,
      createdAt: "2026-10-21T12:00:00.000Z",
      updatedAt: "2026-10-21T12:00:00.000Z",
    };

    requestMock.mockResolvedValue({
      success: true,
      data: { data: fechamento },
    });

    const result = await criarFechamentoExcepcionalAdmin({
      idEvento: 10,
      dataInicio: "2026-12-24",
      dataFim: "2026-12-26",
      motivo: "Natal",
    });

    expect(requestMock).toHaveBeenCalledWith(
      "/hospedagem/fechamentos-excepcionais",
      "POST",
      {
        idEvento: 10,
        dataInicio: "2026-12-24",
        dataFim: "2026-12-26",
        motivo: "Natal",
      },
    );
    expect(result).toEqual(fechamento);
  });

  it("propaga mensagem de erro da API", async () => {
    requestMock.mockResolvedValue({
      success: false,
      message: "idEvento é obrigatório.",
    });

    await expect(
      criarFechamentoExcepcionalAdmin({
        idEvento: 0,
        dataInicio: "2026-12-24",
        dataFim: "2026-12-26",
      }),
    ).rejects.toThrow("idEvento é obrigatório.");
  });
});
