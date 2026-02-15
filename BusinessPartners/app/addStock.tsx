import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    <View style={styles.container}>
      {/* ─────────────────────────────────────────── */}
      {/* HEADER */}
      {/* ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerLeft}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Add Stock</Text>

        <TouchableOpacity onPress={saveStock}>
          <Text style={styles.headerRightText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ─────────────────────────────────────────── */}
      {/* BODY */}
      {/* ─────────────────────────────────────────── */}
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
  );
}

/* ─────────────────────────────────────────── */
/* STYLES */
/* ─────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  /* Header */
  header: {
    backgroundColor: "#4f93ff",
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 9999, // <-- added
    elevation: 6, // <-- added
    position: "relative", // <-- added
  },

  headerLeft: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: -40,
  },
  headerRightText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

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
