// src/screens/Settings.tsx
import React from "react";
import { View, Text } from "react-native";
import Header from "../../app/components/Header";

export default function Settings() {
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Text>Settings Page</Text>
    </View>
  );
}
