import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import BASE_URL from "../src/config/config";
import { InvestmentDTO } from "./types";
import {
  pickImageFromCamera,
  pickImageFromGallery,
} from "./utils/ImagePickerService";
import { numberToWords } from "./utils/numberToWords";

interface EditInvestmentScreenProps {
  visible: boolean;
  businessId: string;
  businessName: string;
  investmentData: InvestmentDTO[];
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
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
  const [investmentDataState, setInvestmentDataState] =
    useState(investmentData);
  const [supplierName, setSupplierName] = useState(first.supplierName ?? "");

  /* const [checkedState, setCheckedState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (investmentDataState?.length) {
      const initialState: Record<number, boolean> = {};

      investmentDataState.forEach((item, index) => {
        initialState[index] = Number(item.reduceLeftOver) > 0; // default: checked if > 0
      });

      setCheckedState(initialState);
    }
  }, [investmentDataState]); */

  const [checkedState, setCheckedState] = useState(false);

  const toggleCheckbox = () => {
    setCheckedState((prev) => !prev);
  };

  // ✅ Extract group data safely
  const partners =
    investmentData?.map((inv) => ({
      id: inv.partnerId?.toString() || "",
      username: inv.partnerName || "",
      share: inv.share ?? 0,
      invested: inv.invested?.toString() ?? "0",
      investable: inv.investable?.toString() ?? "0",
    })) ?? [];
  const [rows, setRows] = useState<any[]>(partners);

  const [totalAmount, setTotalAmount] = useState<string>(
    first.totalAmount?.toString() ?? ""
  );
  const [description, setDescription] = useState<string>(
    first.description ?? ""
  );
  const [transactionType, setTransactionType] = useState<string>(
    first.transactionType ?? "Investment"
  );
  const [images, setImages] = useState<any[]>(first.images ?? []);

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /*  const [transactionType, setTransactionType] = useState<
    "Investment" | "Sold" | "Withdraw" | null
  >(initialTransactionType || "Investment"); */

