import React from "react";
import {
  StyleSheet,
  View,
  Platform,
  Text,
  Linking,
  Button,
} from "react-native";
import { WebView } from "react-native-webview";

interface WebMapProps {
  location: { latitude: number; longitude: number };
}

const WebMap: React.FC<WebMapProps> = ({ location }) => {
  const { latitude, longitude } = location;
  const mapHtml = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; height: 100%; overflow: hidden;">
        <iframe
          width="100%"
          height="1000"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed/v1/place?key=AIzaSyDOKub2Z7hwFD9BiMxNfXPSSwKJ--YG_rU&q=${latitude},${longitude}&zoom=17"
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe
          width="100%"
          height="500"
          style={{ border: 0 }}
          src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyDOKub2Z7hwFD9BiMxNfXPSSwKJ--YG_rU&q=${latitude},${longitude}&zoom=15`}
          allowFullScreen
        />
      ) : (
        <WebView
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          // style={styles.webMap}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loading}>
              <Text>Loading...</Text>
            </View>
          )}
        />
      )}
      <Button title="Abrir no Google Maps" onPress={handleOpenMaps} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 300,
    marginVertical: 8,
  },
  webMap: {
    width: "100%",
    height: "auto",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WebMap;
