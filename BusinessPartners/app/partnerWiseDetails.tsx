import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../src/config/config";

export default function PartnerWiseDetails() {
  const router = useRouter();
  const { businessId, businessName } = useLocalSearchParams();
  const [partners, setPartners] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const text = await res.text();
        if (!res.ok || !text) return;
        const data = JSON.parse(text);

        if (data?.partners) setPartners(data.partners);
      } catch (err) {
        console.error("❌ Error fetching partner details:", err);
      }
    };

    fetchPartners();
  }, [token, businessId]);

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {partners.map((p, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.partnerName}>{p.username}</Text>
              <Text style={styles.smallShare}>Share: {p.share}%</Text>
            </View>

            <View style={styles.rowWrap}>
              <View style={styles.item}>
                <Text style={styles.label}>Available Money</Text>
                <Text style={styles.value}>₹{formatAmount(p.leftOver)}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.label}>Withdrawn</Text>
                <Text style={styles.value}>₹{formatAmount(p.withdrawn)}</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.label}>Actual Investment</Text>
                <Text style={styles.value}>
                  ₹{formatAmount(p.actualInvestment)}
                </Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.label}>You Invested</Text>
                <Text style={styles.value}>
                  ₹{formatAmount(p.yourInvestment)}
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
    height:
      Platform.OS === "android" ? 80 + (StatusBar.currentHeight || 0) : 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    elevation: 3,
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
    elevation: 2,
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
});
