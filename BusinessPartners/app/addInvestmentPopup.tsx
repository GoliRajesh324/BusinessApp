import React, { useState, useEffect, useMemo } from "react";
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
  share?: number;
};

type AddInvestmentPopupProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  partners: Partner[];
  cropDetails?: any;
};

const AddInvestmentPopup: React.FC<AddInvestmentPopupProps> = ({
  visible,
  onClose,
  onSave,
  partners,
  cropDetails,
}) => {
  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">("share");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);

  const createdBy = "CurrentUser"; // Replace with AsyncStorage or context if needed

  // Initialize rows
  useEffect(() => {
    const initial = partners.map((p) => ({
      id: p.id,
      name: p.username,
      share: p.share ?? 0,
      actual: "",
      investing: "",
    }));
    setRows(initial);
  }, [partners]);

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    if (!partners.length) return;

    setRows((prev) =>
      partners.map((p, idx) => {
        const prevRow = prev[idx] || {};
        if (!totalAmount) return { ...prevRow, actual: "", investing: "" };

        if (splitMode === "share") {
          const actual = ((p.share ?? 0) / 100 * expected).toFixed(2);
          return { ...prevRow, actual, investing: actual };
        }

        if (splitMode === "equal") {
          const per = (expected / partners.length).toFixed(2);
          return { ...prevRow, actual: per, investing: per };
        }

        // manual
        return { ...prevRow, actual: prevRow.investing || "", investing: prevRow.investing || "" };
      })
    );
  }, [splitMode, totalAmount, partners]);

  const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index].investing = value.replace(/^0+(?=\d)/, "");
      if (splitMode === "manual") next[index].actual = next[index].investing;
      return next;
    });
  };

  const handleSave = () => {
    const totalEntered = rows.reduce((sum, r) => sum + (parseFloat(r.investing) || 0), 0);
    if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    }

    const investmentData = rows.map((r) => ({
      partnerId: r.id,
      cropId: cropDetails?.id,
      description,
      totalAmount: expected,
      invested: parseFloat(r.investing || 0),
      splitType: splitMode.toUpperCase(),
      createdBy,
    }));

    onSave(investmentData);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Investment</Text>
          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Amount"
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />

            <View style={styles.splitContainer}>
              {["share", "equal", "manual"].map((mode) => (
                <TouchableOpacity key={mode} onPress={() => setSplitMode(mode as any)} style={styles.splitButton}>
                  <Text style={{ color: splitMode === mode ? "white" : "black" }}>{mode.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.table}>
              {rows.map((row, idx) => (
                <View key={row.id} style={styles.row}>
                  <Text style={styles.cell}>{row.name}</Text>
                  {splitMode === "share" && <Text style={styles.cell}>{row.share}%</Text>}
                  <Text style={styles.cell}>{row.actual}</Text>
                  <TextInput
                    style={[styles.cell, styles.inputCell]}
                    value={row.investing}
                    keyboardType="numeric"
                    onChangeText={(val) => handleInvestingChange(idx, val)}
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

export default AddInvestmentPopup;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  container: { backgroundColor: "white", borderRadius: 8, padding: 16, maxHeight: "90%" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 8, marginBottom: 12 },
  splitContainer: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  splitButton: { padding: 8, borderRadius: 6, backgroundColor: "#007bff" },
  table: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cell: { flex: 1, textAlign: "center" },
  inputCell: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 4 },
  buttons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  buttonCancel: { padding: 12, backgroundColor: "#ccc", borderRadius: 6, marginRight: 8 },
  buttonSave: { padding: 12, backgroundColor: "#28a745", borderRadius: 6 },
  buttonText: { color: "white", fontWeight: "bold" },
});
