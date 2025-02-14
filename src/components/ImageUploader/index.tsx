import React, { useState } from "react";
import { View, Image, Button, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function ImageUploader() {
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
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🚀 Enviar imagem para API
  const uploadImage = async () => {
    if (!image) {
      Alert.alert("Erro", "Selecione uma imagem primeiro!");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", {
      uri: image,
      name: "upload.jpg",
      type: "image/jpeg",
    } as any);

    try {
      const response = await fetch("https://sua-api.com/upload", {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      const data = await response.json();
      Alert.alert("Sucesso!", "Imagem enviada com sucesso.");
    } catch (error) {
      Alert.alert("Erro", "Erro ao enviar imagem.");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View
      style={{
        justifyContent: "center",
        alignItems: "flex-start",
        marginBottom: 20,
      }}
    >
      {image && (
        <Image
          source={{ uri: image }}
          style={{ width: 200, height: 200, marginBottom: 20 }}
        />
      )}

      <Button title="Selecionar Imagem" onPress={() => pickImage(false)} />
      {/* <Button title="Tirar Foto" onPress={() => pickImage(true)} /> */}

      {/* {uploading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={{ marginTop: 20 }}
        />
      ) : (
        <Button title="Enviar Imagem" onPress={uploadImage} />
      )} */}
    </View>
  );
}
