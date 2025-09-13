import React, { useState,useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";

type Partner = {
  id: string;
  username: string;
};

type SoldAmountPopupProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  partners: Partner[];
  cropDetails?: any;
};

const SoldAmountPopup: React.FC<SoldAmountPopupProps> = ({
  visible,
  onClose,
  onSave,
  partners,
  cropDetails
}) => {
  const [totalSold, setTotalSold] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<{ id: string; name: string; share: string }[]>([]);

  React.useEffect(() => {
    setRows(partners.map((p) => ({ id: p.id, name: p.username, share: "" })));
  }, [partners]);

  const handleShareChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index].share = value.replace(/^0+(?=\d)/, "");
      return next;
    });
  };

  const handleSave = () => {
    const totalEntered = rows.reduce((sum, r) => sum + (parseFloat(r.share) || 0), 0);
    if (Math.round((totalEntered - parseFloat(totalSold || "0")) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total shares do not match total sold amount");
      return;
    }

    const soldData = rows.map((r) => ({
      partnerId: r.id,
      amount: parseFloat(r.share || "0"),
      description,
    }));

    onSave(soldData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Record Sold Amount</Text>
          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Sold Amount"
              keyboardType="numeric"
              value={totalSold}
              onChangeText={setTotalSold}
            />

            <View style={styles.table}>
              {rows.map((row, idx) => (
                <View key={row.id} style={styles.row}>
                  <Text style={styles.cell}>{row.name}</Text>
                  <TextInput
                    style={[styles.cell, styles.inputCell]}
                    placeholder="Share"
                    keyboardType="numeric"
                    value={row.share}
                    onChangeText={(val) => handleShareChange(idx, val)}
                  />
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.buttonCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.buttonSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SoldAmountPopup;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  container: { backgroundColor: "white", borderRadius: 8, padding: 16, maxHeight: "90%" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12 },
  table: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cell: { flex: 1, textAlign: "center" },
  inputCell: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 4 },
  buttons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  buttonCancel: { padding: 12, backgroundColor: "#ccc", borderRadius: 6, marginRight: 8 },
  buttonSave: { padding: 12, backgroundColor: "#28a745", borderRadius: 6 },
  buttonText: { color: "white", fontWeight: "bold" },
});
