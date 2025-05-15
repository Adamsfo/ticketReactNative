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

export default function Index() {
  const endpointApi = "/ingresso";
  const [registro, setRegistro] = useState<Ingresso | null>(null);
  const route = useRoute();

  const [permission, requestPermission] = useCameraPermissions();

  const isPermissionGranted = Boolean(permission?.granted);

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

        <CameraView
          style={[
            StyleSheet.absoluteFillObject,
            {
              width: "90%",
              height: "70%",
              marginLeft: "5%",
              borderRadius: 20,
              marginTop: "30%",
            },
          ]}
          facing="back"
          onBarcodeScanned={({ data }) => {
            Alert.alert("QR Code Scanned", `Data: ${data}`, [
              {
                text: "Scan Again",
                onPress: () => setRegistro(null),
              },
            ]);
            // Aqui você pode fazer a chamada para a API com o código escaneado
            // Exemplo:
            // getRegistros({ filters: { qrcode: data } });
          }}
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
});
