import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

interface DataItem {
  label: string;
}

interface CustomGridProps {
  data: DataItem[];
}

const CustomGridTitle: React.FC<CustomGridProps> = ({ data }) => {
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;

  if (!isMobile) {
    return (
      <View style={styles.container}>
        <View style={[styles.row, isMobile && styles.column]}>
          {data.map((item, index) => (
            <View key={index} style={styles.box}>
              <Text style={styles.textLabel}>{item.label}</Text>
            </View>
          ))}
          <View style={{ ...styles.boxIcone }}>
            <Feather name="edit" size={18} color="rgba(255,255,255, 0.21)" />
          </View>
        </View>
      </View>
    );
  }
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 2,
    // backgroundColor: colors.azul,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
  },
  box: {
    // backgroundColor: colors.azul,
    margin: 5,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
  },
  boxIcone: {
    // backgroundColor: colors.azul,
    margin: 5,
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    marginRight: 5,
  },
  textLabel: {
    // color: "#FFF",
    marginRight: 5,
    fontWeight: "bold",
    alignItems: "center",
    alignContent: "center",
  },
});

export default CustomGridTitle;
