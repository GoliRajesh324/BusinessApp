import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function BusinessDetail() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  return (
    <View>
      <Text>ID: {id}</Text>
      <Text>Name: {name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  info: { fontSize: 18, marginVertical: 5 },
});
