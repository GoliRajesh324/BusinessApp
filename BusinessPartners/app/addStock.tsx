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

export default function AddStock() {
  const router = useRouter();

  const { businessId } = useLocalSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const token = await AsyncStorage.getItem("token");

    if (!token) return;

    try {
      const data = await fetchCategories(Number(businessId), token);
      setCategories(data);
    } catch (e) {
      console.log("Error loading categories:", e);
    }
  };

  const saveStock = async () => {
    if (!selectedCategory) {
      return Alert.alert("Validation", "Please select a category");
    }

    if (!quantity.trim()) {
      return Alert.alert("Validation", "Enter quantity");
    }

    const token = await AsyncStorage.getItem("token");

    try {
      await changeStock(
        {
          businessId: Number(businessId),
          categoryId: selectedCategory.id,
          changeType: "ADD",
          quantity: Number(quantity),
          note: "",
        },
        token ?? ""
      );

      Alert.alert("Success", "Stock Added");
      router.back();
    } catch (e) {
      console.log("Stock save error:", e);
      Alert.alert("Error", "Unable to save stock");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>&lt; Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Stock</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Select Category */}
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
            <Text style={styles.categoryText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Quantity Input */}
      {selectedCategory && (
        <>
          <Text style={styles.label}>
            Enter Quantity ({selectedCategory.quantityType})
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="Enter Quantity"
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveStock}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
  },

  back: { color: "#007bff", fontSize: 16 },

  title: { fontSize: 20, fontWeight: "700" },

  label: { marginTop: 20, fontWeight: "700", fontSize: 15 },

  categoryItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 8,
  },

  categoryActive: {
    borderColor: "#007bff",
    backgroundColor: "#e8f0ff",
  },

  categoryText: { fontSize: 16 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },

  saveBtn: {
    marginTop: 20,
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
