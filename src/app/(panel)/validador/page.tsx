import React, { useCallback, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  View,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import { Ingresso, QueryParams } from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";

type Props = {
  type: string;
  data: string;
};

export default function Index() {
  const endpointApi = "/ingresso";
  const [registro, setRegistro] = useState<Ingresso | null>(null);
  const route = useRoute();
  const [scanned, setScanned] = useState(false);
  const [qrcode, setqrcode] = useState<string | null>(null);

  const getRegistros = async (params: QueryParams) => {
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
      getRegistros({ filters: { qrcode } });
    }, [qrcode])
  );

  const handleBarCodeScanned = ({ type, data }: Props) => {
    setScanned(true);
    const dados = JSON.parse(data);
    const qrcode = dados.idqrcode;
    setqrcode(qrcode);
  };

  const [permission, requestPermission] = useCameraPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

  if (!isPermissionGranted) {
    return (
      <LinearGradient
        colors={[colors.white, colors.laranjado]}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <StatusBarPage style="dark" />
        <BarMenu />
        <View style={styles.container}>
          <Text style={styles.title}>Validador</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSave, { width: 250 }]}
            onPress={requestPermission}
          >
            <Text style={{ color: colors.branco }}>
              {Platform.OS === "web"
                ? "Validador Somente no App!"
                : "Requer permissão"}{" "}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (registro) {
    return (
      <LinearGradient
        colors={[colors.white, colors.laranjado]}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <StatusBarPage style="dark" />
        <BarMenu />
        <View style={styles.container}>
          <Text style={styles.title}>Validador</Text>
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
                  Nome: {registro.nomeImpresso}
                </Text>
                <Text style={styles.labelText}>Status: {registro.status}</Text>
              </View>
            )}
          </Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonSave, { width: 250 }]}
            onPress={() => {
              setScanned(false);
              setRegistro(null);
              setqrcode(null);
            }}
          >
            <Text style={{ color: colors.branco }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[colors.white, colors.laranjado]}
      style={{ flex: 1, justifyContent: "center" }}
    >
      <StatusBarPage style="dark" />
      <BarMenu />
      <View style={styles.container}>
        <Text style={styles.title}>Validador</Text>

        <CameraView
          style={[
            StyleSheet.absoluteFillObject,
            {
              width: "90%",
              height: "70%",
              marginLeft: "5%",
              borderRadius: 30,
              marginTop: "30%",
            },
          ]}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />

        {/* )} */}
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
    marginRight: Platform.OS === "web" ? 200 : 0,
    marginLeft: Platform.OS === "web" ? 200 : 0,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  area: {
    backgroundColor: "rgba(255,255,255, 0.21)",
    marginTop: 7,
    paddingHorizontal: 5,
    paddingVertical: 15,
    borderRadius: 20,
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
});
