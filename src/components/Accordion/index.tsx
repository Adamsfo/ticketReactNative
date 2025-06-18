import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type AccordionProps = {
  index: number;
  title: string;
  children: React.ReactNode;
};

const Accordion: React.FC<AccordionProps> = ({ index, title, children }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const toggleAccordion = () => {
    setExpanded(!expanded);
  };

  useEffect(() => {
    if (index === 0) {
      setExpanded(true);
    }
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleAccordion} style={styles.header}>
        <Text style={styles.headerText}>{title}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color="#444"
          style={styles.icon}
        />
      </TouchableOpacity>
      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
  },
  header: {
    backgroundColor: "#f1f1f1",
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
  },
  icon: {
    marginLeft: 10,
  },
  content: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
});

export default Accordion;
