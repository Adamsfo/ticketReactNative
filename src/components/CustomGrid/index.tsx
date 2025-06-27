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
  content?: string;
  iconName?: keyof typeof Feather.glyphMap; // Ex: 'edit', 'trash'
  id: number;
  isButton?: boolean;
  onPress?: (id: number) => void;
}

interface CustomGridProps {
  data: DataItem[];
  onItemPress?: (id: number) => void;
}

const CustomGrid: React.FC<CustomGridProps> = ({ data, onItemPress }) => {
  const { width } = Dimensions.get("window");
  const isMobile = width < 768;

  return (
    <View style={styles.container}>
      <View style={[styles.row, isMobile ? styles.column : styles.rowDesktop]}>
        {data.map((item, index) => {
          const isIcon = !!item.iconName;
          const handlePress = () => {
            if (item.isButton && item.onPress) {
              item.onPress(item.id);
            } else if (onItemPress) {
              onItemPress(item.id);
            }
          };

          const ContentComponent = (
            <View style={styles.box}>
              {item.label && isMobile && (
                <Text style={styles.textLabel}>{item.label}:</Text>
              )}
              {isIcon ? (
                <Feather name={item.iconName} size={18} color={colors.branco} />
              ) : (
                <Text style={styles.text}>{item.content}</Text>
              )}
            </View>
          );

          return item.isButton || isIcon ? (
            <TouchableOpacity key={index} onPress={handlePress}>
              {ContentComponent}
            </TouchableOpacity>
          ) : (
            <View style={styles.areabox} key={index}>
              {ContentComponent}
            </View>
          );
        })}

        {/* Botão fixo à direita */}
        {/* {!isMobile && onItemPress && (
          <TouchableOpacity
            style={styles.boxIcone}
            onPress={() => onItemPress(data[0].id)}
          >
            <Feather name="edit" size={18} color={colors.branco} />
          </TouchableOpacity>
        )} */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 2,
    backgroundColor: colors.azul,
    // borderWidth: 1,
    borderRadius: 5,
  },
  row: {
    flexDirection: "column",
    // justifyContent: "space-between",
  },
  rowDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-around",
  },
  areabox: {
    flex: 1,
    justifyContent: "space-between",
  },
  column: {
    flexDirection: "column",
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    marginHorizontal: 8,
    flex: 1,
  },
  boxIcone: {
    margin: 8,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#FFF",
  },
  textLabel: {
    color: "#FFF",
    marginRight: 4,
    fontWeight: "bold",
  },
});

export default CustomGrid;
