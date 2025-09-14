// src/components/InvestmentAudit.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../../src/config/config";

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
          }
        );

        if (!response.ok) throw new Error("Failed to fetch audit logs");
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [businessId, visible]);

  // Group logs by investmentId
  const groupedLogs: { [key: string]: AuditLog[] } = logs.reduce(
    (acc, log) => {
      if (!acc[log.investmentId]) acc[log.investmentId] = [];
      acc[log.investmentId].push(log);
      return acc;
    },
    {} as { [key: string]: AuditLog[] }
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            Audit Trail for Business: {businessName}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : logs.length === 0 ? (
            <Text style={styles.noData}>No changes found for this business.</Text>
          ) : (
            <ScrollView horizontal>
              <View>
                <View style={styles.headerRow}>
                  <Text style={[styles.cell, styles.header]}>Investment ID</Text>
                  <Text style={[styles.cell, styles.header]}>Field</Text>
                  <Text style={[styles.cell, styles.header]}>Old Value</Text>
                  <Text style={[styles.cell, styles.header]}>New Value</Text>
                  <Text style={[styles.cell, styles.header]}>User</Text>
                  <Text style={[styles.cell, styles.header]}>Date</Text>
                </View>

                {Object.entries(groupedLogs).map(([investmentId, rows]) =>
                  rows.map((log, idx) => (
                    <View key={log.id} style={styles.row}>
                      {idx === 0 && (
                        <Text
                          style={[styles.cell, styles.groupedId]}
                          numberOfLines={rows.length}
                        >
                          {investmentId}
                        </Text>
                      )}
                      <Text style={styles.cell}>{log.fieldName}</Text>
                      <Text style={[styles.cell, styles.oldValue]}>
                        {log.oldValue ?? "-"}
                      </Text>
                      <Text style={[styles.cell, styles.newValue]}>
                        {log.newValue ?? "-"}
                      </Text>
                      <Text style={styles.cell}>{log.modifiedBy}</Text>
                      <Text style={styles.cell}>
                        {new Date(log.modifiedAt).toLocaleString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
    color: "#333",
  },
  noData: {
    textAlign: "center",
    color: "#888",
    marginVertical: 20,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#3498db",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  cell: {
    padding: 8,
    minWidth: 100,
    borderRightWidth: 1,
    borderColor: "#ddd",
    fontSize: 12,
  },
  header: {
    color: "#fff",
    fontWeight: "600",
  },
  groupedId: {
    fontWeight: "bold",
    backgroundColor: "#f8f9fa",
  },
  oldValue: {
    color: "#d9534f",
    fontWeight: "600",
  },
  newValue: {
    color: "#28a745",
    fontWeight: "600",
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: "center",
    backgroundColor: "#285ecf",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 10,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#444",
  },
});
