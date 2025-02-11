import React from "react";
import { StyleSheet, View, Platform } from "react-native";
import { Marker, Region } from "react-native-maps";
import MapView from "../mymap";

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

  return (
    <MapView style={styles.map} region={region}>
      {/* <Marker coordinate={location} draggable onDragEnd={handleMarkerDragEnd} /> */}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    marginVertical: 8,
  },
});

export default MobileMap;
