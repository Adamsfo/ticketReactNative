import React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
};

/** Visualização fullscreen de uma imagem. */
export default function PhotoViewer({ uri, visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Feather name="x" size={28} color="#fff" />
        </TouchableOpacity>
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  close: {
    position: "absolute",
    top: 28,
    right: 24,
    zIndex: 2,
  },
  image: {
    width: "100%",
    height: "80%",
  },
});
