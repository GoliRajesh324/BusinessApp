import React, { useEffect, useState } from "react";
import {
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { Entypo, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

import BASE_URL from "../src/config/config";
import InvestmentTable from "./InvestmentTable";
import SoldAmountPopup from "./SoldAmountPopup";
import WithdrawAmountPopup from "./WithdrawAmountPopup";
import AddInvestmentPopup from "./addInvestmentPopup";
import InvestmentAudit from "./components/InvestmentAudit";

export default function BusinessDetail() {
  const { businessId, businessName } = useLocalSearchParams<{
    businessId?: string;
    businessName?: string;
  }>();
  const router = useRouter();

  // //console.log("➡️ Params received:", businessId, businessName);

  // Ensure safe usage
  const safeBusinessId = businessId ? String(businessId) : "";
  const safeBusinessName = businessName ? String(businessName) : "";

  const [partners, setPartners] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [soldPopup, setSoldPopup] = useState(false);
  const [withdrawPopup, setWithdrawPopup] = useState(false);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalSoldAmount, setTotalSoldAmount] = useState(0);
  const [cropDetails, setCropDetails] = useState<any>(null);
  const [showAuditPopup, setShowAuditPopup] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState<
    { partnerName: string; leftOver: number }[]
  >([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);

  // enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const tableMaxHeight = Math.round(Dimensions.get("window").height * 0.55); // adjust as needed

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");

      //console.log("📌 Loaded userId:", u);
      setToken(t);
      setUserId(u);
    };
    loadData();
  }, []);

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

  // Fetch business info
  useEffect(() => {
    if (!token || !safeBusinessId) return;
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
          { headers: { Authorization: `Bearer ${token}` } }
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
        console.error("❌ Error fetching business info:", err);
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
          { headers: { Authorization: `Bearer ${token}` } }
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
            }))
          );
        }
      } catch (err) {
        console.error("❌ Error fetching partners:", err);
      }
    };

    fetchPartners();
  }, [safeBusinessId, token]);

  // --- Inside BusinessDetail component ---

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
        }
      );
      // Refresh and navigate
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Restart crop error:", err);
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

  const handlePopupSave = async ({ investmentData, images }: any) => {
    console.log("➡️ Popup images :", images);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/investment/add-investment`,
        investmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const investmentGroupId = response?.data;
      console.log("➡️ Investment Group ID:", investmentGroupId);
      if (images && images.length > 0) {
        for (let file of images) {
          const formData = new FormData();
          formData.append("file", file);
          await axios.post(
            `${BASE_URL}/api/investment-images/upload/${investmentGroupId}`,
            formData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }

      const res = await fetch(
        `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setTotalInvestment(data.totalInvestment);
      setTotalSoldAmount(data.totalSoldAmount);
      setCropDetails(data.crop);
      setInvestmentDetails(data.investmentDetails);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBack = () => router.back();

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
          activeOpacity={0.95}
          onPress={toggleExpanded}
          style={[styles.summaryCard, expanded && styles.summaryCardExpanded]}
        >
          <View style={styles.summaryVertical}>
            {/*  <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Crop :</Text>
              <Text style={styles.summaryValueLarge}>
                {String(cropDetails?.cropNumber ?? "-")}
              </Text>
            </View> */}

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Availabe Money :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(totalInvestment)}
              </Text>
            </View>

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>You Investment :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(totalInvestment)}
              </Text>
            </View>

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>You Sold :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(totalSoldAmount)}
              </Text>
            </View>

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>You Share :</Text>
              <Text style={styles.summaryValueLarge}>
                75%
              </Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Total Investment :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(totalInvestment)}
              </Text>
            </View>

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Total Sold :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(totalSoldAmount)}
              </Text>
            </View>

            <View style={{ alignItems: "center", marginTop: 4 }}>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={22}
                color="#666"
              />
            </View>
          </View>

          {/* optional expanded summary area (additional details) */}
          {expanded && (
            <View style={styles.expandedContent}>
              {/* you can show more summary details here if needed */}
              <Text style={{ color: "#666" }}>
                Tap the card to collapse. Scroll the table below for more
                details.
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Expanded table area */}
        {expanded && (
          <View style={[styles.tableContainer, { maxHeight: tableMaxHeight }]}>
            {/* nested scroll enabled so table can scroll inside main scroll */}
            <ScrollView nestedScrollEnabled>
              <InvestmentTable investmentDetails={investmentDetails} />
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
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
      </View>
      {/* Bottom Footer Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("Charts Feature coming soon")}
        >
          <MaterialIcons name="bar-chart" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Charts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("Inventory Feature coming soon")}
        >
          <Ionicons name="cube-outline" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("All Investments Feature coming soon")}
        >
          <Ionicons name="cash-outline" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Investments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => setShowAuditPopup(true)}
        >
          <MaterialIcons name="history" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Popups */}
      {/* inside BusinessDetail */}

      {showPopup && (
        <AddInvestmentPopup
          visible={showPopup}
          partners={partners}
          cropDetails={cropDetails}
          onClose={() => setShowPopup(false)}
          onSave={(data) => {
            handlePopupSave(data);
            setShowPopup(false);
          }}
        />
      )}

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

      {showAuditPopup && (
        <InvestmentAudit
          businessId={String(businessId || "")}
          businessName={String(businessName || "")}
          visible={showAuditPopup}
          onClose={() => setShowAuditPopup(false)}
        />
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

// Existing styles + new styles for header & bottom buttons
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // page background
  },

  // -------- Header --------
  header: {
    height:
      Platform.OS === "android" ? 80 + (StatusBar.currentHeight || 0) : 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 100,
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
    backgroundColor: "#fff",
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
    bottom: Platform.OS === "ios" ? 110 : 90, // ⬆️ lifted to sit nicely above bottom bar
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
    paddingBottom: Platform.OS === "ios" ? 30 : 16, // safe area spacing
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: Platform.OS === "ios" ? 10 : 0, // ⬅️ lifts bar a bit upward
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
});
