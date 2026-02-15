import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../config/config";

interface InvestmentAuditProps {
  businessId: string;
  businessName: string;
  visible: boolean;
  onClose: () => void;
}

interface AuditLog {
  id: string;
  investmentId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  modifiedBy: string;
  modifiedAt: string;
}

export default function InvestmentAudit({
  businessId,
  businessName,
  visible,
  onClose,
}: InvestmentAuditProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId || !visible) return;

    const fetchAuditLogs = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(
          `${BASE_URL}/api/audit/business/${businessId}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch audit logs");
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.log("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [businessId, visible]);

  // Flatten grouped logs for FlatList
  const flatLogs = logs.map((log) => ({
    id: log.id, // unique id for FlatList keyExtractor
    investmentId: log.investmentId,
    fieldName: log.fieldName,
    oldValue: log.oldValue,
    newValue: log.newValue,
    modifiedBy: log.modifiedBy,
    modifiedAt: log.modifiedAt,
  }));

  const renderRow = ({ item }: { item: AuditLog }) => (
    <View style={styles.card}>
      <Text style={styles.fieldName}>{item.fieldName}</Text>

      <View style={styles.valueWrapper}>
        <Text style={styles.oldValue}>{item.oldValue ?? "-"}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.newValue}>{item.newValue ?? "-"}</Text>
      </View>

      <Text style={styles.investmentId}>
        Investment ID: {item.investmentId}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.modifiedBy}>By: {item.modifiedBy}</Text>
        <Text style={styles.modifiedAt}>
          {new Date(item.modifiedAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerLeft}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change History</Text>
          <View style={styles.headerRight} />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#3498db"
            style={{ marginTop: 20 }}
          />
        ) : logs.length === 0 ? (
          <Text style={styles.noDataText}>
            No changes found for this business.
          </Text>
        ) : (
          <FlatList
            data={flatLogs}
            renderItem={renderRow}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height:
      Platform.OS === "android" ? 90 + (StatusBar.currentHeight || 0) : 110,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 60 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },

  tableWrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },

  headerRow: {
    backgroundColor: "#3498db",
  },

  cell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontSize: 14,
    textAlign: "center",
  },

  headerCell: {
    color: "#fff",
    fontWeight: "600",
  },

  investmentCol: { width: 120, textAlign: "left" },
  fieldCol: { width: 140, textAlign: "left" },
  valueCol: { width: 140 },
  userCol: { width: 120 },
  dateCol: { width: 180 },
  /* 
  oldValue: { color: "#d9534f", fontWeight: "600" },
  newValue: { color: "#28a745", fontWeight: "600" }, */

  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  fieldName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },

  valueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },

  oldValue: {
    color: "#d9534f",
    textDecorationLine: "line-through",
    fontWeight: "600",
    fontSize: 15,
  },

  arrow: {
    marginHorizontal: 6,
    fontSize: 16,
    fontWeight: "bold",
  },

  newValue: {
    color: "#28a745",
    fontWeight: "700",
    fontSize: 15,
  },

  investmentId: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
    marginBottom: 4,
    fontStyle: "italic",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  modifiedBy: {
    fontSize: 12,
    color: "#777",
  },

  modifiedAt: {
    fontSize: 12,
    color: "#999",
  },
});
