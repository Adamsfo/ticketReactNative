import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { uploadFile } from "@/src/lib/upload";

type Props = {
  /** Chamado com filenames já enviados ao storage. */
  onUploaded: (filenames: string[]) => void | Promise<void>;
  /** Indica início/fim do upload físico (antes de onUploaded). */
  onBusyChange?: (busy: boolean) => void;
  prefixo?: string;
  disabled?: boolean;
  label?: string;
  /** Variante compacta (botão + na galeria) */
  compact?: boolean;
  selectionLimit?: number;
};

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploader genérico (múltiplas imagens).
 * Não conhece EventoSuite — só devolve filenames via onUploaded.
 */
export default function PhotoUploader({
  onUploaded,
  onBusyChange,
  prefixo = "Upload",
  disabled,
  label = "Selecionar fotos",
  compact = false,
  selectionLimit = 12,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setBusy = (busy: boolean) => {
    setUploading(busy);
    onBusyChange?.(busy);
  };

  const processBase64List = async (
    items: Array<{ base64: string; nomeOriginal: string; mimeType: string }>,
  ) => {
    if (!items.length) return;
    setBusy(true);
    try {
      const filenames: string[] = [];
      for (const item of items) {
        const { filename } = await uploadFile({
          file: item.base64,
          prefixo,
          nomeOriginal: item.nomeOriginal,
          mimeType: item.mimeType,
        });
        filenames.push(filename);
      }
      await onUploaded(filenames);
    } catch (e: any) {
      Alert.alert("Erro", e?.message || "Falha no upload das fotos.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const pickNative = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão", "Habilite o acesso à galeria para continuar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit,
    });

    if (result.canceled || !result.assets?.length) return;

    await processBase64List(
      result.assets
        .filter((a) => a.base64)
        .map((a) => ({
          base64: a.base64!,
          nomeOriginal: a.fileName || "foto.jpg",
          mimeType: a.mimeType || "image/jpeg",
        })),
    );
  };

  const onWebFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const items: Array<{
      base64: string;
      nomeOriginal: string;
      mimeType: string;
    }> = [];
    for (const file of Array.from(files).slice(0, selectionLimit)) {
      if (!file.type.startsWith("image/")) continue;
      items.push({
        base64: await fileToBase64(file),
        nomeOriginal: file.name,
        mimeType: file.type,
      });
    }
    await processBase64List(items);
  };

  const openPicker = () => {
    if (Platform.OS === "web") {
      inputRef.current?.click();
      return;
    }
    pickNative();
  };

  return (
    <View>
      {Platform.OS === "web" ? (
        // @ts-ignore input nativo web
        <input
          ref={inputRef as any}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e: any) => onWebFiles(e.target.files)}
        />
      ) : null}

      <TouchableOpacity
        style={[styles.btn, compact && styles.btnCompact]}
        onPress={openPicker}
        disabled={disabled || uploading}
      >
        {uploading ? (
          <ActivityIndicator color={compact ? colors.azul : "#fff"} />
        ) : (
          <>
            <Feather
              name={compact ? "plus" : "image"}
              size={compact ? 22 : 16}
              color={compact ? colors.azul : "#fff"}
            />
            {!compact ? (
              <Text style={styles.btnText}>{label}</Text>
            ) : null}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.azul,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 140,
    justifyContent: "center",
  },
  btnCompact: {
    width: 132,
    height: 100,
    minWidth: 132,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    marginBottom: 0,
    marginRight: 8,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
