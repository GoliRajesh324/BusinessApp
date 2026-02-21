import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

import { Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

import { generateBusinessStatementPDF } from "@/src/utils/BusinessStatementPDF";
import { useFocusEffect } from "@react-navigation/native";
import { Calendar, DateData } from "react-native-calendars";
import InvestmentAudit from "../src/components/InvestmentAudit";
import BASE_URL from "../src/config/config";
import AddInvestmentPopup from "./addInvestmentPopup";

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

  const [summaryFilter, setSummaryFilter] = useState("ALL");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [selectingStart, setSelectingStart] = useState(true);

  const [summaryDropdownOpen, setSummaryDropdownOpen] = useState(false);

  const summaryOptions = [
    "ALL",
    "TODAY",
    "YESTERDAY",
    "THIS MONTH",
    "LAST MONTH",
    "SELECT DATES",
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

  const [items, setItems] = useState([
    { label: "Your Transactions", value: "byLoggedInUser" },
    { label: "Your Investments", value: "byInvestment" },
    { label: "Your Withdraws", value: "byWithdraw" },
    { label: "Your Sold", value: "bySold" },
    { label: "Everyone's Transactions", value: "allInvestments" },
  ]);

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
      console.log("📌 Loaded username:", uName);
      setToken(t);
      setUserId(u);
    };
    loadData();
  }, []);

  /*   useEffect(() => {
    AsyncStorage.getItem("token").then(setToken);
  }, []); */

  // 🏷 Get label text dynamically based on selected value
  const currentLabel =
    items.find((item) => item.value === selectedFilter)?.label ||
    "Select Filter";

  // enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  /*   useEffect(() => {
    fetchBusinessDetails();
  }, [safeBusinessId, token, userName]);
 */
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

      // ✅ type accumulator and final cast
      const grouped: Supplier[] = Object.values(
        data.reduce((acc: Record<number, Supplier>, item: any) => {
          if (!acc[item.supplierId]) {
            acc[item.supplierId] = {
              supplierId: item.supplierId,
              supplierName: item.supplierName,
              pendingAmount: item.pendingAmount || 0,
              partners: [],
            };
          }

          acc[item.supplierId].partners.push({
            partnerId: item.partnerId,
            username: item.partnerName,
            paidAmount: item.amountPaid || 0,
            pendingAmount: item.amountPending || 0,
          });

          return acc;
        }, {}),
      );

      setSuppliers(grouped); // ✅ now works
    } catch (err) {
      console.log(err);
      alert("Error fetching suppliers");
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
      console.log(`📅 Fetching summary for range: ${startDate} to ${endDate}`);

      const response = await fetch(
        `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id-and-date?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();

      setTotalInvestment(data?.totalInvestment || 0);
      setTotalSoldAmount(data?.totalSoldAmount || 0);
      setYourInvestment(0);
      setLeftOver(0);
    } catch (err) {
      console.log("❌ Error fetching filtered summary:", err);
    }
  };

  useEffect(() => {
    if (!token || !safeBusinessId) return;

    if (summaryFilter === "ALL") {
      console.log(
        "🔄 Summary filter ALL selected → fetching overall business details",
      );
      fetchBusinessDetails(); // existing method
      return;
    }
    console.log(
      `🔄 Summary filter ${summaryFilter} selected → fetching filtered summary`,
    );
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
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const text = await response.text();
        if (!response.ok || !text) return;
        const data = JSON.parse(text);

        setTotalInvestment(data.totalInvestment || 0);
        setTotalSoldAmount(data.totalSoldAmount || 0);
        setInvestmentDetails(data.investmentDetails || []);

        if (data.crop) {
          setCropDetails({
            id: data.crop.id,
            cropNumber: data.crop.cropNumber,
          });
        }
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
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const text = await response.text();
        if (!response.ok || !text) return;
        const data = JSON.parse(text);

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
        console.log("❌ Error fetching partners:", err);
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

  // fetch once
  useEffect(() => {
    if (safeBusinessId && token) fetchInvestments();
    //businessDetails();
  }, [safeBusinessId, token]);

  const fetchInvestments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/investment/all-investments/${safeBusinessId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch investments");
      const data = await response.json();
      console.log("➡️ Fetched investments:", data);
      setAllInvestments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Error fetching investments");
    }
  };
  const fetchBusinessDetails = async () => {
    if (!token || !safeBusinessId) return;
    try {
      const response = await fetch(
        `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await response.json();

      // 🧮 Safely update top-level totals
      setTotalInvestment(data?.totalInvestment || 0);
      setTotalSoldAmount(data?.totalSoldAmount || 0);
      setInvestmentDetails(
        Array.isArray(data?.investmentDetails) ? data.investmentDetails : [],
      );
      setCropDetails(data?.crop || null);

      setInvestmentDetails(data.investmentDetails || []);
    } catch (err) {
      console.log("❌ Error fetching business details:", err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!token) return;

      fetchInvestments();
      fetchSuppliers();

      if (summaryFilter === "ALL") {
        fetchBusinessDetails();
      }
    }, [safeBusinessId, token, summaryFilter]),
  );

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
      router.push("/dashboard");
    } catch (err: any) {
      console.log("❌ Restart crop error:", err);
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
      <View
        key={supplier.supplierId}
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
      </View>
    );
  };

  const handlePopupSave = async ({ investmentData }: any) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/investment/add-investment`,
        investmentData,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const investmentGroupId = response?.data;
      console.log("➡️ Investment Group ID:", investmentGroupId);

      /* 
      const res = await fetch(
        `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setTotalInvestment(data.totalInvestment);
      setTotalSoldAmount(data.totalSoldAmount);
      setCropDetails(data.crop);
      setInvestmentDetails(data.investmentDetails);

      investmentDetails.forEach((item) => {
        const partner = item.partner; // partner object
        console.log("➡️ Your investment item:", item);
        if (partner.username === userName) {
          console.log("➡️ Your investment item:", item);
          setYourInvestment(item.yourInvestment);
          setLeftOver(item.leftOver);
        }
      }); */
      // refresh investments list
      await fetchBusinessDetails();
      fetchInvestments();
    } catch (error) {
      console.log(error);
    }
  };

  const handleBack = () => router.back();

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
        activeOpacity={0.9}
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
              <Text style={styles.investedLabel}>Invested</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(invested)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Investable</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(investable)}
                </Text>
              </View>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}

          {/* Sold Layout */}
          {type === "Sold" && (
            <>
              <Text style={styles.investedLabel}>Your Sold Amount</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(soldAmount)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Sold Amount</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}

          {/* Withdraw Layout */}
          {type === "Withdraw" && (
            <>
              <Text style={styles.investedLabel}>Your Withdrawal</Text>
              <Text style={styles.investedValue}>
                ₹{formatAmount(withdrawn)}
              </Text>

              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Total Withdrawal</Text>
                <Text style={styles.amountValue}>
                  ₹{formatAmount(totalAmount)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerLeft}>Created by: {createdBy}</Text>
          <Text style={styles.footerRight}>{formatDateTime(createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleSelect = (val: string) => {
    setSelectedFilter(val);
    setOpen(false); // ✅ closes the dropdown when selected
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{String(businessName || "")}</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => alert("Header actions comming soon")}
        >
          <Entypo name="dots-three-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 180,
          paddingHorizontal: 16,
          paddingTop: 16, // spacing from header
        }}
      >
        {/* Summary Card (tap to expand/collapse) */}
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
            <Text style={styles.summaryTitle}>Business Summary</Text>

            {/* 📌 ICON + DROPDOWN BUTTON */}
            <TouchableOpacity
              onPress={() => setSummaryDropdownOpen(!summaryDropdownOpen)}
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
                name={summaryDropdownOpen ? "chevron-up" : "chevron-down"}
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
                      { color: opt === summaryFilter ? "#2563eb" : "#000" },
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
              <Text style={styles.summaryLabelNew}>Total Investment</Text>
              <Text style={styles.summaryValuePrimary}>
                ₹{formatAmount(totalInvestment)}
              </Text>
            </View>

            <View style={styles.summaryBlock}>
              <Text style={styles.summaryLabelNew}>Total Sold</Text>
              <Text style={styles.summaryValuePrimary}>
                ₹{formatAmount(totalSoldAmount)}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.summaryDivider} />

          {/* Row 2 */}
          {summaryFilter === "ALL" && (
            <>
              <View style={styles.summaryRowNew}>
                <View style={styles.summaryBlock}>
                  <Text style={styles.summaryLabelNew}>Available Money</Text>
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
                  <Text style={styles.summaryLabelNew}>Your Investment</Text>
                  <Text
                    style={[styles.summaryValueSecondary, { color: "#2563eb" }]}
                  >
                    ₹{formatAmount(yourInvestment)}
                  </Text>
                </View>
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* SUPPLIER CONTRIBUTIONS SECTION */}
        {/* ✅ Suppliers Section */}
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

        {/* Expanded table area */}
        {/* {expanded && (
          <View style={[styles.tableContainer, { maxHeight: tableMaxHeight }]}>
            <ScrollView nestedScrollEnabled>
              <InvestmentTable investmentDetails={investmentDetails} />
            </ScrollView>
          </View>
        )} */}

        {/* --- FILTER SECTION --- */}
        <View style={{ marginVertical: 12, zIndex: 1000 }}>
          {/* 🔹 Row: Title + Icons */}
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

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* PDF Button */}
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

              {/* Filter Button */}
              <TouchableOpacity onPress={() => setOpen((prev) => !prev)}>
                <Ionicons
                  name={open ? "filter-circle" : "filter"}
                  size={24}
                  color="#333"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 🔹 Dropdown BELOW row (not inside row) */}
          {open && (
            <View style={{ marginTop: 8 }}>
              <DropDownPicker
                open={open}
                value={selectedFilter}
                items={items}
                setOpen={setOpen}
                setItems={setItems}
                setValue={(callback) => {
                  const value = callback(selectedFilter);
                  setSelectedFilter(value);
                }}
                placeholder="Select Filter"
                listMode="SCROLLVIEW"
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
          )}
        </View>

        {/* --- New section: list of investment cards --- */}
        {/* Investment Cards */}
        <View style={{ marginTop: 12 }}>
          {filteredInvestments.length === 0 ? (
            <View style={styles.noDataContainer}>
              <Image
                source={require("../assets/stickers/no-transaction.png")}
                style={styles.sticker}
                resizeMode="contain"
              />
              <Text style={styles.noDataText}>No Transaction's found</Text>
              <Text style={styles.noDataText}>
                Tap the “+ Add” button below to add Transaction
              </Text>
            </View>
          ) : (
            filteredInvestments.map((inv, idx) =>
              renderInvestmentCard(inv, idx),
            )
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {/*       <View style={styles.fabContainer}>
        {fabOpen && (
          <View style={styles.fabOptions}>
            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#ff9900" }]}
              onPress={() => {
                setSoldPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Sold</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#4f93ff" }]}
              onPress={() => {
                setShowPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#f44336" }]}
              onPress={() => {
                setWithdrawPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFabOpen(!fabOpen)}
        >
          <Text style={styles.fabText}>{fabOpen ? "×" : "+"}</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setShowPopup(true);
            setFabOpen(false);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Footer Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => router.push("/dashboard")}
        >
          <Ionicons name="home" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("Charts Feature coming soon")}
        >
          <Ionicons name="bar-chart" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Charts</Text>
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
          <Text style={styles.bottomButtonText}>Inventory</Text>
        </TouchableOpacity>

        {/*  <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("All Investments Feature coming soon")}
        >
          <Ionicons name="cash-outline" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Investments</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("History Feature coming soon")}
          /*   onPress={() => setShowAuditPopup(true)} */
        >
          <Ionicons name="time" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Popups */}
      {/* inside BusinessDetail */}

      {showPopup && (
        <AddInvestmentPopup
          visible={showPopup}
          businessId={String(businessId || "")}
          businessName={String(businessName || "")}
          partners={partners}
          cropDetails={cropDetails}
          onClose={() => setShowPopup(false)}
          onSave={(data) => {
            handlePopupSave(data);
            setShowPopup(false);
          }}
        />
      )}
      {/* 
      {withdrawPopup && (
        <WithdrawAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          investmentDetails={investmentDetails}
          visible={withdrawPopup}
          onClose={() => setWithdrawPopup(false)}
          onSave={handlePopupSave}
        />
      )}
      {soldPopup && (
        <SoldAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          visible={soldPopup}
          onClose={() => setSoldPopup(false)}
          onSave={(data) => {
            handlePopupSave(data);
            setSoldPopup(false);
          }}
        />
      )}
 */}
      {showAuditPopup && (
        <InvestmentAudit
          businessId={String(businessId || "")}
          businessName={String(businessName || "")}
          visible={showAuditPopup}
          onClose={() => setShowAuditPopup(false)}
        />
      )}

      {calendarVisible && (
        <View style={styles.popupOverlay}>
          <View style={[styles.popupContent, { padding: 10 }]}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 10 }}>
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
              Do you really want to restart crop?{"\n"}Leftover money exists for
              some partners.
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
    paddingBottom: 30, // safe area spacing
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
});
