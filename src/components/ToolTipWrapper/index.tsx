import React, { useState } from "react";
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";

interface TooltipWrapperProps {
  label: string;
  children: React.ReactNode;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ label, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <Pressable
      onHoverIn={() => Platform.OS === "web" && setVisible(true)}
      onHoverOut={() => Platform.OS === "web" && setVisible(false)}
      onLongPress={() => Platform.OS !== "web" && setVisible(true)}
      delayLongPress={300}
    >
      <View>
        {children}
        {visible && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>{label}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    top: -30,
    left: 0,
    backgroundColor: "#333",
    padding: 5,
    borderRadius: 4,
    zIndex: 9999,
    minWidth: 120, // largura mínima maior
    maxWidth: 220,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default TooltipWrapper;
