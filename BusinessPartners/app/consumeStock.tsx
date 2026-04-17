import AppHeader from "@/src/components/AppHeader";
import { showToast } from "@/src/utils/ToastService";
import { getVideoId } from "@/src/utils/VideoStorage";
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

export default function ConsumeStock() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
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
    })();
  }, [businessId]);

  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("consumeStock");
    setVideoId(id);
  };
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
        `Only ${selectedCategory.availableQuantity} ${selectedCategory.quantityType} available.`,
      );
    }

    const token = await AsyncStorage.getItem("token");
    const userId = await AsyncStorage.getItem("userId");
    if (!token) return;

    try {
      setSaving(true);
      await changeStock(
        {
          businessId: Number(businessId),
          categoryId: selectedCategory.id,
          changeType: "CONSUME",
          quantity: qty,
          note: notes,
          createdBy: userId,
        },
        token,
      );
      showToast("Stock consumed successfully", "success");
      router.back();
    } catch (err: any) {
      showToast(err.message || "Failed to consume stock", "error");
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={String("Consume Stock")}
          videoId={videoId}
          rightComponent={
            <TouchableOpacity onPress={saveConsumption} disabled={saving}>
              <Text style={styles.headerRightText}>
                {saving ? "Saving" : "Save"}
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
                placeholderTextColor={"#ccc"}
                placeholder="Enter quantity"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.notes}
                value={notes}
                onChangeText={setNotes}
                placeholderTextColor={"#ccc"}
                placeholder="Enter Description"
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
      </SafeAreaView>
    </>
  );
}

/* ─────────────────────────────────────────── */
/* STYLES */
/* ─────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

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
  notes: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    fontSize: 16,
  },
});
