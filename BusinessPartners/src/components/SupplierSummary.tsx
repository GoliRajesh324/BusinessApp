import React, { useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PartnerItem {
  partnerId: number;
  username: string;
  paidAmount: number;
  pendingAmount: number;
}

interface SupplierItem {
  supplierId: number;
  supplierName: string;
  pendingAmount: number;
  partners: PartnerItem[];
}

interface Props {
  pendingSuppliers: SupplierItem[];
  formatAmount: (num: number) => string;
  onSettleUp: (supplierId: number) => void;
}

export default function SupplierSummary({
  pendingSuppliers,
  formatAmount,
  onSettleUp,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {pendingSuppliers.length > 0 && (
        <Text style={styles.title}>Pending Supplier Amounts</Text>
      )}

      <FlatList
        data={pendingSuppliers}
        keyExtractor={(item) => item.supplierId.toString()}
        renderItem={({ item }) => {
          const isOpen = expanded === item.supplierId;

          return (
            <View style={styles.card}>
              {/* Header */}
              <TouchableOpacity
                style={styles.header}
                onPress={() => toggleExpand(item.supplierId)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{item.supplierName}</Text>
                  <Text style={styles.pending}>
                    ₹{formatAmount(item.pendingAmount)}
                  </Text>
                </View>

                {/* Settle Button */}
                <TouchableOpacity
                  style={styles.settleBtn}
                  onPress={() => onSettleUp(item.supplierId)}
                >
                  <Text style={styles.settleText}>Settle</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Expandable Partner Cards */}
              {isOpen &&
                item.partners?.map((p) => (
                  <View key={p.partnerId} style={styles.partnerCard}>
                    <Text style={styles.partnerName}>{p.username}</Text>

                    <View style={styles.row}>
                      <Text style={styles.label}>Paid</Text>
                      <Text style={styles.value}>
                        ₹{formatAmount(p.paidAmount)}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Pending</Text>
                      <Text style={[styles.value, { color: "#c1121f" }]}>
                        ₹{formatAmount(p.pendingAmount)}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1d3557",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#264653",
  },
  pending: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e63946",
    marginTop: 4,
  },
  settleBtn: {
    backgroundColor: "#457b9d",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  settleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  partnerCard: {
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
    color: "#1d3557",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: { fontSize: 13, fontWeight: "500", color: "#6c757d" },
  value: { fontSize: 13, fontWeight: "700", color: "#2a9d8f" },
});
