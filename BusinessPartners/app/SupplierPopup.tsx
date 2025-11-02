import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ✅ Type for each partner row
export interface PartnerRow {
  id: number;
  name: string;
  actual: number | string;
  investing: number | string;
  pending?: number;
}

// ✅ Component Props
interface SupplierPopupProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  totalAmount: number;
  remaining: number;
  rows: PartnerRow[];
}

export default function SupplierPopup({
  visible,
  onClose,
  onConfirm,
  totalAmount,
  remaining,
  rows,
}: SupplierPopupProps) {
  const [supplierName, setSupplierName] = useState("");

  const pendingRows: PartnerRow[] = rows.map((r: PartnerRow) => {
    const investNum = Number(r.actual) || 0;
    const actualNum = Number(r.investing) || 0;
    const diff = actualNum - investNum;
    return { ...r, pending: diff > 0 ? diff : 0 };
  });

  const handleConfirm = () => {
    if (!supplierName.trim()) {
      Alert.alert("Validation", "Please enter supplier name.");
      return;
    }
    onConfirm(supplierName);
    setSupplierName(""); // reset
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.heading}>
            Borrowed from Supplier 
          </Text>
           <Text style={styles.orheading}>
                OR
          </Text>
           <Text style={styles.heading}>
            Adjust Remaining Amount
          </Text>

          {/* Amount Display */}
          <View style={styles.amountBox}>
            <Text style={styles.amountText}>
              Total Amount:{" "}
              <Text style={styles.bold}>{totalAmount.toFixed(2)}</Text>
            </Text>

            <Text style={styles.amountText}>
              Remaining Borrowed:{" "}
              <Text style={[styles.bold, { color: "#e63946" }]}>
                {remaining.toFixed(2)}
              </Text>
            </Text>
          </View>

          {/* Supplier Input */}
          <Text style={styles.label}>Supplier Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Supplier Name"
            value={supplierName}
            onChangeText={setSupplierName}
          />

          {/* Pending List */}
          <Text style={styles.subheading}>Partner Pending Contributions</Text>
          <ScrollView style={{ maxHeight: 220 }}>
            {pendingRows.map((r: PartnerRow) => (
              <View key={r.id} style={styles.row}>
                <Text style={styles.name}>{r.name}</Text>
                <Text style={styles.tag}>Invested: {r.investing || 0}</Text>
                <Text style={[styles.tag, { color: "#d00000" }]}>
                  Pending: {r.pending?.toFixed(2)}
                </Text>
              </View>
            ))}

            {pendingRows.length === 0 && (
              <Text style={styles.noData}>No pending amounts</Text>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleConfirm}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1d3557",
    textAlign: "center",
  },
    orheading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    color: "#1d3557",
    textAlign: "center",
  },
  subheading: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: "#457b9d",
  },
  amountBox: {
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  amountText: {
    fontSize: 14,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "700",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    padding: 10,
    borderRadius: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    padding: 10,
    backgroundColor: "#eef2f3",
    borderRadius: 10,
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  tag: {
    fontSize: 13,
    marginBottom: 2,
  },
  noData: {
    textAlign: "center",
    padding: 15,
    color: "#777",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#adb5bd",
    padding: 12,
    borderRadius: 10,
    marginRight: 8,
    alignItems: "center",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#2a9d8f",
    padding: 12,
    borderRadius: 10,
    marginLeft: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
