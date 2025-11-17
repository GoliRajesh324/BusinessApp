// SimpleInterestPage.tsx
import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { addInterest, getAllInterests, updateInterest } from "./interestService";

type Interest = {
  id?: number | string;
  name: string;
  type: "given" | "taken";
  amount: number;
  rate?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string | null;
  comment?: string;
};

const numberToWordsIndian = (num?: number | string) => {
  if (num === undefined || num === null || num === "") return "";
  const n = Number(num);
  if (isNaN(n)) return "";
  const numInt = Math.floor(n);
  if (numInt === 0) return "Zero Rupees";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Lakh", "Crore"];

  const getTwoDigits = (n: number) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "");
  };

  const getThreeDigits = (n: number) => {
    let str = "";
    if (n > 99) {
      str += units[Math.floor(n / 100)] + " Hundred ";
      n = n % 100;
    }
    if (n > 0) {
      str += getTwoDigits(n);
    }
    return str.trim();
  };

  let parts: string[] = [];
  let i = 0;
  let numVal = numInt;
  while (numVal > 0) {
    let part = i === 0 ? numVal % 1000 : numVal % 100;
    if (part) {
      let word = getThreeDigits(part);
      if (i > 0) word += " " + scales[i];
      parts.unshift(word);
    }
    numVal = i === 0 ? Math.floor(numVal / 1000) : Math.floor(numVal / 100);
    i++;
  }
  return parts.join(" ").replace(/\s+/g, " ").trim() + " Rupees";
};

const toTitleCase = (str?: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ""))
    .join(" ");
};

