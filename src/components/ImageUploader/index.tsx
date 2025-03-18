import React, { useState } from "react";
import {
  View,
  Image,
  Button,
  Alert,
  ActivityIndicator,
  Text,
  StyleSheet,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/lib/api";

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted" || cameraStatus !== "granted") {
      Alert.alert(
        "Permissão Necessária",
        "Habilite as permissões para continuar."
      );
      return false;
    }
    return true;
  };

  const pickImage = async (fromCamera = false) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: true,
      base64: true,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled && result.assets[0].base64) {
      await uploadImage(result.assets[0].base64);
    } else {
      Alert.alert("Erro", "Erro ao selecionar imagem.");
    }
  };

  const uploadImage = async (base64Image: string) => {
    setUploading(true);

    axios
      .post(
        api.getBaseApi() + "/upload",
        { file: base64Image, Codigo: "0" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Imagem enviada:", response.data.filename);
        onChange(response.data.filename);
        setUploading(false);
      })
      .catch((error) => {
        setUploading(false);
        Alert.alert("Erro", "Erro ao enviar imagem.");
        console.error("Erro ao carregar arquivos:", error);
      });
  };

  return (
    <View style={styles.container}>
      {value ? (
        <Image
          source={{ uri: api.getBaseApi() + "/uploads/" + value }}
          style={styles.image}
        />
      ) : (
        <Text style={styles.placeholder}>Nenhuma imagem selecionada</Text>
      )}

      <Button title="Selecionar Imagem" onPress={() => pickImage(false)} />

      {uploading && (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  placeholder: {
    fontSize: 16,
    color: "#888",
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
