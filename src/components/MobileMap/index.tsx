import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

interface MobileMapProps {
  location: { latitude: number; longitude: number };
  setLocation: (location: { latitude: number; longitude: number }) => void;
}

const MobileMap: React.FC<MobileMapProps> = ({ location, setLocation }) => {
  const region: Region = {
    ...location,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleMarkerDragEnd = (e: any) => {
    const newLocation = e.nativeEvent.coordinate;
    setLocation(newLocation);
  };

  return Platform.OS === "web" ? (
    <View style={styles.map}>
      <Text>Mapa não disponível no navegador</Text>
    </View>
  ) : (
    // <MapView style={styles.map} region={region}>
    //   <Marker coordinate={location} draggable onDragEnd={handleMarkerDragEnd} />
    // </MapView>
    <View style={styles.map}>
      <Text>Mapa não disponível no navegador</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    marginVertical: 8,
  },
});

export default MobileMap;