const formatDateForDisplay = (dateStr?: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}-${month}-${year}`;
};

const formatAmountIndian = (amount?: number) => {
  if (amount === undefined || amount === null) return "";
  return Number(amount).toLocaleString("en-IN");
};

export default function SimpleInterestPage() {
  const [persons, setPersons] = useState<Interest[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Interest>>({
    name: "",
    type: "taken",
    amount: undefined,
    rate: undefined,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    comment: "",
  });

  // fetch on mount and on toggle
  useEffect(() => {
    fetchAll();
  }, [showActive]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getAllInterests();
      setPersons(data || []);
    } catch (e) {
      console.error("fetchAll error", e);
      Alert.alert("Error", "Failed to fetch interests");
    } finally {
      setLoading(false);
    }
  };

  const filteredPersons = persons.filter((p) =>
    showActive ? !p.endDate || p.endDate === "" : !!p.endDate && p.endDate !== ""
  );

  const totalTakenByYou = filteredPersons
    .filter((p) => p.type === "given")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalGivenByYou = filteredPersons
    .filter((p) => p.type === "taken")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAmount = totalGivenByYou - totalTakenByYou;

  const grouped = filteredPersons.reduce<Record<string, Interest[]>>((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  const handleSave = async () => {
    if (!formData.name || !formData.amount) {
      Alert.alert("Validation", "Name and Amount are required!");
      return;
    }
    setSaving(true);
    const dto: any = {
      name: toTitleCase(String(formData.name)),
      type: formData.type,
      amount: Number(formData.amount),
      rate: formData.rate ? Number(formData.rate) : 0,
      startDate: formData.startDate,
      endDate: formData.endDate || null,
      comment: formData.comment,
    };

    try {
      if (editingId) {
        const updated = await updateInterest(editingId, dto);
        if (updated) {
          setPersons((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        }
      } else {
        const saved = await addInterest(dto);
        if (saved) {
          setPersons((prev) => [...prev, saved]);
        }
      }
      setShowPopup(false);
      setEditingId(null);
      setFormData({
        name: "",
        type: "given",
        amount: undefined,
        rate: undefined,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        comment: "",
      });
    } catch (e) {
      console.error("save error", e);
      Alert.alert("Error", "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (person: Interest) => {
    setFormData({
      name: person.name,
      type: person.type,
      amount: person.amount,
      rate: person.rate,
      startDate: person.startDate,
      endDate: person.endDate || "",
      comment: person.comment,
    });
    setEditingId(person.id ?? null);
    setShowPopup(true);
  };

  const toggleExpand = (name: string) => {
    setExpanded((prev) => (prev === name ? null : name));
  };

  // PDF export placeholder — jspdf doesn't run in plain RN.
  const handleDownloadPDF = () => {
    // In React Native you need a dedicated PDF generation / print library:
    // - expo-print + expo-file-system (Expo)
    // - react-native-html-to-pdf
    // - react-native-pdf-lib
    // Implementing this requires native modules; left as a placeholder.
    Alert.alert(
      "PDF Export",
      "PDF export is not implemented in this RN build. Use libraries like expo-print or react-native-html-to-pdf to create/share PDFs."
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Interest Money Details</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={styles.switchContainer}
              onPress={() => setShowActive((s) => !s)}
            >
              <View style={[styles.slider, showActive && styles.sliderOn]}>
                <View style={[styles.knob, showActive && styles.knobOn]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.toggleLabel}>{showActive ? "Active" : "InActive"}</Text>
          </View>
        </View>

        {/* PDF Button */}
        <TouchableOpacity style={styles.pdfButton} onPress={handleDownloadPDF}>
          <Text style={styles.pdfLabel}>PDF</Text>
          <Text style={styles.pdfIcon}>⬇️</Text>
        </TouchableOpacity>

        {/* Summary */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Your Remaining Money</Text>
            <Text style={[styles.summaryValue, styles.totalValue]}>₹ {formatAmountIndian(totalAmount)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Money Taken By You</Text>
            <Text style={[styles.summaryValue, styles.givenValue]}>₹ {formatAmountIndian(totalTakenByYou)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryTitle}>Money Given By You</Text>
            <Text style={[styles.summaryValue, styles.takenValue]}>₹ {formatAmountIndian(totalGivenByYou)}</Text>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView style={styles.listContainer}>
            {Object.keys(grouped).map((name) => {
              const records = grouped[name];
              const netAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0);
              const type = records[0].type;
              return (
                <View key={name} style={styles.personCard}>
                  <TouchableOpacity style={styles.personHeader} onPress={() => toggleExpand(name)}>
                    <Text style={styles.personName}>{toTitleCase(name)}</Text>
                    <Text style={[styles.personAmount, type === "given" ? styles.givenValue : styles.takenValue]}>
                      ₹ {formatAmountIndian(netAmount)}
                    </Text>
                  </TouchableOpacity>

                  {expanded === name && (
                    <View style={styles.personDetails}>
                      <View style={styles.tableHeader}>
                        <Text style={[styles.tableCell, styles.cellType]}>Type</Text>
                        <Text style={[styles.tableCell, styles.cellAmount]}>Amount</Text>
                        <Text style={[styles.tableCell, styles.cellRate]}>Interest %</Text>
                        <Text style={[styles.tableCell, styles.cellDate]}>Start Date</Text>
                        <Text style={[styles.tableCell, styles.cellComment]}>Comment</Text>
                        <Text style={[styles.tableCell, styles.cellAction]}>Action</Text>
                      </View>
                      {records.map((rec) => (
                        <View key={rec.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.cellType, rec.type === "given" ? styles.givenValue : styles.takenValue]}>
                            {rec.type === "given" ? "Money Taken By You" : "Money Given By You"}
                          </Text>
                          <Text style={[styles.tableCell, styles.cellAmount]}>₹ {formatAmountIndian(rec.amount)}</Text>
                          <Text style={[styles.tableCell, styles.cellRate]}>{rec.rate} %</Text>
                          <Text style={[styles.tableCell, styles.cellDate]}>{formatDateForDisplay(rec.startDate)}</Text>
                          <Text style={[styles.tableCell, styles.cellComment]}>{rec.comment}</Text>
                          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(rec)}>
                            <FontAwesome name="edit" size={18} color="#007bff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Floating + Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => { setShowPopup(true); setEditingId(null); }}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        {/* Modal Popup */}
        <Modal visible={showPopup} transparent animationType="fade" onRequestClose={() => { if (!saving) setShowPopup(false); }}>
          <View style={styles.popupOverlay}>
            <View style={styles.popup}>
              <Text style={styles.popupTitle}>{editingId ? "Edit Person" : "Add Person"}</Text>

              <TextInput
                placeholder="Name"
                style={styles.input}
                value={String(formData.name ?? "")}
                onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
                editable={!saving}
              />

              <View style={styles.pickerRow}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === "taken" && styles.typeSelected]}
                  onPress={() => setFormData((p) => ({ ...p, type: "taken" }))}
                  disabled={saving}
                >
                  <Text style={styles.typeText}>Money Given By You</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === "given" && styles.typeSelected]}
                  onPress={() => setFormData((p) => ({ ...p, type: "given" }))}
                  disabled={saving}
                >
                  <Text style={styles.typeText}>Money Taken By You</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Amount"
                style={styles.input}
                value={formData.amount !== undefined && formData.amount !== null ? String(formData.amount) : ""}
                onChangeText={(t) => {
                  const num = t.replace(/[^0-9.]/g, "");
                  setFormData((p) => ({ ...p, amount: num === "" ? undefined : Number(num) }));
                }}
                keyboardType="numeric"
                editable={!saving}
              />

              {(formData.amount !== undefined && formData.amount !== null) && (
                <Text style={styles.amountWords}>{numberToWordsIndian(formData.amount)}</Text>
              )}

              <TextInput
                placeholder="Rate of Interest (%)"
                style={styles.input}
                value={formData.rate !== undefined && formData.rate !== null ? String(formData.rate) : ""}
                onChangeText={(t) => setFormData((p) => ({ ...p, rate: t === "" ? undefined : Number(t) }))}
                keyboardType="numeric"
                editable={!saving}
              />

              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  placeholder="YYYY-MM-DD"
                  value={formData.startDate ?? ""}
                  onChangeText={(t) => setFormData((p) => ({ ...p, startDate: t }))}
                  editable={!saving}
                />
              </View>

              {editingId && (
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>End Date:</Text>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="YYYY-MM-DD"
                    value={formData.endDate ?? ""}
                    onChangeText={(t) => setFormData((p) => ({ ...p, endDate: t }))}
                    editable={!saving}
                  />
                </View>
              )}

              <TextInput
                placeholder="Comment"
                style={[styles.input, styles.textarea]}
                value={formData.comment ?? ""}
                onChangeText={(t) => setFormData((p) => ({ ...p, comment: t }))}
                editable={!saving}
                multiline
              />

              <View style={styles.popupActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => { if (!saving) { setShowPopup(false); setEditingId(null); } }}
                  disabled={saving}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, { color: "#fff" }]}>{editingId ? "Update" : "Save"}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6f9" },
  container: {
    flex: 1,
    padding: 16,
    position: "relative",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  switchContainer: { marginRight: 8 },
  slider: {
    width: 50,
    height: 26,
    backgroundColor: "#ccc",
    borderRadius: 26,
    justifyContent: "center",
    padding: 3,
  },
  sliderOn: { backgroundColor: "#007bff" },
  knob: {
    height: 20,
    width: 20,
    borderRadius: 20,
    backgroundColor: "#fff",
    transform: [{ translateX: 0 }],
  },
  knobOn: { transform: [{ translateX: 24 }] },
  toggleLabel: { fontWeight: "700", fontSize: 16, color: "#333" },

  pdfButton: {
    position: "absolute",
    right: 20,
    bottom: 120,
    width: 60,
    height: 60,
    backgroundColor: "#f11515",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  pdfLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  pdfIcon: { color: "#fff", fontSize: 18 },

  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryTitle: { fontSize: 14, color: "#666", marginBottom: 6 },
  summaryValue: { fontSize: 20, fontWeight: "800" },
  totalValue: { color: "#007bff" },
  givenValue: { color: "red" },
  takenValue: { color: "green" },

  listContainer: { flex: 1 },

  personCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  personHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
    alignItems: "center",
  },
  personName: { fontSize: 18, fontWeight: "700" },
  personAmount: { fontSize: 18, fontWeight: "800" },
  personDetails: { padding: 10, backgroundColor: "#fafafa", borderTopWidth: 1, borderTopColor: "#eee" },

  tableHeader: { flexDirection: "row", marginBottom: 6, alignItems: "center" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomColor: "#eee", borderBottomWidth: 0.5 },
  tableCell: { flex: 1, fontSize: 12 },
  cellType: { flex: 2 },
  cellAmount: { flex: 1.2 },
  cellRate: { flex: 1 },
  cellDate: { flex: 1.2 },
  cellComment: { flex: 2 },
  cellAction: { flex: 0.6 },

  editBtn: { padding: 6 },

  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  addButtonText: { color: "#fff", fontSize: 28, lineHeight: 28 },

  popupOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  popup: { width: "92%", maxWidth: 420, backgroundColor: "#fff", padding: 16, borderRadius: 12 },
  popupTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14 },
  textarea: { height: 80, textAlignVertical: "top" },
  amountWords: { fontStyle: "italic", color: "#555", marginBottom: 8 },

  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dateLabel: { width: 100, fontWeight: "700" },
  dateInput: { flex: 1 },

  popupActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  cancelBtn: { backgroundColor: "#f13535" },
  saveBtn: { backgroundColor: "#007bff" },
  btnText: { fontWeight: "700", color: "#fff" },

  pickerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  typeButton: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginRight: 6, alignItems: "center" },
  typeSelected: { backgroundColor: "#e6f0ff", borderColor: "#007bff" },
  typeText: { fontSize: 13, textAlign: "center" },

  center: { alignItems: "center", justifyContent: "center", flex: 1 },
});
