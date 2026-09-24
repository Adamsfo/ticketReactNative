import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Switch } from "react-native-gesture-handler";
import colors from "@/src/constants/colors";
import { TITULO_POLITICA_HOSPEDAGEM } from "@/src/constants/politicaCancelamentoHospedagem";
import ModalPoliticaCancelamentoHospedagem from "../ModalPoliticaCancelamentoHospedagem";

interface AceitePoliticaHospedagemProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
}

export default function AceitePoliticaHospedagem({
  value,
  onValueChange,
  style,
}: AceitePoliticaHospedagemProps) {
  const [visiblePolitica, setVisiblePolitica] = React.useState(false);

  return (
    <View style={[styles.row, style]}>
      <Switch
        trackColor={{ false: colors.cinza, true: colors.azul }}
        thumbColor={colors.azul}
        onValueChange={onValueChange}
        value={value}
      />
      <Text style={styles.label}>
        Li e aceito a{" "}
        <Text
          style={styles.link}
          onPress={() => setVisiblePolitica(true)}
          accessibilityRole="link"
        >
          {TITULO_POLITICA_HOSPEDAGEM}
        </Text>
      </Text>
      <ModalPoliticaCancelamentoHospedagem
        visible={visiblePolitica}
        onClose={() => setVisiblePolitica(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#212743",
    lineHeight: 22,
  },
  link: {
    color: colors.azul,
    textDecorationLine: "underline",
  },
});
