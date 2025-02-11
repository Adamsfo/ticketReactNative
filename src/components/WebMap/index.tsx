import React from "react";

interface WebMapProps {
  location: { latitude: number; longitude: number };
}

const WebMap: React.FC<WebMapProps> = ({ location }) => {
  return (
    <iframe
      width="100%"
      height="500"
      frameBorder="0"
      style={{ border: 0 }}
      src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${location.latitude},${location.longitude}&zoom=15`}
      allowFullScreen
    ></iframe>
  );
};

export default WebMap;
