import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
 * (/clientejango, /clientejangoadd, addlogin).
 */
export default function CadastroClienteRapido({
  onCadastrado,
  onCancelar,
  cpfInicial = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
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

      const busca = await apiAuth.getUsuario({
        filters: { cpf: formData.cpf },
      });
      const usuario = (busca.data as Usuario[])?.[0];
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

  return (
    <View style={styles.wrap}>
      <Text style={styles.titulo}>Cadastrar novo cliente</Text>
      <Text style={styles.hint}>
        Mesmo cadastro utilizado na Cortesia (Jango + pré-cadastro).
      </Text>

      <Text style={styles.label}>CPF</Text>
      <TextInput
        style={styles.input}
        value={formData.cpf}
        keyboardType="numeric"
        onChangeText={(t) => setField("cpf", formatCPF(t))}
        onBlur={() => {
          if (formData.cpf && isValidCPF(formData.cpf)) {
            buscarJangoPorCpf(formData.cpf);
          }
        }}
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
