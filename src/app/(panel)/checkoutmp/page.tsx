import React, { useCallback, useEffect, useState } from "react";
import {
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import StatusBarPage from "@/src/components/StatusBarPage";
import colors from "@/src/constants/colors";
import BarMenu from "@/src/components/BarMenu";
import {
  Evento,
  EventoIngresso,
  Produtor,
  QueryParams,
} from "@/src/types/geral";
import { apiGeral } from "@/src/lib/geral";
import { useFocusEffect } from "expo-router";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Accordion from "@/src/components/Accordion";
import CounterTicket from "@/src/components/CounterTicket";
import { api } from "@/src/lib/api";
import ModalResumoIngresso from "@/src/components/ModalResumoIngresso";
import StepIndicator from "@/src/components/StepIndicator";
import formatCurrency from "@/src/components/FormatCurrency";
import { useCart } from "@/src/contexts_/CartContext";
import { CardPayment, initMercadoPago, Payment } from "@mercadopago/sdk-react";
import CreditCardForm from "@/src/components/CreditCardForm";
import WebViewMP from "@/src/components/WebViewMP";
import CheckoutMercadoPago from "@/src/components/CheckoutMercadoPago";

export default function Index() {
  initMercadoPago("TEST-98f4cccd-2514-4062-a671-68df4b579410", {
    locale: "pt-BR",
  });

  return (
    <View style={styles.container}>
      <CheckoutMercadoPago />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: Platform.OS === "web" ? 80 : 120,
    // marginRight: Platform.OS === "web" ? 200 : 5,
    // marginLeft: Platform.OS === "web" ? 200 : 5,
    // marginBottom: 20,
    // height: 500,
  },
});
