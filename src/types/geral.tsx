// types/geral.ts

export interface QueryParams {
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  meta?: T;
  message?: string;
  // error?: string;
}

export interface Login {
  login: string;
  senha: string;
}

export interface Usuario {
  id?: number;
  login: string;
  email: string;
  senha?: string;
  nomeCompleto: string;
  confirmaSenha?: string;
  ativo?: boolean;
  alterarSenha?: boolean;
  idFuncaoUsuario?: number;
  token?: string;
}

export interface Cidade {
  id: number;
  descricao: string;
  uf: string;
}

export interface TipoIngresso {
  id: number;
  descricao: string;
  qtde: number;
}

export interface FormPropsEdit {
  id?: string;
  onClose?: () => void;
}

export interface Empresa {
  id: number;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoEstadual: string;
  inscricaoMunicipal: string;
  dataInicioAtividades: Date;
  cep: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  idCidade: number;
  logradouro?: string;
  telefone?: string;
  ultimoNumeroNFe?: number;
  ultimoNumeroNFCe?: number;
  numeroSerieNFe?: number;
  numeroSerieNFCe?: number;
  ambienteNFe: "Produção" | "Homologação";
  regimeTributario: "Simples Nacional" | "Regime Normal";
  tipo: "principal" | "filial";
  CSCID?: string;
  CSC?: string;
}

export interface ClienteFornecedor {
  id: number;
  tipo: "Cliente" | "Fornecedor";
  cnpjCpf: string;
  insEstadual?: string;
  insMunicipal?: string;
  razaoSocialNome: string;
  nomeFantasia?: string;
  consumidorFinal: "Sim" | "Não";
  contribuinte: "Sim" | "Não";
  cnae?: string;
  email?: string;
  telefoneFixo?: string;
  telefoneCelular?: string;
  telefoneAlternativo?: string;
  telefoneWhatsApp?: string;
  dataNascimento?: Date;
  sexo?: "Masculino" | "Feminino";
  nacionalidade?: string;
  tipoDocumento?: "RG" | "CPF" | "CNPJ" | "Passaporte" | "Outro";
  limiteCredito?: number;
  observacao?: string;
  empresaId: number;
}

export interface FuncaoUsuario {
  id: number;
  funcaoUsuario: string;
}

export interface FuncaoUsuarioAcesso {
  id?: number;
  idFuncaoSistema: number;
  idFuncaoUsuario: number;
  funcaoSistema_funcaoSistema?: string;
  funcaoUsuario_funcaoUsuario?: string;
}

export interface FuncaoSistema {
  id: number;
  funcaoSistema: string;
}

export interface UsuarioEmpresa {
  id?: number;
  usuarioId: number;
  empresaId: number;
  empresa_nomeFantasia?: string;
}

export interface Pais {
  name: string;
  alpha2Code: string;
}

export interface EnderecoClienteFornecedor {
  id?: number;
  clienteFornecedorId?: number;
  tipoEndereco: "Residencial" | "Comercial" | "Cobrança" | "Inscrição";
  rua?: string;
  uf?: string;
  cidadeId?: number;
  numero?: string;
  bairro?: string;
  cep?: string;
  inscricaoEstadual?: string;
  complemento?: string;
  observacao?: string;
  nomeCidade?: string;
}

export interface EstruturaTorneio {
  id: number;
  descricao: string;
  blindId?: number; // Chave estrangeira para associar com Blind
  empresaId: number;
}

export interface EstruturaTorneioItem {
  id: number;
  descricao: string;
  fichas: number;
  limiteJogador: boolean;
  qtdePorJogador: number;
  valorInscricao: number;
  taxaAdm: number;
  totalInscricao?: number;
  tipoRake: "%" | "R$";
  rake: number;
  estruturaId?: number;
}

export interface Blind {
  id: number;
  descricao: string; // Descrição geral dos blinds
  empresaId: number;
}

export interface BlindItem {
  id?: number;
  nivel: number; // Nível dos blinds (1, 2, 3, etc.)
  smallBlind: number; // Valor do Small Blind
  bigBlind: number; // Valor do Big Blind
  ante: number; // Valor do Ante (se houver)
  duracao: number; // Duração em minutos de cada nível
  blindId: number; // Chave estrangeira para associar com Blind
  order: number;
}

export interface Torneio {
  id: number;
  descricao: string;
  blindId?: number; // Chave estrangeira para associar com Blind
  empresaId: number;
  estruturaId?: number;
  dataInicio?: Date;
  status?: "Criado" | "parado" | "em andamento" | "finalizado";
  nivelAtualOrder?: number;
  tempoRestanteNivel?: number;
  blindItem?: any;
}

export interface TorneioItem {
  id: number;
  descricao: string;
  fichas: number;
  limiteJogador: boolean;
  qtdePorJogador: number;
  valorInscricao: number;
  taxaAdm: number;
  totalInscricao?: number;
  tipoRake?: "%" | "R$";
  rake: number;
  torneioId?: number; // Chave estrangeira para associar com Torneio
}

export interface TorneioBlindItem {
  id?: number;
  nivel: number; // Nível dos blinds (1, 2, 3, etc.)
  smallBlind: number; // Valor do Small Blind
  bigBlind: number; // Valor do Big Blind
  ante: number; // Valor do Ante (se houver)
  duracao: number; // Duração em minutos de cada nível
  order: number; // Ordem dos itens de blind
  torneioId: number; // Chave estrangeira para associar com Torneio
}

export interface Ticket {
  id: number;
  uid?: string;
  torneioId?: number;
  torneioItemId?: number;
  clienteId?: number;
  clienteIdPagou?: number;
  valorInscricao?: number;
  taxaAdm?: number;
  rake?: number;
  fichas?: number;
  usuarioId?: number;
  empresaId?: number;
  metodoPagamento?: "Pagamento" | "Crédito na Conta";
  status?: "DISPONÍVEL" | "PENDENTE" | "CANCELADO" | "UTILIZADO";
  ClienteFornecedor_razaoSocialNome?: string;
  torneioItem_descricao?: string;
}

export interface TicketHistorico {
  id?: number;
  ticketId: number;
  descricao: string;
  data: Date;
  usuarioId: number;
  status: "DISPONÍVEL" | "PENDENTE" | "CANCELADO" | "UTILIZADO";
}
