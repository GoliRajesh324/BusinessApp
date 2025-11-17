import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function CategoryDetails() {
  const { categoryId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Category Details</Text>
      <Text style={styles.subtitle}>ID: {categoryId}</Text>

      <Text style={styles.note}>We will build this next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { marginTop: 10, fontSize: 16, color: "#333" },
  note: { marginTop: 20, color: "#888" },
});
