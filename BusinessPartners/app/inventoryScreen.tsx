import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CategoryCard from "./components/CategoryCard";
import { fetchCategories } from "./inventory";

export default function InventoryScreen() {
  const router = useRouter();

  const { businessId, businessName } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const t = await AsyncStorage.getItem("token");
        if (!t) return;

        loadCategories(t);
      })();
    }, [businessId])
  );

  // Load categories
  const loadCategories = async (t: string) => {
    try {
      const response = await fetchCategories(Number(businessId), t);
      setCategories(response);
    } catch (err) {
      console.log("❌ Category Fetch Error:", err);
    }
  };

  const handleBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{businessName ?? "Inventory"}</Text>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/addCategory",
              params: { businessId },
            })
          }
        >
          <Text style={styles.addText}>Add Category</Text>
        </TouchableOpacity>
      </View>

      {/* Category list */}
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No categories yet. Click "Add Category".
          </Text>
        }
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            onPress={() =>
              router.push({
                pathname: "/categoryDetails",
                params: { categoryId: item.id },
              })
            }
          />
        )}
      />

      {/* FOOTER BUTTONS */}
      <View style={styles.footer}>
        {/* Add Stock */}
        <TouchableOpacity
          style={[styles.footerBtn, styles.addStockBtn]}
          onPress={() => {
            if (categories.length === 0) {
              return alert("Please add at least one category first.");
            }

            router.push({
              pathname: "/addStock",
              params: { businessId },
            });
          }}
        >
          <Text style={styles.footerBtnText}>Add Stock</Text>
        </TouchableOpacity>

        {/* Consume Stock */}
        <TouchableOpacity
          style={[styles.footerBtn, styles.consumeBtn]}
          onPress={() => {
            if (categories.length === 0) {
              return alert("Please add at least one category first.");
            }

            const hasStock = categories.some(
              (c: any) => Number(c.availableQuantity) > 0
            );

            if (!hasStock) {
              return alert("No stock available to consume.");
            }

            router.push({
              pathname: "/consumeStock",
              params: { businessId },
            });
          }}
        >
          <Text style={styles.footerBtnText}>Consume Stock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
  },

  headerLeft: { width: 40 },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  addText: { color: "#fff", fontWeight: "600" },

  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#777",
  },

  /* ----- Footer buttons ----- */

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },

  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
  },

  addStockBtn: {
    backgroundColor: "#28a745", // Green
  },

  consumeBtn: {
    backgroundColor: "#dc3545", // Red
  },

  footerBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
