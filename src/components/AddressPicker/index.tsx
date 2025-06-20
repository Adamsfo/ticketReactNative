import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import Geocoder from "react-native-geocoding";
import MapViewer from "../MapViewer";

// Substitua pela sua chave de API do Google Maps
Geocoder.init("AIzaSyDOKub2Z7hwFD9BiMxNfXPSSwKJ--YG_rU");

interface AddressPickerProps {
  onSave?: (location: {
    latitude: number;
    longitude: number;
    endereco: string;
  }) => void;
  initialAddress?: string;
}

const AddressPicker: React.FC<AddressPickerProps> = ({
  onSave,
  initialAddress,
}) => {
  const [address, setAddress] = useState<string>("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  }>({
    latitude: -15.6014109,
    longitude: -56.0978917,
  });

  const handleAddressChange = (input: string) => {
    setAddress(input);
  };

  const handleFindLocation = async (busca: string) => {
    try {
      const json = await Geocoder.from(busca);
      if (json.results.length > 0) {
        const location = json.results[0].geometry.location;
        setLocation({
          latitude: location.lat,
          longitude: location.lng,
        });
        handleSaveLocation(location.lat, location.lng, busca);
      } else {
        Alert.alert(
          "Endereço não encontrado",
          "Usando localização padrão de Cuiabá, Mato Grosso."
        );
        setLocation({
          latitude: -15.6014109,
          longitude: -56.0978917,
        });
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Erro ao encontrar localização",
        "Usando localização padrão de Cuiabá, Mato Grosso."
      );
      setLocation({
        latitude: -15.6014109,
        longitude: -56.0978917,
      });
    }
  };

  const handleSaveLocation = (lat: number, long: number, end: string) => {
    if (onSave) {
      onSave({
        latitude: lat,
        longitude: long,
        endereco: end,
      });
    }
  };

  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      handleFindLocation(initialAddress);
    }
  }, [initialAddress]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Digite o endereço"
        value={address}
        onChangeText={handleAddressChange}
      />
      <Button
        title="Encontrar localização"
        onPress={() => handleFindLocation(address)}
      />
      <MapViewer location={location} setLocation={setLocation} />
      {/* <Button title="Salvar localização" onPress={handleSaveLocation} /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    height: 470,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
});

export default AddressPicker;
