import AppHeader from "@/src/components/AppHeader";
import { showToast } from "@/src/utils/ToastService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changeStock, fetchCategories } from "../src/services/inventory";

export default function AddStock() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  /* ---------------- Load categories ---------------- */
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const data = await fetchCategories(Number(businessId), token);
      setCategories(data);

      // Auto-select first category
      if (data.length > 0) setSelectedCategoryId(data[0].id);
    })();
  }, [businessId]);

  /* ---------------- Save Stock ---------------- */
  const saveStock = async () => {
    if (!selectedCategoryId) return showToast("Select a category", "info");
    if (!quantity.trim()) return showToast("Enter quantity", "info");

    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");
    if (!token) return;

    try {
      setSaving(true);
      await changeStock(
        {
          businessId: Number(businessId),
          categoryId: selectedCategoryId,
          changeType: "ADD",
          quantity: quantity,
          note: notes,
          createdBy: userId,
        },
        token,
      );

      showToast("Stock added successfully", "success");
      router.back();
    } catch (err: any) {
      showToast(err.message || "Could not add stock", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* TOP SAFE AREA */}
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <StatusBar style="light" backgroundColor="#4f93ff" />

        <AppHeader
          title="Add Stock"
          rightComponent={
            <TouchableOpacity
              onPress={saveStock}
              disabled={saving} // ✅ disable button
            >
              <Text
                style={{
                  color: saving ? "#ccc" : "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      {/* BOTTOM SAFE AREA */}
      <SafeAreaView edges={["bottom"]} style={styles.safeBottom}>
        <View style={styles.container}>
          {/* BODY */}
          <View style={styles.body}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              placeholderTextColor={"#ccc"}
            />
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.notes}
              value={notes}
              onChangeText={setNotes}
              placeholder="Enter Description"
              placeholderTextColor={"#ccc"}
            />
            <Text style={styles.label}>Select Category</Text>

            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedCategoryId(item.id)}
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === item.id && styles.categorySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategoryId === item.id && { color: "#fff" },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

/* ─────────────────────────────────────────── */
/* STYLES */
/* ─────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeTop: { backgroundColor: "#4f93ff" },
  safeBottom: { flex: 1, backgroundColor: "#fff" },
  /* Body */
  body: {
    flex: 1,
    padding: 20,
    paddingTop: 10, // <-- prevents overlap
  },

  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },

  categoryItem: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 8,
  },

  categorySelected: {
    backgroundColor: "#4f93ff",
    borderColor: "#4f93ff",
  },

  categoryText: {
    fontSize: 16,
    color: "#333",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
  },
  notes: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
  },
});
