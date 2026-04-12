import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import DropDownPicker from "react-native-dropdown-picker";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppHeader from "@/src/components/AppHeader";
import ImagePickerModal from "@/src/components/ImagePickerModal";
import ImagePreviewModal from "@/src/components/ImagePreviewModal";
import { InvestmentDTO } from "@/src/types/types";
import { generateBusinessStatementPDF } from "@/src/utils/BusinessStatementPDF";
import {
  ImageFile,
  pickImageFromCamera,
  pickImageFromGallery,
} from "@/src/utils/ImagePickerService";
import { normalizeInvestmentForEdit } from "@/src/utils/InvestmentNormalizer";
import { getVideoId } from "@/src/utils/VideoStorage";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
import { Calendar, DateData } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import InvestmentAudit from "../src/components/InvestmentAudit";
import BASE_URL from "../src/config/config";
type Partner = {
  partnerId: number;
  username: string;
  paidAmount: number;
  pendingAmount: number;
};

type Supplier = {
  supplierId: number;
  supplierName: string;
  pendingAmount: number;
  partners: Partner[];
};
export default function BusinessDetail() {
  // ✅ define types before using state

  // ✅ fix state type
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const { businessId, businessName } = useLocalSearchParams<{
    businessId?: string;
    businessName?: string;
  }>();

  const [summaryFilter, setSummaryFilter] = useState(t("all"));
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);

  const [summaryDropdownOpen, setSummaryDropdownOpen] = useState(false);

  const summaryOptions = [
    t("all"),
    t("today"),
    t("yesterday"),
    t("thisMonth"),
    t("lastMonth"),
    t("selectDates"),
  ];

  const router = useRouter();

  // Ensure safe usage
  const safeBusinessId = businessId ? String(businessId) : "";
  const safeBusinessName = businessName ? String(businessName) : "";
  // AsyncStorage.setItem("businessName", safeBusinessName);
  const [partners, setPartners] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [leftOver, setLeftOver] = useState(0);
  const [yourInvestment, setYourInvestment] = useState(0);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]); // <-- new
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalSoldAmount, setTotalSoldAmount] = useState(0);
  const [cropDetails, setCropDetails] = useState<any>(null);
  const [withdrawPopup, setWithdrawPopup] = useState(false);
  const [showAuditPopup, setShowAuditPopup] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState<
    { partnerName: string; leftOver: number }[]
  >([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState("byLoggedInUser"); // default
  const [open, setOpen] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);

  const [selectedTime, setSelectedTime] = useState(null);
  const [openTime, setOpenTime] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pickerSheetVisible, setPickerSheetVisible] = useState(false);
  const [imageTransactions, setImageTransactions] = useState<any[]>([]);

  const [items, setItems] = useState([
    { label: t("yourTransactions"), value: "byLoggedInUser" },
    { label: t("yourInvestments"), value: "byInvestment" },
    { label: t("yourWithdraws"), value: "byWithdraw" },
    { label: t("yourSold"), value: "bySold" },
    { label: t("everyonesTransactions"), value: "allInvestments" },
  ]);

  const [videoId, setVideoId] = useState("");
  const [caption, setCaption] = useState("");
  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("businessDetail");
    setVideoId(id);
  };
  useEffect(() => {
    if (!businessId || !token) return;
    fetchSuppliers();
  }, [businessId, token, investmentDetails]);

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");
      const uName = await AsyncStorage.getItem("userName");
      setUserName(uName);
      //console.log("📌 Loaded username:", uName);
      setToken(t);
      setUserId(u);
    };
    loadData();
  }, []);

  const handleCamera = async () => {
    const img = await pickImageFromCamera();

    if (img) {
      setImages((prev) => {
        const updated = [...prev, img];
        setSelectedIndex(updated.length - 1);
        return updated;
      });

      setPickerSheetVisible(false);

      setTimeout(() => {
        setImageModalVisible(true);
      }, 150);
    }
  };

  const handleGallery = async () => {
    const imgs = await pickImageFromGallery();

    if (imgs.length > 0) {
      setImages((prev) => {
        const updated = [...prev, ...imgs];
        setSelectedIndex(updated.length - 1);
        return updated;
      });

      setTimeout(() => {
        setImageModalVisible(true); // 👈 reopen preview
      }, 200);
    }

    setPickerSheetVisible(false);
  };

  // 🏷 Get label text dynamically based on selected value
  const currentLabel =
    items.find((item) => item.value === selectedFilter)?.label ||
    "Select Filter";

  const handleSupplierClick = async (supplier: Supplier) => {
    try {
      if (!token) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/supplier/supplier-group-investments/${supplier.supplierId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch supplier investments");
      }

      const data: InvestmentDTO[] = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert("No transactions found for this supplier");
        return;
      }

      // 🚀 Navigate to Edit Screen
      router.push({
        pathname: "/EditTransactionScreen",
        params: {
          businessId: safeBusinessId,
          businessName: safeBusinessName,
          investmentData: JSON.stringify(normalizeInvestmentForEdit(data)),
        },
      });
    } catch (error) {
      console.log("Supplier click error:", error);
      Alert.alert("Error", "Unable to open supplier transaction");
    }
  };

  const fetchImageTransactions = async () => {
    if (!token || !safeBusinessId) return;

    try {
      const res = await fetch(
        `${BASE_URL}/api/investment-images/business/${safeBusinessId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setImageTransactions(data || []);
    } catch (err) {
      console.log("Image fetch error", err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/supplier/${businessId}/contributions`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch suppliers");

      const data = await res.json();

      const grouped: Supplier[] = Object.values(
        data.reduce((acc: Record<number, Supplier>, item: any) => {
          if (!acc[item.supplierId]) {
            acc[item.supplierId] = {
              supplierId: item.supplierId,
              supplierName: item.supplierName,
              pendingAmount: item.pendingAmount ?? 0,
              partners: [],
            };
          }

          acc[item.supplierId].partners.push({
            partnerId: item.partnerId,
            username: item.partnerName,
            paidAmount: item.amountPaid ?? 0,
            pendingAmount: item.amountPending ?? 0,
          });

          return acc;
        }, {}),
      );

      setSuppliers(grouped);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Error fetching suppliers");
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getDateRange = (filter: string) => {
    const today = new Date();

    // 🔥 NEW: Custom Range Support
    if (filter === "SELECT DATES" && customStartDate && customEndDate) {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
      };
    }

    switch (filter) {
      case "TODAY":
        return {
          startDate: formatDate(today),
          endDate: formatDate(today),
        };

      case "YESTERDAY":
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return {
          startDate: formatDate(yesterday),
          endDate: formatDate(yesterday),
        };

      case "THIS MONTH":
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          startDate: formatDate(firstDay),
          endDate: formatDate(lastDay),
        };

      case "LAST MONTH":
        const firstDayLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastDayLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0,
        );
        return {
          startDate: formatDate(firstDayLastMonth),
          endDate: formatDate(lastDayLastMonth),
        };

      default:
        return null;
    }
  };

  const fetchSummaryByDateRange = async (
    startDate: string,
    endDate: string,
  ) => {
    if (!token || !safeBusinessId) return;

    try {
      const response = await fetch(
        `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id-and-date?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.warn("⚠️ Failed to fetch summary by date range");
        return;
      }

      const data = await response.json();

      setTotalInvestment(data?.totalInvestment || 0);
      setTotalSoldAmount(data?.totalSoldAmount || 0);

      // keeping same behavior as your existing logic
      setYourInvestment(0);
      setLeftOver(0);
    } catch (err) {
      console.log("❌ Error fetching filtered summary:", err);
    }
  };

  useEffect(() => {
    if (!token || !safeBusinessId) return;

    if (summaryFilter === t("all")) {
      /* console.log(
        "🔄 Summary filter ALL selected → fetching overall business details",
      ); */
      fetchBusinessDetails(); // existing method
      return;
    }
    /* console.log(
      `🔄 Summary filter ${summaryFilter} selected → fetching filtered summary`,
    ); */
    const range = getDateRange(summaryFilter);
    if (!range) return;

    fetchSummaryByDateRange(range.startDate, range.endDate);
  }, [summaryFilter, token, safeBusinessId]);

  const parseAmount = (v: any) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formatAmount = (v: any) =>
    Number(parseAmount(v)).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const formatDateTime = (isoOrObj: any) => {
    if (!isoOrObj) return "-";
    try {
      const d = new Date(isoOrObj);
      return isNaN(d.getTime()) ? String(isoOrObj) : d.toLocaleString();
    } catch {
      return String(isoOrObj);
    }
  };

  // Fetch business info
  useEffect(() => {
    if (!token || !safeBusinessId) return;

    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          console.warn("⚠️ Failed to fetch business info");
          return;
        }

        const data = await response.json();

        setTotalInvestment(data?.totalInvestment || 0);
        setTotalSoldAmount(data?.totalSoldAmount || 0);
        setInvestmentDetails(data?.investmentDetails || []);

        if (data?.crop) {
          setCropDetails({
            id: data.crop.id,
            cropNumber: data.crop.cropNumber,
          });
        }

        console.log("📊 Business id:", safeBusinessId);
        console.log("📊 Business details fetched:", data?.crop);
      } catch (err) {
        console.log("❌ Error fetching business info:", err);
      }
    };

    fetchBusinessInfo();
  }, [safeBusinessId, token]);
  // Fetch partners
  useEffect(() => {
    if (!token || !safeBusinessId) return;

    const fetchPartners = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${safeBusinessId}/partners`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data?.partners) {
          setPartners(
            data.partners.map((p: any) => ({
              id: p.partnerId,
              username: p.username,
              share: p.share,
            })),
          );
        }
      } catch (err) {
        // console.log("❌ Error fetching partners:", err);
      }
    };

    fetchPartners();
  }, [safeBusinessId, token]);
  useEffect(() => {
    if (!userName || !investmentDetails.length) return;

    const myRecord = investmentDetails.find((inv) => {
      const partnerName = inv?.partnerName ?? inv?.partner?.username ?? "";
      return (
        partnerName.toString().toLowerCase() ===
        userName.toString().toLowerCase()
      );
    });

    setYourInvestment(myRecord?.yourInvestment || 0);
    setLeftOver(myRecord?.leftOver || 0);
  }, [investmentDetails, userName]);

  // --- NEW: fetch investments when businessId or token changes ---
  const [allInvestments, setAllInvestments] = useState<any[]>([]);

  const fetchInvestments = async (pageNumber = 0, reset = false) => {
    if (!token || !safeBusinessId) return;
    if (!reset && loadingInvestments) return;

    try {
      setLoadingInvestments(true);

      const response = await fetch(
        `${BASE_URL}/api/investment/all-investments/${safeBusinessId}?page=${pageNumber}&size=20`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to fetch investments");

      const data = await response.json();

      const content = data?.content || [];

      if (reset) {
        setAllInvestments(content);
      } else {
        setAllInvestments((prev) => [...prev, ...content]);
      }

      setHasMore(!data?.last);
      setPage(pageNumber);
    } catch (err) {
      Alert.alert("Error", "Error fetching investments");
    } finally {
      setLoadingInvestments(false);
      setRefreshing(false);
    }
  };

  const fetchBusinessDetails = async () => {
    if (!token || !safeBusinessId) return;

    try {
      const response = await fetch(
        `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.warn("⚠️ Failed to fetch business details");
        return;
      }

      const data = await response.json();

      // 🧮 Safely update top-level totals
      setTotalInvestment(data?.totalInvestment || 0);
      setTotalSoldAmount(data?.totalSoldAmount || 0);

      setInvestmentDetails(
        Array.isArray(data?.investmentDetails) ? data.investmentDetails : [],
      );

      setCropDetails(data?.crop || null);
    } catch (err) {
      //console.log("❌ Error fetching business details:", err);
    }
  };

  const uploadImages = async () => {
    const formData = new FormData();

    images
      .filter((img: any) => !img.isExisting) // ✅ only new images
      .forEach((img: any, index: number) => {
        formData.append("files", {
          uri: img.uri,
          name: `image_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

    formData.append("businessId", String(businessId));
    formData.append("caption", caption || "");

    const response = await fetch(`${BASE_URL}/api/investment-images/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`, // ✅ REQUIRED
      },
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }
  };

  const groupedImages = useMemo(() => {
    const map: any = {};

    imageTransactions.forEach((img) => {
      const key = img.investmentId; // ✅ IMPORTANT

      if (!map[key]) {
        map[key] = {
          investmentId: key,
          caption: img.caption,
          createdBy: img.createdBy,
          createdAt: img.createdAt,
          images: [],
        };
      }

      map[key].images.push(img.imageUrl);
    });

    return Object.values(map);
  }, [imageTransactions]);

  const renderImageCard = (item: any, index: number) => {
    return (
      <View style={styles.newCard}>
        {/* TOP */}
        <View>
          <Text style={styles.caption}>{item.caption || "No Description"}</Text>

          <TouchableOpacity
            style={styles.fillBtn}
            onPress={() => {
              const formatted = item.images.map((url: string) => ({
                uri: url,
                isExisting: true,
              }));

              router.push({
                pathname: "/AddTransactionScreen",
                params: {
                  businessId: safeBusinessId,
                  businessName: safeBusinessName,
                  cropDetails: JSON.stringify(cropDetails),
                  images: JSON.stringify(formatted), // ✅ PASS IMAGES
                  caption: item.caption || "",
                  investmentGroupId: item.investmentId || null,
                },
              });
            }}
          >
            <Text style={styles.fillBtnText}>Press to add details.</Text>
          </TouchableOpacity>
        </View>

        {/* IMAGE ROW */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[...item.images, "ADD_BUTTON"]}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item: img, index }) => {
            if (img === "ADD_BUTTON") {
              return (
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={() => {
                    const formatted = item.images.map((url: string) => ({
                      uri: url,
                      isExisting: true, // ✅ VERY IMPORTANT
                    }));

                    setImages(formatted);
                    setSelectedIndex(0);

                    setTimeout(() => {
                      setImageModalVisible(true);
                    }, 150);
                  }}
                >
                  <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
              );
            }

            return <Image source={{ uri: img }} style={styles.imageThumbNew} />;
          }}
        />

        {/* FOOTER */}
        <View style={styles.footerRow}>
          <Text style={styles.footerLeft}>Created By: {item.createdBy}</Text>
          <Text style={styles.footerRight}>
            {formatDateTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!token) return;

      setPage(0);
      setHasMore(true);
      setAllInvestments([]);
      fetchImageTransactions();
      fetchInvestments(0, true);
      fetchSuppliers();

      // if (summaryFilter === "ALL") {
      fetchBusinessDetails();
      //}
    }, [safeBusinessId, token]),
  );
  const loadMoreInvestments = () => {
    if (hasMore && !loadingInvestments) {
      fetchInvestments(page + 1);
    }
  };
  const filteredInvestments = useMemo(() => {
    if (!allInvestments) return [];

    switch (selectedFilter) {
      case "byLoggedInUser":
        return allInvestments.filter(
          (inv) =>
            inv.partnerName?.toString().toLowerCase() ===
            userName?.toString().toLowerCase(),
        );

      case "byInvestment":
        return allInvestments.filter(
          (inv) =>
            inv.partnerName?.toString().toLowerCase() ===
              userName?.toString().toLowerCase() &&
            inv?.transactionType === "INVESTMENT",
        );

      case "byWithdraw":
        return allInvestments.filter(
          (inv) =>
            inv.partnerName?.toString().toLowerCase() ===
              userName?.toString().toLowerCase() &&
            inv?.transactionType === "WITHDRAW",
        );

      case "bySold":
        return allInvestments.filter(
          (inv) =>
            inv.partnerName?.toString().toLowerCase() ===
              userName?.toString().toLowerCase() &&
            inv?.transactionType === "SOLD",
        );

      case "allInvestments":
      default:
        return allInvestments;
    }
  }, [allInvestments, selectedFilter, userName]);

  // Handle "Restart" (End Crop) click
  const handleRestartClick = () => {
    if (!investmentDetails || investmentDetails.length === 0) {
      handleRestartCrop();
      return;
    }

    // Check leftover money for partners
    const leftovers = investmentDetails
      .map((inv) => ({
        partnerName: inv?.partner?.username || "Unknown",
        leftOver: parseAmount(inv?.leftOver),
      }))
      .filter((p) => p.leftOver !== 0);

    if (!leftovers || leftovers.length === 0) {
      handleRestartCrop();
    } else {
      setConfirmRestart(leftovers);
    }
  };

  // Restart crop API call
  const handleRestartCrop = async () => {
    try {
      const cropId = cropDetails?.id;
      if (!cropId) return;

      await axios.post(
        `${BASE_URL}/api/crop/end/${cropId}/${userId}`,
        investmentDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      // Refresh and navigate
      router.back();
    } catch (err: any) {
      //console.log("❌ Restart crop error:", err);
      if (err.response?.status === 400) alert("Invalid partner data.");
      else if (err.response?.status === 403) alert("Access forbidden!");
      else alert("Error restarting crop.");
    }
    setConfirmRestart([]);
  };

  // Handle Withdraw from confirm popup
  const handleWithdrawFromPopup = () => {
    setWithdrawPopup(true);
    setConfirmRestart([]);
  };

  const renderSupplierCard = (supplier: Supplier) => {
    return (
      <TouchableOpacity
        key={supplier.supplierId}
        activeOpacity={0.8}
        onPress={() => handleSupplierClick(supplier)}
        style={{
          backgroundColor: "#fff",
          padding: 14,
          borderRadius: 10,
          marginVertical: 10,
          borderWidth: 1,
          borderColor: "#ddd",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600", color: "#333" }}>
          {supplier.supplierName}
        </Text>

        <Text style={{ marginTop: 6, fontSize: 14, color: "#777" }}>
          Pending: ₹{supplier.pendingAmount.toLocaleString("en-IN")}
        </Text>

        <View style={{ marginTop: 8 }}>
          {supplier.partners.map((p, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 14 }}>{p.username}</Text>
              <Text style={{ fontSize: 14 }}>
                Paid: ₹{p.paidAmount.toLocaleString("en-IN")}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  // Render a small label-value row
  const RowKV = ({ k, v }: { k: string; v: any }) => (
    <View style={styles.invRow}>
      <Text style={styles.invLabel}>{k}</Text>
      <Text style={styles.invValue}>{v ?? "-"}</Text>
    </View>
  );

  const transactionConfig: Record<string, { label: string; color: string }> = {
    INVESTMENT: {
      label: "Investment",
      color: "#2563EB", // blue
    },
    SOLD: {
      label: "Sold",
      color: "#16A34A", // green
    },
    WITHDRAW: {
      label: "Withdraw",
      color: "#DC2626", // red
    },
    INVESTMENT_WITHDRAW: {
      label: "Investment Withdraw",
      color: "#F59E0B", // amber/orange (mixed meaning)
    },
  };

  // Render intelligent card based on flags
  const renderInvestmentCard = (inv: any, idx: number) => {
    const config =
      transactionConfig[inv.transactionType] || transactionConfig["INVESTMENT"];

    const type = config.label;
    const typeColor = config.color;

    const description = inv?.description || "-";
    const partnerName = inv?.partnerName || "-";
    const totalAmount = inv?.totalAmount ?? 0;
    const invested = inv?.invested ?? 0;
    const investable = inv?.investable ?? 0;
    const soldAmount = inv?.soldAmount ?? 0;
    const withdrawn = inv?.withdrawn ?? 0;
    const splitType = inv?.splitType ?? "-";
    const createdAt = inv?.createdAt || "-";
    const createdBy = inv?.createdBy || "-";

    return (
      <TouchableOpacity
        key={String(inv?.investmentId ?? idx)}
        style={styles.newCard}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: "/investmentDetail",
            params: {
              investmentGroupId: inv.investmentGroupId,
              businessId: safeBusinessId,
              businessName: safeBusinessName,
            },
          })
        }
      >
        {/* Top Section */}
        <View style={styles.newTopRow}>
          <Text
            style={styles.newDescription}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {description}
          </Text>

          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeBadgeText}>{type}</Text>
          </View>
        </View>

        {/* Name + Split */}
        <View style={styles.newSecondRow}>
          <Text style={styles.partnerNameText}>
            {partnerName.toUpperCase()}
          </Text>
          <Text style={styles.splitText}>{splitType}</Text>
        </View>

        {/* Amounts */}
        <View style={{ marginTop: 10 }}>
          {/* Investment Layout */}
          {type === "Investment" && (
            <>
              <Text style={styles.investedLabel}>{t("invested")}</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(invested)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t("investable")}</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(investable)}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t("totalAmount")}</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}

          {/* Sold Layout */}
          {type === "Sold" && (
            <>
              <Text style={styles.investedLabel}>{t("yourSoldAmount")}</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(soldAmount)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t("totalSoldAmount")}</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}

          {/* Withdraw Layout */}
          {type === "Withdraw" && (
            <>
              <Text style={styles.investedLabel}>{t("yourWithdrawal")}</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(withdrawn)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>{t("totalWithdrawal")}</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerLeft}>
            {t("createdBy")}: {createdBy}
          </Text>
          <Text style={styles.footerRight}>{formatDateTime(createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    if (open) return;
  }, [selectedFilter]);
  const renderHeader = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
      {/* SUMMARY CARD */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/partnerWiseDetails",
            params: {
              businessId: safeBusinessId,
              businessName: safeBusinessName,
              investmentDetails: investmentDetails,
            },
          })
        }
        style={styles.summaryCardNew}
      >
        {/* === KEEP YOUR EXISTING SUMMARY JSX EXACTLY AS IS === */}
      </TouchableOpacity>

      {/* SUPPLIERS */}
      {/* 🔹 SUPPLIERS */}
      {suppliers.filter((s) => Number(s.pendingAmount ?? 0) > 0).length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 10,
              color: "#000",
            }}
          >
            Suppliers
          </Text>

          {suppliers
            .filter((s) => Number(s.pendingAmount ?? 0) > 0)
            .map((s) => renderSupplierCard(s))}
        </View>
      )}

      {/* FILTER SECTION */}
      <View style={{ marginVertical: 12, zIndex: 1000 }}>
        {/* === KEEP YOUR FILTER JSX EXACTLY AS IS === */}
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={String(businessName || "")} videoId={videoId} />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          {open && (
            <View style={styles.filterOverlay}>
              <View style={styles.filterBox}>
                <DropDownPicker
                  open={open}
                  value={selectedFilter}
                  items={items}
                  setOpen={setOpen}
                  setItems={setItems}
                  setValue={setSelectedFilter}
                  listMode="SCROLLVIEW"
                  dropDownDirection="BOTTOM"
                  style={{
                    backgroundColor: "#fff",
                    borderColor: "#ccc",
                    borderRadius: 8,
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: "#fff",
                    borderColor: "#ccc",
                  }}
                />
              </View>
            </View>
          )}
          {/* Investment Cards */}
          <FlatList
            data={[...groupedImages, ...filteredInvestments]}
            keyExtractor={(item, index) => `${item.investmentId}-${index}`}
            renderItem={({ item, index }) => {
              if (item.images) {
                return renderImageCard(item, index);
              }
              return renderInvestmentCard(item, index);
            }}
            ListHeaderComponent={
              <View
                style={{ paddingHorizontal: 16, paddingTop: 16, zIndex: 10 }}
              >
                {/* 🔹 SUMMARY CARD */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    router.push({
                      pathname: "/partnerWiseDetails",
                      params: {
                        businessId: safeBusinessId,
                        businessName: safeBusinessName,
                        investmentDetails: investmentDetails,
                      },
                    })
                  }
                  style={styles.summaryCardNew}
                >
                  {/* Header */}
                  <View style={styles.summaryHeaderRow}>
                    <Text style={styles.summaryTitle}>
                      {t("businessSummary")}
                    </Text>

                    {/* 📌 ICON + DROPDOWN BUTTON */}
                    <TouchableOpacity
                      onPress={() =>
                        setSummaryDropdownOpen(!summaryDropdownOpen)
                      }
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={{
                          marginLeft: 6,
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#2563eb",
                          flexShrink: 0, // IMPORTANT FIX
                        }}
                      >
                        {summaryFilter.toLowerCase()}
                      </Text>

                      <Ionicons
                        name={
                          summaryDropdownOpen ? "chevron-up" : "chevron-down"
                        }
                        size={18}
                        color="#2563eb"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* 📌 SMALL DROPDOWN LIST */}
                  {summaryDropdownOpen && (
                    <View style={styles.summaryDropdownBox}>
                      {summaryOptions.map((opt, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setSummaryDropdownOpen(false);

                            if (opt === "SELECT DATES") {
                              setCalendarVisible(true);
                              setCustomStartDate(null);
                              setCustomEndDate(null);
                              setSelectingStart(true);
                            } else {
                              setSummaryFilter(opt);
                            }
                          }}
                          style={styles.summaryDropdownItem}
                        >
                          <Text
                            style={[
                              styles.summaryDropdownText,
                              {
                                color:
                                  opt === summaryFilter ? "#2563eb" : "#000",
                              },
                            ]}
                          >
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Row 1 */}
                  <View style={styles.summaryRowNew}>
                    <View style={styles.summaryBlock}>
                      <Text style={styles.summaryLabelNew}>
                        {t("totalInvestment")}
                      </Text>
                      <Text style={styles.summaryValuePrimary}>
                        ₹{formatAmount(totalInvestment)}
                      </Text>
                    </View>

                    <View style={styles.summaryBlock}>
                      <Text style={styles.summaryLabelNew}>
                        {t("totalSold")}
                      </Text>
                      <Text style={styles.summaryValuePrimary}>
                        ₹{formatAmount(totalSoldAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.summaryDivider} />

                  {/* Row 2 */}
                  {summaryFilter === t("all") && (
                    <>
                      <View style={styles.summaryRowNew}>
                        <View style={styles.summaryBlock}>
                          <Text style={styles.summaryLabelNew}>
                            {t("yourMoney")}
                          </Text>
                          <Text
                            style={[
                              styles.summaryValueSecondary,
                              {
                                color:
                                  leftOver < 0
                                    ? "#DC2626"
                                    : leftOver > 0
                                      ? "#16A34A"
                                      : "#000000",
                              },
                            ]}
                          >
                            ₹{formatAmount(leftOver)}
                          </Text>
                        </View>

                        <View style={styles.summaryBlock}>
                          <Text style={styles.summaryLabelNew}>
                            {t("yourInvestment")}
                          </Text>
                          <Text
                            style={[
                              styles.summaryValueSecondary,
                              { color: "#2563eb" },
                            ]}
                          >
                            ₹{formatAmount(yourInvestment)}
                          </Text>
                        </View>
                      </View>
                    </>
                  )}
                </TouchableOpacity>

                {/* 🔹 SUPPLIERS */}
                {suppliers.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        marginBottom: 10,
                        color: "#000",
                      }}
                    >
                      Suppliers
                    </Text>
                    {suppliers.map((s) => renderSupplierCard(s))}
                  </View>
                )}

                {/* 🔹 FILTER SECTION */}
                <View
                  style={{
                    marginBottom: 12,
                    zIndex: 2000,
                    elevation: 2000,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600" }}>
                      {currentLabel}
                    </Text>

                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          generateBusinessStatementPDF({
                            businessName: safeBusinessName,
                            downloadedBy: userName || "Unknown",
                            transactions: filteredInvestments,
                          })
                        }
                        style={{ marginRight: 12 }}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={24}
                          color="#DC2626"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setOpen((prev) => !prev)}
                      >
                        <Ionicons
                          name={open ? "filter-circle" : "filter"}
                          size={24}
                          color="#333"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            }
            contentContainerStyle={{
              paddingBottom: 180,
            }}
            onEndReached={loadMoreInvestments}
            onEndReachedThreshold={0.4}
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInvestments(0, true);
            }}
            ListFooterComponent={
              loadingInvestments ? (
                <ActivityIndicator size="small" color="#4f93ff" />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.noDataContainer}>
                <Image
                  source={require("../assets/stickers/no-transaction.png")}
                  style={styles.sticker}
                  resizeMode="contain"
                />
                <Text style={styles.noDataText}>No Transaction's found</Text>
              </View>
            }
            removeClippedSubviews={false}
          />
          <View style={styles.fabContainer}>
            {/* 📷 Upload Button */}
            <TouchableOpacity
              style={[
                styles.fab,
                { marginBottom: 12, backgroundColor: "#28a745" },
              ]}
              onPress={() => setPickerSheetVisible(true)}
            >
              <Ionicons name="camera" size={26} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.fab}
              onPress={() => {
                router.push({
                  pathname: "/AddTransactionScreen",
                  params: {
                    businessId: safeBusinessId,
                    businessName: safeBusinessName,
                    cropDetails: JSON.stringify(cropDetails),
                  },
                });
              }}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Footer Buttons */}
          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity
              style={styles.bottomButtonIcon}
              onPress={() => router.back()}
            >
              <Ionicons name="home" size={28} color="#4f93ff" />
              <Text style={styles.bottomButtonText}>{t("home")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bottomButtonIcon}
              onPress={() =>
                router.push({
                  pathname: "/businessNews",
                  params: {
                    businessId: safeBusinessId,
                    businessName: safeBusinessName,
                    cropId: cropDetails?.id,
                  },
                })
              }
            >
              <Ionicons name="newspaper" size={28} color="#4f93ff" />
              <Text style={styles.bottomButtonText}>{t("news")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButtonIcon}
              onPress={() =>
                router.push({
                  pathname: "/inventoryScreen",
                  params: {
                    businessId: safeBusinessId,
                    businessName: safeBusinessName,
                  },
                })
              }
              //onPress={() => alert("Inventory Feature coming soon")}
            >
              <Ionicons name="cube" size={28} color="#4f93ff" />
              <Text style={styles.bottomButtonText}>{t("inventory")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButtonIcon}
              //onPress={() => alert("History Feature coming soon")}
              onPress={() =>
                router.push({
                  pathname: "/ChangeHistoryScreen",
                  params: {
                    businessId,
                    businessName,
                  },
                })
              }
            >
              <Ionicons name="time" size={28} color="#4f93ff" />
              <Text style={styles.bottomButtonText}>{t("history")}</Text>
            </TouchableOpacity>
          </View>
          <ImagePreviewModal
            visible={imageModalVisible}
            images={images}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            onClose={() => setImageModalVisible(false)}
            onAddMore={() => {
              setImageModalVisible(false); // 👈 close preview first

              setTimeout(() => {
                setPickerSheetVisible(true); // 👈 open picker after
              }, 150);
            }}
            onSend={async () => {
              try {
                console.log("DATA →", {
                  businessId,

                  caption,
                  images: images.map((i) => i.uri),
                });
                await uploadImages();
                await fetchImageTransactions(); // refresh first
                setImages([]);
                setImageModalVisible(false);
                Alert.alert("Success", "Uploaded successfully ✅");
              } catch (e) {
                Alert.alert("Error", "Upload failed ❌");
              }
            }}
            setImages={setImages}
            businessName={safeBusinessName}
            caption={caption}
            setCaption={setCaption}
          />
          {showAuditPopup && (
            <InvestmentAudit
              businessId={String(businessId || "")}
              businessName={String(businessName || "")}
              visible={showAuditPopup}
              onClose={() => setShowAuditPopup(false)}
            />
          )}

          <ImagePickerModal
            visible={pickerSheetVisible}
            onClose={() => setPickerSheetVisible(false)}
            onCamera={handleCamera}
            onGallery={handleGallery}
          />
          {/* EXISTING */}
          {calendarVisible && (
            <View style={styles.popupOverlay}>
              <View style={[styles.popupContent, { padding: 10 }]}>
                <Text
                  style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}
                >
                  Select Date Range
                </Text>

                <Calendar
                  markingType="period"
                  onDayPress={(day: DateData) => {
                    if (selectingStart) {
                      setCustomStartDate(day.dateString);
                      setCustomEndDate(null);
                      setSelectingStart(false);
                    } else {
                      if (customStartDate && day.dateString < customStartDate) {
                        Alert.alert("End date must be after start date");
                        return;
                      }
                      setCustomEndDate(day.dateString);
                    }
                  }}
                  markedDates={{
                    ...(customStartDate && {
                      [customStartDate]: {
                        startingDay: true,
                        color: "#2563eb",
                        textColor: "#fff",
                      },
                    }),
                    ...(customEndDate && {
                      [customEndDate]: {
                        endingDay: true,
                        color: "#2563eb",
                        textColor: "#fff",
                      },
                    }),
                  }}
                />

                <View style={{ flexDirection: "row", marginTop: 12 }}>
                  <TouchableOpacity
                    style={styles.moveBtn}
                    onPress={() => {
                      if (!customStartDate) {
                        Alert.alert("Please select a date");
                        return;
                      }

                      const finalEndDate = customEndDate || customStartDate;

                      setCalendarVisible(false);
                      setSummaryFilter("SELECT DATES");

                      fetchSummaryByDateRange(customStartDate, finalEndDate);
                    }}
                  >
                    <Text style={styles.buttonText}>Apply</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setCalendarVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {confirmRestart && confirmRestart.length > 0 && (
            <View style={styles.popupOverlay}>
              <View style={styles.popupContent}>
                <Text style={styles.popupTitle}>
                  Do you really want to restart crop?{"\n"}Leftover money exists
                  for some partners.
                </Text>

                <View style={styles.leftoverList}>
                  {confirmRestart.map((p, idx) => (
                    <View key={idx} style={styles.leftoverItem}>
                      <Text style={styles.partnerName}>
                        {String(p.partnerName)}
                      </Text>
                      <Text style={styles.partnerAmount}>
                        ₹{formatAmount(p.leftOver)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.popupButtons}>
                  <TouchableOpacity
                    style={styles.moveBtn}
                    onPress={handleRestartCrop}
                  >
                    <Text style={styles.buttonText}>Move</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.withdrawBtn}
                    onPress={handleWithdrawFromPopup}
                  >
                    <Text style={styles.buttonText}>Withdraw</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setConfirmRestart([])}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

// Existing styles + new styles for header & bottom buttons + investment cards
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
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 40, justifyContent: "center", alignItems: "flex-end" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  // -------- Business Name --------
  businessName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 12,
    color: "#000",
  },
  businessSummary: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "left",
    marginVertical: 5,
    color: "#000",
  },

  // -------- Summary Row --------
  /*   summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  }, */
  summaryInfo: { flex: 1 },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  /*   summaryLabel: { color: "#555" },
  summaryValue: { color: "#222", fontWeight: "700" }, */
  summaryCard: {
    backgroundColor: "#a5c4f5ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  summaryCardExpanded: {
    // tiny visual difference when expanded
    borderColor: "#e6f0ff",
    borderWidth: 1,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    paddingHorizontal: 6,
  },

  summaryLabelSmall: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  summaryValueLarge: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryVertical: {
    flexDirection: "column",
    gap: 6,
  },
  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },

  // -------- Investment Card styles (new) --------
  investmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  imageThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: "#4f93ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  invRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  invLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  invValue: { color: "#111827", fontSize: 13, fontWeight: "700" },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createdAtText: { color: "#9ca3af", fontSize: 12 },
  viewMore: { color: "#4f93ff", fontWeight: "700" },

  // -------- Buttons --------
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginHorizontal: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  addBtn: { backgroundColor: "#4f93ff" },
  withdrawBtn: { backgroundColor: "#f44336" },
  soldBtn: { backgroundColor: "#ff9900" },
  invBtn: { backgroundColor: "#4f93ff" },
  restartBtn: { backgroundColor: "#f44336" },
  auditBtn: { backgroundColor: "#999a9c" },
  buttonText: { color: "#fff", fontWeight: "500", fontSize: 13 },

  // -------- Popup --------
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  popupContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  leftoverList: { marginBottom: 20 },
  leftoverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  partnerName: { fontSize: 16, fontWeight: "500", color: "#444" },
  partnerAmount: { fontSize: 16, fontWeight: "700", color: "#222" },
  popupButtons: { flexDirection: "row", justifyContent: "space-between" },
  moveBtn: {
    flex: 1,
    backgroundColor: "#4f93ff",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#999a9c",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },

  // -------- Floating Action Button --------
  fabContainer: {
    position: "absolute",
    bottom: 110, // ⬆️ lifted to sit nicely above bottom bar
    right: 25,
    zIndex: 1000,
    alignItems: "flex-end",
  },

  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  fabOptions: {
    marginBottom: 14,
    alignItems: "flex-end",
  },

  fabOption: {
    width: 150,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginBottom: 12,
    backgroundColor: "#4F93FF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  fabOptionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },

  // -------- Bottom Buttons --------
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: 5,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0, // ⬅️ lifts bar a bit upward
    left: 0,
    right: 0,
    elevation: 10, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },

  bottomButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  bottomButtonText: {
    fontSize: 13,
    color: "#4f93ff",
    marginTop: 2,
    textAlign: "center",
  },
  cardContainer: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  sticker: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
  newCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  newTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  caption: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    paddingBottom: 10,
    color: "#111",
    marginRight: 10,
  },
  newDescription: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginRight: 10,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  typeBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  newSecondRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  partnerNameText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },

  splitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  investedLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },

  investedValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  amountLabel: {
    fontSize: 13,
    color: "#6B7280",
  },

  amountValue: {
    fontSize: 14,
    fontWeight: "600",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  footerLeft: {
    fontSize: 12,
    color: "#6B7280",
  },

  footerRight: {
    fontSize: 12,
    color: "#6B7280",
  },

  summaryCardNew: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },

    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },

  summaryRowNew: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  summaryBlock: {
    flex: 1,
  },

  summaryLabelNew: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },

  summaryValuePrimary: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },

  summaryValueSecondary: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 2,
  },

  summaryDropdownBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
    elevation: 4,
    zIndex: 999,
  },

  summaryDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  summaryDropdownText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterOverlay: {
    position: "absolute",
    top: 200, // adjust if needed
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 9999,
  },

  filterBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  imageCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 14,
    elevation: 2,
  },

  imageCaption: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },

  addBtnImage: {
    marginTop: 10,
    alignSelf: "flex-end",
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 20,
  },
  imageThumbNew: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
  },

  addImageBtn: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },

  fillBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#7c3aed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },

  fillBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
