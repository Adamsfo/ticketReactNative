import React from "react";
import { Platform } from "react-native";
import MobileMap from "../MobileMap";
import WebMapPlaceholder from "../WebMapPlaceholder";
import WebMap from "../WebMap";

interface MapViewerProps {
  location: { latitude: number; longitude: number };
  setLocation: (location: { latitude: number; longitude: number }) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ location, setLocation }) => {
  return Platform.OS === "web" ? (
    <WebMap location={location} />
  ) : (
    <MobileMap location={location} setLocation={setLocation} />
  );
};

export default MapViewer;
