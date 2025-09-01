import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "@/src/constants/colors";
import { useNavigation } from "@react-navigation/native";
import { useRoute } from "@react-navigation/native";

// Função util para formatar o valor em R$
function formatCurrency(valor: string | number | undefined) {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return num?.toLocaleString("pt-BR", {
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

const payment_status = {
  1: {
    color: "#f1c40f",
    icon: "clock-outline",
    label: "Pagamento solicitado",
    description: "Estamos aguardando a confirmação do pagamento.",
  },
  4: {
    color: "#27ae60",
    icon: "check-circle",
    label: "Pagamento aprovado",
    description: "Seu pagamento foi aprovado com sucesso!",
  },
  5: {
    color: "#e74c3c",
    icon: "close-circle",
    label: "Pagamento cancelado ou com erro",
    description: "Ocorreu um problema e o pagamento foi recusado ou cancelado.",
  },
};

interface PaymentData {
  payment_uniqueid: number;
  created_at: string;
  payment_status: number;
  payment_message: string;
  payment_data: {
    id_payment: any;
    cardholder_name: any;
    brand: any;
    nsu: any;
    authorization_code: any;
    authorization_date_time: any;
  };
}

interface MeuStatusCustomizadoProps {
  data?: PaymentData;
  idUsuario?: number;
}

export default function StatusPaymentCustomizadoPOS({
  data,
  idUsuario,
}: MeuStatusCustomizadoProps) {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { idEvento } = route.params as {
    idEvento: number;
  };

  if (!data) {
    return (
      <View style={styles.container}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={styles.title}>Detalhes do pagamento não encontrados</Text>
        <Text style={styles.description}>Tente novamente mais tarde.</Text>
      </View>
    );
  }

  const info = payment_status[
    data.payment_status as keyof typeof payment_status
  ] || {
    color: "#7f8c8d",
    icon: "help-circle",
    label: "Status desconhecido",
    description: "Não foi possível identificar o status do pagamento.",
  };

  return (
    <View style={[styles.container, { borderColor: info.color }]}>
      {/* <MaterialCommunityIcons name={info.icon} size={64} color={info.color} /> */}
      <Text style={[styles.title, { color: info.color }]}>{info.label}</Text>
      <Text style={styles.description}>{info.description}</Text>

      <View style={styles.details}>
        <Text style={styles.detail}>
          <Text style={styles.label}>ID:</Text> {data.payment_uniqueid}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Data:</Text> {formatDate(data.created_at)}
        </Text>
        <Text style={styles.detail}>
          <Text style={styles.label}>Mensagem:</Text> {data.payment_message}
        </Text>
      </View>

      {data.payment_status === 4 && idEvento === 1 && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSave,
            { alignSelf: "center", marginTop: 16 },
          ]}
          onPress={() =>
            navigation.navigate("validador", {
              idUsuario: idUsuario,
            })
          }
        >
          <Text style={{ color: "white", fontWeight: "600" }}>
            Validador Jango
          </Text>
        </TouchableOpacity>
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
