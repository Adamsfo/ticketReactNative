import {
  validarHospedes,
  type HospedesSuiteForm,
} from "./hospedagemHospedes";

function suiteComAdultos(
  idEventoSuite: number,
  adultos: Array<{ ordem: number; nomeCompleto: string }>,
): HospedesSuiteForm {
  return {
    idEventoSuite,
    nomeSuite: "Teste",
    adultos: adultos.map((a) => ({
      tipo: "adulto" as const,
      ordem: a.ordem,
      nomeCompleto: a.nomeCompleto,
    })),
    criancas: [],
  };
}

describe("validarHospedes — site/conferência", () => {
  it("exige nome de todos os adultos por padrão", () => {
    const errors = validarHospedes([
      suiteComAdultos(1, [
        { ordem: 1, nomeCompleto: "João" },
        { ordem: 2, nomeCompleto: "" },
        { ordem: 3, nomeCompleto: "" },
      ]),
    ]);

    expect(errors["1-adulto-2-nome"]).toBeDefined();
    expect(errors["1-adulto-3-nome"]).toBeDefined();
    expect(errors["1-adulto-1-nome"]).toBeUndefined();
  });
});

describe("validarHospedes — recepção (nomeOpcional: true)", () => {
  it("3 adultos com somente 1 nome → sem erros de nome", () => {
    const errors = validarHospedes(
      [
        suiteComAdultos(1, [
          { ordem: 1, nomeCompleto: "Titular" },
          { ordem: 2, nomeCompleto: "" },
          { ordem: 3, nomeCompleto: "" },
        ]),
      ],
      { nomeOpcional: true },
    );

    expect(Object.keys(errors).length).toBe(0);
  });

  it("todos os nomes vazios → sem erros de nome", () => {
    const errors = validarHospedes(
      [
        suiteComAdultos(1, [
          { ordem: 1, nomeCompleto: "" },
          { ordem: 2, nomeCompleto: "" },
        ]),
      ],
      { nomeOpcional: true },
    );

    expect(Object.keys(errors).length).toBe(0);
  });

  it("criança sem nome mas com data válida → sem erro de nome", () => {
    const errors = validarHospedes(
      [
        {
          idEventoSuite: 1,
          nomeSuite: "Teste",
          adultos: [],
          criancas: [
            {
              tipo: "crianca",
              ordem: 1,
              nomeCompleto: "",
              dataNascimento: new Date(2020, 0, 15),
            },
          ],
        },
      ],
      { nomeOpcional: true },
    );

    expect(errors["1-crianca-1-nome"]).toBeUndefined();
    expect(errors["1-crianca-1-nasc"]).toBeUndefined();
  });
});
