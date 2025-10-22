import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BASE_URL from "../src/config/config";
import EditInvestmentPopup from "./EditInvestmentPopup";

export default function InvestmentDetail() {
  const { investmentGroupId } = useLocalSearchParams<{ investmentGroupId?: string }>();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [editVisible, setEditVisible] = useState(false);

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

  // Prepare group-level investment data for EditInvestmentPopup
  const getGroupInvestmentData = () => {
    if (!investmentGroupId) throw new Error("Invalid groupId");
    return {
      groupId: investmentGroupId,
      totalAmount: investments.reduce((sum, inv) => sum + (inv.totalAmount ?? inv.invested ?? 0), 0),
      description: investments[0]?.description ?? "",
      partners: investments.map((inv) => ({
        id: inv.partnerId,
        username: inv.partnerName,
        share: inv.share, // optional
      })),
      images: investments[0]?.images ?? [],
      transactionType: investments[0]?.transactionType ?? "Investment",
    };
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transaction Details</Text>
        <View style={styles.headerIcons}>
          {/* Header-level Edit/Delete */}
          <TouchableOpacity
            onPress={() => setEditVisible(true)}
            style={{ marginRight: 16 }}
          >
            <MaterialIcons name="edit" size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert("Delete feature coming soon")}
          >
            <MaterialIcons name="delete" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
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

      {/* Edit Investment Popup */}
      {editVisible && investmentGroupId && (
        <EditInvestmentPopup
          visible={editVisible}
          investmentData={getGroupInvestmentData()}
          onClose={() => setEditVisible(false)}
          onUpdated={fetchGroupInvestments}
        />
      )}
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
    color: "#fff",
  },
  headerIcons: { flexDirection: "row" },
  content: { padding: 16 },
});
