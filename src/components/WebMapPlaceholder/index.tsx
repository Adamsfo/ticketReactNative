import React from "react";
import { StyleSheet, View, Text } from "react-native";

const WebMapPlaceholder: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mapa não disponível no navegador</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    color: "red",
  },
});

export default WebMapPlaceholder;