  const [errorVisible, setErrorVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">(
    "share"
  );
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTempMode, setSheetTempMode] = useState<
    "share" | "equal" | "manual"
  >("share");
  const [shareValues, setShareValues] = useState<number[]>([]);

  /*   const [remaining, setRemaining] = useState<number>(0);
  const [showSupplierPopup, setShowSupplierPopup] = useState(false); */
  // ✅ Restore saved split type when editing an existing investment
  useEffect(() => {
    if (first?.splitType) {
      const type = first.splitType.toLowerCase();
      if (type === "share" || type === "equal" || type === "manual") {
        setSplitMode(type);
      }
    }
  }, [first]);

  const normalizeEditData = (data: InvestmentDTO[]) => {
    return data.map((inv) => {
      // INVESTMENT
      if (inv.withdrawFlag !== "Y" && inv.soldFlag !== "Y") {
        return {
          ...inv,
          invested: Number(inv.invested ?? 0),
          investable: Number(inv.investable ?? inv.invested ?? 0),
        };
      }

      // WITHDRAW
      if (inv.withdrawFlag === "Y") {
        return {
          ...inv,
          invested: 0,
          investable: 0,
          withdrawn: Number(inv.withdrawn ?? 0),
        };
      }

      // SOLD
      if (inv.soldFlag === "Y") {
        return {
          ...inv,
          invested: 0,
          investable: 0,
          soldAmount: Number(inv.soldAmount ?? 0),
        };
      }

      return inv;
    });
  };

  useEffect(() => {
    if (!visible || !investmentData?.length) return;

    // 🔥 normalize ONCE when edit opens
    const normalized = normalizeEditData(investmentData);
    setInvestmentDataState(normalized);

    // header level values
    setTotalAmount(String(investmentData[0]?.totalAmount ?? ""));
    setDescription(investmentData[0]?.description ?? "");
    setTransactionType(
      investmentData[0]?.withdrawFlag === "Y"
        ? "Withdraw"
        : investmentData[0]?.soldFlag === "Y"
        ? "Sold"
        : "Investment"
    );

    isInitialLoad.current = true;
  }, [visible, investmentData]);

  const handleSave = async () => {
    try {
      investmentData.map((inv) =>
        console.log("Investment to update:", inv.invested)
      );
      const totalEntered = investmentDataState.reduce((sum, r) => {
        if (transactionType === "Withdraw") {
          return sum + Number(r.withdrawn ?? 0);
        }

        if (transactionType === "Sold") {
          return sum + Number(r.soldAmount ?? 0);
        }

        // Investment
        return sum + Number(r.invested ?? 0);
      }, 0);

      console.log("handleSave called with: ", totalEntered, expected);
      const enteredTotal = Number(totalAmount);

      if (
        first.supplierId == null &&
        Math.round((totalEntered - enteredTotal) * 100) / 100 !== 0
      ) {
        Alert.alert("Error", "Total entered does not match expected amount");
        return;
      }

      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      console.log(
        "Preparing to send updated investments description...",
        description
      );
      // ✅ Prepare list of updated investments matching backend InvestmentDTO
      const updatedInvestments = investmentDataState.map((inv) => {
        //const match = rows.find((r) => r.id === inv.partnerId?.toString());
        return {
          investmentId: inv.investmentId,
          createdAt: inv.createdAt,
          createdBy: inv.createdBy,
          cropId: inv.cropId,
          description: description || inv.description,
          invested:
            transactionType === "Investment" ? Number(inv.invested || 0) : 0,
          investable:
            transactionType === "Investment" ? Number(inv.investable || 0) : 0,
          withdrawn:
            transactionType === "Withdraw" ? Number(inv.withdrawn || 0) : 0,
          soldAmount:
            transactionType === "Sold" ? Number(inv.soldAmount || 0) : 0,
          //      investable: Number(/* match?.actual ||  */ inv.investable || 0),
          //    invested: Number(/* match?.investing ||  */ inv.invested || 0),
          partnerId: inv.partnerId,
          share: inv.share,
          //  soldAmount: inv.soldAmount,
          soldFlag: inv.soldFlag,
          //withdrawn: inv.withdrawn,
          comments: inv.comments,
          withdrawFlag: inv.withdrawFlag,
          partnerName: inv.partnerName,
          investmentGroupId: inv.investmentGroupId,
          totalAmount: Number(totalAmount || inv.totalAmount || 0),
          imageUrl: inv.imageUrl,
          splitType: inv.splitType?.toUpperCase(),
          supplierName: inv.supplierName,
          supplierId: inv.supplierId,
          updatedBy: userId,
          reduceLeftOver: Number(/* match?. */ inv.reduceLeftOver || 0),
        };
      });

      console.log("📤 Sending updated investments:", updatedInvestments);

      const response = await fetch(
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
      }

      Alert.alert("✅ Success", "Investment updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("❌ handleSave error:", err);
      Alert.alert("Error", "Unexpected error occurred");
    }
  };

  useEffect(() => {
    if (visible) {
      isInitialLoad.current = true;
    }
  }, [visible]);

  // Auto-update when totalAmount or splitMode changes
  // ✅ To skip first recalculation when popup opens
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (
      !totalAmount ||
      Number(totalAmount) <= 0 ||
      !investmentDataState?.length
    ) {
      return;
    }

    const total = Number(totalAmount);

    const updated = investmentDataState.map((r) => {
      const share = Number(r.share) || 0;
      const value =
        splitMode === "equal"
          ? total / investmentDataState.length
          : (total * share) / 100;

      if (transactionType === "Withdraw") {
        return {
          ...r,
          withdrawn: Number(value.toFixed(2)),
        };
      }

      if (transactionType === "Sold") {
        return {
          ...r,
          soldAmount: Number(value.toFixed(2)),
        };
      }

      // Investment
      return {
        ...r,
        invested: Number(value.toFixed(2)),
        investable: Number(value.toFixed(2)),
      };
    });

    setInvestmentDataState(updated);
  }, [totalAmount, transactionType]);

  const openSheet = () => {
    // 🔒 Block for Withdraw / Sold

    if (!totalAmount || Number(totalAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount first");
      return;
    }

    setSheetTempMode(splitMode);

    // ✅ Prepare temp values correctly for EDIT
    if (splitMode === "share") {
      // load current invested values
      setShareValues(investmentDataState.map((r) => Number(r.invested ?? 0)));
    } else if (splitMode === "equal") {
      const per = expected / investmentDataState.length;
      setShareValues(investmentDataState.map(() => Number(per.toFixed(2))));
    } else {
      // ✅ MANUAL → load existing values (NOT zero)
      setShareValues(investmentDataState.map((r) => Number(r.invested ?? 0)));
    }

    setSheetVisible(true);
  };

  /*   const applySheet = () => {
    // Apply split values based on sheetTempMode
    setSplitMode(sheetTempMode);

    if (sheetTempMode === "share") {
      // Use shareValues (which may have been edited by user)
      setInvestmentDataState((prev) =>
        prev.map((r, idx) => {
          const actualAmount = shareValues[idx] ?? 0;
      
          return {
            ...r,
            actual: actualAmount.toFixed(2), // investable amount
            investing: r.invested ? r.invested : actualAmount.toFixed(2),

            // Do NOT touch share %
          };
        })
      );
    } else if (sheetTempMode === "equal") {
      // Prefer shareValues (user may have edited the equal values).
      const per = expected / partners.length;
      setInvestmentDataState((prev) =>
        prev.map((r, idx) => {
          const val = shareValues[idx] ?? per;
          const updated = {
            ...r,
            actual: Number(val).toFixed(2),
            investing: r.invested ? r.invested : Number(val).toFixed(2),
          };
     
          return updated;
        })
      );
    } else {
      // Manual: apply user-entered values from shareValues (don't overwrite with old share)
      setInvestmentDataState((prev) =>
        prev.map((r, idx) => {
          const val = shareValues[idx] ?? parseFloat(String(r.invested || "0")) ?? 0;
          return {
            ...r,
            actual: Number(val).toFixed(2),
            investing: String(val),
          };
          })
        );
    }

    setSheetVisible(false);
  }; */

  const applySheet = () => {
    setSplitMode(sheetTempMode);

    setInvestmentDataState((prev) =>
      prev.map((r, idx) => {
        const entered = shareValues[idx]; // user input
        let val = 0;

        if (!isNaN(Number(entered))) {
          val = Number(entered);
        } else if (sheetTempMode === "equal") {
          val = expected / prev.length;
        } else if (sheetTempMode === "share") {
          const share = Number(r.share) || 0;
          val = (expected * share) / 100;
        } else {
          val = Number(r.invested) || 0;
        }

        // ✅ Keep investable (expected) value as-is
        // ✅ Update invested and actual only
        return {
          ...r,
          invested: Number(val.toFixed(2)),
          investable: Number(r.investable ?? expected / prev.length), // don’t overwrite
          actual: Number(val.toFixed(2)),
          splitType: sheetTempMode, // ✅ Save mode here
        };
      })
    );
    // 3️⃣ Close modal
    setSheetVisible(false);
  };

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userName");
      setToken(t);
      setUserId(u);
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

  const extraText = (r: InvestmentDTO) => {
    const investableNum = parseFloat((r.investable ?? "0").toString()) || 0;
    const investedNum = parseFloat((r.invested ?? "0").toString()) || 0;
    const diff = Math.round((investedNum - investableNum) * 100) / 100;
    if (diff > 0) return `Extra  + ${diff.toFixed(2)}`;
    if (diff < 0) return `Pending - ${Math.abs(diff).toFixed(2)}`;
    return "Settled";
  };
  /* 
  useEffect(() => {}, [investmentData]);
 */
  useEffect(() => {
    if (visible) {
      isInitialLoad.current = true; // Reset when popup opens again
    }
  }, [visible]);

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
                //onPress={() => alert("openSheet")}
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

          {/* Supplier Name */}
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 8,
              borderRadius: 6,
              fontSize: 14,
              backgroundColor: "#fff",
            }}
            value={supplierName}
            placeholder="Enter supplier name"
            onChangeText={(val) => {
              setSupplierName(val);

              // ✅ Update inside investmentDataState as well
              setInvestmentDataState((prev) =>
                prev.map((inv) => ({
                  ...inv,
                  supplierName: val,
                }))
              );
            }}
          />

          {/* Partner Cards */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Partners</Text>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              {investmentDataState.map((r, i) => (
                <View key={r.partnerId} style={{ marginBottom: 12 }}>
                  <View style={styles.partnerCard}>
                    {/* Top Row = Partner Left + Partner Right */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View style={styles.partnerLeftBox}>
                        <Text style={styles.partnerName}>
                          {(r.partnerName || "Unknown").toUpperCase()}
                        </Text>
                        <Text style={styles.partnerShareText}>
                          {r.share ?? 0}%
                        </Text>
                      </View>

                      <View style={styles.partnerRightBox}>
                        <Text style={styles.partnerInvestedText}>
                          {Number(
                            transactionType === "Withdraw"
                              ? r.withdrawn
                              : transactionType === "Sold"
                              ? r.soldAmount
                              : r.invested
                          ).toFixed(2)}
                        </Text>

                        <Text style={styles.partnerStatusText}>
                          {extraText(r)}
                        </Text>
                      </View>
                    </View>

                    {/* ✅ Leftover section full width below */}
                    {transactionType === "Investment" &&
                      Number(r.reduceLeftOver) > 0 && (
                        <View
                          style={{
                            marginTop: 10,
                            borderTopWidth: 0.6,
                            borderTopColor: "#ccc",
                            paddingTop: 8,
                          }}
                        >
                          <TouchableOpacity
                            onPress={toggleCheckbox}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons
                              name={
                                checkedState ? "checkbox" : "square-outline"
                              }
                              size={22}
                              color="#007AFF"
                            />

                            <Text
                              style={{
                                marginLeft: 8,
                                fontSize: 14,
                                fontWeight: "500",
                              }}
                            >
                              Available Money to use: ₹
                              {Number(r.reduceLeftOver).toFixed(2)}
                            </Text>
                          </TouchableOpacity>

                          {checkedState && (
                            <TextInput
                              style={styles.leftOverInput}
                              keyboardType="numeric"
                              placeholder="Enter amount to use..."
                              placeholderTextColor="#888"
                              value={String(r.reduceLeftOver) ?? ""}
                              onChangeText={(val) => {
                                setInvestmentDataState((prev) => {
                                  const next = [...prev];
                                  next[i] = {
                                    ...next[i],
                                    reduceLeftOver: Number(val),
                                  };
                                  return next;
                                });
                              }}
                            />
                          )}
                        </View>
                      )}
                    {transactionType === "Withdraw" &&
                      Number(r.reduceLeftOver) > 0 && (
                        <View
                          style={{
                            marginTop: 10,
                            borderTopWidth: 0.6,
                            borderTopColor: "#ccc",
                            paddingTop: 8,
                          }}
                        >
                          <Text
                            style={{
                              marginLeft: 8,
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                          >
                            Available Money to use: ₹
                            {Number(r.reduceLeftOver).toFixed(2)}
                          </Text>
                        </View>
                      )}
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
              onPress={() => setTypeModalVisible(true)}
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
        <Modal visible={sheetVisible} animationType="slide" transparent>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.sheetOverlay}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, justifyContent: "flex-end" }}
              >
                <View style={styles.sheetContainer}>
                  {/* Header */}
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetHeaderTitle}>Split Options</Text>
                    <TouchableOpacity onPress={applySheet}>
                      <Text style={styles.sheetDone}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Body */}
                  <ScrollView
                    style={{ maxHeight: "70%", paddingHorizontal: 12 }}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 40 }}
                  >
                    {/* Mode Buttons */}
                    <View style={styles.splitModeRow}>
                      {(["share", "equal", "manual"] as const).map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            setSheetTempMode(m);
                            if (m === "equal") {
                              const per = expected / partners.length;
                              setShareValues(partners.map(() => per));
                            } else if (m === "share") {
                              const shareBased = partners.map(
                                (p, i) =>
                                  ((p.share ?? 100 / partners.length) / 100) *
                                  expected
                              );
                              setShareValues(shareBased);
                            } else {
                              // When user chooses manual mode show current invested/investing values so user can edit them
                              setShareValues(rows.map((r) => parseFloat("0")));
                            }
                          }}
                          style={[
                            styles.splitModeButton,
                            sheetTempMode === m && styles.splitModeButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.splitModeText,
                              sheetTempMode === m && styles.splitModeTextActive,
                            ]}
                          >
                            {m.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Partner List */}
                    {partners.map((p, idx) => {
                      const val = shareValues[idx] ?? 0;
                      return (
                        <View
                          key={p.id}
                          style={[
                            styles.partnerRow,
                            {
                              backgroundColor:
                                idx % 2 === 0 ? "#f8f9ff" : "#fff",
                            },
                          ]}
                        >
                          <Text style={styles.partnerName}>{p.username}</Text>
                          <TextInput
                            style={styles.partnerAmountInput}
                            keyboardType="numeric"
                            value={val.toString()}
                            onChangeText={(txt) => {
                              const num = Number(txt) || 0;
                              setShareValues((prev) => {
                                const copy = [...prev];
                                copy[idx] = num;
                                return copy;
                              });
                            }}
                          />
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
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
    // paddingHorizontal: 12,
    paddingVertical: 5,
    color: "#666",
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 16,
  } /* 
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
  }, */,
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
  /*  partnerName: {
    flex: 1,
    fontWeight: "600",
    fontSize: 14,
  }, */
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
  partnerCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
    elevation: 2,
    paddingBottom: 10, // ✅ important to avoid overlap
  },

  partnerLeftBox: {
    flex: 1,
  },

  partnerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  partnerShareText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  partnerRightBox: {
    alignItems: "flex-end",
    minWidth: 80,
  },

  partnerInvestedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },

  partnerStatusText: {
    fontSize: 12,
    color: "green",
    marginTop: 2,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  availableMoneyText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#1cd134ff",
  },

  leftOverArea: {
    marginTop: 10,
    borderTopWidth: 0.7,
    borderTopColor: "#ccc",
    paddingTop: 8,
    // ✅ allow expanding and avoid clipping
    flexDirection: "column",
  },

  leftOverInput: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: "#007AFF",
    fontSize: 14,
    width: "100%", // ✅ full width inside card
    backgroundColor: "#fff",
  },
});
