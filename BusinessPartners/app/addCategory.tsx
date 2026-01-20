import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { createCategory, updateCategory } from "./inventory";

export default function AddCategory() {
  const router = useRouter();
  const {
    businessId,
    isEdit,
    categoryId,
    name: editName,
    description: editDesc,
    quantityType: editQty,
  } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantityType, setQuantityType] = useState<"KG" | "LITERS">("KG");

  /* ------------------ IMAGE PICKERS ------------------ */
  useEffect(() => {
    if (isEdit === "true") {
      if (editName) setName(editName as string);
      if (editDesc) setDescription(editDesc as string);
      if (editQty) setQuantityType(editQty as "KG" | "LITERS");
    }
  }, [isEdit, editName, editDesc, editQty]);

  /* ------------------ SAVE CATEGORY ------------------ */
  const saveCategory = async () => {
    if (!name.trim()) return Alert.alert("Enter category name");

    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Token missing");

    try {
      if (isEdit === "true") {
        // UPDATE
        await updateCategory(
          Number(categoryId),
          {
            name,
            description,
            quantityType,
          },
          token
        );

        Alert.alert("Success", "Category updated successfully");
        router.back();
        return;
      }

      // CREATE
      await createCategory(
        {
          businessId: Number(businessId),
          name,
          description,
          quantityType,
          createdBy: 1,
        },
        token
      );

      Alert.alert("Success", "Category created");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ================================================================== */}
      {/* CUSTOM HEADER (same as inventory) */}
      {/* ================================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEdit === "true" ? "Edit Category" : "Add Category"}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* ================================================================== */}
      {/* BODY */}
      {/* ================================================================== */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Name */}
          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter category name"
          />

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            multiline
          />

          {/* Quantity Type */}
          <Text style={styles.label}>Quantity Type</Text>
          <View style={styles.qtyRow}>
            {["KG"].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setQuantityType(v as "KG" | "LITERS")}
                style={[
                  styles.qtyOption,
                  quantityType === v && styles.qtySelected,
                ]}
              >
                <Text
                  style={{
                    color: quantityType === v ? "#fff" : "#333",
                    fontWeight: "700",
                  }}
                >
                  {v}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
          </TouchableOpacity>

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#333", fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

/* ---------------------------------------------------------------------- */
/* STYLES */
/* ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /* Header */
  header: {
    backgroundColor: "#4f93ff",
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 999,
  },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: -40,
  },

  /* Body */
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  label: { fontWeight: "600", marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 6,
    padding: 10,
  },

  /* Quantity */
  qtyRow: { flexDirection: "row", marginTop: 10 },
  qtyOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#aaa",
    marginRight: 12,
  },
  qtySelected: {
    backgroundColor: "#4f93ff",
    borderColor: "#4f93ff",
  },

  /* Image */
  imageRow: { flexDirection: "row", marginTop: 10 },
  imageButton: {
    padding: 16,
    backgroundColor: "#eef4ff",
    borderRadius: 12,
    marginRight: 12,
  },
  thumbnail: {
    width: 120,
    height: 90,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Buttons */
  saveBtn: {
    marginTop: 28,
    backgroundColor: "#4f93ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
  },

  /* Preview Modal */
  previewModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: { width: "90%", height: "70%" },
  previewClose: { position: "absolute", top: 50, right: 30 },
});
