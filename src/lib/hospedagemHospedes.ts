import { ItemCarrinhoHospedagem } from "@/src/components/ModalResumoPousada";

export const IDADE_MAXIMA_CRIANCA_HOSPEDAGEM = 12;

export const MSG_CRIANCA_ACIMA_IDADE =
  "A categoria Criança é válida somente até 12 anos. Para hóspedes acima de 12 anos, selecione Adulto.";

/** Responsável técnico sem CPF (ex.: "HÓSPEDE SEM CPF (HOSPEDIN)"). */
export function isHospedeSemCpf(nome?: string | null): boolean {
  const n = String(nome || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
  return n.includes("HOSPEDE SEM CPF") || n.includes("SEM CPF");
}

/** Texto de observações já mesclado pela API ou pelas partes importada/operador. */
export function textoObservacoesReserva(reserva: {
  observacoes?: string | null;
  observacaoImportada?: string | null;
  observacaoOperador?: string | null;
} | null | undefined): string {
  if (!reserva) return "";
  if (reserva.observacoes != null && String(reserva.observacoes).length > 0) {
    return String(reserva.observacoes);
  }
  return [reserva.observacaoImportada, reserva.observacaoOperador]
    .filter((parte) => String(parte || "").length > 0)
    .join("\n\n");
}

export type HospedeAdultoForm = {
  tipo: "adulto";
  ordem: number;
  nomeCompleto: string;
  idReservaHospede?: number;
};

export type HospedeCriancaForm = {
  tipo: "crianca";
  ordem: number;
  nomeCompleto: string;
  dataNascimento: Date | null;
  idReservaHospede?: number;
};

export type HospedesSuiteForm = {
  idEventoSuite: number;
  idReservaSuite?: number;
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

/**
 * Alinha a estrutura de hóspedes ao carrinho, preservando nomes já preenchidos
 * (voltar/avançar etapas ou alterar qtde não apaga o que o usuário digitou).
 */
export function sincronizarHospedesComCarrinho(
  atuais: HospedesSuiteForm[],
  itens: ItemCarrinhoHospedagem[],
): HospedesSuiteForm[] {
  return itens.map((item) => {
    const existente = atuais.find((h) => h.idEventoSuite === item.idEventoSuite);
    return {
      idEventoSuite: item.idEventoSuite,
      nomeSuite: item.nomeSuite,
      adultos: Array.from({ length: item.adultos }, (_, index) => {
        const ordem = index + 1;
        const prev = existente?.adultos.find((a) => a.ordem === ordem);
        return {
          tipo: "adulto" as const,
          ordem,
          nomeCompleto: prev?.nomeCompleto ?? "",
        };
      }),
      criancas: Array.from({ length: item.criancas }, (_, index) => {
        const ordem = index + 1;
        const prev = existente?.criancas.find((c) => c.ordem === ordem);
        return {
          tipo: "crianca" as const,
          ordem,
          nomeCompleto: prev?.nomeCompleto ?? "",
          dataNascimento: prev?.dataNascimento ?? null,
        };
      }),
    };
  });
}

/**
 * Nova reserva: preenche Adulto 1 da primeira suíte com o nome do cliente
 * responsável, sem sobrescrever se o campo já tiver valor.
 */
export function preencherPrimeiroAdultoSeVazio(
  hospedes: HospedesSuiteForm[],
  nomeCompleto: string,
): HospedesSuiteForm[] {
  const nome = String(nomeCompleto || "").trim();
  if (!nome || hospedes.length === 0) return hospedes;

  let aplicado = false;
  return hospedes.map((suite) => {
    if (aplicado || suite.adultos.length === 0) return suite;

    const adulto1 = suite.adultos.find((a) => a.ordem === 1);
    if (!adulto1) return suite;
    if (adulto1.nomeCompleto.trim()) {
      aplicado = true;
      return suite;
    }

    aplicado = true;
    return {
      ...suite,
      adultos: suite.adultos.map((adulto) =>
        adulto.ordem === 1 ? { ...adulto, nomeCompleto: nome } : adulto,
      ),
    };
  });
}

export type ValidarHospedesOptions = {
  /** Recepção/atendente: nome do hóspede é opcional. */
  nomeOpcional?: boolean;
};

export function validarHospedes(
  hospedes: HospedesSuiteForm[],
  options?: ValidarHospedesOptions,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const nomeOpcional = options?.nomeOpcional === true;

  hospedes.forEach((suite) => {
    suite.adultos.forEach((adulto) => {
      if (!nomeOpcional && !adulto.nomeCompleto.trim()) {
        errors[`${suite.idEventoSuite}-adulto-${adulto.ordem}-nome`] =
          "Informe o nome completo do adulto.";
      }
    });

    suite.criancas.forEach((crianca) => {
      if (!nomeOpcional && !crianca.nomeCompleto.trim()) {
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

export type ReservaPublicaHospedeApi = {
  id: number;
  nome: string;
  tipo: string;
  dataNascimento?: string | null;
};

export type ReservaPublicaSuiteApi = {
  idReservaSuite: number;
  idEventoSuite: number;
  nome: string;
  adultos: number;
  criancas: number;
  hospedes?: ReservaPublicaHospedeApi[];
};

function parseDataNascimentoApi(valor?: string | null): Date | null {
  if (!valor) return null;
  const base = String(valor).split("T")[0];
  const parsed = new Date(`${base}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Monta formulário a partir do GET público /reserva/:token. */
export function hospedesReservaPublicaParaForm(
  suites: ReservaPublicaSuiteApi[],
): HospedesSuiteForm[] {
  return suites.map((suite) => {
    const adultosDb = (suite.hospedes ?? []).filter(
      (hospede) => String(hospede.tipo).toLowerCase() === "adulto",
    );
    const criancasDb = (suite.hospedes ?? []).filter(
      (hospede) => String(hospede.tipo).toLowerCase() === "crianca",
    );

    return {
      idEventoSuite: suite.idEventoSuite,
      idReservaSuite: suite.idReservaSuite,
      nomeSuite: suite.nome,
      adultos: adultosDb.map((hospede, index) => ({
        tipo: "adulto" as const,
        ordem: index + 1,
        nomeCompleto: String(hospede.nome || "").trim(),
        idReservaHospede: hospede.id,
      })),
      criancas: criancasDb.map((hospede, index) => ({
        tipo: "crianca" as const,
        ordem: index + 1,
        nomeCompleto: String(hospede.nome || "").trim(),
        dataNascimento: parseDataNascimentoApi(hospede.dataNascimento),
        idReservaHospede: hospede.id,
      })),
    };
  });
}

export function hospedesFormParaSalvarPublico(hospedes: HospedesSuiteForm[]) {
  return {
    suites: hospedes.map((suite) => ({
      idReservaSuite: Number(suite.idReservaSuite),
      hospedes: [
        ...suite.adultos.map((adulto) => ({
          id: Number(adulto.idReservaHospede),
          nome: adulto.nomeCompleto.trim(),
        })),
        ...suite.criancas.map((crianca) => ({
          id: Number(crianca.idReservaHospede),
          nome: crianca.nomeCompleto.trim(),
          ...(crianca.dataNascimento
            ? { dataNascimento: crianca.dataNascimento.toISOString() }
            : {}),
        })),
      ],
    })),
  };
}
