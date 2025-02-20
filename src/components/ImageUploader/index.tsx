import React, { useState } from "react";
import {
  View,
  Image,
  Button,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/lib/api";

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ImageUploader({ value, onChange }: ImageUploaderProps) {
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 Solicitar permissões
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

  // 📷 Selecionar imagem da galeria ou câmera
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

    if (!result.canceled) {
      if (result.assets[0].base64) {
        setImage(result.assets[0].base64);
      } else {
        Alert.alert("Erro", "Erro ao selecionar imagem.");
      }
    }

    await uploadImage();
  };

  // 🚀 Enviar imagem para API
  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Erro", "Selecione uma imagem primeiro!");
      return;
    }

    setUploading(true);

    axios
      .post(
        api.getBaseApi() + "/upload",
        { file: image, Codigo: "0" },
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
    <View
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      {/* {image && (
        <Image
          source={{ uri: `data:image/jpeg;base64,${image}` }}
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
      )} */}
      {value && (
        <Image
          source={{ uri: api.getBaseApi() + "/uploads/" + value }}
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
      )}

      {/* <Text>{api.getBaseApi() + "/" + value}</Text> */}
      <Button title="Selecionar Imagem" onPress={() => pickImage(false)} />
      {/* <Button title="Tirar Foto" onPress={() => pickImage(true)} /> */}

      {uploading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <Button title="Enviar Imagem" onPress={uploadImage} />
      )}
    </View>
  );
}
