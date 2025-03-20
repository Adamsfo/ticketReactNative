import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <View style={styles.container}>
      {["Ingressos", "Conferência", "Pagamento"].map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              currentStep === index + 1 && styles.currentStepCircle,
            ]}
          >
            {currentStep > index + 1 ? (
              <Feather name="check" size={24} color={colors.white} />
            ) : (
              <Text
                style={[
                  styles.stepText,
                  currentStep === index + 1 && styles.currentStepText,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.label,
              currentStep === index + 1 && styles.currentStepLabel,
            ]}
          >
            {step}
          </Text>
          {index < 2 && <View style={styles.line} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    width: Platform.OS === "web" ? "auto" : "100%",
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: colors.gray,
    alignItems: "center",
    justifyContent: "center",
  },
  currentStepCircle: {
    backgroundColor: colors.azul,
  },
  stepText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: "bold",
  },
  currentStepText: {
    color: colors.white,
  },
  label: {
    marginLeft: 5,
    color: colors.gray,
    fontSize: Platform.OS === "web" ? 14 : 10,
    flexShrink: 1,
  },
  currentStepLabel: {
    color: colors.azul,
  },
  line: {
    width: Platform.OS === "web" ? 40 : 10,
    height: 2,
    backgroundColor: colors.gray,
    marginHorizontal: 5,
  },
});

export default StepIndicator;
