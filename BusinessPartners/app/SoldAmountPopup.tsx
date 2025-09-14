import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { numberToWords } from "./utils/numberToWords";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImageManipulator from "expo-image-manipulator";

type Partner = {
  id: string;
  username: string;
  share?: number;
};

type SoldAmountPopupProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  partners: Partner[];
  cropDetails?: any;
};

const SoldAmountPopup: React.FC<SoldAmountPopupProps> = ({
  visible,
  onClose,
  onSave,
  partners,
  cropDetails,
}) => {
  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">(
    "share"
  );
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const n = await AsyncStorage.getItem("userName");
      const u = await AsyncStorage.getItem("userId");

      //console.log("📌 Loaded userId:", u);
      setUserName(n);
      setUserId(u);
    };
    loadData();
  }, []);

  const createdBy = userName; // Replace with AsyncStorage/context

  useEffect(() => {
    const initial = partners.map((p) => ({
      id: p.id,
      name: p.username,
      share: p.share ?? 0,
      actual: "",
      investing: "",
    }));
    setRows(initial);
  }, [partners]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1, // pick full quality initially
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // Compress and resize before saving
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }], // scale down width, keep aspect ratio
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG } // 60% quality
      );

      const file = {
        uri: manipulated.uri,
        name: asset.uri.split("/").pop() || "image.jpg",
        type: "image/jpeg",
      };

      setImages([...images, file]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    if (!partners.length) return;

    setRows((prev) =>
      partners.map((p, idx) => {
        const prevRow = prev[idx] || {};
        if (!totalAmount) return { ...prevRow, actual: "", investing: "" };

        if (splitMode === "share") {
          const actual = (((p.share ?? 0) / 100) * expected).toFixed(2);
          return { ...prevRow, actual, investing: actual };
        }

        if (splitMode === "equal") {
          const per = (expected / partners.length).toFixed(2);
          return { ...prevRow, actual: per, investing: per };
        }

        return {
          ...prevRow,
          actual: prevRow.investing || "",
          investing: prevRow.investing || "",
        };
      })
    );
  }, [splitMode, totalAmount, partners]);

  const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index].investing = value.replace(/^0+(?=\d)/, "");
      if (splitMode === "manual") next[index].actual = next[index].investing;
      return next;
    });
  };

  const handleSave = () => {
    const totalEntered = rows.reduce(
      (sum, r) => sum + (parseFloat(r.investing) || 0),
      0
    );
    if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    }

    const investmentData = rows.map((r) => ({
      partnerId: r.id,
      cropId: cropDetails?.id,
      description: description || "",
      comments: description || "",
      totalAmount: expected, // ❌ wrong → you’re passing total business amount
      investable: 0, // per-partner split amount (corrected here)
      invested: 0, // user entered / default invested
      soldAmount: parseFloat(r.investing || 0),
      withdrawn: 0,
      soldFlag: "Y",
      withdrawFlag: "N",
      splitType: splitMode.toUpperCase(),
      createdBy: createdBy,
    }));
    onSave({ investmentData, images });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Sold Amount</Text>
          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Amount"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
            {!!totalAmount && (
              <Text style={styles.amountWords}>
                {numberToWords(Number(totalAmount))}
              </Text>
            )}

            <View style={styles.splitContainer}>
              {["share", "equal", "manual"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setSplitMode(mode as any)}
                  style={[
                    styles.splitButton,
                    splitMode === mode && styles.splitButtonActive,
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: splitMode === mode ? "white" : "black",
                    }}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Table Headers */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={styles.headerCell}>User</Text>
              {splitMode === "share" && (
                <Text style={styles.headerCell}>Share %</Text>
              )}
              <Text style={styles.headerCell}>Actual</Text>
              <Text style={styles.headerCell}>Sold</Text>
              <Text style={styles.headerCell}>Diff</Text>
            </View>

            {/* Table Rows */}
            <View style={styles.table}>
              {rows.map((row, idx) => {
                const actualNum = parseFloat(row.actual) || 0;
                const soldNum = parseFloat(row.investing) || 0;
                const diff = soldNum - actualNum;

                return (
                  <View key={row.id} style={styles.row}>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: row.name.length > 10 ? 11 : 13 },
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    {splitMode === "share" && (
                      <Text style={styles.cell}>{row.share}%</Text>
                    )}
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: row.actual.length > 6 ? 11 : 13 },
                      ]}
                    >
                      {row.actual}
                    </Text>
                    <TextInput
                      style={[styles.cell, styles.inputCell]}
                      value={row.investing}
                      keyboardType="numeric"
                      onChangeText={(val) => handleInvestingChange(idx, val)}
                    />
                    <Text
                      style={[
                        styles.cell,
                        {
                          color:
                            diff > 0 ? "green" : diff < 0 ? "red" : "black",
                        },
                      ]}
                    >
                      {diff !== 0 ? diff.toFixed(2) : ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Image Upload Section */}
            <Text style={styles.sectionTitle}>Upload Images</Text>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={{ color: "white" }}>Pick Image</Text>
            </TouchableOpacity>
            <ScrollView horizontal style={{ marginTop: 8 }}>
              {images.map((file, idx) => (
                <View key={idx} style={styles.imagePreview}>
                  <TouchableOpacity onPress={() => setPreviewImage(file.uri)} activeOpacity={0.8}>
                    <Image source={{ uri: file.uri  }} style={styles.previewThumb} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                  onPress={() => removeImage(idx)}
                  >
                    <Text style={styles.deleteText}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </ScrollView>

          {/* cancel and save Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.buttonCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.buttonSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Full Image Preview */}
      {previewImage && (
        <Modal visible transparent onRequestClose={() => setPreviewImage(null)}>
          <View style={styles.previewOverlay}>
            <TouchableOpacity
              style={styles.previewClose}
              onPress={() => setPreviewImage(null)}
            >
              <Text style={{ color: "white", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
            <Image
              source={{ uri: previewImage }}
              style={styles.previewLarge}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
};

export default SoldAmountPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  amountWords: { fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  splitContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  splitButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
  },
  splitButtonActive: {
    backgroundColor: "#007bff",
  },
  table: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerRow: {
    borderBottomWidth: 1,
    borderColor: "#dc3131ff",
    paddingBottom: 4,
  },
  cell: { flex: 1, textAlign: "center", fontSize: 13 },
  inputCell: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  buttonCancel: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
  },
  buttonSave: {
    padding: 10,
    backgroundColor: "#28a745",
    borderRadius: 6,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  sectionTitle: { marginTop: 12, fontWeight: "bold" },
  imageButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 6,
    marginTop: 4,
    alignItems: "center",
  },
  imagePreview: {
    position: "relative",
    marginRight: 10,
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 0,
    padding: 2,
  },
  deleteBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    borderRadius: 0,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    position: "relative",
    width: "90%",
    height: "70%",
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    borderRadius: 8,
  },
  closePreviewBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "red",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
    previewLarge: {
    width: "90%",
    height: "80%",
  },
   previewClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
});
