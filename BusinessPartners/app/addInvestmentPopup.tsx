// AddInvestmentPopup.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PanResponder,
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
  businessId?: string;
  [key: string]: any;
};

interface AddInvestmentPopupProps {
  visible: boolean;
  businessId: string;
  businessName: string;
  partners: Partner[];
  cropDetails?: CropDetails;
  onSave: (data: { investmentData: any[]; images: ImageFile[] }) => void;
  onClose: () => void;
}

const SLIDER_THUMB_SIZE = 18;

const AddInvestmentPopup: React.FC<AddInvestmentPopupProps> = ({
  visible,
  businessId,
  businessName,
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

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTempMode, setSheetTempMode] = useState<
    "share" | "equal" | "manual"
  >("share");
  const [shareValues, setShareValues] = useState<number[]>([]);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "Investment" | "Sold" | "Withdraw"
  >("Investment");

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
    setShareValues(partners.map((p) => p.share ?? 0));
  }, [partners]);

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    if (!partners.length) return;

    setRows((prev) =>
      partners.map((p, idx) => {
        const prevRow = prev[idx] || {};
        if (!totalAmount) return { ...prevRow, actual: "", investing: "" };

        if (splitMode === "share") {
          const percent = shareValues[idx] ?? p.share ?? 0;
          const actual = ((percent / 100) * expected).toFixed(2);
          return { ...prevRow, actual, investing: actual, share: percent };
        }

        if (splitMode === "equal") {
          const per = (expected / partners.length).toFixed(2);
          return {
            ...prevRow,
            actual: per,
            investing: per,
            share: Math.round((1 / partners.length) * 100),
          };
        }

        return {
          ...prevRow,
          actual: prevRow.investing || "",
          investing: prevRow.investing || "",
        };
      })
    );
  }, [splitMode, totalAmount, partners, shareValues]);

  const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      const sanitized = value.replace(/^0+(?=\d)/, "");
      next[index] = { ...next[index], investing: sanitized };
      if (splitMode === "manual") next[index].actual = sanitized;
      return next;
    });
  };

  function Slider({
    value,
    onChange,
  }: {
    value: number;
    onChange: (v: number) => void;
  }) {
    const [width, setWidth] = useState(0);
    const updateFromX = (x: number) => {
      if (!width) return;
      let v = Math.round((x / width) * 100);
      if (v < 0) v = 0;
      if (v > 100) v = 100;
      onChange(v);
    };
    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => updateFromX(e.nativeEvent.locationX),
        onPanResponderMove: (e) => updateFromX(e.nativeEvent.locationX),
        onPanResponderRelease: () => {},
      })
    ).current;

    return (
      <View
        style={styles.sliderContainer}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        <View style={styles.sliderTrack} />
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View
          style={[
            styles.sliderThumb,
            { left: `${value}%`, marginLeft: -SLIDER_THUMB_SIZE / 2 },
          ]}
        />
      </View>
    );
  }

  const openSheet = () => {
    setSheetTempMode(splitMode);
    setShareValues((prev) => {
      if (prev.length === partners.length) return prev;
      return partners.map((p) => p.share ?? 0);
    });
    setSheetVisible(true);
  };

  const applySheet = () => {
    setSplitMode(sheetTempMode);
    if (sheetTempMode === "share") {
      setRows((prev) =>
        prev.map((r, idx) => {
          const percent = shareValues[idx] ?? 0;
          const actual = ((percent / 100) * expected).toFixed(2);
          return { ...r, share: percent, actual, investing: actual };
        })
      );
    } else if (sheetTempMode === "equal") {
      const per =
        expected && partners.length
          ? (expected / partners.length).toFixed(2)
          : "";
      setRows((prev) =>
        prev.map((r) => ({
          ...r,
          share: Math.round((1 / partners.length) * 100),
          actual: per,
          investing: per,
        }))
      );
    } else {
      setRows((prev) => prev.map((r) => ({ ...r, actual: r.investing || "" })));
    }
    setSheetVisible(false);
  };

  const pickImageCamera = async () => {
    const file = await pickImageFromCamera();
    if (file) setImages((prev) => [...prev, file]);
  };
  const pickImageGallery = async () => {
    const file = await pickImageFromGallery();
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

    const investmentData = rows.map((r) => {
      if (transactionType === "Investment")
        return {
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
        };
      if (transactionType === "Sold")
        return {
          partnerId: r.id,
          cropId: cropDetails?.id,
          description: description || "",
          comments: description || "",
          totalAmount: expected,
          investable: 0,
          invested: 0,
          soldAmount: parseFloat(r.investing || 0),
          withdrawn: 0,
          soldFlag: "Y",
          withdrawFlag: "N",
          splitType: splitMode.toUpperCase(),
          createdBy,
        };
      if (transactionType === "Withdraw")
        return {
          partnerId: r.id,
          cropId: cropDetails?.id,
          description: description || "",
          comments: description || "",
          totalAmount: expected,
          investable: 0,
          invested: 0,
          soldAmount: 0,
          withdrawn: parseFloat(r.investing || 0),
          soldFlag: "N",
          withdrawFlag: "Y",
          splitType: splitMode.toUpperCase(),
          createdBy,
        };
      return {};
    });

    onSave({ investmentData, images });
    onClose();
  };

  const extraText = (r: any) => {
    const actualNum = parseFloat(r.actual) || 0;
    const investNum = parseFloat(r.investing) || 0;
    const diff = Math.round((investNum - actualNum) * 100) / 100;
    if (!actualNum && !investNum) return "";
    if (diff > 0) return `Extra +${diff.toFixed(2)}`;
    if (diff < 0) return `Pending ${Math.abs(diff).toFixed(2)}`;
    return "Settled";
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.headerRight,
              { opacity: !totalAmount || Number(totalAmount) <= 0 ? 0.5 : 1 },
            ]}
            disabled={!totalAmount || Number(totalAmount) <= 0}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Enter description</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={[styles.inputContainer, { marginBottom: 6 }]}>
            <Text style={styles.inputLabel}>Enter amount</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.inputBox, styles.amountInput]}
                placeholder="Enter amount"
                keyboardType="numeric"
                value={totalAmount}
                onChangeText={setTotalAmount}
              />
              <TouchableOpacity
                style={styles.splitDropdownBtn}
                onPress={openSheet}
              >
                <Text style={styles.splitDropdownText}>
                  {splitMode.toUpperCase()}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {!!totalAmount && (
            <Text style={styles.amountWords}>
              {numberToWords(Number(totalAmount))}
            </Text>
          )}

          {/* Partner Cards */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Partners</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {rows.map((r, i) => (
                <View key={r.id} style={styles.partnerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.partnerName}>{r.name}</Text>
                    <Text style={styles.partnerPercent}>
                      {(r.share ?? 0).toString()}%
                    </Text>
                  </View>
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "flex-end",
                      marginLeft: 12,
                    }}
                  >
                    <Text style={styles.partnerAmount}>
                      {r.investing || r.actual || "0.00"}
                    </Text>
                    <Text style={styles.smallNote}>{extraText(r)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Images */}
          <Text style={styles.sectionTitle}>Images</Text>
          <View style={{ flexDirection: "row", marginBottom: 10 }}>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={pickImageCamera}
            >
              <Ionicons name="camera" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: "#28a745" }]}
              onPress={pickImageGallery}
            >
              <Ionicons name="image" size={28} color="white" />
            </TouchableOpacity>
          </View>
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

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerOutlineBtn}>
            <Text style={{ color: "#333" }}>{businessName}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerOutlineBtn}
            onPress={() => setTypeModalVisible(true)}
          >
            <Text style={{ color: "#333" }}>{transactionType}</Text>
            <Ionicons name="chevron-down" size={16} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Image Preview */}
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

        {/* Split Sheet */}
        <Modal visible={sheetVisible} animationType="slide" transparent>
          <View style={styles.sheetOverlay}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={{ fontWeight: "700", fontSize: 16 }}>
                  Split Options
                </Text>
                <TouchableOpacity onPress={applySheet}>
                  <Text style={{ fontWeight: "700", color: "#007bff" }}>
                    Done
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ paddingHorizontal: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginVertical: 8,
                  }}
                >
                  {(["share", "equal", "manual"] as const).map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setSheetTempMode(m)}
                      style={[
                        styles.sheetModeBtn,
                        sheetTempMode === m && styles.sheetModeBtnActive,
                      ]}
                    >
                      <Text
                        style={{
                          color: sheetTempMode === m ? "#fff" : "#333",
                          fontWeight: "700",
                        }}
                      >
                        {m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {sheetTempMode === "share" &&
                  partners.map((p, idx) => {
                    const percent = shareValues[idx] ?? 0;
                    const computed = ((percent / 100) * expected).toFixed(2);
                    return (
                      <View key={p.id} style={{ marginBottom: 12 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontWeight: "600" }}>
                            {p.username}
                          </Text>
                          <Text style={{ fontWeight: "700" }}>{percent}%</Text>
                        </View>
                        <Slider
                          value={percent}
                          onChange={(v) =>
                            setShareValues((prev) => {
                              const copy = [
                                ...(prev.length
                                  ? prev
                                  : partners.map((pt) => pt.share ?? 0)),
                              ];
                              copy[idx] = v;
                              return copy;
                            })
                          }
                        />
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 6,
                          }}
                        >
                          <Text style={{ fontSize: 12, color: "#666" }}>
                            Assigned: {computed}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#666" }}>
                            Tap/drag to change
                          </Text>
                        </View>
                      </View>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Type Modal */}
        <Modal visible={typeModalVisible} transparent animationType="fade">
          <TouchableOpacity
            style={styles.typeModalOverlay}
            onPress={() => setTypeModalVisible(false)}
          >
            <View style={styles.typeModal}>
              {(["Investment", "Sold", "Withdraw"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    setTransactionType(t);
                    setTypeModalVisible(false);
                  }}
                  style={styles.typeOption}
                >
                  <Text
                    style={{
                      fontWeight: transactionType === t ? "700" : "400",
                    }}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

export default AddInvestmentPopup;

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
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#000",
    backgroundColor: "#f9f9f9",
    flex: 1,
  },
  amountRow: { flexDirection: "row", alignItems: "center" },
  amountInput: { marginRight: 8 },
  splitDropdownBtn: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  splitDropdownText: { color: "#fff", fontWeight: "700", marginRight: 6 },
  amountWords: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 4,
    color: "#666",
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 16,
  },
  partnerCard: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 10,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerName: { fontWeight: "600", fontSize: 14 },
  partnerPercent: { fontSize: 12, color: "#666", marginTop: 4 },
  partnerAmount: { fontSize: 16, fontWeight: "700", color: "#111" },
  smallNote: { fontSize: 10, color: "#666", marginTop: 4 },
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
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    marginBottom: Platform.OS === "ios" ? 30 : 20,
  },
  footerOutlineBtn: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
  },
  sheetModeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  sheetModeBtnActive: { backgroundColor: "#007bff", borderColor: "#007bff" },
  sliderContainer: { height: 36, justifyContent: "center", marginTop: 8 },
  sliderTrack: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 6,
    position: "absolute",
    left: 0,
    right: 0,
  },
  sliderFill: {
    height: 6,
    backgroundColor: "#007bff",
    borderRadius: 6,
    position: "absolute",
    left: 0,
  },
  sliderThumb: {
    position: "absolute",
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#007bff",
    top: -SLIDER_THUMB_SIZE / 2 + 3,
  },
  smallPartnerInline: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginRight: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  typeModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  typeModal: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  typeOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
});
