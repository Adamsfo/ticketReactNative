import {
  MSG_CRIANCA_ACIMA_IDADE,
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

function suiteComCrianca(
  dataNascimento: Date | null,
): HospedesSuiteForm {
  return {
    idEventoSuite: 1,
    nomeSuite: "Teste",
    adultos: [],
    criancas: [
      {
        tipo: "crianca",
        ordem: 1,
        nomeCompleto: "João",
        dataNascimento,
      },
    ],
  };
}

describe("validarHospedes — site/conferência", () => {
  it("criança sem data → inválido", () => {
    const errors = validarHospedes([suiteComCrianca(null)]);
    expect(errors["1-crianca-1-nasc"]).toBeDefined();
  });

  it("criança com data válida → válido", () => {
    const errors = validarHospedes([
      suiteComCrianca(new Date(2020, 0, 15)),
    ]);
    expect(errors["1-crianca-1-nasc"]).toBeUndefined();
  });

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

  it("criança sem data com dataNascimentoCriancaOpcional → válido", () => {
    const errors = validarHospedes([suiteComCrianca(null)], {
      nomeOpcional: true,
      dataNascimentoCriancaOpcional: true,
    });
    expect(errors["1-crianca-1-nasc"]).toBeUndefined();
  });

  it("criança com data válida na recepção → válido", () => {
    const errors = validarHospedes(
      [suiteComCrianca(new Date(2020, 0, 15))],
      {
        nomeOpcional: true,
        dataNascimentoCriancaOpcional: true,
      },
    );
    expect(errors["1-crianca-1-nasc"]).toBeUndefined();
  });

  it("criança com idade acima do limite na recepção → inválido", () => {
    const errors = validarHospedes(
      [suiteComCrianca(new Date(2010, 0, 1))],
      {
        nomeOpcional: true,
        dataNascimentoCriancaOpcional: true,
      },
    );
    expect(errors["1-crianca-1-nasc"]).toBe(MSG_CRIANCA_ACIMA_IDADE);
  });
});
