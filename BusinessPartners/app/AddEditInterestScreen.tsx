import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AddEditInterestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const record = params.record ? JSON.parse(params.record as string) : null;

  const [form, setForm] = useState({
    name: record?.name || "",
    amount: record?.amount?.toString() || "",
    rate: record?.rate?.toString() || "",
    type: record?.type || "given",
  });

  const handleSave = () => {
    if (!form.name || !form.amount) {
      Alert.alert("Error", "Name and Amount are required");
      return;
    }
    Alert.alert("Saved", `${record ? "Updated" : "Added"} successfully`);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {record ? "Edit Record" : "Add Record"}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Name"
          style={styles.input}
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
        />
        <TextInput
          placeholder="Amount"
          keyboardType="numeric"
          style={styles.input}
          value={form.amount}
          onChangeText={(v) => setForm({ ...form, amount: v })}
        />
        <TextInput
          placeholder="Rate (%)"
          keyboardType="numeric"
          style={styles.input}
          value={form.rate}
          onChangeText={(v) => setForm({ ...form, rate: v })}
        />

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              form.type === "given" && styles.activeBtn,
            ]}
            onPress={() => setForm({ ...form, type: "given" })}
          >
            <Text
              style={[
                styles.toggleText,
                form.type === "given" && styles.activeText,
              ]}
            >
              Money Given
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              form.type === "taken" && styles.activeBtn,
            ]}
            onPress={() => setForm({ ...form, type: "taken" })}
          >
            <Text
              style={[
                styles.toggleText,
                form.type === "taken" && styles.activeText,
              ]}
            >
              Money Taken
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  saveText: { color: "#fff", fontSize: 16 },
  form: { padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  toggleText: { color: "#333" },
  activeBtn: { backgroundColor: "#007bff" },
  activeText: { color: "#fff" },
});
