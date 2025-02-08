import colors from "@/src/constants/colors";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";

interface CounterTicketProps {
  data: any; // Replace 'any' with the appropriate type if known
}

const CounterTicket: React.FC<CounterTicketProps> = ({ data }) => {
  // State to hold the counter value
  const [count, setCount] = useState(0);

  return (
    <View
      style={{
        flexDirection: "row",
        padding: 7,
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.1)",
      }}
    >
      <View key={data.id}>
        <Text style={{ fontWeight: "normal", paddingLeft: 5, fontSize: 18 }}>
          Day use Adulto R$ 60,00
        </Text>
      </View>
      <View>
        <View style={{ marginLeft: 10, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              style={{
                backgroundColor: "rgb(0, 146, 250)",
                borderRadius: 5,
              }}
              onPress={() => setCount(count + 1)}
            >
              <Feather name="plus" size={28} color="white"></Feather>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, marginHorizontal: 5 }}>{count}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: "rgb(0, 146, 250)",
                borderRadius: 5,
              }}
              onPress={() => setCount(count - 1)}
            >
              <Feather name="minus" size={28} color="white"></Feather>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
  },
  counterText: {
    fontSize: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default CounterTicket;
