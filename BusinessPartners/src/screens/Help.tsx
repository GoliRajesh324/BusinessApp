// src/screens/Help.tsx
import React from "react";
import { View, Text } from "react-native";
import Header from "../../app/components/Header";

export default function Help() {
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Text>Help Page</Text>
    </View>
  );
}
