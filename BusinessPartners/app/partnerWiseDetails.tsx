import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import BASE_URL from "../src/config/config";

export default function PartnerWiseDetails() {
  const router = useRouter();
  const { businessId, businessName } = useLocalSearchParams();
  const [partners, setPartners] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]); // <-- new
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalSoldAmount, setTotalSoldAmount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!token || !businessId) return;

    const fetchPartners = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/business/${businessId}/partners`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const text = await res.text();
        if (!res.ok || !text) return;
        const data = JSON.parse(text);

        if (data?.partners) setPartners(data.partners);
      } catch (err) {
        console.log("❌ Error fetching partner details:", err);
      }
    };

    fetchPartners();
  }, [token, businessId]);

  // Fetch business info
  useEffect(() => {
    if (!token || !businessId) return;
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const text = await response.text();
        if (!response.ok || !text) return;
        const data = JSON.parse(text);

        setTotalInvestment(data.totalInvestment || 0);
        setTotalSoldAmount(data.totalSoldAmount || 0);
        setInvestmentDetails(data.investmentDetails || []);

        /*  if (data.crop) {
          setCropDetails({
            id: data.crop.id,
            cropNumber: data.crop.cropNumber,
          });
        } */
      } catch (err) {
        console.log("❌ Error fetching business info:", err);
      }
    };

    fetchBusinessInfo();
  }, [businessId, token]);

  const formatAmount = (v: any) =>
    Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerLeft}
        >
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Wise Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingVertical: 16,
          paddingBottom: 150,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔵 Partner Share Pie Chart */}
        {partners.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Partner Share Distribution</Text>

            <View style={styles.pieContainer}>
              <PieChart
                data={partners.map((p, index) => ({
                  value: Number(p.share || 0),
                  text: `${p.share}%`,
                  color: [
                    "#4f93ff",
                    "#22c55e",
                    "#f97316",
                    "#dc2626",
                    "#a855f7",
                    "#14b8a6",
                    "#2563EB",
                    "#DC2626",
                    "#16A34A",
                    "#9333EA",
                    "#0EA5E9",
                    "#E11D48",
                    "#F59E0B",
                    "#6366F1",
                    "#EC4899",
                  ][index % 15],
                }))}
                radius={110}
                showText
                textSize={12}
                textColor="#000"
                focusOnPress
                strokeWidth={2}
                strokeColor="#fff"
              />
            </View>

            {/* 🔹 Color Legend Below Pie (2 Columns) */}
            <View style={styles.legendContainer}>
              {partners.map((p, index) => {
                const colors = [
                  "#4f93ff",
                  "#22c55e",
                  "#f97316",
                  "#dc2626",
                  "#a855f7",
                  "#14b8a6",
                  "#2563EB",
                  "#DC2626",
                  "#16A34A",
                  "#9333EA",
                  "#0EA5E9",
                  "#E11D48",
                  "#F59E0B",
                  "#6366F1",
                  "#EC4899",
                ];

                return (
                  <View key={index} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendColor,
                        { backgroundColor: colors[index % 15] },
                      ]}
                    />
                    <Text style={styles.legendText} numberOfLines={1}>
                      {p.username} ({p.share}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
        {investmentDetails.map((inv, index) => (
          <View key={index} style={styles.partnerCard}>
            {/* Header */}
            <View style={styles.partnerCardHeader}>
              <Text style={styles.partnerCardName}>
                {inv?.partner?.username?.toUpperCase()}
              </Text>
              <Text style={styles.partnerCardShare}>
                Share: {inv.partner.share}%
              </Text>
            </View>

            {/* Grid */}
            <View style={styles.partnerGrid}>
              {/* Available Money */}
              <View style={styles.partnerGridItem}>
                <Text style={styles.gridLabel}>Available Money</Text>
                <Text
                  style={[
                    styles.gridValue,
                    inv.leftOver < 0
                      ? { color: "#DC2626" } // red
                      : inv.leftOver > 0
                        ? { color: "#16A34A" } // green
                        : { color: "#000" }, // zero
                  ]}
                >
                  ₹{formatAmount(inv.leftOver)}
                </Text>
              </View>

              {/* Withdrawn */}
              <View style={styles.partnerGridItem}>
                <Text style={styles.gridLabel}>Withdrawn</Text>
                <Text style={styles.gridValue}>
                  ₹{formatAmount(inv.withdrawn)}
                </Text>
              </View>

              {/* Actual Investment */}
              <View style={styles.partnerGridItem}>
                <Text style={styles.gridLabel}>Actual Investment</Text>
                <Text style={styles.gridValue}>
                  ₹{formatAmount(inv.actualInvestment)}
                </Text>
              </View>

              {/* You Invested */}
              <View style={styles.partnerGridItem}>
                <Text style={styles.gridLabel}>You Invested</Text>
                <Text style={styles.gridValue}>
                  ₹{formatAmount(inv.yourInvestment)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f8fc" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  headerLeft: { width: 40, alignItems: "flex-start" },
  headerRight: { width: 40 },

  scrollContent: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  partnerName: { fontSize: 17, fontWeight: "700", color: "#111" },
  smallShare: { fontSize: 12, color: "#666" },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "48%",
    marginVertical: 4,
    backgroundColor: "#f1f5ff",
    borderRadius: 8,
    padding: 8,
  },
  label: { fontSize: 11, color: "#555" },
  value: { fontSize: 14, fontWeight: "600", color: "#222" },

  partnerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

    borderLeftWidth: 6,
    borderLeftColor: "#4f93ff",
  },

  partnerCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  partnerCardName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },

  partnerCardShare: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },

  partnerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  partnerGridItem: {
    width: "48%",
    backgroundColor: "#f8faff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  gridLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 4,
  },

  gridValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  chartTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000", // bold black
    textAlign: "center",
    marginBottom: 16,
  },

  pieContainer: {
    alignItems: "center", // centers horizontally
    justifyContent: "center",
  },
  legendContainer: {
    marginTop: 18,
    flexDirection: "row",
    flexWrap: "wrap", // 🔥 allows wrapping
    justifyContent: "space-between",
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%", // 🔥 2 columns
    marginBottom: 12,
  },

  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },

  legendText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111",
    flexShrink: 1, // 🔥 prevents overflow
  },
});
