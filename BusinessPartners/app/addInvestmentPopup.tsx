import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ImageFile,
  pickImageFromCamera,
  pickImageFromGallery,
} from "./utils/ImagePickerService";
import { numberToWords } from "./utils/numberToWords";

type Partner = {
  id: string;
  username: string;
  share?: number;
};

type CropDetails = {
  id: string;
  businessId: string;
  [key: string]: any;
};

interface AddInvestmentPopupProps {
  visible: boolean;
  partners: Partner[];
  cropDetails?: CropDetails;
  onSave: (data: { investmentData: any[]; images: ImageFile[] }) => void;
  onClose: () => void;
}

const AddInvestmentPopup: React.FC<AddInvestmentPopupProps> = ({
  visible,
  partners,
  cropDetails,
  onSave,
  onClose,
}) => {
  const router = useRouter();

  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">(
    "share"
  );
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const n = await AsyncStorage.getItem("userName");
      const u = await AsyncStorage.getItem("userId");
      setUserName(n);
      setUserId(u);
    };
    loadData();
  }, []);

  const createdBy = userName;

  // Initialize rows for partners
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

  const pickImage = async () => {
    const file: ImageFile | null = await pickImageFromCamera();
    if (file) setImages((prev) => [...prev, file]);
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
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
      totalAmount: expected,
      investable: parseFloat(r.actual || 0),
      invested: parseFloat(r.investing || 0),
      soldAmount: 0,
      withdrawn: 0,
      soldFlag: "N",
      withdrawFlag: "N",
      splitType: splitMode.toUpperCase(),
      createdBy,
    }));

    onSave({ investmentData, images });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add Investment</Text>

          <TouchableOpacity onPress={handleSave} style={styles.headerRight}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        >
          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Amount */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Amount</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter amount"
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
          </View>

          {!!totalAmount && (
            <Text style={styles.amountWords}>
              {numberToWords(Number(totalAmount))}
            </Text>
          )}

          {/* Split Mode Buttons */}
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

          {/* Table Header */}
          <View style={[styles.row, styles.headerRow]}>
            <Text style={styles.headerCell}>User</Text>
            {splitMode === "share" && (
              <Text style={styles.headerCell}>Share %</Text>
            )}
            <Text style={styles.headerCell}>Actual</Text>
            <Text style={styles.headerCell}>Investing</Text>
            <Text style={styles.headerCell}>Diff</Text>
          </View>

          {/* Table Rows */}
          {rows.map((row, idx) => {
            const actualNum = parseFloat(row.actual) || 0;
            const investNum = parseFloat(row.investing) || 0;
            const diff = investNum - actualNum;

            return (
              <View key={row.id} style={styles.row}>
                <Text
                  style={[
                    styles.cell,
                    { fontSize: row.name.length > 10 ? 11 : 13 },
                  ]}
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
                    { color: diff > 0 ? "green" : diff < 0 ? "red" : "#333" },
                  ]}
                >
                  {diff !== 0 ? diff.toFixed(2) : ""}
                </Text>
              </View>
            );
          })}

          {/* Images Section */}
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            {/* Camera */}
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={async () => {
                const file = await pickImageFromCamera();
                if (file) setImages((prev) => [...prev, file]);
              }}
            >
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>

            {/* Gallery */}
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: "#28a745" }]}
              onPress={async () => {
                const file = await pickImageFromGallery();
                if (file) setImages((prev) => [...prev, file]);
              }}
            >
              <Ionicons name="image" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Image Thumbnails */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((file, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.imagePreview}
                onPress={() => setPreviewImage(file.uri)}
              >
                <Image source={{ uri: file.uri }} style={styles.previewThumb} />
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeImage(idx)}
                >
                  <Text style={styles.deleteText}>X</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>

        {/* Full-Screen Preview */}
        <Modal visible={!!previewImage} transparent>
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewImage! }} style={styles.fullPreview} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default AddInvestmentPopup;

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height:
      Platform.OS === "android" ? 90 + (StatusBar.currentHeight || 0) : 110,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 60, justifyContent: "center", alignItems: "flex-end" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  saveText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  inputContainer: { marginVertical: 10 },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
  },
  amountWords: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
    color: "#666",
  },
  splitContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  splitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
  },
  splitButtonActive: { backgroundColor: "#007bff" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    alignItems: "center",
  },
  headerRow: { borderBottomWidth: 1, borderColor: "#ccc", paddingBottom: 4 },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 13,
    color: "#111",
  },
  cell: { flex: 1, textAlign: "center", fontSize: 13 },
  inputCell: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  imagesRow: { flexDirection: "row", alignItems: "center" },
  cameraBtn: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  imagePreview: { position: "relative", marginRight: 10 },
  previewThumb: { width: 60, height: 60, borderRadius: 8 },
  deleteBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: { color: "white", fontSize: 12, fontWeight: "bold" },
  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPreview: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 12,
  },
  closeBtn: { position: "absolute", top: 40, right: 20 },
});
