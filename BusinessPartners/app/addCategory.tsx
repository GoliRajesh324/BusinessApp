import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { createCategory } from "./inventory";

export default function AddCategory() {
  const router = useRouter();
  const { businessId } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantityType, setQuantityType] = useState<"KG" | "LITRES">("KG");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const saveCategory = async () => {
    if (!name.trim()) {
      return Alert.alert("Validation", "Enter category name");
    }

    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Error", "User token missing");

    const payload = {
      businessId: Number(businessId),
      name,
      description,
      quantityType,
      imageUrl,
      createdBy: 1,
    };

    try {
      await createCategory(payload, token);
      Alert.alert("Success", "Category added successfully");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save category");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* ------------------------------------- */}
          {/* ✅ FIXED HEADER (matches InventoryScreen) */}
          {/* ------------------------------------- */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Add Category</Text>

            {/* Placeholder right to keep title centered */}
            <View style={styles.rightPlaceholder} />
          </View>

          {/* BODY */}
          <View style={styles.container}>
            <Text style={styles.label}>Category Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter category name"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              multiline
            />

            <Text style={styles.label}>Quantity Type</Text>
            <View style={styles.qtyRow}>
              {["KG", "LITRES"].map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setQuantityType(type as any)}
                  style={[
                    styles.qtyChip,
                    quantityType === type && styles.qtyChipActive,
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: quantityType === type ? "#fff" : "#000",
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Image</Text>

            <View style={styles.imageRow}>
              {/* Gallery */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => alert("Image picking pending")}
              >
                <Ionicons name="image-outline" size={28} color="#4f93ff" />
              </TouchableOpacity>

              {/* Camera */}
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => alert("Camera pending")}
              >
                <Ionicons name="camera-outline" size={28} color="#4f93ff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveCategory}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={{ color: "#333", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#4f93ff",
    paddingTop: 45,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: -40, // keep title visually center
  },

  rightPlaceholder: {
    width: 40, // matches back button size
  },

  /* BODY */
  container: {
    padding: 20,
  },

  label: {
    fontWeight: "700",
    marginTop: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },

  qtyRow: { flexDirection: "row", marginTop: 10 },
  qtyChip: {
    borderWidth: 1,
    borderColor: "#aaa",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },

  qtyChipActive: {
    backgroundColor: "#4f93ff",
    borderColor: "#4f93ff",
  },

  imageRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  iconBtn: {
    width: 55,
    height: 55,
    borderRadius: 10,
    backgroundColor: "#e8f0ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  saveBtn: {
    backgroundColor: "#4f93ff",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 28,
  },

  cancelBtn: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    marginTop: 12,
  },
});
