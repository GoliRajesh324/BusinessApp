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
import { changeStock, fetchCategories } from "./inventory";

export default function ConsumeStock() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [quantity, setQuantity] = useState("");

  /* ---------------- Load categories ---------------- */
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const data = await fetchCategories(Number(businessId), token);
      setCategories(data);
    })();
  }, [businessId]);

  /* ---------------- Save stock consumption ---------------- */
  const saveConsumption = async () => {
    if (!selectedCategory)
      return Alert.alert("Validation", "Please select a category");

    if (!quantity.trim()) return Alert.alert("Validation", "Enter quantity");

    const qty = Number(quantity);
    if (qty <= 0) return Alert.alert("Error", "Quantity must be > 0");

    if (qty > selectedCategory.availableQuantity) {
      return Alert.alert(
        "Not Enough Stock",
        `Only ${selectedCategory.availableQuantity} ${selectedCategory.quantityType} available.`
      );
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      await changeStock(
        {
          businessId: Number(businessId),
          categoryId: selectedCategory.id,
          changeType: "CONSUME",
          quantity: qty,
          note: "",
        },
        token
      );

      Alert.alert("Success", "Stock consumed successfully");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to consume stock");
    }
  };
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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

        <Text style={styles.headerTitle}>Consume Stock</Text>

        <TouchableOpacity onPress={saveConsumption}>
          <Text style={styles.headerRightText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* ─────────────────────────────────────────── */}
      {/* BODY */}
      {/* ─────────────────────────────────────────── */}
      {/* Quantity Input */}
      {selectedCategory && (
        <>
          <Text style={styles.label}>
            Quantity to Consume ({selectedCategory.quantityType})
          </Text>

          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="Enter quantity"
          />
        </>
      )}
      <Text style={styles.label}>Select Category</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryItem,
              selectedCategory?.id === item.id && styles.categoryActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory?.id === item.id && { color: "#fff" },
              ]}
            >
              {item.name}
            </Text>

            <Text
              style={[
                styles.stockText,
                selectedCategory?.id === item.id && { color: "#fff" },
              ]}
            >
              Available: {item.availableQuantity} {item.quantityType}
            </Text>
          </TouchableOpacity>
        )}
      />
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
    fontWeight: "700",
    fontSize: 16,
  },

  /* Body */
  label: {
    marginTop: 20,
    marginLeft: 10,
    fontWeight: "700",
    fontSize: 15,
  },

  categoryItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginTop: 10,
    marginHorizontal: 10,
  },

  categoryActive: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },

  categoryText: { fontSize: 16, fontWeight: "600", color: "#333" },

  stockText: { marginTop: 4, color: "#666" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 10,
    fontSize: 16,
  },
});
