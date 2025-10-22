import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function InvestmentDetail() {
  const router = useRouter();
  const { investment } = useLocalSearchParams();
  const inv =
    investment && typeof investment === "string"
      ? JSON.parse(investment)
      : Array.isArray(investment)
      ? JSON.parse(investment[0])
      : {};

  const formatAmount = (v: string | number | null | undefined) => {
    const num = parseFloat(String(v ?? "0"));
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
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

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.detailCard}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{inv.description || "-"}</Text>

          <Text style={styles.label}>Partner:</Text>
          <Text style={styles.value}>{inv.partnerName || "-"}</Text>

          <Text style={styles.label}>Total Amount:</Text>
          <Text style={styles.value}>₹{formatAmount(inv.totalAmount)}</Text>

          <Text style={styles.label}>Invested:</Text>
          <Text style={styles.value}>₹{formatAmount(inv.invested)}</Text>

          <Text style={styles.label}>Split Type:</Text>
          <Text style={styles.value}>{inv.splitType || "-"}</Text>

          <Text style={styles.label}>Created At:</Text>
          <Text style={styles.value}>
            {new Date(inv.createdAt || "").toLocaleString()}
          </Text>

          <Text style={styles.label}>Updated By:</Text>
          <Text style={styles.value}>{inv.updatedBy || "-"}</Text>
        </View>
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
