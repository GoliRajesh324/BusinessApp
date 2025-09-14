// src/screens/Profile.tsx
import React from "react";
import { View, Text } from "react-native";
import Header from "../../app/components/Header";

export default function Profile() {
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <Text>Profile Page</Text>
    </View>
  );
}
