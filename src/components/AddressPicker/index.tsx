import React, { useState, useEffect } from "react";
import { View, TextInput, Button, StyleSheet, Platform } from "react-native";
import Geocoder from "react-native-geocoding";
import WebMap from "../WebMap";

// Substitua pela sua chave de API do Google Maps
Geocoder.init("AIzaSyDOKub2Z7hwFD9BiMxNfXPSSwKJ--YG_rU");

interface AddressPickerProps {
  onSave?: (location: { latitude: number; longitude: number }) => void;
}

const AddressPicker: React.FC<AddressPickerProps> = ({ onSave }) => {
  const [address, setAddress] = useState<string>("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: -15.6014109,
    longitude: -56.0978917,
  });
  const [MobileMap, setMobileMap] = useState<React.FC<{
    location: { latitude: number; longitude: number };
    setLocation: (location: { latitude: number; longitude: number }) => void;
  }> | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      import("../MobileMap")
        .then((module) => setMobileMap(() => module.default))
        .catch((error) => console.error("Failed to load MobileMap:", error));
    }
  }, []);

  const handleAddressChange = (input: string) => {
    setAddress(input);
  };

  const handleFindLocation = async () => {
    try {
      const json = await Geocoder.from(address);
      const location = json.results[0].geometry.location;
      setLocation({
        latitude: location.lat,
        longitude: location.lng,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveLocation = () => {
    if (onSave) {
      onSave(location);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite o endereço"
        value={address}
        onChangeText={handleAddressChange}
      />
      <Button title="Encontrar localização" onPress={handleFindLocation} />
      {Platform.OS !== "web" && MobileMap && (
        <MobileMap location={location} setLocation={setLocation} />
      )}
      {Platform.OS === "web" && <WebMap location={location} />}
      <Button title="Salvar localização" onPress={handleSaveLocation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
});

export default AddressPicker;
