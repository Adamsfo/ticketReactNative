import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import colors from "@/src/constants/colors";
import { apiGeral } from "@/src/lib/geral";
import { apiAuth } from "@/src/lib/auth";
import { Usuario } from "@/src/types/geral";

type Props = {
  onCadastrado: (usuario: Usuario) => void;
  onCancelar: () => void;
  cpfInicial?: string;
  /** Texto livre da reserva — somente exibição, sem parsing ou preenchimento automático. */
  observacoesReserva?: string | null;
  /** Hospedagem: cadastro/consulta somente no MySQL/site, sem Jango/Firebird. */
  cadastroSomenteMysql?: boolean;
};

function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10 || firstDigit === 11) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10 || secondDigit === 11) secondDigit = 0;
  return secondDigit === Number(cpf[10]);
}

function formatCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
    .slice(0, 14);
}

function formatPhone(value: string) {
  const onlyNumbers = value.replace(/\D/g, "");
  if (onlyNumbers.length <= 10) {
    return onlyNumbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }
  return onlyNumbers
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Cadastro rápido de cliente — mesmas APIs da Cortesia
 * (/clientejango, /clientejangoadd, addlogin), ou somente MySQL quando cadastroSomenteMysql.
 */
export default function CadastroClienteRapido({
  onCadastrado,
  onCancelar,
  cpfInicial = "",
  observacoesReserva,
  cadastroSomenteMysql = false,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const textoObservacoes = observacoesReserva ?? "";
  const mostrarObservacoes = textoObservacoes.length > 0;
  const layoutLadoALado = mostrarObservacoes && windowWidth >= 768;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioMysqlEncontrado, setUsuarioMysqlEncontrado] = useState(false);
  const [ultimoCpfConsultado, setUltimoCpfConsultado] = useState("");
  const [formData, setFormData] = useState<Usuario>({
    id: 0,
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    sobreNome: "",
    confirmaSenha: "",
    cpf: cpfInicial ? formatCPF(cpfInicial) : "",
    telefone: "",
    id_cliente: 0,
  });

  const setField = (field: keyof Usuario, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buscarJangoPorCpf = async (cpf: string) => {
    const resCliente = await apiGeral.createResource<any>("/clientejango", {
      cpf: cpf.replace(/\D/g, ""),
    });
    const cliente = resCliente.data;
    if (!cliente) return;
    const nomePartes = String(cliente.nome || "").trim().split(" ");
    setFormData((prev) => ({
      ...prev,
      nomeCompleto: nomePartes[0] || "",
      sobreNome: nomePartes.slice(1).join(" "),
      telefone: cliente.telefone_celular
        ? formatPhone(cliente.telefone_celular)
        : prev.telefone,
      email: cliente.email || prev.email,
      id_cliente: cliente.id_cliente || 0,
    }));
  };

  const buscarMysqlPorCpf = async (cpf: string) => {
    const cpfDigits = cpf.replace(/\D/g, "");
    setUltimoCpfConsultado(cpfDigits);

    const busca = await apiAuth.getUsuario({
      filters: { cpf },
    });
    const usuario = (busca.data as Usuario[])?.[0];

    if (usuario?.id) {
      setFormData((prev) => ({
        ...prev,
        id: usuario.id,
        nomeCompleto: usuario.nomeCompleto || "",
        sobreNome: usuario.sobreNome || "",
        telefone: usuario.telefone
          ? formatPhone(String(usuario.telefone))
          : prev.telefone,
        email: usuario.email || "",
        id_cliente: usuario.id_cliente || 0,
        cpf: formatCPF(cpf),
      }));
      setUsuarioMysqlEncontrado(true);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      id: 0,
      id_cliente: 0,
    }));
    setUsuarioMysqlEncontrado(false);
  };

  const handleCpfBlur = () => {
    if (!formData.cpf || !isValidCPF(formData.cpf)) {
      return;
    }
    if (cadastroSomenteMysql) {
      void buscarMysqlPorCpf(formData.cpf);
    } else {
      void buscarJangoPorCpf(formData.cpf);
    }
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value);
    const newDigits = formatted.replace(/\D/g, "");

    setFormData((prev) => {
      const prevDigits = String(prev.cpf ?? "").replace(/\D/g, "");
      if (!cadastroSomenteMysql || newDigits === prevDigits) {
        return { ...prev, cpf: formatted };
      }
      return {
        ...prev,
        cpf: formatted,
        id: 0,
        id_cliente: 0,
      };
    });

    if (cadastroSomenteMysql && newDigits !== ultimoCpfConsultado) {
      setUsuarioMysqlEncontrado(false);
    }
  };

  const buscarUsuarioPorCpf = async (): Promise<Usuario | null> => {
    const busca = await apiAuth.getUsuario({
      filters: { cpf: formData.cpf },
    });
    return (busca.data as Usuario[])?.[0] ?? null;
  };

  const handleCadastrarMysql = async () => {
    if (Number(formData.id) > 0 && usuarioMysqlEncontrado) {
      const usuario = await buscarUsuarioPorCpf();
      if (!usuario?.id) {
        setErro("Cliente não encontrado. Consulte o CPF novamente.");
        return;
      }
      onCadastrado(usuario);
      return;
    }

    const resp = await apiAuth.addlogin({
      ...formData,
      login: formData.email,
      senha: String(formData.cpf ?? "").replace(/\D/g, "").slice(0, 6) || "123456",
      preCadastro: true,
    } as Usuario & { preCadastro?: boolean });

    if (!resp.success) {
      setErro(resp.message || "Não foi possível cadastrar o cliente.");
      return;
    }

    const usuario = await buscarUsuarioPorCpf();
    if (!usuario?.id) {
      setErro("Cliente cadastrado, mas não foi possível selecioná-lo.");
      return;
    }
    onCadastrado(usuario);
  };

  const handleCadastrar = async () => {
    setErro(null);
    if (!formData.cpf || !isValidCPF(formData.cpf)) {
      setErro("Informe um CPF válido.");
      return;
    }
    if (!formData.nomeCompleto?.trim()) {
      setErro("Informe o nome.");
      return;
    }
    if (!formData.email || !isEmail(formData.email)) {
      setErro("Informe um e-mail válido.");
      return;
    }
    if (!formData.telefone || formData.telefone.replace(/\D/g, "").length < 10) {
      setErro("Informe um telefone válido.");
      return;
    }

    setLoading(true);
    try {
      if (cadastroSomenteMysql) {
        await handleCadastrarMysql();
        return;
      }

      if (!formData.id_cliente) {
        await apiGeral.createResource("/clientejangoadd", {
          cpf: formData.cpf.replace(/\D/g, ""),
          nome: `${formData.nomeCompleto} ${formData.sobreNome || ""}`.trim(),
          email: formData.email,
          telefone_celular: formData.telefone.replace(/\D/g, ""),
        });
      }

      const resp = await apiAuth.addlogin({
        ...formData,
        login: formData.email,
        senha: formData.cpf.replace(/\D/g, "").slice(0, 6) || "123456",
        preCadastro: true,
      } as Usuario & { preCadastro?: boolean });

      if (!resp.success) {
        setErro(resp.message || "Não foi possível cadastrar o cliente.");
        return;
      }

      const usuario = await buscarUsuarioPorCpf();
      if (!usuario?.id) {
        setErro("Cliente cadastrado, mas não foi possível selecioná-lo.");
        return;
      }
      onCadastrado(usuario);
    } catch {
      setErro("Erro ao cadastrar cliente.");
    } finally {
      setLoading(false);
    }
  };

  const hintTexto = cadastroSomenteMysql
    ? "Cadastro do cliente no site de ingressos. A integração com o Jango ocorre posteriormente, no registro de chegada."
    : "Mesmo cadastro utilizado na Cortesia (Jango + pré-cadastro).";

  return (
    <View style={styles.wrap}>
      <Text style={styles.titulo}>Cadastrar novo cliente</Text>
      <Text style={styles.hint}>{hintTexto}</Text>

      <View
        style={[styles.corpo, layoutLadoALado && styles.corpoDesktop]}
      >
        <View style={[styles.formCol, layoutLadoALado && styles.formColDesktop]}>
          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            value={formData.cpf}
            keyboardType="numeric"
            onChangeText={handleCpfChange}
            onBlur={handleCpfBlur}
            placeholder="000.000.000-00"
          />

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={formData.nomeCompleto}
            onChangeText={(t) => setField("nomeCompleto", t.toUpperCase())}
            placeholder="Nome"
          />

          <Text style={styles.label}>Sobrenome</Text>
          <TextInput
            style={styles.input}
            value={formData.sobreNome}
            onChangeText={(t) => setField("sobreNome", t.toUpperCase())}
            placeholder="Sobrenome"
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(t) => setField("email", t)}
            placeholder="email@exemplo.com"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={formData.telefone}
            keyboardType="phone-pad"
            onChangeText={(t) => setField("telefone", formatPhone(t))}
            placeholder="(00) 00000-0000"
          />
        </View>

        {mostrarObservacoes ? (
          <View
            style={[
              styles.obsCol,
              layoutLadoALado ? styles.obsColDesktop : styles.obsColMobile,
            ]}
          >
            <Text style={styles.obsTitulo}>Observações da reserva</Text>
            <ScrollView
              style={[
                styles.obsScroll,
                layoutLadoALado && styles.obsScrollDesktop,
              ]}
              contentContainerStyle={styles.obsScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              <Text style={styles.obsTexto}>{textoObservacoes}</Text>
            </ScrollView>
          </View>
        ) : null}
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.btns}>
        <TouchableOpacity style={styles.btnSec} onPress={onCancelar}>
          <Text style={styles.btnSecTexto}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnPri}
          onPress={handleCadastrar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.branco} />
          ) : (
            <Text style={styles.btnPriTexto}>Salvar cliente</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  titulo: { fontSize: 18, fontWeight: "700", color: colors.cinza, marginBottom: 4 },
  hint: { fontSize: 12, color: "#777", marginBottom: 10 },
  corpo: { gap: 16 },
  corpoDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  formCol: { gap: 6, flex: 1 },
  formColDesktop: { flex: 1, minWidth: 260 },
  obsCol: { gap: 6 },
  obsColMobile: { marginTop: 4 },
  obsColDesktop: { flex: 1, minWidth: 260, minHeight: 0 },
  obsTitulo: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  obsScroll: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  obsScrollDesktop: {
    maxHeight: 420,
    flexGrow: 1,
  },
  obsScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  obsTexto: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#666", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.branco,
    color: colors.cinza,
  },
  erro: { color: colors.red, marginTop: 8, fontSize: 13 },
  btns: { flexDirection: "row", gap: 10, marginTop: 16 },
  btnSec: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnSecTexto: { fontWeight: "600", color: colors.cinza },
  btnPri: {
    flex: 1.3,
    backgroundColor: colors.azul,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    minHeight: 46,
    justifyContent: "center",
  },
  btnPriTexto: { fontWeight: "700", color: colors.branco },
});
