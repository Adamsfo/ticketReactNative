import React from "react";
import { View, Text, StyleSheet, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { publicTheme } from "@/src/constants/publicTheme";

const { width } = Dimensions.get("window");

const PUBLIC_STEP_SHORT_LABEL: Record<string, string> = {
  Reserva: "Reserva",
  Conferência: "Confer.",
  Pagamento: "Pagto.",
};

function publicStepLabel(step: string): string {
  if (width >= 480) return step;
  return PUBLIC_STEP_SHORT_LABEL[step] ?? step;
}

interface StepIndicatorHospedagemProps {
  currentStep: number;
  variant?: "default" | "public";
}

const StepIndicatorHospedagem: React.FC<StepIndicatorHospedagemProps> = ({
  currentStep,
  variant = "default",
}) => {
  const steps = ["Reserva", "Conferência", "Pagamento"];

  if (variant === "public") {
    return (
      <View style={publicStyles.wrap}>
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const done = currentStep > stepNum;
          const active = currentStep === stepNum;
          return (
            <React.Fragment key={step}>
              <View style={publicStyles.stepCol}>
                <View
                  style={[
                    publicStyles.circle,
                    active && publicStyles.circleActive,
                    done && publicStyles.circleDone,
                  ]}
                >
                  {done ? (
                    <Feather
                      name="check"
                      size={14}
                      color={publicTheme.surface}
                    />
                  ) : (
                    <Text
                      style={[
                        publicStyles.circleText,
                        active && publicStyles.circleTextActive,
                      ]}
                    >
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    publicStyles.label,
                    (active || done) && publicStyles.labelActive,
                  ]}
                  numberOfLines={1}
                >
                  {publicStepLabel(step)}
                </Text>
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[publicStyles.connector, done && publicStyles.lineDone]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step} style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              currentStep === index + 1 && styles.currentStepCircle,
            ]}
          >
            {currentStep > index + 1 ? (
              <Feather name="check" size={20} color={colors.green} />
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
          {index < steps.length - 1 && <View style={styles.line} />}
        </View>
      ))}
    </View>
  );
};

const publicStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: publicTheme.surface,
    borderRadius: publicTheme.radiusMd,
    borderWidth: 1,
    borderColor: publicTheme.border,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  stepCol: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  connector: {
    flexGrow: 0.65,
    flexShrink: 1,
    height: 2,
    marginTop: 13,
    backgroundColor: publicTheme.border,
    minWidth: 12,
    maxWidth: 48,
  },
  circle: {
    width: Platform.OS === "web" ? 28 : 26,
    height: Platform.OS === "web" ? 28 : 26,
    borderRadius: 14,
    backgroundColor: publicTheme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  circleActive: {
    backgroundColor: publicTheme.accent,
  },
  circleDone: {
    backgroundColor: publicTheme.success,
  },
  circleText: {
    fontSize: 12,
    fontWeight: "700",
    color: publicTheme.textSecondary,
  },
  circleTextActive: {
    color: publicTheme.surface,
  },
  label: {
    marginTop: 4,
    fontSize: Platform.OS === "web" ? 12 : 10,
    color: publicTheme.textMuted,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
  },
  labelActive: {
    color: publicTheme.textPrimary,
  },
  lineDone: {
    backgroundColor: publicTheme.success,
  },
});

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
    width: Platform.OS === "web" ? (width <= 1000 ? 10 : 40) : 10,
    height: 2,
    backgroundColor: colors.gray,
    marginHorizontal: 5,
  },
});

export default StepIndicatorHospedagem;
