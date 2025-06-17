import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import colors from "@/src/constants/colors";
import { useNavigation } from "@react-navigation/native";

// Função util para formatar o valor em R$
function formatCurrency(valor: number | undefined) {
  return valor?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Função util para formatar a data
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR") + " às " + d.toLocaleTimeString("pt-BR");
}

const statusInfo = {
  approved: {
    color: "#27ae60",
    icon: "check-circle",
    label: "Pagamento aprovado",
    description: "Seu pagamento foi aprovado com sucesso!",
  },
  rejected: {
    color: "#e74c3c",
    icon: "close-circle",
    label: "Pagamento recusado",
    description: "Ocorreu um problema e o pagamento foi recusado.",
  },
  pending: {
    color: "#f1c40f",
    icon: "clock-outline",
    label: "Pagamento pendente",
    description: "Estamos aguardando a confirmação do pagamento.",
  },
  in_process: {
    color: "#3498db",
    icon: "information",
    label: "Pagamento em análise",
    description: "Seu pagamento está sendo processado.",
  },
  refunded: {
    color: "#8e44ad",
    icon: "undo",
    label: "Pagamento devolvido",
    description: "O valor foi devolvido ao pagador.",
  },
  // Adicione outros status se necessário
};

interface PaymentData {
  id: string;
  transaction_amount: number;
  status: keyof typeof statusInfo | string;
  status_detail?: string;
  payment_method_id?: string;
  date_approved?: string;
  date_created?: string;
  email?: string;
  installments: number;
}

interface MeuStatusCustomizadoProps {
  data?: PaymentData;
}

export default function StatusPaymentCustomizado({
  data,
}: MeuStatusCustomizadoProps) {
  if (!data) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.title}>Detalhes do pagamento não encontrados</Text>
        <Text style={styles.description}>Tente novamente mais tarde.</Text>
      </View>
    );
  }

  const info = statusInfo[data.status as keyof typeof statusInfo] || {
    color: "#7f8c8d",
    icon: "help-circle",
    label: "Status desconhecido",
    description: "Não foi possível identificar o status do pagamento.",
  };

  const navigation = useNavigation() as any;

  return (
    <View style={[styles.container, { borderColor: info.color }]}>
      {/* <MaterialCommunityIcons name={info.icon} size={64} color={info.color} /> */}
      <Text style={[styles.title, { color: info.color }]}>{info.label}</Text>
      <Text style={styles.description}>{info.description}</Text>
      <View style={styles.details}>
        <Text style={styles.detail}>
          <Text style={styles.label}>ID:</Text> {data.id}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Valor:</Text>{" "}
          {formatCurrency(data.transaction_amount)}
        </Text>
        {/* <Text style={styles.detail}>
          <Text style={styles.label}>Status:</Text>{" "}
          {data.status_detail || data.status}
        </Text> */}
        <Text style={styles.detail}>
          <Text style={styles.label}>Método:</Text>{" "}
          {data.payment_method_id?.toUpperCase()}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Data:</Text>{" "}
          {formatDate(data.date_approved || data.date_created)}
        </Text>
        {data.email && (
          <Text style={styles.detail}>
            <Text style={styles.label}>Pagador:</Text> {data.email}
          </Text>
        )}
        {data.installments > 1 && (
          <Text style={styles.detail}>
            <Text style={styles.label}>Parcelas:</Text> {data.installments}x de{" "}
            {formatCurrency(data.transaction_amount / data.installments)}
          </Text>
        )}
      </View>
      {data && data.status && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {data.status === "approved" && (
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonSave,
                { alignSelf: "center", marginTop: 16 },
              ]}
              onPress={() => navigation.navigate("meusingressos")}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Ver Ingressos
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 24,
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 12,
  },
  description: {
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
    marginTop: 6,
    textAlign: "center",
  },
  details: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  label: {
    fontWeight: "bold",
    color: "#555",
  },
  detail: {
    fontSize: 15,
    marginVertical: 2,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  buttonSave: {
    backgroundColor: colors.azul,
  },
});
