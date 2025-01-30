import React from "react";
import { StatusBar } from "expo-status-bar";
import { useIsFocused } from "@react-navigation/native";

import { StatusBarProps } from "expo-status-bar";

function StatusBarPage(props: StatusBarProps) {
  const isFocused = useIsFocused();

  return isFocused ? <StatusBar {...props} /> : null;
}

export default StatusBarPage;
