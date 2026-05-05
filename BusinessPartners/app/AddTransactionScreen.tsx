// AddInvestmentPopup.tsx
import AppHeader from "@/src/components/AppHeader";
import LoadingOverlay from "@/src/components/LoadingOverlay";
import SupplierPopup from "@/src/components/SupplierPopup";
import TransactionConfirmModal from "@/src/components/TransactionConfirmModal";
import { showToast } from "@/src/utils/ToastService";
import { getVideoId } from "@/src/utils/VideoStorage";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
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
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../src/config/config";
import { numberToWords } from "../src/utils/numberToWords";

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
  autoFilled?: boolean;
}
type ImageFile = {
  uri: string;
  isExisting?: boolean;
};
const SLIDER_THUMB_SIZE = 18;
const AddTransactionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const businessId = params.businessId as string;
  const businessName = params.businessName as string;

  const cropDetails = params.cropDetails
    ? JSON.parse(params.cropDetails as string)
    : undefined;

  const investmentGroupId = params.investmentGroupId
    ? Number(params.investmentGroupId)
    : null;
  const shakeAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">(
    "share",
  );

  const [showSupplierPopup, setShowSupplierPopup] = useState(false);
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  //const [token, setToken] = useState<string | null>(null);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetTempMode, setSheetTempMode] = useState<
    "share" | "equal" | "manual"
  >("share");
  const [shareValues, setShareValues] = useState<number[]>([]);
  const [typeDropdownVisible, setTypeDropdownVisible] = useState(false);
  const [transactionType, setTransactionType] = useState<
    "Investment" | "Sold" | "Withdraw" | null
  >(null);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  const [errorVisible, setErrorVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current; // for fade in/out
  const redTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [supplierName, setSupplierName] = useState<string | null>(null);

  const [images, setImages] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [videoId, setVideoId] = useState("");
  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("addTransaction");
    setVideoId(id);
  };
  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    load();
  }, []);

  useEffect(() => {
    if (params.images) {
      try {
        const parsedImages = JSON.parse(params.images as string);
        const formattedImages = parsedImages.map((img: any) => ({
          uri: typeof img === "string" ? img : img.uri,
          isExisting: true, // ✅ VERY IMPORTANT
        }));

        setImages(formattedImages);
      } catch (e) {
        console.log("Error parsing images", e);
      }
    }

    if (params.caption) {
      setDescription(params.caption as string); // optional
    }
  }, [params.images, params.caption]);

  const handlePreSave = () => {
    if (!transactionType) {
      setErrorVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setErrorVisible(false));
      }, 2000);

      return;
    }
    // 🚨 Withdraw validation: cannot exceed available money
    if (transactionType === "Withdraw") {
      const withdrawErrors: Record<string, string> = {};

      rows.forEach((r) => {
        const entered = Number(r.investing || 0); // withdraw amount entered
        const available = Number(r.leftOver || 0); // available money

        // ✅ SKIP rows where nothing entered
        if (entered === 0) return;
        if (entered > available) {
          withdrawErrors[r.id] = `Withdraw ₹${entered.toFixed(
            2,
          )} exceeds available ₹${available.toFixed(2)}`;
        }
      });

      if (Object.keys(withdrawErrors).length > 0) {
        setRowErrors(withdrawErrors);

        // 🔥 CLEAR OLD TIMEOUT
        if (redTimeoutRef.current) {
          clearTimeout(redTimeoutRef.current);
        }

        // 🔥 AUTO CLEAR AFTER 5 SECONDS
        redTimeoutRef.current = setTimeout(() => {
          setRowErrors({});
        }, 5000);

        // 🔥 Shake invalid cards (same animation logic you use above)
        Object.keys(withdrawErrors).forEach((id) => {
          if (!shakeAnimations[id]) {
            shakeAnimations[id] = new Animated.Value(0);
          }

          Animated.sequence([
            Animated.timing(shakeAnimations[id], {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: 6,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]).start();
        });

        Alert.alert(
          "Invalid Withdraw Amount",
          "Withdraw amount cannot be greater than available money.",
        );

        return; // ⛔ STOP SAVE
      }
    }
    // ❌ Validate leftover usage
    const errors: Record<string, string> = {};

    rows.forEach((r) => {
      if (r.checked) {
        const used = Number(r.reduceLeftOver || 0);
        const available = Number(r.leftOver || 0);

        if (used > available) {
          errors[r.id] = `Used amount ₹${used.toFixed(
            2,
          )} exceeds available ₹${available.toFixed(2)}`;
        }
      }
    });

    // ⛔ Stop save if any error
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);

      // 🔥 CLEAR OLD TIMEOUT
      if (redTimeoutRef.current) {
        clearTimeout(redTimeoutRef.current);
      }

      // 🔥 AUTO CLEAR AFTER 5 SECONDS
      redTimeoutRef.current = setTimeout(() => {
        setRowErrors({});
      }, 5000);

      // 🔥 Trigger shake for invalid cards
      Object.keys(errors).forEach((id) => {
        if (!shakeAnimations[id]) {
          shakeAnimations[id] = new Animated.Value(0);
        }

        Animated.sequence([
          Animated.timing(shakeAnimations[id], {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: 6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      });

      return;
    }

    // ✅ Clear errors if valid
    setRowErrors({});

    const totalEntered = rows.reduce(
      (sum, r) => sum + (parseFloat(r.actual) || 0),
      0,
    );

    const expected = Number(totalAmount || 0);

    console.log("entered:", totalEntered, "expected:", expected);

    // 🔴 mismatch → supplier popup
    const diff = Math.round((expected - totalEntered) * 100) / 100;

    // ✅ Show supplier popup ONLY if money is LESS (borrowing case)
    if (diff > 0) {
      setRemaining(diff);
      setShowSupplierPopup(true);
      return;
    }

    // ✅ If extra investment → no popup, treat as valid
    if (diff <= 0) {
      setSupplierName(null);
      setRemaining(0);
    }
    // 🔥 Reset for non-investment
    if (transactionType !== "Investment") {
      setSupplierName(null);
      setRemaining(0);
    }
    if (Math.round((totalEntered - expected) * 100) / 100 === 0) {
      setSupplierName(null);
      setRemaining(0);
    }
    // ✅ match → confirm
    console.log("👉 Confirm popup triggered");

    setShowConfirmPopup(true);
  };

  useEffect(() => {
    if (!token || !businessId) return;

    const fetchPartners = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${businessId}/partners`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          console.log("Failed to fetch partners");
          return;
        }

        const data = await response.json();

        if (data?.partners) {
          setPartners(
            data.partners.map((p: any) => ({
              id: p.partnerId,
              username: p.username,
              share: p.share,
            })),
          );
        } else {
          setPartners([]);
        }
      } catch (err) {
        console.log("Error fetching partners", err);
      }
    };

    fetchPartners();
  }, [businessId, token]);
  // Load user data
  useEffect(() => {
    const loadData = async () => {
      const n = await AsyncStorage.getItem("userName");
      const u = await AsyncStorage.getItem("userId");
      const t = await AsyncStorage.getItem("token");
      setToken(t);
      setUserName(n);
      setUserId(u);
    };
    loadData();
  }, []);

  const createdBy = userName;
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const hasRowErrors = Object.keys(rowErrors).length > 0;

  // ✅ Fetch business info with leftover + partnerDTO
  useEffect(() => {
    if (!token || !businessId) return;

    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          console.warn("⚠️ No data returned from business-details-by-id");
          return;
        }

        const data = await response.json();

        setInvestmentDetails(data?.investmentDetails || []);

        // ✅ Map backend structure correctly
        const mappedRows: PartnerRow[] = (data?.investmentDetails || []).map(
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
          }),
        );

        console.log({ mappedRows });

        if (mappedRows.length > 0) {
          setRows(mappedRows);
        }
      } catch (err) {
        console.log("❌ Error fetching business info:", err);
      }
    };
    fetchBusinessInfo();
  }, [businessId, token]);

  // Initialize rows for partners
  useEffect(() => {
    if (rows.length > 0) return; // ✅ VERY IMPORTANT

    const initial = partners.map((p) => ({
      id: p.id,
      name: p.username,
      share: p.share ?? 0,
      actual: "",
      investing: "",
      leftOver: 0,
      checked: false,
      reduceLeftOver: "",
    }));

    setRows(initial);
    setShareValues(partners.map((p) => p.share ?? 0));
  }, [partners]);

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    if (!partners.length) return;
    setRows((prev) =>
      prev.map((prevRow, idx) => {
        const p = partners[idx];

        if (!p) return prevRow;

        const base = {
          ...prevRow,
          id: p.id,
          name: p.username,
          share: p.share ?? 0,
        };

        if (!totalAmount) {
          return { ...base, actual: "", investing: "" };
        }

        const liveAmount = Number(totalAmount || 0);

        let actual = prevRow.actual;
        let investing = prevRow.investing;

        if (splitMode === "share") {
          const percent = p.share ?? 0;
          actual = ((percent / 100) * liveAmount).toFixed(2);
          investing = actual;
        }

        if (splitMode === "equal") {
          const per = (liveAmount / partners.length).toFixed(2);
          actual = per;
          investing = per;
        }

        if (splitMode === "manual") {
          actual = prevRow.actual;
          investing = prevRow.investing;
        }

        return {
          ...base,
          actual,
          investing,
        };
      }),
    );
  }, [splitMode, totalAmount, partners]);
  // Inside AddInvestmentPopup.tsx, only update split options logic

  useEffect(() => {
    if (transactionType !== "Investment") return;
    if (!totalAmount || Number(totalAmount) <= 0) return;

    setRows((prev) =>
      prev.map((r) => {
        // ✅ Skip if no leftover
        if (!r.leftOver || Number(r.leftOver) <= 0) return r;

        // ✅ If user already touched → DO NOT override
        if (r.autoFilled) return r;

        const investable = Number(r.investing || 0);
        const available = Number(r.leftOver || 0);

        // 👉 how much can be used
        const usable = Math.min(investable, available);

        if (usable <= 0) return r;

        return {
          ...r,
          checked: true,
          reduceLeftOver: usable.toFixed(2),
        };
      }),
    );
  }, [totalAmount, transactionType]);

  const openSheet = () => {
    console.log("Opening split options sheet with mode:");
    if (!totalAmount || Number(totalAmount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount first");
      return;
    }
    setSheetTempMode(splitMode);

    // Prepare temp share values based on current split mode
    if (splitMode === "share") {
      // Actual invested amounts for partners in share mode
      setShareValues(
        rows.map((r) => parseFloat(r.investing || r.actual || "0")),
      );
    } else if (splitMode === "equal") {
      const per = expected / partners.length;
      setShareValues(partners.map(() => per));
    } else {
      setShareValues(rows.map((r) => parseFloat(r.investing || "0")));
    }
    console.log("End of Opening split options sheet with mode:", shareValues);
    setSheetVisible(true);
  };

  const applySheet = () => {
    // Apply split values based on sheetTempMode
    setSplitMode(sheetTempMode);
    console.log("Applying split options sheet with mode:", shareValues);
    console.log("rows", rows);
    if (sheetTempMode === "share") {
      // Use shareValues (which may have been edited by user)
      setRows((prev) =>
        prev.map((r, idx) => {
          const actualAmount = shareValues[idx] ?? 0;
          return {
            ...r,
            actual: actualAmount.toFixed(2), // investable amount
            investing: r.investing ? r.investing : actualAmount.toFixed(2),
            // Do NOT touch share %
          };
        }),
      );
    } else if (sheetTempMode === "equal") {
      // Prefer shareValues (user may have edited the equal values).
      const per = expected / partners.length;
      setRows((prev) =>
        prev.map((r, idx) => {
          const val = shareValues[idx] ?? per;
          const updated = {
            ...r,
            actual: Number(val).toFixed(2),
            investing: r.investing ? r.investing : Number(val).toFixed(2),
          };
          console.log(`Partner ${idx + 1} (${r.name}) →`, updated);
          return updated;
        }),
      );
    } else {
      // Manual: apply user-entered values from shareValues (don't overwrite with old share)
      setRows((prev) =>
        prev.map((r, idx) => {
          const val = shareValues[idx] ?? parseFloat(r.investing || "0") ?? 0;
          return {
            ...r,
            actual: Number(val).toFixed(2),
            investing: String(val),
          };
        }),
      );
    }

    console.log("End of Applying split options sheet with mode:", shareValues);
    console.log("rows", rows);
    setSheetVisible(false);
  };

  const handleSave = () => {
    if (!transactionType) {
      setErrorVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setErrorVisible(false));
      }, 2000);

      return;
    }
    // 🚨 Withdraw validation: cannot exceed available money
    if (transactionType === "Withdraw") {
      const withdrawErrors: Record<string, string> = {};

      rows.forEach((r) => {
        const entered = Number(r.investing || 0); // withdraw amount entered
        const available = Number(r.leftOver || 0); // available money

        // ✅ SKIP rows where nothing entered
        if (entered === 0) return;
        if (entered > available) {
          withdrawErrors[r.id] = `Withdraw ₹${entered.toFixed(
            2,
          )} exceeds available ₹${available.toFixed(2)}`;
        }
      });

      if (Object.keys(withdrawErrors).length > 0) {
        setRowErrors(withdrawErrors);

        // 🔥 CLEAR OLD TIMEOUT
        if (redTimeoutRef.current) {
          clearTimeout(redTimeoutRef.current);
        }

        // 🔥 AUTO CLEAR AFTER 5 SECONDS
        redTimeoutRef.current = setTimeout(() => {
          setRowErrors({});
        }, 5000);

        // 🔥 Shake invalid cards (same animation logic you use above)
        Object.keys(withdrawErrors).forEach((id) => {
          if (!shakeAnimations[id]) {
            shakeAnimations[id] = new Animated.Value(0);
          }

          Animated.sequence([
            Animated.timing(shakeAnimations[id], {
              toValue: 10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: -10,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: 6,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimations[id], {
              toValue: 0,
              duration: 50,
              useNativeDriver: true,
            }),
          ]).start();
        });

        Alert.alert(
          "Invalid Withdraw Amount",
          "Withdraw amount cannot be greater than available money.",
        );

        return; // ⛔ STOP SAVE
      }
    }
    // ❌ Validate leftover usage
    const errors: Record<string, string> = {};

    rows.forEach((r) => {
      if (r.checked) {
        const used = Number(r.reduceLeftOver || 0);
        const available = Number(r.leftOver || 0);

        if (used > available) {
          errors[r.id] = `Used amount ₹${used.toFixed(
            2,
          )} exceeds available ₹${available.toFixed(2)}`;
        }
      }
    });

    // ⛔ Stop save if any error
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);

      // 🔥 CLEAR OLD TIMEOUT
      if (redTimeoutRef.current) {
        clearTimeout(redTimeoutRef.current);
      }

      // 🔥 AUTO CLEAR AFTER 5 SECONDS
      redTimeoutRef.current = setTimeout(() => {
        setRowErrors({});
      }, 5000);

      // 🔥 Trigger shake for invalid cards
      Object.keys(errors).forEach((id) => {
        if (!shakeAnimations[id]) {
          shakeAnimations[id] = new Animated.Value(0);
        }

        Animated.sequence([
          Animated.timing(shakeAnimations[id], {
            toValue: 10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: -10,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: 6,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnimations[id], {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]).start();
      });

      return;
    }

    // ✅ Clear errors if valid
    setRowErrors({});

    const totalEntered = rows.reduce(
      (sum, r) => sum + (parseFloat(r.actual) || 0),
      0,
    );
    console.log({ totalEntered, expected });
    /* if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    } */

    /*   if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      console.log("Need supplier popup, diff:", expected - totalEntered);
      console.log(rows);
      setRemaining(expected - totalEntered);
      setShowSupplierPopup(true);
      return;
    } */
    // ✅ If perfect match (no supplier needed)
    if (Math.round((totalEntered - expected) * 100) / 100 === 0) {
      saveInvestment(null);
      return;
    }
  };

  const saveInvestment = async (supplierName: string | null) => {
    setIsSaving(true);
    const investmentData = rows.map((r) => {
      const reduceLeftOverValue =
        transactionType === "Investment"
          ? parseFloat(r.reduceLeftOver || "0") || 0
          : 0;

      const reduceLeftOverFlag =
        r.reduceLeftOver && Number(r.reduceLeftOver) > 0 ? "Y" : "N";
      console.log("CropDetails in saveInvestment:", cropDetails);
      if (transactionType === "Investment")
        return {
          partnerId: r.id,
          cropId: cropDetails?.id,
          businessId: params.businessId,
          investmentGroupId,
          description: description || "",
          comments: description || "",
          totalAmount: expected,
          investable: parseFloat(r.investing || 0),
          invested: parseFloat(r.actual || 0),
          soldAmount: 0,
          withdrawn: 0,
          transactionType: "INVESTMENT",
          splitType: splitMode.toUpperCase(),
          reduceLeftOver: reduceLeftOverValue,
          reduceLeftOverFlag: reduceLeftOverFlag,
          supplierName, // ✅ add
          createdBy,
        };

      if (transactionType === "Sold")
        return {
          partnerId: r.id,
          cropId: cropDetails?.id,
          investmentGroupId,
          businessId: params.businessId,
          description: description || "",
          comments: description || "",
          totalAmount: expected,
          investable: 0,
          invested: 0,
          soldAmount: parseFloat(r.investing || 0),
          withdrawn: 0,
          transactionType: "SOLD",
          splitType: splitMode.toUpperCase(),
          reduceLeftOver: 0,
          reduceLeftOverFlag: "N",
          supplierName,
          createdBy,
        };

      if (transactionType === "Withdraw")
        return {
          partnerId: r.id,
          cropId: cropDetails?.id,
          investmentGroupId,
          businessId: params.businessId,
          description: description || "",
          comments: description || "",
          totalAmount: expected,
          investable: 0,
          invested: 0,
          soldAmount: 0,
          withdrawn: parseFloat(r.investing || 0),
          transactionType: "WITHDRAW",
          splitType: splitMode.toUpperCase(),
          reduceLeftOver: 0,
          reduceLeftOverFlag: "N",
          supplierName,
          createdBy,
        };

      return {};
    });

    try {
      // 1️⃣ Create form data
      const formData = new FormData();

      // 2️⃣ Append investment JSON
      formData.append("investmentData", JSON.stringify(investmentData));

      // 3️⃣ Append images
      // ✅ 1. EXISTING IMAGES (KEEP)
      const existingImages = images
        .filter((img) => img.isExisting)
        .map((img) => img.uri);

      formData.append("existingImages", JSON.stringify(existingImages));

      // ✅ 2. NEW IMAGES (UPLOAD)
      images
        .filter((img) => !img.isExisting)
        .forEach((img, index) => {
          formData.append("files", {
            uri: img.uri,
            name: img.fileName || `image_${Date.now()}_${index}.jpg`,
            type: img.mimeType || "image/jpeg",
          } as any);
        });

      // 4️⃣ Send request
      const response = await axios.post(
        `${BASE_URL}/api/investment/add-investment`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("✅ Success:", response.data);
      router.back();
      //setImages([]); // clear images
      showToast("Transaction saved successfully", "success");

      // ⏳ wait for toast to finish (same duration: 3s)
      /* setTimeout(() => {
        router.back();
      }, 2000); */
    } catch (error: any) {
      console.log("❌ FULL ERROR:", error);

      if (error.response) {
        console.log("❌ Status:", error.response.status);
        console.log("❌ Backend Message:", error.response.data);
      }

      showToast(
        error.response?.data?.message || "Something went wrong",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusInfo = (r: any) => {
    if (transactionType !== "Investment") {
      return { text: "", color: "#000" };
    }

    const investableNum = Number(r.investing ?? 0);
    const investedNum = Number(r.actual ?? 0);

    const diff = Math.round((investedNum - investableNum) * 100) / 100;

    if (!investableNum && !investedNum) {
      return { text: "", color: "#000" };
    }

    if (diff > 0) {
      return {
        text: `Extra + ${diff.toFixed(2)}`,
        color: "green",
      };
    }

    if (diff < 0) {
      return {
        text: `Pending - ${Math.abs(diff).toFixed(2)}`,
        color: "red",
      };
    }

    return {
      text: "Settled",
      color: "#666",
    };
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
          isExisting: false, // ✅ NEW IMAGE
        },
      ]);
    }
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages((prev) => [
        ...prev,
        {
          uri: result.assets[0].uri,
          fileName: result.assets[0].fileName,
          mimeType: result.assets[0].mimeType,
          isExisting: false, // ✅ NEW IMAGE
        },
      ]);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={t("addTransaction")}
          videoId={videoId}
          rightComponent={
            <TouchableOpacity
              onPress={handlePreSave}
              style={[
                styles.headerRight,
                {
                  opacity:
                    !totalAmount || Number(totalAmount) <= 0 || hasRowErrors
                      ? 0.5
                      : 1,
                },
              ]}
              disabled={
                !totalAmount || Number(totalAmount) <= 0 || hasRowErrors
              }
            >
              <Text style={styles.saveText}>{t("save")}</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
            onScrollBeginDrag={() => setTypeDropdownVisible(false)}
          >
            {/* Business + Transaction Type Row */}
            <View style={styles.businessTypeRow}>
              <Text style={styles.businessNameText}>{businessName}</Text>

              <Animated.View
                style={{
                  transform: [{ scale: shakeAnim }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.typeDropdownBtn,
                    errorVisible && { borderColor: "red", borderWidth: 2 },
                  ]}
                  onPress={() => setTypeDropdownVisible(true)}
                >
                  <Text
                    style={{
                      color: errorVisible
                        ? "red"
                        : transactionType === "Investment"
                          ? "#007bff"
                          : transactionType === "Sold"
                            ? "#28a745"
                            : transactionType === "Withdraw"
                              ? "#dc3545"
                              : "#333",
                      fontWeight: "600",
                    }}
                  >
                    {transactionType
                      ? t(transactionType.toLowerCase())
                      : t("selectType")}
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
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("description")}</Text>
              <TextInput
                style={styles.inputBox}
                placeholderTextColor={"#ccc"}
                placeholder={t("enterDescription")}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={[styles.inputContainer, { marginBottom: 6 }]}>
              <Text style={styles.inputLabel}>{t("amount")}</Text>
              <View style={styles.amountRow}>
                <TextInput
                  style={[styles.inputBox, styles.amountInput]}
                  placeholderTextColor={"#ccc"}
                  placeholder={t("enterAmount")}
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
              <Text style={styles.sectionTitle}>{t("partners")}</Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
              >
                {rows.map((r, i) => (
                  <View key={r.id} style={{ marginBottom: 12 }}>
                    <Animated.View
                      style={[
                        styles.partnerCard,
                        rowErrors[r.id] && {
                          borderColor: "red",
                          borderWidth: 2,
                          backgroundColor: "#fff5f5",
                        },
                        {
                          transform: [
                            {
                              translateX:
                                shakeAnimations[r.id] || new Animated.Value(0),
                            },
                          ],
                        },
                      ]}
                    >
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
                            {(r.name || "Unknown").toUpperCase()}
                          </Text>
                          <Text style={styles.partnerShareText}>
                            {r.share ?? 0}%
                          </Text>
                        </View>

                        <View style={styles.partnerRightBox}>
                          <Text style={styles.partnerInvestedText}>
                            {r.actual || "0.00"}
                          </Text>
                          {(() => {
                            const status = getStatusInfo(r);
                            return (
                              <Text
                                style={[
                                  styles.partnerStatusText,
                                  { color: status.color },
                                ]}
                              >
                                {status.text}
                              </Text>
                            );
                          })()}
                        </View>
                      </View>

                      {transactionType === "Withdraw" &&
                        Number(r.leftOver) > 0 && (
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
                              {Number(r.leftOver).toFixed(2)}
                            </Text>
                          </View>
                        )}
                      {/* ✅ Leftover section full width below */}
                      {transactionType === "Investment" &&
                        Number(r.leftOver) > 0 && (
                          <View
                            style={{
                              marginTop: 10,
                              borderTopWidth: 0.6,
                              borderTopColor: "#ccc",
                              paddingTop: 8,
                            }}
                          >
                            <TouchableOpacity
                              onPress={() =>
                                setRows((prev) => {
                                  const next = [...prev];
                                  next[i] = {
                                    ...next[i],
                                    checked: !next[i].checked,
                                    autoFilled: true,
                                    reduceLeftOver: next[i].checked
                                      ? ""
                                      : next[i].reduceLeftOver,
                                  };
                                  return next;
                                })
                              }
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Ionicons
                                name={r.checked ? "checkbox" : "square-outline"}
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
                                {t("availableMoneytoUse")} : ₹
                                {Number(r.leftOver).toFixed(2)}
                              </Text>
                            </TouchableOpacity>

                            {r.checked && (
                              <>
                                <TextInput
                                  style={styles.leftOverInput}
                                  keyboardType="numeric"
                                  placeholderTextColor={"#ccc"}
                                  placeholder="Enter amount to use..."
                                  value={r.reduceLeftOver ?? ""}
                                  onChangeText={(val) => {
                                    setRows((prev) => {
                                      const next = [...prev];
                                      next[i] = {
                                        ...next[i],
                                        reduceLeftOver: val,
                                        autoFilled: true, // ✅ user override lock
                                      };
                                      return next;
                                    });

                                    const used = Number(val || 0);
                                    const available = Number(r.leftOver || 0);

                                    if (used <= available) {
                                      setRowErrors((prev) => {
                                        const copy = { ...prev };
                                        delete copy[r.id];
                                        return copy;
                                      });
                                    }
                                  }}
                                />
                                {/* ❌ Inline error message */}
                                {rowErrors[r.id] && (
                                  <Text
                                    style={{
                                      color: "red",
                                      fontSize: 12,
                                      marginTop: 4,
                                      marginLeft: 6,
                                    }}
                                  >
                                    {rowErrors[r.id]}
                                  </Text>
                                )}
                              </>
                            )}
                          </View>
                        )}
                    </Animated.View>
                  </View>
                ))}
              </ScrollView>
            </View>
            {/* Images Section */}
            <Text style={styles.sectionTitle}>{t("images")}</Text>

            <View style={{ flexDirection: "row", marginBottom: 10 }}>
              <TouchableOpacity
                style={styles.cameraBtn}
                onPress={pickFromCamera}
              >
                <Ionicons name="camera" size={28} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cameraBtn, { backgroundColor: "#28a745" }]}
                onPress={pickFromGallery}
              >
                <Ionicons name="image" size={28} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.imagePreview}
                  onPress={() => setPreviewImage(img.uri)}
                >
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.previewThumb}
                  />

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
          {showSupplierPopup && (
            <SupplierPopup
              visible={showSupplierPopup}
              totalAmount={expected}
              rows={rows}
              remaining={remaining}
              onClose={() => setShowSupplierPopup(false)}
              onConfirm={(supplierName) => {
                setShowSupplierPopup(false);
                setSupplierName(supplierName); // store
                // 👉 ONLY open confirm here
                setShowConfirmPopup(true);
              }}
            />
          )}
          {/* Image Preview */}
          <Modal visible={!!previewImage} transparent>
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: previewImage! }}
                style={styles.fullPreview}
              />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setPreviewImage(null)}
              >
                <Ionicons name="close" size={36} color="#fff" />
              </TouchableOpacity>
            </View>
          </Modal>
          <TransactionConfirmModal
            visible={showConfirmPopup}
            onClose={() => setShowConfirmPopup(false)}
            onConfirm={() => {
              setShowConfirmPopup(false);
              saveInvestment(supplierName);
            }}
            description={description}
            totalAmount={totalAmount}
            splitMode={splitMode}
            rows={rows}
            transactionType={transactionType ?? "Investment"}
            supplierName={supplierName}
            remaining={remaining}
          />
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
                      <Text style={styles.sheetHeaderTitle}>
                        {t("splitOptions")}
                      </Text>
                      <TouchableOpacity onPress={applySheet}>
                        <Text style={styles.sheetDone}>{t("done")}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView
                      style={{ flex: 1 }} // ✅ FULL HEIGHT
                      contentContainerStyle={{
                        paddingBottom: 40,
                        paddingHorizontal: 12,
                      }}
                      keyboardShouldPersistTaps="handled"
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
                                    expected,
                                );
                                setShareValues(shareBased);
                              } else {
                                // When user chooses manual mode show current invested/investing values so user can edit them
                                setShareValues(
                                  rows.map((r) => parseFloat("0")),
                                );
                              }
                            }}
                            style={[
                              styles.splitModeButton,
                              sheetTempMode === m &&
                                styles.splitModeButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.splitModeText,
                                sheetTempMode === m &&
                                  styles.splitModeTextActive,
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
          {typeDropdownVisible && (
            <View style={styles.typeDropdownMenu}>
              {[
                { value: "Investment", color: "#007bff" },
                { value: "Sold", color: "#28a745" },
                { value: "Withdraw", color: "#dc3545" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.typeDropdownItem}
                  onPress={() => {
                    setTransactionType(item.value as any); // ✅ same backend value
                    setTypeDropdownVisible(false);
                  }}
                >
                  <Text
                    style={{
                      color: item.color,
                      fontWeight:
                        transactionType === item.value ? "700" : "500",
                    }}
                  >
                    {t(item.value.toLowerCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <LoadingOverlay
            visible={isSaving}
            message={
              transactionType === "Investment"
                ? "Saving Investment..."
                : transactionType === "Sold"
                  ? "Saving Sale..."
                  : transactionType === "Withdraw"
                    ? "Processing withdrawal..."
                    : "Saving Transaction..."
            }
          />
        </View>
      </SafeAreaView>
    </>
  );
};

export default AddTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // page background
  },
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

  headerLeft: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerRight: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },

  saveText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
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
  /*   partnerCard: {
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
  }, */
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
    height: "90%",
    backgroundColor: "#f5f5f8ff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
  businessTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  businessNameText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    flex: 1,
  },

  typeDropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
  },
  typeDropdownMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    elevation: 5,
    zIndex: 999,
    width: 150,
  },

  typeDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
});
