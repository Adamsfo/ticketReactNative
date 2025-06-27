import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";

interface DataItem {
  label: string;
  isButton?: boolean;
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
        <View
          style={[styles.row, isMobile ? styles.column : styles.rowDesktop]}
        >
          {data.map((item, index) =>
            !item.isButton ? (
              <View key={index} style={styles.box}>
                <Text style={styles.textLabel}>{item.label}</Text>
              </View>
            ) : null
          )}
          {/* <View style={{ ...styles.boxIcone }}>
            <Feather name="edit" size={18} color="rgba(255,255,255, 0.21)" />
          </View> */}
          {/* Se houver pelo menos um item com isButton === true, exibe coluna "Ações" */}
          {data.some((item) => item.isButton) && (
            <View key="acoes" style={{ width: 55 }}>
              <Text style={styles.textLabel}>Ações</Text>
            </View>
          )}
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
    justifyContent: "flex-start",
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
    alignItems: "flex-start",
    alignContent: "flex-start",
    textAlign: "left",
  },
  rowDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-around",
  },
});

export default CustomGridTitle;
