import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { useRoute } from "@react-navigation/native";

import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";

import BASE_URL from "../src/config/config";
import InvestmentTable from "./InvestmentTable";
import AddInvestmentPopup from "./addInvestmentPopup";
import WithdrawAmountPopup from "./WithdrawAmountPopup";
import SoldAmountPopup from "./SoldAmountPopup";
import InvestmentAudit from "./components/InvestmentAudit";
//import styles from "./BusinessDetailStyles";

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

  const [showActions, setShowActions] = useState(false); // ✅ toggle state

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
return (
  <View style={{ flex: 1, position: "relative" }}>
    <ScrollView style={styles.container}>
      {/* Business Name */}
      <Text style={styles.businessName}>{String(businessName || "")}</Text>

      {/* Toggle-dependent actions */}
      {showActions && (
        <View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.invBtn]}
              onPress={() =>
                router.push({
                  pathname: "/crop-details/[businessId]",
                  params: {
                    businessId: String(businessId || ""),
                    businessName: String(businessName || ""),
                  },
                })
              }
            >
              <Text style={styles.buttonText}>Investments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.auditBtn]}
              onPress={() => setShowAuditPopup(true)}
            >
              <Text style={styles.buttonText}>View Audit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Crop: </Text>
            <Text style={styles.summaryValue}>
              {String(cropDetails?.cropNumber || "-")}
            </Text>
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total Investment: </Text>
            <Text style={styles.summaryValue}>
              {formatAmount(totalInvestment)}
            </Text>
          </Text>

          <Text style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Total Sold: </Text>
            <Text style={styles.summaryValue}>
              {formatAmount(totalSoldAmount)}
            </Text>
          </Text>
        </View>

        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>
            {showActions ? "Normal" : "Show All"}
          </Text>
          <Switch
            value={showActions}
            onValueChange={setShowActions}
            thumbColor={showActions ? "#ccc" : "#ccc"}
          />
        </View>
      </View>

      {/* Investment Table */}
      <InvestmentTable investmentDetails={investmentDetails} />

      {/* Action Buttons */}
      {/* {showActions && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.soldBtn]}
            onPress={() => setSoldPopup(true)}
          >
            <Text style={styles.buttonText}>Sold</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.addBtn]}
            onPress={() => setShowPopup(true)}
          >
            <Text style={styles.buttonText}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.withdrawBtn]}
            onPress={() => setWithdrawPopup(true)}
          >
            <Text style={styles.buttonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      )} */}

      {/* Popups */}
      {showPopup && (
        <AddInvestmentPopup
          partners={partners}
          cropDetails={cropDetails}
          visible={showPopup}
          onClose={() => setShowPopup(false)}
          onSave={handlePopupSave}
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
          onSave={handlePopupSave}
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

      {/* Confirm Restart */}
      {confirmRestart && confirmRestart.length > 0 && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>
              Do you really want to restart crop?{"\n"}
              Leftover money exists for some partners.
            </Text>

            <View style={styles.leftoverList}>
              {confirmRestart.map((p, idx) => (
                <View key={idx} style={styles.leftoverItem}>
                  <Text style={styles.partnerName}>{String(p.partnerName)}</Text>
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
  </View>
);

}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  businessName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  /*  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  }, */
  summaryContainer: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  /* summaryText: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
  summaryLabel: {
    color: "#666",
    fontWeight: "500",
  },
  summaryValue: {
    color: "#111",
    fontWeight: "700",
  }, */
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
  buttonText: { color: "#fff", fontWeight: "400", fontSize: 11 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  summaryLabel: {
    color: "#777", // lighter
  },

  summaryValue: {
    color: "#222", // darker
    fontWeight: "bold",
  },

  toggleContainer: {
    alignItems: "center",
    marginLeft: 12,
  },
  toggleLabel: {
    fontSize: 8,
    color: "#555",
    marginBottom: 4,
  },
  // Overlay behind the popup
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

  // Popup container
  popupContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Popup title text
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },

  // Leftover balances container
  leftoverList: {
    marginBottom: 20,
  },

  // Each partner row
  leftoverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  // Partner name
  partnerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#444",
  },

  // Partner amount
  partnerAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  // Buttons container
  popupButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  // Move button
  moveBtn: {
    flex: 1,
    backgroundColor: "#4f93ff",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },

  // Cancel button
  cancelBtn: {
    flex: 1,
    backgroundColor: "#999a9c",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
fabContainer: {
  position: "absolute",
  bottom: 20,
  right: 20,
  zIndex: 1000,
  alignItems: "flex-end", // ensures options align to right
},


fab: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: "#2196F3",
  justifyContent: "center",
  alignItems: "center",
  elevation: 5,
},

fabText: {
  fontSize: 28,
  color: "#fff",
  fontWeight: "bold",
},

fabOptions: {
  marginBottom: 10,
  alignItems: "flex-end",
},


fabOption: {
  width: 150,             // ✅ same width for all
  height: 45,             // ✅ same height for all
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 25,
  marginBottom: 12,
},

fabOptionText: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 14,
},


});
