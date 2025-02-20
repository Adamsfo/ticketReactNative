import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";

interface DataItem {
  label?: string;
  content: string;
  id: number;
}

interface CustomGridProps {
  data: DataItem[];
  onItemPress: (id: number) => void;
}

const CustomGrid: React.FC<CustomGridProps> = ({ data, onItemPress }) => {
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.row, isMobile && styles.column]}>
        {data.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.box}
            onPress={() => onItemPress(data[0].id)}
          >
            {Platform.OS !== "web" && (
              <Text style={styles.textLabel}>{item.label + ":"}</Text>
            )}
            <Text style={styles.text}>{item.content}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.boxIcone}
          onPress={() => onItemPress(data[0].id)}
        >
          <Feather name="edit" size={18} color={colors.branco} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 2,
    backgroundColor: colors.azul,
    borderRadius: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
  },
  box: {
    backgroundColor: colors.azul,
    margin: 5,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  boxIcone: {
    backgroundColor: colors.azul,
    margin: 5,
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    marginRight: 5,
  },
  textLabel: {
    color: "#FFF",
    marginRight: 5,
    fontWeight: "bold",
  },
});

export default CustomGrid;
