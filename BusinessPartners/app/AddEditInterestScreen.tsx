import AppHeader from "@/src/components/AppHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert, StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
    <>
      {/* TOP SAFE AREA */}
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={record ? "Edit Record" : "Add Record"} />
      </SafeAreaView>

      {/* CONTENT SAFE AREA */}
      <SafeAreaView edges={["bottom"]} style={styles.safeBottom}>
        <View style={styles.container}>
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

            {/* Toggle */}
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

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeTop: { backgroundColor: "#4f93ff" },
  safeBottom: { flex: 1, backgroundColor: "#f3f4f6" },

  container: {
    flex: 1,
    padding: 16,
  },

  form: { marginTop: 10 },

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

  saveBtn: {
    marginTop: 30,
    backgroundColor: "#4f93ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
});
