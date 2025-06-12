import colors from "@/src/constants/colors";
import React from "react";
import {
  StyleSheet,
  View,
  Platform,
  Text,
  Linking,
  Button,
  TouchableOpacity,
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

  const handleOpenWaze = () => {
    const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    Linking.openURL(wazeUrl).catch(() =>
      alert("Não foi possível abrir o Waze.")
    );
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "web" ? (
        <iframe
          width="100%"
          height="500"
          style={{ border: 0, borderRadius: 15 }}
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
      <View style={styles.buttons}>
        <TouchableOpacity
          onPress={handleOpenMaps}
          style={{
            padding: 10,
            backgroundColor: "rgb(0, 146, 250)",
            borderRadius: 5,
          }}
        >
          <Text style={{ color: colors.branco }}>Abrir no Google Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleOpenWaze}
          style={{
            padding: 10,
            backgroundColor: "#rgb(0, 146, 250)",
            borderRadius: 5,
          }}
        >
          <Text style={{ color: colors.branco }}>Abrir no Waze</Text>
        </TouchableOpacity>

        {/* <Button title="Abrir no Google Maps" onPress={handleOpenMaps} />
        <Button title="Abrir no Waze" onPress={handleOpenWaze} /> */}
      </View>
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
  buttons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
});

export default WebMap;
