import React from "react";
import { View, Text } from "react-native";

export default function BusinessDetail({ route }) {
  const { id, name } = route.params;

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 20 }}>Business ID: {id}</Text>
      <Text style={{ fontSize: 20 }}>Business Name: {name}</Text>
    </View>
  );
}
