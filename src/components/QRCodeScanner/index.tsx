import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert, StyleSheet } from "react-native";
import { Camera, CameraType, CameraView } from "expo-camera";

interface QRCodeScannerProps {
  onQRCodeScanned: (data: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onQRCodeScanned }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [cameraType, setCameraType] = useState(Camera);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    onQRCodeScanned(data);
    Alert.alert("QR Code Scanned", `Data: ${data}`, [
      {
        text: "Scan Again",
        onPress: () => setScanned(false),
      },
    ]);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <Button
          title="Grant Permission"
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        // type={cameraType}
        style={StyleSheet.absoluteFillObject}
        // barCodeScannerSettings={{
        //   barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        // }}
        // onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <Text style={styles.text}>Scan a QR Code</Text>
          {scanned && (
            <Button
              title="Tap to Scan Again"
              onPress={() => setScanned(false)}
              color="#fff"
            />
          )}
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 16,
  },
});

export default QRCodeScanner;
