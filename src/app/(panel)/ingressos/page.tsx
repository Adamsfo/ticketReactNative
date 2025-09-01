import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  Ingresso,
  Produtor,
  QueryParams,
  Usuario,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Accordion from "@/src/components/Accordion";
import CounterTicket from "@/src/components/CounterTicket";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import { useCart } from "@/src/contexts_/CartContext";
import { useAuth } from "@/src/contexts_/AuthContext";
import { apiAuth } from "@/src/lib/auth";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/evento";
  const endpointApiIngressos = "/eventoingresso";
  const { isPDV, user } = useAuth();
  const route = useRoute();
  const { state, dispatch } = useCart();
  const navigation = useNavigation() as any;
  const { id } = route.params as { id: number };
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [infoUsuario, setInfoUsuario] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<Evento>({
    id: 0,
    nome: "",
    descricao: "",
    imagem: "",
    data_hora_inicio: new Date(),
    data_hora_fim: new Date(),
    endereco: "",
    idUsuario: 0,
    idProdutor: 0,
  });

  const [formDataUsuario, setFormDataUsuario] = useState<Usuario>({
    id: 0,
    login: "",
    email: "",
    senha: "",
    nomeCompleto: "",
    confirmaSenha: "",
    cpf: "",
    telefone: "",
    id_cliente: 0,
  });

  const [registrosEventoIngressos, setRegistrosEventoIngressos] = useState<
    EventoIngresso[]
  >([]);
  const [modalVisible, setModalVisible] = useState(true);
  const data = [{ label: "Nome", content: "Nome" }];

  const getRegistros = async (id: number) => {
    if (id > 0) {
      const response = await apiGeral.getResourceById<Evento>(endpointApi, id);

      let data = response as unknown as Evento;
      data.data_hora_inicio = new Date(data.data_hora_inicio.toString());
      data.data_hora_fim = new Date(data.data_hora_fim.toString());
      getRegistrosIngressos({
        filters: { idEvento: id, status: isPDV ? "PDV" : "Ativo" },
      });
      setFormData(data as Evento);
    }
  };
  const getRegistrosIngressos = async (params: QueryParams) => {
    const response = await apiGeral.getResource<EventoIngresso>(
      endpointApiIngressos,
      { ...params, pageSize: 200 }
    );
    const registrosData = response.data ?? [];

    let novosRegistros = await Promise.all(
      registrosData.map(async (ingresso) => {
        // Aqui você pode fazer algo com cada ingresso, se necessário
        const ingressosConfirmados = await apiGeral.getResource<Ingresso>(
          "/ingresso",
          {
            filters: {
              idEventoIngresso: ingresso.id,
              status: "Confirmado",
            },
          }
        );
        ingresso.ingressosConfirmados = ingressosConfirmados.data?.length ?? 0;

        return ingresso;
      })
    );

    setRegistrosEventoIngressos(novosRegistros);
  };

  useEffect(() => {
    zerarIngressos();
    dispatch({ type: "REMOVE_TRANSACAO" });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      zerarIngressos();
      setFormDataUsuario({
        id: 0,
        login: "",
        email: "",
        senha: "",
        nomeCompleto: "",
        sobreNome: "",
        confirmaSenha: "",
        cpf: "",
        telefone: "",
        id_cliente: 0,
      });
      if (id > 0) {
        getRegistros(id);
        // getRegistrosIngressos({ filters: { idEvento: id } });
      }
      if (id > 1 && isPDV && user) {
        setFormDataUsuario(user);
      }
    }, [id])
  );

  // Filtrar os diferentes TipoIngresso_descricao
  const tipoIngressoDescricoes = Array.from(
    new Set(
      registrosEventoIngressos.map(
        (ingresso) => ingresso.TipoIngresso_descricao
      )
    )
  );

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const zerarIngressos = () => {
    state.items.map((ingresso) => {
      dispatch({ type: "REMOVE_ITEM", id: ingresso.id });
    });
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

  const handleChangeUsuario = (field: keyof Usuario, value: string) => {
    setFormDataUsuario({ ...formDataUsuario, [field]: value });
  };

  const handleBuscarUsuario = async () => {
    setErrors({});
    formDataUsuario.id = 0;
    formDataUsuario.id_cliente = 0;
    formDataUsuario.nomeCompleto = "";
    formDataUsuario.sobreNome = "";
    formDataUsuario.email = "";
    formDataUsuario.telefone = "";

    setInfoUsuario("");

    if (!formDataUsuario.cpf) {
      setInfoUsuario("O cpf é obrigatório.");
      return;
    } else if (!isValidCPF(formDataUsuario.cpf)) {
      setInfoUsuario("CPF inválido. Verifique e tente novamente.");
      return;
    }

    const vUserResponse = await apiAuth.getUsuario({
      filters: { cpf: formDataUsuario.cpf },
    });
    console.log("vUser", vUserResponse);

    const vUser: Usuario = vUserResponse.data[0];

    if (!vUser) {
      setInfoUsuario(
        "Usuário não encontrado. Preencha os dados para fazer o pre-cadastro."
      );
      handleGetClienteJango(formDataUsuario.cpf);
      return;
    }

    setFormDataUsuario(vUser);

    setInfoUsuario("Usuário encontrado.");
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

      setFormDataUsuario({
        ...formDataUsuario,
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

  useEffect(() => {
    if (
      formDataUsuario.id_cliente &&
      formDataUsuario.id_cliente > 0 &&
      formDataUsuario.id === 0
    ) {
      handleCadastrarUsuario(formDataUsuario);
    }
  }, [formDataUsuario.id_cliente]);

  const isEmail = (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formDataUsuario.cpf) {
      newErrors.cpf = "O cpf é obrigatório.";
    } else if (!isValidCPF(formDataUsuario.cpf)) {
      newErrors.cpf = "CPF inválido.";
    }
    // if (!formDataUsuario.email) newErrors.email = "O email é obrigatório.";
    if (!formDataUsuario.telefone)
      newErrors.telefone = "O telefone é obrigatório.";
    if (!formDataUsuario.sobreNome)
      newErrors.sobreNome = "A sobrenome é obrigatória.";
    if (!formDataUsuario.nomeCompleto)
      newErrors.nomeCompleto = "Nome Completo é obrigatório.";
    // if (formDataUsuario.email) {
    //   if (!emailRegex.test(formDataUsuario.email)) {
    //     newErrors.email = "Por favor, insira um email válido.";
    //   }
    // }

    return newErrors;
  };

  const handleCadastrarUsuario = async (dados: Usuario) => {
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    // let dados = formDataUsuario;

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
          // setFormDataUsuario({
          //   ...formDataUsuario,
          //   id_cliente: cliente.id_cliente,
          // });
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

      console.log("Response from addlogin:", response);
      if (response.data.message) {
        setErrors({
          api: response.message || "Erro desconhecido ao registrar usuário.",
        });
        setInfoUsuario("Erro ao cadastrar usuário:" + response.data.message);
        return;
      } else {
        setFormDataUsuario({
          ...response.data,
        });

        console.log("Usuário cadastrado com sucesso id :", response.data.id);

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

  return (
    <LinearGradient
      colors={[colors.branco, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />

      <View style={styles.container}>
        <View style={styles.areaStep}>
          <StepIndicator currentStep={1} />
        </View>
        <Text style={styles.titulo}>Ingressos</Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={{
            borderRadius: 8,
            flexGrow: 1,
            height: "100%",
          }}
        >
          <View style={styles.areaEvento}>
            <Image
              source={{ uri: api.getBaseApi() + "/uploads/" + formData.imagem }}
              style={styles.imagem}
            />
            <View style={styles.areaTextoEvento}>
              <Text style={styles.tituloEvento}>{formData.nome}</Text>
              {/* <Text style={styles.enderecoEvento}>{formData.endereco}</Text> */}
            </View>
          </View>

          {isPDV && id === 1 && (
            <View style={styles.areaUsuario}>
              <View style={styles.grupoInput}>
                <Text style={styles.label}>CPF</Text>
                <View style={styles.grupoInput}>
                  <TextInput
                    style={styles.input}
                    placeholder="CPF..."
                    keyboardType="numeric"
                    value={formDataUsuario.cpf}
                    onChangeText={(text) => {
                      const formatted = formatCPF(text);
                      handleChangeUsuario("cpf", formatted);
                    }}
                    onBlur={() => {
                      if ((formDataUsuario.cpf?.length ?? 0) === 14) {
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
                  value={formDataUsuario.nomeCompleto}
                  onChangeText={(text) =>
                    (formDataUsuario.id ?? 0) > 0
                      ? ""
                      : handleChangeUsuario("nomeCompleto", text.toUpperCase())
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
                  value={formDataUsuario.sobreNome}
                  onChangeText={(text) =>
                    formDataUsuario.id
                      ? ""
                      : handleChangeUsuario("sobreNome", text.toUpperCase())
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
                  value={formDataUsuario.email}
                  onChangeText={(text) =>
                    formDataUsuario.id ? "" : handleChangeUsuario("email", text)
                  }
                  onBlur={() => {
                    if (!isEmail(formDataUsuario.email)) {
                      formDataUsuario.id
                        ? ""
                        : handleChangeUsuario(
                            "email",
                            formatCPF(formDataUsuario.email)
                          );
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
                  value={formDataUsuario.telefone}
                  onChangeText={(text) => {
                    const formatted = formatPhone(text);
                    handleChangeUsuario("telefone", formatted);
                  }}
                />
                {errors.telefone && (
                  <Text style={styles.labelError}>{errors.telefone}</Text>
                )}
              </View>

              {formDataUsuario.id === 0 && (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TouchableOpacity
                    style={[
                      styles.newButton,
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                    onPress={() => handleCadastrarUsuario(formDataUsuario)}
                  >
                    {loading && (
                      <ActivityIndicator
                        size="small"
                        color={colors.laranjado}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text style={styles.newButtonText}>Cadastrar Usuário</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          <View style={styles.area}>
            {tipoIngressoDescricoes.map((descricao, index) => (
              <Accordion
                index={index}
                key={index}
                title={descricao || "Descrição indisponível"}
              >
                {registrosEventoIngressos
                  .filter(
                    (ingresso) => ingresso.TipoIngresso_descricao === descricao
                  )
                  .map((ingresso, idx) => (
                    // <Text key={idx}>{ingresso.nome}</Text>
                    <View key={ingresso.id} style={{ flexDirection: "column" }}>
                      <CounterTicket data={ingresso} />
                    </View>
                  ))}
              </Accordion>
            ))}
            <View style={{ height: 100 }}></View>
          </View>
        </ScrollView>
      </View>
      {modalVisible && (
        <ModalResumoIngresso step={1} UsuarioVenda={formDataUsuario} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 5,
    marginBottom: 20,
    height: 500,
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 3,
    textAlign: "center",
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 25,
    borderRadius: 20,
    flex: 1,
  },
  areaUsuario: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 15,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    // paddingBottom: 25,
    borderRadius: 20,
    height: 550,
    // flex: 1,
  },
  areaTitulo: {
    fontSize: 22,
    // fontWeight: "bold",
    marginBottom: 30,
    color: "rgb(0, 146, 250)",
  },
  label: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    // flexBasis: "45%",
  },
  labelData: {
    // fontSize: 16,
    color: colors.zinc,
    marginBottom: 4,
    width: 140,
    textAlign: "right",
    // flexBasis: "45%",
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
  eventDetails: {
    flexWrap: "wrap",
    // justifyContent: "center",
    width: Platform.OS === "web" ? width - 432 : -32, // Ajusta a largura conforme a tela
    // width: width - 32, // Ajusta a largura conforme a tela
  },
  eventDetailItem: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "flex-start" : "center",
    marginBottom: 5,
  },
  imagem: {
    // width: "100%", // 100% para web, largura da tela para mobile
    borderRadius: 20,
    height: 110,
    width: 180,
    resizeMode: "cover", // Ajuste o modo de redimensionamento conforme necessário
  },
  areaEvento: {
    marginTop: 7,
    paddingRight: 5,
    paddingLeft: 5,
    paddingTop: 10,
    marginRight: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    marginLeft: Platform.OS === "web" ? (width <= 1000 ? 5 : "10%") : 0,
    paddingBottom: 10,
    borderRadius: 20,
    flexDirection: "row",
  },
  areaStep: {
    justifyContent: "center",
    alignItems: "center",
  },
  areaTextoEvento: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  tituloEvento: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  enderecoEvento: {
    fontSize: 16,
    textAlign: "left",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  grupoInput: {
    alignItems: "flex-start",
    width: "100%",
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
