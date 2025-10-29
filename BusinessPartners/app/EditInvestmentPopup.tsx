import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../src/config/config";
import { InvestmentDTO } from "./types";
import {
  pickImageFromCamera,
  pickImageFromGallery,
} from "./utils/ImagePickerService";

interface Partner {
  id: string;
  username: string;
  share?: number;
  invested?: string;
  investable?: string;
}

/* interface InvestmentRow {
  id: string;
  name: string;
  share: number;
  actual: string;
  investable: string;
  investing: string;
  leftOver?: number;
  checked?: boolean;
  reduceLeftOver?: string;
} */
interface EditInvestmentScreenProps {
  visible: boolean;
  businessId: string;
  businessName: string;
  investmentData: InvestmentDTO[];
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
}
interface PartnerRow {
  id: string;
  name: string;
  share: number;
  actualInvestment: number;
  yourInvestment: number;
  actualSold: number;
  withdrawn: number;
  leftOver: number;
  investing: string;
  actual: string;
  checked: boolean;
  reduceLeftOver: string;
}
const SLIDER_THUMB_SIZE = 18;

const EditInvestmentPopup: React.FC<EditInvestmentScreenProps> = ({
  visible,
  businessId,
  businessName,
  investmentData,
  onClose,
  onUpdated,
}) => {
  const first = investmentData?.[0] || {};

  // ✅ Extract group data safely
  const partners =
    investmentData?.map((inv) => ({
      id: inv.partnerId?.toString() || "",
      username: inv.partnerName || "",
      share: inv.share ?? 0,
      invested: inv.invested?.toString() ?? "0",
      investable: inv.investable?.toString() ?? "0",
    })) ?? [];

  const [totalAmount, setTotalAmount] = useState<string>(
    first.totalAmount?.toString() ?? ""
  );
  const [description, setDescription] = useState<string>();
  const [transactionType, setTransactionType] = useState<string>(
    first.transactionType ?? "Investment"
  );
  const [images, setImages] = useState<any[]>(first.images ?? []);
  const [rows, setRows] = useState<any[]>(partners);
  const [token, setToken] = useState<string | null>(null);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  /*  const [transactionType, setTransactionType] = useState<
    "Investment" | "Sold" | "Withdraw" | null
  >(initialTransactionType || "Investment"); */

  const [errorVisible, setErrorVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  const handleSave = async () => {
    try {
      const totalEntered = investmentData.reduce(
        (sum, r) => sum + (parseFloat((r.invested || "0").toString()) || 0),
        0
      );
      console.log("handleSave called with: ",totalEntered, expected)
      if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
        Alert.alert("Error", "Total entered does not match expected amount");
        return;
      }

      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // ✅ Prepare list of updated investments matching backend InvestmentDTO
      const updatedInvestments = investmentData.map((inv) => {
        const match = rows.find((r) => r.id === inv.partnerId?.toString());
        return {
          investmentId: inv.investmentId,
          createdAt: inv.createdAt,
          createdBy: inv.createdBy,
          cropId: inv.cropId,
          description: description || inv.description,
          investable: Number(match?.actual || inv.investable || 0),
          invested: Number(match?.investing || inv.invested || 0),
          partnerId: inv.partnerId,
          share: inv.share,
          soldAmount: inv.soldAmount,
          soldFlag: inv.soldFlag,
          withdrawn: inv.withdrawn,
          comments: inv.comments,
          withdrawFlag: inv.withdrawFlag,
          partnerName: inv.partnerName,
          investmentGroupId: inv.investmentGroupId,
          totalAmount: Number(totalAmount || inv.totalAmount || 0),
          imageUrl: inv.imageUrl,
          splitType: inv.splitType,
          supplierName: inv.supplierName,
          supplierId: inv.supplierId,
          updatedBy: inv.updatedBy,
          reduceLeftOver: Number(match?.reduceLeftOver || 0),
        };
      });

      console.log("📤 Sending updated investments:", updatedInvestments);

/*       const response = await fetch(
        `${BASE_URL}/api/investment/edit-investment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedInvestments),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        console.error("❌ Backend error:", text);
        Alert.alert("Error", "Failed to update investment");
        return;
      } */

      Alert.alert("✅ Success", "Investment updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("❌ handleSave error:", err);
      Alert.alert("Error", "Unexpected error occurred");
    }
  };

  // ✅ Fetch business info with leftover + partnerDTO
  useEffect(() => {
    if (!token || !businessId) return;
    console.log("Fetching business info for businessId:", businessId);
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const text = await response.text();
        if (!response.ok || !text) {
          console.warn("⚠️ No data returned from business-details-by-id");
          return;
        }

        const data = JSON.parse(text);
        setInvestmentDetails(data.investmentDetails || []);

        // ✅ Map backend structure correctly
        const mappedRows: PartnerRow[] = (data.investmentDetails || []).map(
          (inv: any) => ({
            id: inv.partner?.partnerId?.toString() || "",
            name: inv.partner?.username || "Unknown",
            share: Number(inv.partner?.share || 0),
            actualInvestment: Number(inv.actualInvestment || 0),
            yourInvestment: Number(inv.yourInvestment || 0),
            actualSold: Number(inv.actualSold || 0),
            withdrawn: Number(inv.withdrawn || 0),
            leftOver: Number(inv.leftOver || 0),
            investing: "",
            actual: "",
            checked: false,
            reduceLeftOver: "",
          })
        );
        console.log({ mappedRows });
        setRows(mappedRows);
      } catch (err) {
        console.error("❌ Error fetching business info:", err);
      }
    };

    fetchBusinessInfo();
  }, [investmentData, token]);

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    loadToken();
  }, []);

  /*     useEffect(() => {
    if (!investmentData || investmentData.length === 0) return;
    const freshRows =
      investmentData?.map((inv) => ({
        id: inv.partnerId?.toString() || "",
        username: inv.partnerName || "",
        share: inv.share ?? 0,
        invested: inv.invested?.toString() ?? "0",
        investable: inv.investable?.toString() ?? "0",
      })) ?? [];
    setRows(freshRows);
  }, [investmentData]); */

  /*   const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], investing: value, actual: value };
      return next;
    });
  }; */

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
/* 
  const handleSave = () => {
    const totalEntered = rows.reduce(
      (sum, r) => sum + (parseFloat(r.actual) || 0),
      0
    );
    if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    }

    console.log("Updated investment:", {
      rows,
      totalAmount,
      description,
      images,
      transactionType,
    });

    onUpdated();
    onClose();
  }; */

  const extraText = (r: InvestmentDTO) => {
    console.log(
      "Calculating extraText for:",
      r.partnerName,
      r.investable,
      r.invested
    );
    const investableNum = parseFloat((r.investable ?? "0").toString()) || 0;
    const investedNum = parseFloat((r.invested ?? "0").toString()) || 0;
    const diff = Math.round((investedNum - investableNum) * 100) / 100;
    if (diff > 0) return `Extra  + ${diff.toFixed(2)}`;
    if (diff < 0) return `Pending - ${Math.abs(diff).toFixed(2)}`;
    return "Settled";
  };

  /*   const extraText = (r: any) => {
    const actualNum = parseFloat(r.actual) || 0;
    const investNum = parseFloat(r.investing) || 0;
    const diff = Math.round((actualNum - investNum) * 100) / 100;
    if (!actualNum && !investNum) return "";
    if (diff > 0) return `Extra +${diff.toFixed(2)}`;
    if (diff < 0) return `Pending -${Math.abs(diff).toFixed(2)}`;
    return "Settled";
  }; */

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Transaction</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.headerRight,
              { opacity: !totalAmount || Number(totalAmount) <= 0 ? 0.5 : 1 },
            ]}
            disabled={!totalAmount || Number(totalAmount) <= 0}
          >
            <Text style={styles.saveText}>Update</Text>
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
                onPress={() => alert("openSheet")}
                /* onPress={openSheet} */
              >
                <Text style={styles.splitDropdownText}>
                  SHARE
                  {/*  {splitMode.toUpperCase()} */}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/*   {!!totalAmount && (
            <Text style={styles.amountWords}>
              {numberToWords(Number(totalAmount))}
            </Text>
          )} */}

          {/* Partner Cards */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Partners</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {investmentData.map((r, i) => (
                <View key={r.partnerId} style={{ marginBottom: 12 }}>
                  {/* Partner Card */}
                  <View style={styles.partnerCard}>
                    {/* Column 1: Name + Share % */}
                    <View style={styles.col1}>
                      <Text style={styles.partnerName}>
                        {(r.partnerName || "Unknown").toUpperCase()}
                      </Text>

                      <Text style={styles.partnerPercent}>
                        {(r.share ?? 0).toString()}%
                      </Text>
                    </View>

                    {/* Column 2: Checkbox shown only in Investment */}
                    {/*                     {transactionType === "Investment" ? (
                      <View style={styles.col2}>
                        {Number(r.leftOver) > 0 && (
                          <Text style={{ fontSize: 12, color: "#666" }}>
                            Use Available Money
                          </Text>
                        )}
                        {Number(r.leftOver) > 0 ? (
                          <TouchableOpacity
                            onPress={() =>
                              setRows((prev) => {
                                const next = [...prev];
                                next[i].checked = !next[i].checked;
                                return next;
                              })
                            }
                            style={{ marginTop: 4 }}
                          >
                            <Ionicons
                              name={r.checked ? "checkbox" : "square-outline"}
                              size={22}
                              color="#007bff"
                            />
                          </TouchableOpacity>
                        ) : (
                          <View style={{ marginTop: 6 }}>
                            <Text style={{ fontSize: 12, color: "#999" }}>
                              No leftover {r.leftOver}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.col2} />
                    )}
 */}
                    {/* Column 3: Investing amount + Extra/Pending/Settled */}
                    <View style={styles.col3}>
                      <Text style={styles.partnerAmount}>
                        {r.invested || "0.00"}
                      </Text>
                      <Text style={styles.smallNote}>{extraText(r)}</Text>
                    </View>
                  </View>

                  {/* Expanded Section only for Investment + when checked */}
                  {/*   {transactionType === "Investment" && r.checked && (
                    <View style={styles.expandedSection}>
                      <Text style={styles.expandedLabel}>
                        Available Money to use: ₹{Number(r.leftOver).toFixed(2)}
                      </Text>

                      <TextInput
                        style={styles.expandedInput}
                        keyboardType="numeric"
                        placeholder="Enter amount to use (≤ Available Money)"
                        value={r.reduceLeftOver ?? ""}
                        onChangeText={(val) => {
                          setRows((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], reduceLeftOver: val }; // store exactly what user types
                            return next;
                          });
                        }}
                      />
                    </View>
                  )} */}
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
                onPress={() => alert("Need to set previewimage")} //setPreviewImage(file.uri)}
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
        <View
          style={[
            styles.footer,
            { flexDirection: "row", justifyContent: "space-evenly" },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.footerOutlineBtn,
              {
                flex: 1,
                marginRight: 8,
                alignItems: "center",
                justifyContent: "center",
                height: 40,
              },
            ]}
          >
            <Text style={{ color: "#333", fontWeight: "500" }}>
              {businessName}
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={{
              flex: 1,
              marginLeft: 8,
              alignItems: "center",
              justifyContent: "center",
              height: 40,
              transform: [{ scale: shakeAnim }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.footerOutlineBtn,
                {
                  width: "100%",
                  height: "100%",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                },
                errorVisible && { borderColor: "red", borderWidth: 2 },
              ]}
              onPress={() => alert("setTypeModalVisible")} //setTypeModalVisible(true)}
            >
              <Text
                style={{
                  color: errorVisible ? "red" : "#333",
                  fontWeight: "500",
                }}
              >
                {transactionType ?? "Select Type"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={errorVisible ? "red" : "#333"}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {errorVisible && (
          <Animated.View
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: [{ translateX: -100 }, { translateY: -20 }],
              backgroundColor: "rgba(0,0,0,0.8)",
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
              opacity: fadeAnim,
              zIndex: 999,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              Please select a type
            </Text>
          </Animated.View>
        )}

        {/* Image Preview */}
        {/*         <Modal visible={!!previewImage} transparent>
          <View style={styles.previewContainer}>
            <Image source={{ uri: previewImage! }} style={styles.fullPreview} />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setPreviewImage(null)}
            >
              <Ionicons name="close" size={36} color="white" />
            </TouchableOpacity>
          </View>
        </Modal> */}

        {/* Split Sheet */}

        {/* Type Modal */}
        {/*  <Modal visible={typeModalVisible} transparent animationType="fade">
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
        </Modal> */}
      </View>
    </Modal>
  );
};

export default EditInvestmentPopup;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  /*   header: {
    height:
      Platform.OS === "android" ? 90 + (StatusBar.currentHeight || 0) : 110,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  }, */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
    elevation: 4,
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
  saveText: { color: "#fff", fontWeight: "700", fontSize: 13 },
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

  sheet: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    paddingVertical: 12,
  },
  /*   sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 10,
  }, */
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
  /* splitModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  splitModeButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  sheetContainer: {
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingTop: 12,
  paddingBottom: Platform.OS === "ios" ? 20 : 10,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 5,
  elevation: 10,
}, */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetHeaderTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  sheetDone: {
    fontWeight: "700",
    color: "#007bff",
  },
  splitModeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 12,
  },
  splitModeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  splitModeButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  splitModeText: {
    fontWeight: "700",
    color: "#333",
  },
  splitModeTextActive: {
    color: "#fff",
  },
  partnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  partnerName: {
    flex: 1,
    fontWeight: "600",
    fontSize: 14,
  },
  partnerAmountInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    width: 100,
    textAlign: "right",
    fontWeight: "600",
    backgroundColor: "#fafafa",
  },
  sheetContainer: {
    backgroundColor: "#f5f5f8ff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    minHeight: 300,
  },
  partnerCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },

  col1: { flex: 2 },
  col2: { flex: 1, alignItems: "center" },
  col3: { flex: 1, alignItems: "flex-end" },

  /* partnerName: { fontWeight: "600", fontSize: 14 },
partnerPercent: { fontSize: 12, color: "#666", marginTop: 2 },
partnerAmount: { fontSize: 16, fontWeight: "700", color: "#111" },
smallNote: { fontSize: 10, color: "#666", marginTop: 4 },
 */
  expandedRow: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  /* inputBox: {
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 4,
  padding: 6,
  minWidth: 80,
  textAlign: "right",
} */

  /*   partnerCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  }, */
  //col1: { flex: 1 },
  //col2: { justifyContent: "center", alignItems: "center", width: 80 },
  //col3: { justifyContent: "center", alignItems: "flex-end", flex: 1 },
  //partnerName: { fontWeight: "bold", fontSize: 14 },
  //partnerPercent: { fontSize: 12, color: "#666" },
  //partnerAmount: { fontSize: 14, fontWeight: "600" },
  //smallNote: { fontSize: 12, color: "#999" },
  expandedRowCard: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    marginHorizontal: 0, // same as card
    borderWidth: 1,
    borderColor: "#eee",
  },
  /*   inputBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
  }, */
  expandedSection: {
    marginTop: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  expandedLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  expandedInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
});
