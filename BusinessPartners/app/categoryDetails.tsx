import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchCategoryById } from "./inventory";

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
        imageUrl: category.imageUrl ?? "",
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
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* ---------------- HEADER ---------------- */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerLeft}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Category Details</Text>

        <TouchableOpacity onPress={handleEdit}>
          <Text style={styles.headerRightText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ---------------- BODY ---------------- */}
      <ScrollView style={styles.body}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{category.name}</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>{category.description || "—"}</Text>

        <Text style={styles.label}>Quantity Type</Text>
        <Text style={styles.value}>{category.quantityType}</Text>

        <Text style={styles.label}>Image</Text>

        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.noImageBox}>
            <Ionicons name="image-outline" size={50} color="#aaa" />
            <Text style={{ color: "#999" }}>No Image</Text>
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLeft: { width: 40 },

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
