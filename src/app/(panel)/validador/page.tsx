import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  View,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Ingresso, QueryParams, Usuario } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { CheckCircle, XCircle } from "lucide-react-native";
import { FlatList } from "react-native-gesture-handler";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";

type Props = {
  type: string;
  data: string;
};

const { width } = Dimensions.get("window");

export default function Index() {
  const endpointApi = "/ingresso";
  const [registro, setRegistro] = useState<Ingresso | null>(null);
  const route = useRoute();
  const [scanned, setScanned] = useState(false);
  const [qrcode, setqrcode] = useState<string | null>(null);
  const [qrcodeCPF, setqrcodeCPF] = useState<string>("qrcode");
  const [cpf, setCpf] = useState<string>("");
  const [ingressos, setIngressos] = useState<Ingresso[]>([]);
  const [ingressosSelecionados, setIngressosSelecionados] = useState<number[]>(
    []
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  const getRegistroQrCode = async (params: QueryParams) => {
    const response = await apiGeral.getResource<Ingresso>(endpointApi, {
      ...params,
      pageSize: 200,
    });
    const registrosData = response.data ?? [];
    setRegistro(registrosData[0]);
  };

  useFocusEffect(
    useCallback(() => {
      if (qrcode === null) {
        return;
      }
      getRegistroQrCode({ filters: { qrcode } });
    }, [qrcode])
  );

  useFocusEffect(
    useCallback(() => {
      setCpf("");
      setIngressos([]);
      setIngressosSelecionados([]);
      setqrcode(null);
      setErrors({});
    }, [])
  );

  const getIngressosUsuario = async () => {
    setIngressos([]);
    setIngressosSelecionados([]);
    setErrors({});

    if (cpf === "") {
      Alert.alert("Atenção", "Informe o CPF");
      return;
    }

    const ret = await apiGeral.getResource<Usuario>("/usuario", {
      filters: { cpf },
    });

    const usuario = ret.data && ret.data.length > 0 ? ret.data[0] : undefined;

    if (!usuario) {
      Alert.alert("Atenção", "Usuário não encontrado para o CPF informado");
      return;
    }

    const response = await apiGeral.getResource<Ingresso>(endpointApi, {
      filters: { idUsuario: usuario?.id, status: "Confirmado" },
      pageSize: 200,
    });
    let registrosData = response.data ?? [];

    setIngressos(registrosData);
  };

  const handleBarCodeScanned = ({ type, data }: Props) => {
    setScanned(true);
    const dados = JSON.parse(data);
    const qrcode = dados.idqrcode;
    setqrcode(qrcode);
  };

  const [permission, requestPermission] = useCameraPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

  const handleValidaQrCode = () => {
    return (
      <View style={styles.areaDentro}>
        <View style={{ alignSelf: "center" }}>
          {Platform.OS === "web" && (
            <TouchableOpacity style={[styles.button, styles.buttonSave]}>
              <Text style={{ color: colors.branco }}>
                Utiliza aplicativo para escanear o QRCode
              </Text>
            </TouchableOpacity>
          )}
          {Platform.OS !== "web" && !isPermissionGranted && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSave, { width: 250 }]}
              onPress={requestPermission}
            >
              <Text style={{ color: colors.branco }}>
                Requer permissão camera
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isPermissionGranted && !scanned && (
          <CameraView
            style={[
              StyleSheet.absoluteFillObject,
              {
                width: "90%",
                height: "70%",
                marginLeft: "5%",
                borderRadius: 30,
                marginTop: "15%",
              },
            ]}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}

        {registro && handleRegistroQrCode()}
      </View>
    );
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

  const handleAbrirConta = async () => {
    if (ingressosSelecionados.length === 0) {
      return;
    }

    setLoading(true);
    setErrors({});

    const json = await apiGeral.createResource("/validadorjango", {
      ingressos: ingressosSelecionados,
    });

    if (json.message) {
      setErrors({ geral: json.message ?? "Ocorreu um erro desconhecido." });
      setLoading(false);
      return;
    }

    setIngressos([]);
    setIngressosSelecionados([]);
    setCpf("");
    setLoading(false);
  };

  const handleValidaCPF = () => {
    return (
      <View style={styles.areaDentro}>
        <View style={{ alignSelf: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignContent: "center",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 15,
            }}
          >
            {/* <Text style={styles.label}>CPF</Text> */}
            <TextInput
              style={[styles.input, { minWidth: 150 }]}
              placeholder="CPF..."
              keyboardType="numeric"
              value={cpf}
              onChangeText={(text) => {
                const formatted = formatCPF(text);
                setCpf(formatted);
              }}
            ></TextInput>
            <TouchableOpacity
              style={[styles.button, styles.buttonSave, { marginBottom: 16 }]}
              onPress={() => getIngressosUsuario()}
            >
              <Text style={{ color: colors.branco }}>Buscar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {ingressos && (
          <FlatList
            data={ingressos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => handleIngressosUsuario(item)}
            showsVerticalScrollIndicator={false}
            style={{ width: "100%", alignSelf: "stretch" }}
            contentContainerStyle={{
              alignItems: "center",
              justifyContent: "center",
            }}
            // ListEmptyComponent={
            //   <Text style={styles.labelError}>
            //     Não há ingressos disponíveis para o CPF informado.
            //   </Text>
            // }
            // ListHeaderComponent={
            //   <Text
            //     style={{
            //       color: colors.branco,
            //       fontSize: 20,
            //       fontWeight: "bold",
            //       marginBottom: 10,
            //     }}
            //   >
            //     Ingressos disponíveis
            //   </Text>
            // }
            ListFooterComponent={
              <Text
                style={{
                  color: colors.branco,
                  fontSize: 20,
                  fontWeight: "bold",
                  marginBottom: 10,
                }}
              >
                Total de ingressos: {ingressos.length}
              </Text>
            }
            showsHorizontalScrollIndicator={false}
            horizontal={false}
            numColumns={1}
          />
        )}

        <View
          style={{
            flexDirection: "row",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 25,
          }}
        >
          {errors.geral && (
            <Text style={styles.labelError}>{errors.geral}</Text>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignContent: "center",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <Text style={{ color: colors.branco }}>
            {ingressosSelecionados.length > 0
              ? ingressosSelecionados.length
              : "Nenhum"}{" "}
            {`ingresso${
              ingressosSelecionados.length > 1 ? "s" : ""
            } selecionado${ingressosSelecionados.length > 1 ? "s" : ""}`}
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSave,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
            onPress={handleAbrirConta}
          >
            {loading && (
              <ActivityIndicator
                size="small"
                color={colors.laranjado}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={{ color: colors.branco }}>Abrir Conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const toggleIngressoSelecionado = (id: number) => {
    setIngressosSelecionados(
      (prevSelecionados) =>
        prevSelecionados.includes(id)
          ? prevSelecionados.filter((itemId) => itemId !== id) // Desmarca
          : [...prevSelecionados, id] // Marca
    );
  };

  const handleIngressosUsuario = (item: Ingresso) => {
    const isSelecionado = ingressosSelecionados.includes(item.id);

    return (
      <View
        key={item.id}
        style={{
          backgroundColor: isSelecionado ? colors.green : colors.cinza,
          width:
            Platform.OS === "web" ? (width > 400 ? 400 : width - 40) : "100%",
          borderRadius: 20,
          marginBottom: 10,
          padding: 5,
          flexDirection: "row", // Coloca os elementos lado a lado
          alignItems: "center", // Alinha verticalmente
        }}
      >
        {/* Lado esquerdo: View "asdfa" */}
        <TouchableOpacity
          onPress={() => toggleIngressoSelecionado(item.id)}
          style={{
            backgroundColor: colors.branco, // só para exemplo visual
            padding: 10,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            borderRadius: 10,
            height: 40,
            width: 40,
          }}
        >
          {isSelecionado && <CheckCircle size={24} color={colors.green} />}
        </TouchableOpacity>

        {/* Lado direito: textos */}
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: colors.branco, fontSize: 16, fontWeight: "bold" }}
          >
            {item.Evento_nome} {item.TipoIngresso_descricao}{" "}
            {item.EventoIngresso_nome}
          </Text>
          <Text
            style={{ color: colors.branco, fontSize: 16, fontWeight: "bold" }}
          >
            Status: {item.status === "Confirmado" ? "Disponível" : "Inválido"}
          </Text>
          <Text
            style={{ color: colors.branco, fontSize: 16, fontWeight: "bold" }}
          >
            {item.nomeImpresso}
          </Text>
          <Text
            style={{ color: colors.branco, fontSize: 16, fontWeight: "bold" }}
          >
            Válido à partir{" "}
            {item.dataValidade
              ? formatInTimeZone(
                  parseISO(item.dataValidade.toString()),
                  "America/Cuiaba",
                  "dd/MM/yyyy"
                )
              : "Data não disponível"}
          </Text>
        </View>
      </View>
    );
  };

  const handleRegistroQrCode = () => {
    return (
      <View style={[styles.areaDentro, { alignItems: "center" }]}>
        <Text style={styles.title}>
          {registro?.status === "Confirmado" ? (
            <View
              style={{
                backgroundColor: colors.green,
                width: "80%",
                height: 200,
                alignItems: "center",
                borderRadius: 20,
                alignContent: "center",
                justifyContent: "center",
              }}
            >
              <Text style={styles.labelText}>Ingresso Válido</Text>
              <Text style={styles.labelText}>
                Nome: {registro.nomeImpresso}
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: colors.red,
                width: "80%",
                height: 200,
                alignItems: "center",
                borderRadius: 20,
                alignContent: "center",
                justifyContent: "center",
              }}
            >
              <Text style={styles.labelText}>Ingresso Inválido</Text>
              <Text style={styles.labelText}>
                Nome: {registro?.nomeImpresso}
              </Text>
              <Text style={styles.labelText}>Status: {registro?.status}</Text>
            </View>
          )}
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonSave, { marginTop: 20 }]}
          onPress={() => {
            setScanned(false);
            setRegistro(null);
            setqrcode(null);
          }}
        >
          <Text style={{ color: colors.branco }}>Fechar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Validador</Text>

        <View style={styles.area}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
            }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                {
                  backgroundColor:
                    qrcodeCPF === "qrcode" ? colors.azul : colors.cinza,
                },
              ]}
              onPress={() => {
                setqrcodeCPF("qrcode");
              }}
            >
              <Text style={{ color: colors.branco }}>QrCode</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                {
                  backgroundColor:
                    qrcodeCPF === "cpf" ? colors.azul : colors.cinza,
                },
              ]}
              onPress={() => {
                setqrcodeCPF("cpf");
              }}
            >
              <Text style={{ color: colors.branco }}>CPF</Text>
            </TouchableOpacity>
          </View>
          {qrcodeCPF === "qrcode" && handleValidaQrCode()}
          {qrcodeCPF === "cpf" && handleValidaCPF()}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 5,
    paddingTop: 10,
    flex: 1,
    marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? 200 : 0,
    // marginLeft: Platform.OS === "web" ? 200 : 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    // marginBottom: 8,
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 20,
    flex: 1,
  },
  areaDentro: {
    flex: 1,
    marginTop: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonClose: {
    backgroundColor: "rgb(211, 211, 211)",
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
  labelText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.branco,
  },
  label: {
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
  },
  labelError: {
    color: colors.red,
    marginTop: -18,
    marginBottom: 18,
    fontWeight: "bold",
  },
});
