import React, { useState } from "react";
import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

const ZoomableImage = ({ uri }: { uri: string }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ alignItems: "center" }}>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image style={styles.qr} source={{ uri }} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          <Image style={styles.zoomedImage} source={{ uri }} />
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ZoomableImage;

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const styles = StyleSheet.create({
  qr: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    resizeMode: "contain",
    borderRadius: 10,
  },
});
