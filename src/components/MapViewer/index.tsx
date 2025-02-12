import React from "react";
import WebMap from "../WebMap";

interface MapViewerProps {
  location: { latitude: number; longitude: number };
  setLocation: (location: { latitude: number; longitude: number }) => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ location, setLocation }) => {
  return <WebMap location={location} />;
};

export default MapViewer;
