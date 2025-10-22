import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BASE_URL from "../src/config/config";

export default function InvestmentDetail() {
  const { investmentGroupId } = useLocalSearchParams<{ investmentGroupId?: string }>();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("token").then(setToken);
  }, []);

  useEffect(() => {
    if (!token || !investmentGroupId) return;
    fetchGroupInvestments();
  }, [token, investmentGroupId]);

  const fetchGroupInvestments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/investment/all-group-investments/${investmentGroupId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch group investments");
      const data = await res.json();
      setInvestments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to fetch group investments");
    }
  };

  const formatAmount = (v: any) =>
    Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
  <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => alert("Edit feature coming soon")}
            style={styles.iconBtn}
          >
            <MaterialIcons name="edit" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => alert("Delete feature coming soon")}
            style={styles.iconBtn}
          >
            <MaterialIcons name="delete" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {investments.length === 0 ? (
          <Text>No investments found for this group</Text>
        ) : (
          investments.map((inv, idx) => (
            <View
              key={idx}
              style={{
                padding: 12,
                marginBottom: 12,
                borderRadius: 10,
                backgroundColor: "#f0f4f7",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 14 }}>
                {inv.description ?? inv.comments ?? "-"}
              </Text>
              <Text>Partner: {inv.partnerName ?? inv.supplierName ?? "-"}</Text>
              <Text>Total Amount: ₹{formatAmount(inv.totalAmount ?? inv.invested)}</Text>
              <Text>Invested: ₹{formatAmount(inv.invested ?? 0)}</Text>
              <Text>Split Type: {inv.splitType ?? "-"}</Text>
              <Text>Created At: {formatDateTime(inv.createdAt)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
    elevation: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  headerIcons: { flexDirection: "row" },

  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 40, justifyContent: "center", alignItems: "flex-end" },



  iconBtn: { marginLeft: 16 },
  content: { padding: 16 },
  detailCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
    marginBottom: 4,
  },
});
