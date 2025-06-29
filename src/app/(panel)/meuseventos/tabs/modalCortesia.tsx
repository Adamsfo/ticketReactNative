import React, { useEffect, useState } from "react";
import {
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  TextInput,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { apiGeral } from "@/src/lib/geral";
import {
  EventoIngresso,
  Ingresso,
  QueryParams,
  Usuario,
} from "@/src/types/geral";
import colors from "@/src/constants/colors";
import { apiAuth } from "@/src/lib/auth";
import Accordion from "@/src/components/Accordion";
import CounterTicket from "@/src/components/CounterTicket";
import { api } from "@/src/lib/api";
import { useCart } from "@/src/contexts_/CartContext";
import { useAuth } from "@/src/contexts_/AuthContext";

const { width } = Dimensions.get("window");

interface ModalMsgProps {
  idEvento: number;
  onClose: () => void;
}

export default function ModalCortesia({ idEvento, onClose }: ModalMsgProps) {
  const endpointApiIngressos = "/eventoingresso";
  const { state, dispatch } = useCart();
  const { user } = useAuth();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [infoUsuario, setInfoUsuario] = useState<string>("");
  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Usuario>({
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    confirmaSenha: "",
    cpf: "",
    telefone: "",
    id_cliente: 0,
  });

  const handleChange = (field: keyof Usuario, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const isValidCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf[i]) * (10 - i);
    }
    let firstDigit = (sum * 10) % 11;
    if (firstDigit === 10 || firstDigit === 11) firstDigit = 0;
    if (firstDigit !== Number(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf[i]) * (11 - i);
    }
    let secondDigit = (sum * 10) % 11;
    if (secondDigit === 10 || secondDigit === 11) secondDigit = 0;
    if (secondDigit !== Number(cpf[10])) return false;

    return true;
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não for número
    const onlyNumbers = value.replace(/\D/g, "");

    // Aplica a máscara do CPF
    return onlyNumbers
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
      .slice(0, 14); // Garante que não passe de 14 caracteres (formato final)
  };

  const formatPhone = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "");

    if (onlyNumbers.length <= 10) {
      // Formato: (99) 9999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      // Formato: (99) 99999-9999
      return onlyNumbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleGetClienteJango = async (cpf: string) => {
    const resCliente = await apiGeral.createResource<any>("/clientejango", {
      cpf: cpf?.replace(/\D/g, "") ?? "",
    });

    const cliente = resCliente.data;

    if (cliente) {
      const nomePartes = cliente.nome.trim().split(" ");
      const primeiroNome = nomePartes[0];
      const sobrenome = nomePartes.slice(1).join(" "); // junta o restante como sobrenome

      setFormData({
        ...formData,
        nomeCompleto: primeiroNome,
        sobreNome: sobrenome,
        telefone: cliente.telefone_celular
          ? formatPhone(cliente.telefone_celular)
          : "",
        email: cliente.email ? cliente.email : "",
        id_cliente: cliente.id_cliente,
      });
    }
  };

  const handleBuscarUsuario = async () => {
    formData.id = 0;
    formData.id_cliente = 0;
    formData.nomeCompleto = "";
    formData.sobreNome = "";
    formData.email = "";
    formData.telefone = "";

    setInfoUsuario("");

    if (!formData.cpf) {
      setInfoUsuario("O cpf é obrigatório.");
      return;
    } else if (!isValidCPF(formData.cpf)) {
      setInfoUsuario("CPF inválido. Verifique e tente novamente.");
      return;
    }

    const vUserResponse = await apiAuth.getUsuario({
      filters: { cpf: formData.cpf },
    });
    console.log("vUser", vUserResponse);

    const vUser: Usuario = vUserResponse.data[0];

    if (!vUser) {
      setInfoUsuario(
        "Usuário não encontrado. Preencha os dados para fazer o pre-cadastro."
      );
      handleGetClienteJango(formData.cpf);
      return;
    }

    setFormData(vUser);

    setInfoUsuario("Usuário encontrado.");
  };

  const isEmail = (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  // Filtrar os diferentes TipoIngresso_descricao
  const tipoIngressoDescricoes = Array.from(
    new Set(
      registrosEventoIngressos.map(
        (ingresso) => ingresso.TipoIngresso_descricao
      )
    )
  );

  useEffect(() => {
    if (idEvento > 0) {
      setFormData({
        login: "",
        email: "",
        senha: "",
        nomeCompleto: "",
        confirmaSenha: "",
        cpf: "",
        telefone: "",
        id_cliente: 0,
      });
      getRegistrosIngressos({
        filters: { idEvento: idEvento, status: "Ativo" },
      });
    }
  }, [idEvento]);

  const getRegistrosIngressos = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    console.log("Registros Ingressos:", registrosData);
    setRegistrosEventoIngressos(registrosData);
  };

  const handleCadastrarUsuario = async () => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    let dados = formData;

    if (dados.id_cliente === 0) {
      try {
        const resCliente = await apiGeral.createResource<any>(
          "/clientejangoadd",
          {
            cpf: (dados.cpf ?? "").replace(/\D/g, ""),
            nomeCompleto: dados.nomeCompleto,
            sobreNome: dados.sobreNome,
            telefone: (dados.telefone ?? "").replace(/\D/g, ""),
            email: dados.email,
          }
        );

        const cliente = resCliente.data;

        if (cliente) {
          dados = {
            ...dados,
            id_cliente: cliente.id_cliente,
          };
          setFormData({
            ...formData,
            id_cliente: cliente.id_cliente,
          });
        }
      } catch (error) {
        console.error("Network request failed:", error);
        setErrors({
          api: "Erro ao registrar usuário no Jango. Tente novamente mais tarde.",
        });
        setLoading(false);
      }
    }

    try {
      const endpoint = api.getBaseUrlSite();
      const response = await apiAuth.addlogin({
        ...dados,
        login: dados.email,
        endpoint: endpoint,
        preCadastro: true,
      });

      if (!response.success) {
        setErrors({
          api: response.message || "Erro desconhecido ao registrar usuário.",
        });
      } else {
        setFormData({
          ...response.data,
        });

        console.log(
          "Usuário cadastrado com sucesso id :",
          response.data.id,
          response.data.id
        );

        setInfoUsuario("Usuário cadastrado com sucesso!\n\n");
      }
    } catch (error) {
      console.error("Network request failed:", error);
      console.log(error);
      setErrors({
        api: "Erro ao registrar usuário. Tente novamente mais tarde." + error,
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.cpf) {
      newErrors.cpf = "O cpf é obrigatório.";
    } else if (!isValidCPF(formData.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    if (!formData.email) newErrors.email = "O email é obrigatório.";
    if (!formData.telefone) newErrors.telefone = "O telefone é obrigatório.";
    if (!formData.sobreNome) newErrors.sobreNome = "A sobrenome é obrigatória.";
    if (!formData.nomeCompleto)
      newErrors.nomeCompleto = "Nome Completo é obrigatório.";
    if (formData.email) {
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Por favor, insira um email válido.";
      }
    }

    return newErrors;
  };

  const gerarIngressos = async () => {
    if (state.items.length > 0) {
      for (let i = 0; i < state.items.length; i++) {
        const item = state.items[i];
        for (let j = 0; j < item.qtde; j++) {
          let json = await apiGeral.createResource<Ingresso>("/ingresso", {
            idEvento: item.eventoIngresso.idEvento,
            idEventoIngresso: item.eventoIngresso.id,
            idTipoIngresso: item.eventoIngresso.idTipoIngresso,
            idUsuario: formData.id,
            idUsuarioCriouIngresso: user?.id,
            tipo: "Cortesia",
            status: "Confirmado",
            nomeImpresso:
              formData.nomeCompleto +
              " " +
              (formData.sobreNome ? formData.sobreNome : ""),
            // idTransacao: idTransacao,
          });
          let ingresso = json.data as unknown as Ingresso;
        }
      }
    }
  };

  const handleGerarCortesia = async () => {
    if (formData.id === 0) {
      setInfoUsuario(
        "Usuário não encontrado. Preencha os dados para fazer o pre-cadastro."
      );
      return;
    }

    setLoading(true);
    await gerarIngressos();
    zerarIngressos();
    onClose();
    setLoading(false);
  };

  const zerarIngressos = () => {
    state.items.map((ingresso) => {
      dispatch({ type: "REMOVE_ITEM", id: ingresso.id });
    });
  };

  return (
    <TouchableWithoutFeedback>
      <View style={styles.modalContainer}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity>
                {/* <Feather name="share" size={30} color="#212743" /> */}
              </TouchableOpacity>
              <Text style={styles.title}>Cortesia</Text>

              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={30} color="#212743" />
              </TouchableOpacity>
            </View>

            <View style={styles.area}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>CPF</Text>
                <View style={styles.grupoInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="CPF..."
                    keyboardType="default"
                    value={formData.cpf}
                    onChangeText={(text) => {
                      const formatted = formatCPF(text);
                      handleChange("cpf", formatted);
                    }}
                    onBlur={() => {
                      if ((formData.cpf?.length ?? 0) === 14) {
                        handleBuscarUsuario();
                      }
                    }}
                  ></TextInput>
                  <TouchableOpacity
                    style={{
                      position: "absolute",
                      right: 10,
                      top: 12,
                    }}
                    onPress={handleBuscarUsuario}
                  >
                    <Feather name="search" size={24} color="#212743" />
                  </TouchableOpacity>
                </View>
                {infoUsuario && (
                  <Text
                    style={
                      infoUsuario === "Usuário encontrado." ||
                      infoUsuario === "Usuário cadastrado com sucesso!\n\n"
                        ? styles.labelSucess
                        : styles.labelError
                    }
                  >
                    {infoUsuario}
                  </Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome..."
                  value={formData.nomeCompleto}
                  onChangeText={(text) =>
                    (formData.id ?? 0) > 0
                      ? ""
                      : handleChange("nomeCompleto", text)
                  }
                ></TextInput>
                {errors.nomeCompleto && (
                  <Text style={styles.labelError}>{errors.nomeCompleto}</Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Sobrenome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sobrenome..."
                  value={formData.sobreNome}
                  onChangeText={(text) =>
                    formData.id ? "" : handleChange("sobreNome", text)
                  }
                ></TextInput>
                {errors.sobreNome && (
                  <Text style={styles.labelError}>{errors.sobreNome}</Text>
                )}
              </View>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Digite seu Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) =>
                    formData.id ? "" : handleChange("email", text)
                  }
                  onBlur={() => {
                    if (!isEmail(formData.email)) {
                      formData.id
                        ? ""
                        : handleChange("email", formatCPF(formData.email));
                    }
                  }}
                />
                {errors.email && (
                  <Text style={styles.labelError}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.grupoInput}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Telefone..."
                  keyboardType="numeric"
                  value={formData.telefone}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    handleChange("telefone", formatted);
                  }}
                />
                {errors.telefone && (
                  <Text style={styles.labelError}>{errors.telefone}</Text>
                )}
              </View>

              {formData.id === 0 && (
                <View
                  style={[styles.area, { marginBottom: 20, marginTop: -10 }]}
                >
                  <TouchableOpacity
                    style={styles.newButton}
                    onPress={handleCadastrarUsuario}
                  >
                    <Text style={styles.newButtonText}>
                      {loading ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.laranjado}
                        />
                      ) : null}
                      Cadastrar Usuário
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ width: "100%" }}>
                {tipoIngressoDescricoes.map((descricao, index) => (
                  <Accordion
                    index={index}
                    key={index}
                    title={descricao || "Descrição indisponível"}
                  >
                    {registrosEventoIngressos
                      .filter(
                        (ingresso) =>
                          ingresso.TipoIngresso_descricao === descricao
                      )
                      .map((ingresso, idx) => (
                        // <Text key={idx}>{ingresso.nome}</Text>
                        <View
                          key={ingresso.id}
                          style={{ flexDirection: "column" }}
                        >
                          <CounterTicket data={ingresso} />
                        </View>
                      ))}
                  </Accordion>
                ))}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <TouchableOpacity
                  style={styles.newButton}
                  onPress={handleGerarCortesia}
                >
                  <Text style={styles.newButtonText}>
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.laranjado}
                      />
                    ) : null}
                    Gerar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fundo semi-transparente
    paddingHorizontal:
      Platform.OS === "web" ? (width <= 1000 ? 10 : "35%") : 10,
  },
  container: {
    // width: Platform.OS === "web" ? "50%" : "90%", // Largura do modal
    // marginHorizontal: 20,
    width: "100%",
    height: "90%",
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
    paddingVertical: 8,
  },
  area: {
    alignItems: "center",
    width: "100%",
    alignSelf: "stretch",
  },
  grupoInput: {
    alignItems: "flex-start",
    width: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212743",
  },
  mensagem: {
    fontSize: 16,
    color: "#1a7a7a7",
    marginBottom: 30,
    marginTop: 10,
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 16,
    width: Platform.OS === "web" ? (width <= 1000 ? "100%" : "100%") : "100%",
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
  },
  labelSucess: {
    color: colors.green,
    marginTop: -18,
    marginBottom: 18,
  },
  newButton: {
    backgroundColor: colors.azul,
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    width: Platform.OS === "web" ? 200 : 100,
    alignItems: "center",
  },
  newButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
