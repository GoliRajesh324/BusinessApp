import AppHeader from "@/src/components/AppHeader";
import BASE_URL from "@/src/config/config";
import { numberToWords } from "@/src/utils/numberToWords";
import { showToast } from "@/src/utils/ToastService";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddAvailableMoney = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const businessId = params.businessId as string;
  const businessName = params.businessName as string;
  const cropId = params.cropId as string;

  const { mode, investmentGroupId } = params;
  const isEdit = mode === "edit";

  const [images, setImages] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // ✅ Load token
  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    load();
  }, []);

  // ✅ Fetch partners (ONLY for ADD mode)
  useEffect(() => {
    if (!token || !businessId || isEdit) return;

    const fetchPartners = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/business/${businessId}/partners`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (data?.partners) {
          const mapped = data.partners.map((p: any) => ({
            id: p.partnerId,
            name: p.username,
            amount: "",
          }));

          setRows(mapped);
        }
      } catch (err) {
        console.log("❌ Partner fetch failed:", err);
      }
    };

    fetchPartners();
  }, [token, businessId, isEdit]);

  // ✅ FETCH EXISTING DEPOSIT DATA (EDIT MODE)
  useEffect(() => {
    if (!isEdit || !investmentGroupId || !token) return;

    fetchDepositData();
  }, [isEdit, investmentGroupId, token]);

  const fetchDepositData = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/investment/all-group-investments/${investmentGroupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      preloadDepositData(data);
    } catch (e) {
      showToast("Failed to load deposit data", "error");
    }
  };

  const preloadDepositData = (data: any[]) => {
    if (!data || !data.length) return;

    const first = data[0];

    setDescription(first.description || "");

    const mapped = data.map((inv) => ({
      id: inv.partnerId,
      name: inv.partnerName,
      amount: String(inv.totalAmount || 0),
    }));

    setRows(mapped);

    // ✅ ADD THIS (images preload)
    if (first?.images) {
      const formatted = first.images.map((img: string) => ({
        uri: img,
        isExisting: true,
      }));
      setImages(formatted);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
          isExisting: false,
        },
      ]);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showToast("Camera permission required", "error");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
          isExisting: false,
        },
      ]);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  // ✅ SAVE (UNCHANGED for now)
  const handleSave = async () => {
    if (isSaving) return; // ✅ prevent double click
    if (!description || description.trim() === "") {
      Alert.alert("Error", "Description is required");
      return;
    }

    const hasValidAmount = rows.some((r) => r.amount && Number(r.amount) > 0);

    if (!hasValidAmount) {
      Alert.alert("Error", "Enter at least one partner amount");
      return;
    }

    try {
      setIsSaving(true); // ✅ START LOADING
      const payload = {
        businessId: Number(businessId),
        cropId: Number(cropId),
        description,
        createdBy: await AsyncStorage.getItem("userName"),
        investmentGroupId: isEdit ? Number(investmentGroupId) : null,

        partners: rows
          .filter((r) => r.amount && Number(r.amount) > 0)
          .map((r) => ({
            partnerId: r.id,
            availableMoney: Number(r.amount),
          })),
      };

      console.log("🚀 Payload:", payload);

      // ✅ 1. Create FormData
      const formData = new FormData();

      // ✅ 2. Append JSON
      formData.append("depositData", JSON.stringify(payload));

      // ✅ 3. EXISTING IMAGES (for edit)
      const existingImages = images
        .filter((img) => img.isExisting)
        .map((img) => img.uri);

      formData.append("existingImages", JSON.stringify(existingImages));

      // ✅ 4. NEW IMAGES
      images
        .filter((img) => !img.isExisting)
        .forEach((img, index) => {
          formData.append("files", {
            uri: img.uri,
            name: img.fileName || `image_${Date.now()}_${index}.jpg`,
            type: img.mimeType || "image/jpeg",
          } as any);
        });

      // ✅ 5. API CALL (IMPORTANT: remove content-type)
      const res = await fetch(`${BASE_URL}/api/investment/initial-deposit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ DO NOT SET Content-Type
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save");
      }
      router.back();
      showToast("Available money saved successfully", "success");
    } catch (err: any) {
      console.log("❌ Save error:", err);
      showToast(err.message || "Failed to save", "error");
    } finally {
      setIsSaving(false); // ✅ STOP LOADING
    }
  };

  const isValid =
    description && rows.some((r) => r.amount && Number(r.amount) > 0);

  return (
    <>
      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />

        <AppHeader
          title={isEdit ? "Edit Available Money" : "Add Available Money"}
          rightComponent={
            <TouchableOpacity
              onPress={handleSave}
              disabled={!isValid || isSaving}
            >
              <Text style={{ color: !isValid || isSaving ? "#ccc" : "#fff" }}>
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      {/* BODY */}
      <View style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Business Name */}
          <Text style={styles.businessName}>{businessName}</Text>

          {/* Edit Mode Info */}
          {isEdit && (
            <Text style={{ marginBottom: 10, color: "#666" }}>
              Editing existing deposit
            </Text>
          )}

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.inputBox}
              placeholderTextColor={"#ccc"}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Partners */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Partners</Text>

            {rows.map((r, index) => (
              <View key={r.id} style={styles.partnerCard}>
                <Text style={styles.partnerName}>{r.name.toUpperCase()}</Text>

                <TextInput
                  style={styles.partnerInput}
                  placeholderTextColor={"#ccc"}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={r.amount}
                  onChangeText={(val) => {
                    const updated = [...rows];
                    updated[index].amount = val;
                    setRows(updated);
                  }}
                />

                {!!r.amount && Number(r.amount) > 0 && (
                  <Text style={styles.amountWords}>
                    {numberToWords(Number(r.amount))}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{t("images")}</Text>

          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <TouchableOpacity style={styles.cameraBtn} onPress={pickFromCamera}>
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: "#28a745" }]}
              onPress={pickFromGallery}
            >
              <Ionicons name="image" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal>
            {images.map((img, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setPreviewImage(img.uri)}
              >
                <Image
                  source={{ uri: img.uri }}
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeImage(i)}
                  style={styles.removeBtn}
                >
                  <Text style={{ color: "#fff" }}>X</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Preview */}
          {previewImage && (
            <Modal transparent>
              <TouchableOpacity
                style={styles.previewContainer}
                onPress={() => setPreviewImage(null)}
              >
                <Image
                  source={{ uri: previewImage }}
                  style={styles.previewImage}
                />
              </TouchableOpacity>
            </Modal>
          )}
        </ScrollView>
      </View>
    </>
  );
};

export default AddAvailableMoney;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingTop: 10,
    backgroundColor: "#f5f7fb",
  },

  businessName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  inputContainer: {
    marginBottom: 10,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },

  inputBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  partnerCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    marginBottom: 12,
  },

  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },

  partnerInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
  },

  amountWords: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    marginTop: 4,
  },
  imageBtn: {
    backgroundColor: "#4f93ff",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 10,
  },

  imageBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  removeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 4, // ✅ square with slight curve (not circle)
    backgroundColor: "rgba(232, 36, 36, 0.7)", // looks premium
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 12,
  },
  icon: {
    fontSize: 36,
  },
  cameraBtn: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
});
