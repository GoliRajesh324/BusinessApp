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
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";

import BASE_URL from "../src/config/config";
import InvestmentTable from "./InvestmentTable";
import AddInvestmentPopup from "./addInvestmentPopup";
import WithdrawAmountPopup from "./WithdrawAmountPopup";
import SoldAmountPopup from "./SoldAmountPopup";
//import styles from "./BusinessDetailStyles";

export default function BusinessDetail() {
  const { businessId, businessName } = useLocalSearchParams<{
    businessId?: string;
    businessName?: string;
  }>();

  console.log("➡️ Params received:", businessId, businessName);

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

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [showActions, setShowActions] = useState(false); // ✅ toggle state

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");

      console.log("📌 Loaded userId:", u);
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

  const handlePopupSave = async ({ investmentData, images }: any) => {
    console.log("➡️ Popup images called with:",  images);
    try {
        console.log("➡️ Saving investment data:", investmentData, images);
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
    <ScrollView style={styles.container}>
      {/* Business Name */}
      <Text style={styles.businessName}>{businessName}</Text>
     {showActions && (
        <View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.addBtn]}
          onPress={() => setSoldPopup(true)}
        >
          <Text style={styles.buttonText}>Investments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.restartBtn]}
          onPress={() => setShowPopup(true)}
        >
          <Text style={styles.buttonText}>Restart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.auditBtn]}
          onPress={() => setWithdrawPopup(true)}
        >
          <Text style={styles.buttonText}>View Audit</Text>
        </TouchableOpacity>
      </View>
      </View>
      )}
  {/* Summary Row with Toggle */}

  <View style={styles.summaryRow}>
    {/* Summary Info */}
    <View style={styles.summaryInfo}>
      <Text style={styles.summaryText}>
        <Text style={styles.summaryLabel}>Crop: </Text>
        <Text style={styles.summaryValue}>{cropDetails?.cropNumber}</Text>
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

      {/* Action Buttons - Only show when toggle is ON */}
      {showActions && (
        <View>
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
          <Text style={styles.buttonText}>+ Add Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.withdrawBtn]}
          onPress={() => setWithdrawPopup(true)}
        >
          <Text style={styles.buttonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>
        </View>
      )}

      {/* Popups */}
      {showPopup && (
        <AddInvestmentPopup
          partners={partners}
          cropDetails={cropDetails}
          visible={showPopup} // pass visible prop
          onClose={() => setShowPopup(false)}
          onSave={handlePopupSave}
        />
      )}
      {withdrawPopup && (
        <WithdrawAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          investmentDetails={investmentDetails}
          visible={withdrawPopup} // use visible
          onClose={() => setWithdrawPopup(false)}
          onSave={handlePopupSave}
        />
      )}
      {soldPopup && (
        <SoldAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          onClose={() => setSoldPopup(false)}
          onSave={handlePopupSave}
          visible={soldPopup} // pass visible prop
        />
      )}
    </ScrollView>
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


});
