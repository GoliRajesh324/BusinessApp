import AppHeader from "@/src/components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchCategoryById } from "../src/services/inventory";

export default function CategoryDetails() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams();

  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- Load Category Details ---------------- */
  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      try {
        const data = await fetchCategoryById(Number(categoryId), token);
        setCategory(data);
        setCategory(data);
        console.log("🔥 Loaded Category:", data);
      } catch (err) {
        console.log("❌ Error loading category:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  const handleEdit = () => {
    router.push({
      pathname: "/addCategory",
      params: {
        isEdit: "true",
        categoryId: category.id,
        name: category.name,
        description: category.description,
        quantityType: category.quantityType,
        imageUrl: "",
        businessId: category.businessId,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#4f93ff" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "red" }}>Category not found</Text>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={String("Category Details")}
          videoId="ogns8WiacUI"
          rightComponent={
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.headerRightText}>Edit</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          {/* ---------------- BODY ---------------- */}
          <ScrollView style={styles.body}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{category.name}</Text>

            <Text style={styles.label}>Description</Text>
            <Text style={styles.value}>{category.description || "—"}</Text>

            <Text style={styles.label}>Quantity Type</Text>
            <Text style={styles.value}>{category.quantityType}</Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

/* --------------- STYLES --------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },

  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    backgroundColor: "#4f93ff",
    paddingVertical: 14, // ✅ single padding
    paddingTop: 40, // ✅ to offset status bar
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginLeft: -40,
  },

  headerRightText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  body: { padding: 20 },
  label: { marginTop: 16, fontWeight: "700", color: "#333" },
  value: {
    marginTop: 4,
    fontSize: 16,
    color: "#444",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
  },

  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },

  noImageBox: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
