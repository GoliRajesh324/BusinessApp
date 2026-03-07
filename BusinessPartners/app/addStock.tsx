import AppHeader from "@/src/components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
    if (!selectedCategoryId) return Alert.alert("Select a category");
    if (!quantity.trim()) return Alert.alert("Enter quantity");

    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      await changeStock(
        {
          businessId: Number(businessId),
          categoryId: selectedCategoryId,
          changeType: "ADD",
          quantity: quantity,
          note: "",
        },
        token,
      );

      Alert.alert("Success", "Stock added successfully");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not add stock");
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
            <TouchableOpacity onPress={saveStock}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Save
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
});
