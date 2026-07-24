import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { api } from "@/src/lib/api";

type Props = {
  value: string | null;
  onChange: (filename: string | null) => void;
};

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.heic";

/** Reutiliza POST /upload (mesmo fluxo do ImageUploader), com PDF e imagens. */
export default function ComprovanteUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadBase64 = async (
    base64: string,
    nomeOriginal: string,
    mimeType: string,
  ) => {
    setUploading(true);
    try {
      const response = await axios.post(
        api.getBaseApi() + "/upload",
        {
          file: base64,
          prefixo: "Comprovante",
          nomeOriginal,
          mimeType,
        },
        { headers: { "Content-Type": "application/json" } },
      );
      onChange(response.data.filename);
    } catch {
      Alert.alert("Erro", "Não foi possível enviar o comprovante.");
    } finally {
      setUploading(false);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão", "Habilite o acesso à galeria.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    const asset = result.assets[0];
    const nome =
      asset.fileName ||
      `comprovante_${Date.now()}.jpg`;
    await uploadBase64(
      asset.base64,
      nome,
      asset.mimeType || "image/jpeg",
    );
  };

  const pickWebFile = () => {
    if (Platform.OS !== "web") {
      pickFromLibrary();
      return;
    }
    inputRef.current?.click();
  };

  const onWebFileChange = async (event: any) => {
    const file = event?.target?.files?.[0] as File | undefined;
    if (!file) return;

    const ok =
      /pdf|jpeg|jpg|png|heic|heif/i.test(file.type) ||
      /\.(pdf|jpe?g|png|heic)$/i.test(file.name);
    if (!ok) {
      Alert.alert("Arquivo inválido", "Use PDF, JPG, PNG ou HEIC.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      await uploadBase64(base64, file.name, file.type);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const url = value ? `${api.getBaseApi()}/uploads/${value}` : null;

  return (
    <View style={styles.wrap}>
      {Platform.OS === "web" ? (
        // @ts-expect-error input nativo web
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: "none" }}
          onChange={onWebFileChange}
        />
      ) : null}

      {!value ? (
        <TouchableOpacity
          style={styles.btn}
          onPress={pickWebFile}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={colors.azul} />
          ) : (
            <>
              <Feather name="paperclip" size={16} color={colors.azul} />
              <Text style={styles.btnText}>Anexar comprovante</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.anexoBox}>
          <Text style={styles.anexoOk}>✓ {value}</Text>
          <View style={styles.anexoActions}>
            <TouchableOpacity
              onPress={() => url && Linking.openURL(url)}
              style={styles.linkBtn}
            >
              <Text style={styles.linkText}>Visualizar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickWebFile}
              style={styles.linkBtn}
              disabled={uploading}
            >
              <Text style={styles.linkText}>Substituir</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onChange(null)}>
              <Feather name="x" size={18} color={colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.azul,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  btnText: { color: colors.azul, fontWeight: "600" },
  anexoBox: {
    gap: 6,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
  },
  anexoOk: { color: "#027a3a", fontWeight: "600", fontSize: 13 },
  anexoActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  linkBtn: { paddingVertical: 2 },
  linkText: { color: colors.azul, fontWeight: "600", fontSize: 13 },
});
