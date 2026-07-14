import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";

export const IDADE_MAXIMA_CRIANCA_HOSPEDAGEM = 12;

export const MSG_CRIANCA_ACIMA_IDADE =
  "A categoria Criança é válida somente até 12 anos. Para hóspedes acima de 12 anos, selecione Adulto.";

export type HospedeAdultoForm = {
  tipo: "adulto";
  ordem: number;
  nomeCompleto: string;
};

export type HospedeCriancaForm = {
  tipo: "crianca";
  ordem: number;
  nomeCompleto: string;
  dataNascimento: Date | null;
};

export type HospedesSuiteForm = {
  idEventoSuite: number;
  nomeSuite: string;
  adultos: HospedeAdultoForm[];
  criancas: HospedeCriancaForm[];
};

/** Idade em anos civis completos (considera dia, mês e ano). */
export function calcularIdadeEmAnos(
  dataNascimento: Date,
  referencia: Date = new Date(),
): number {
  const nasc = new Date(
    dataNascimento.getFullYear(),
    dataNascimento.getMonth(),
    dataNascimento.getDate(),
  );
  const ref = new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate(),
  );

  let idade = ref.getFullYear() - nasc.getFullYear();
  const mes = ref.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && ref.getDate() < nasc.getDate())) {
    idade -= 1;
  }
  return idade;
}

export function formatarIdadeAnos(idade: number): string {
  return `${idade} ${idade === 1 ? "ano" : "anos"}`;
}

export function criarHospedesIniciais(
  itens: ItemCarrinhoHospedagem[],
): HospedesSuiteForm[] {
  return itens.map((item) => ({
    idEventoSuite: item.idEventoSuite,
    nomeSuite: item.nomeSuite,
    adultos: Array.from({ length: item.adultos }, (_, index) => ({
      tipo: "adulto" as const,
      ordem: index + 1,
      nomeCompleto: "",
    })),
    criancas: Array.from({ length: item.criancas }, (_, index) => ({
      tipo: "crianca" as const,
      ordem: index + 1,
      nomeCompleto: "",
      dataNascimento: null,
    })),
  }));
}

export function validarHospedes(
  hospedes: HospedesSuiteForm[],
): Record<string, string> {
  const errors: Record<string, string> = {};

  hospedes.forEach((suite) => {
    suite.adultos.forEach((adulto) => {
      if (!adulto.nomeCompleto.trim()) {
        errors[`${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`] =
          "Informe o nome completo do adulto.";
      }
    });

    suite.criancas.forEach((crianca) => {
      if (!crianca.nomeCompleto.trim()) {
        errors[`${suite.idEventoSuite}-crianca-${crianca.ordem}-nome`] =
          "Informe o nome completo da criança.";
      }
      if (!crianca.dataNascimento) {
        errors[`${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`] =
          "Informe a data de nascimento da criança.";
      } else {
        const idade = calcularIdadeEmAnos(crianca.dataNascimento);
        if (idade > IDADE_MAXIMA_CRIANCA_HOSPEDAGEM) {
          errors[`${suite.idEventoSuite}-crianca-${crianca.ordem}-nasc`] =
            MSG_CRIANCA_ACIMA_IDADE;
        }
      }
    });
  });

  return errors;
}

export type HospedeCheckoutPayload = {
  nome: string;
  tipo: "Adulto" | "Crianca";
  dataNascimento?: string;
};

export function hospedesSuiteParaCheckout(
  suite: HospedesSuiteForm,
): HospedeCheckoutPayload[] {
  const adultos = suite.adultos.map((adulto) => ({
    nome: adulto.nomeCompleto.trim(),
    tipo: "Adulto" as const,
  }));

  const criancas = suite.criancas.map((crianca) => ({
    nome: crianca.nomeCompleto.trim(),
    tipo: "Crianca" as const,
    dataNascimento: crianca.dataNascimento?.toISOString(),
  }));

  return [...adultos, ...criancas];
}
