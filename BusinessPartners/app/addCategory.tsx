import AppHeader from "@/src/components/AppHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createCategory, updateCategory } from "../src/services/inventory";

export default function AddCategory() {
  const router = useRouter();
  const {
    businessId,
    isEdit,
    categoryId,
    name: editName,
    description: editDesc,
    quantityType: editQty,
    imageUrl: editImageUrl, // ✅ ADD THIS
  } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [quantityType, setQuantityType] = useState<string>("KG");
  const [image, setImage] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const quantityTypes = ["KG", "LITER", "BAG", "PACKET"];
  /* ------------------ IMAGE PICKERS ------------------ */
  useEffect(() => {
    if (isEdit === "true") {
      if (editName) setName(editName as string);
      if (editDesc) setDescription(editDesc as string);
      if (editQty) setQuantityType(editQty as string);

      // ✅ SET EXISTING IMAGE
      if (editImageUrl) {
        setImage({
          uri: editImageUrl,
          isExisting: true, // 🔥 important flag
        });
      }
    }
  }, [isEdit, editName, editDesc, editQty, editImageUrl]);

  /* ------------------ SAVE CATEGORY ------------------ */
  const saveCategory = async () => {
    Keyboard.dismiss();

    if (!name.trim()) return Alert.alert("Enter category name");

    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Token missing");

    try {
      const payload = {
        businessId: Number(businessId),
        name,
        description,
        quantityType,
        createdBy: 1,
      };
      setSaving(true);
      if (isEdit === "true") {
        let finalImage = null;
        let payload: any = {
          name,
          description,
          quantityType,
        };

        // ✅ NEW IMAGE
        if (image && !image.isExisting) {
          finalImage = image;
        }

        // ✅ IMAGE REMOVED
        if (!image) {
          payload.removeImage = true;
        }

        await updateCategory(Number(categoryId), payload, finalImage, token);

        Alert.alert("Success", "Category updated successfully");
        router.back();
        return;
      }

      // ✅ CREATE WITH IMAGE
      await createCategory(
        payload,
        image, // ✅ send image
        token,
      );

      Alert.alert("Success", "Category created");
      router.back();
    } catch (err: any) {
      console.log(err);
      Alert.alert("Error", err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    //if (!perm.granted) return Alert.alert("Permission required");

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Camera permission required");

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0]);
    }
  };

  const removeImage = () => setImage(null);
  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={isEdit === "true" ? "Edit Category" : "Add Category"}
          rightComponent={
            <TouchableOpacity
              onPress={saveCategory}
              disabled={saving}
              style={[styles.headerRight]}
            >
              <Text style={styles.saveText}>
                {saving ? t("saving") : t("save")}
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView edges={["bottom"]} style={styles.safeBottom}>
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
              {quantityTypes.map((v) => (
                <TouchableOpacity
                  key={v}
                  onPress={() => setQuantityType(v)}
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

            {/* Image */}
            <Text style={styles.label}>Image</Text>

            <View style={styles.imageRow}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickFromGallery}
              >
                <Text>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickFromCamera}
              >
                <Text>Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            {image && (
              <View style={{ marginTop: 12, position: "relative", width: 120 }}>
                <Image source={{ uri: image.uri }} style={styles.thumbnail} />

                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={removeImage}
                >
                  <Text style={{ color: "#fff" }}>X</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* STYLES */
/* ---------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeTop: { backgroundColor: "#4f93ff" },
  safeBottom: { flex: 1, backgroundColor: "#f3f4f6" },

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
  qtyRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
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

  headerRight: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
