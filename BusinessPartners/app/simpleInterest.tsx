// SimpleInterestPage.tsx 
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
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
  View,
} from "react-native";
import {
  addInterest,
  getAllInterests,
  updateInterest,
} from "./interestService";

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

const emptyForm = (): Partial<Interest> => ({
  name: "",
  type: "taken",
  amount: undefined,
  rate: undefined,
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  comment: "",
});

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
  const router = useRouter();
  const [persons, setPersons] = useState<Interest[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showActive, setShowActive] = useState(true);
  const [formData, setFormData] = useState<Partial<Interest>>(emptyForm());

  useEffect(() => {
    fetchAll();
  }, [showActive]);

  // ADD/EDIT default date behavior
  useEffect(() => {
    if (editingId) {
      setFormData((p) => ({
        ...p,
        startDate: p.startDate, // keep old
        endDate: new Date().toISOString().split("T")[0], // today
      }));
    } else {
      setFormData((p) => ({
        ...p,
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
      }));
    }
  }, [editingId]);

  async function fetchAll() {
    setLoading(true);
    try {
      const data = await getAllInterests();
      setPersons(data || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to fetch interests");
    } finally {
      setLoading(false);
    }
  }

  /* ************************************
     ALWAYS SHOW TOTALS FROM ALL RECORDS
     ************************************ */
  const totalTakenAll = persons
    .filter((p) => p.type === "given")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalGivenAll = persons
    .filter((p) => p.type === "taken")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalAmountAll = totalGivenAll - totalTakenAll;

  /* ************************************
     FILTER ONLY FOR DISPLAY (LIST)
     ************************************ */
  const filteredPersons = persons.filter((p) =>
    showActive ? !p.endDate || p.endDate === "" : !!p.endDate
  );

  const grouped = filteredPersons.reduce<Record<string, Interest[]>>(
    (acc, p) => {
      if (!acc[p.name]) acc[p.name] = [];
      acc[p.name].push(p);
      return acc;
    },
    {}
  );

  const onAddPress = () => {
    setFormData(emptyForm());
    setEditingId(null);
    setShowModal(true);
  };

  const onEditOpen = (rec: Interest) => {
    setFormData({
      name: rec.name,
      type: rec.type,
      amount: rec.amount,
      rate: rec.rate,
      startDate: rec.startDate,
      endDate: rec.endDate || "",
      comment: rec.comment,
    });
    setEditingId(rec.id ?? null);
    setShowModal(true);
  };

 const handleDownloadPDF = async () => {
  try {
    let html = `
    <html>
      <body style="font-family: Arial; padding: 20px;">

        <h2 style="margin-bottom:10px;">Interest Money Details</h2>

        <!-- SUMMARY TABLE -->
        <table style="width:100%; font-size:14px; border-collapse: collapse; margin-bottom: 25px;">
          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Your Remaining Money</b></td>
            <td style="padding:8px; text-align:right; border:1px solid #ccc;">
              ₹ ${formatAmountIndian(totalAmountAll)}
            </td>
          </tr>

          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Money Taken By You</b></td>
            <td style="padding:8px; text-align:right; color:red; border:1px solid #ccc;">
              ₹ ${formatAmountIndian(totalTakenAll)}
            </td>
          </tr>

          <tr>
            <td style="padding:8px; border:1px solid #ccc;"><b>Money Given By You</b></td>
            <td style="padding:8px; text-align:right; color:green; border:1px solid #ccc;">
              ₹ ${formatAmountIndian(totalGivenAll)}
            </td>
          </tr>
        </table>
    `;

    // PERSON WISE DETAILS
    Object.keys(grouped).forEach((name) => {
      html += `
        <h3 style="margin-top:25px; margin-bottom:6px;">${name.toUpperCase()}</h3>

        <table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:20px;">
          <tr style="background:#1e88e5; color:white;">
            <th style="padding:8px; border:1px solid #ccc;">Type</th>
            <th style="padding:8px; border:1px solid #ccc;">Amount</th>
            <th style="padding:8px; border:1px solid #ccc;">Interest %</th>
            <th style="padding:8px; border:1px solid #ccc;">Start Date</th>
            <th style="padding:8px; border:1px solid #ccc;">Comment</th>
          </tr>
      `;

      grouped[name].forEach((r) => {
        html += `
          <tr>
            <td style="padding:8px; border:1px solid #ccc;">
              ${r.type === "given" ? "Money Taken By You" : "Money Given By You"}
            </td>

            <td style="padding:8px; border:1px solid #ccc;">
              Rs. ${formatAmountIndian(r.amount)}
            </td>

            <td style="padding:8px; border:1px solid #ccc; text-align:center;">
              ${r.rate ?? 0} %
            </td>

            <td style="padding:8px; border:1px solid #ccc; text-align:center;">
              ${formatDateForDisplay(r.startDate)}
            </td>

            <td style="padding:8px; border:1px solid #ccc;">
              ${r.comment ?? ""}
            </td>
          </tr>
        `;
      });

      html += `</table>`;
    });

    html += `
      </body>
    </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("File Saved", uri);
    }
  } catch (e) {
    console.error(e);
    Alert.alert("Error", "PDF generation failed");
  }
};


  const handleSave = async () => {
    if (!formData.name || formData.amount == null) {
      Alert.alert("Validation", "Name and Amount are required");
      return;
    }
    setSaving(true);

    const dto: any = {
      name: toTitleCase(String(formData.name)),
      type: formData.type,
      amount: Number(formData.amount),
      rate: formData.rate ? Number(formData.rate) : 0,
      startDate: formData.startDate,
      endDate: editingId ? new Date().toISOString().split("T")[0] : null,
      comment: formData.comment,
    };

    try {
      if (editingId) {
        const updated = await updateInterest(editingId, dto);
        if (updated) {
          setPersons((prev) =>
            prev.map((p) => (p.id === editingId ? updated : p))
          );
        }
      } else {
        const saved = await addInterest(dto);
        if (saved) setPersons((prev) => [...prev, saved]);
      }

      setShowModal(false);
      setEditingId(null);
      setFormData(emptyForm());
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (name: string) =>
    setExpanded((prev) => (prev === name ? null : name));

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interest Money</Text>
        </View>

        {/* Summary (ALWAYS uses All Totals) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Your Remaining Money</Text>
            <Text style={[styles.summaryAmount, styles.totalValue]}>
              ₹ {formatAmountIndian(totalAmountAll)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Money Taken By You</Text>
            <Text style={[styles.summaryAmount, styles.givenValue]}>
              ₹ {formatAmountIndian(totalTakenAll)}
            </Text>
          </View>

          <View style={styles.dividerThin} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Money Given By You</Text>
            <Text style={[styles.summaryAmount, styles.takenValue]}>
              ₹ {formatAmountIndian(totalGivenAll)}
            </Text>
          </View>

          <View style={styles.summaryActions}>
            <TouchableOpacity
              style={styles.activeBtn}
              onPress={() => setShowActive((s) => !s)}
            >
              <Text style={styles.activeText}>
                {showActive ? "Active" : "InActive"} ⏷
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pdfBtn} onPress={handleDownloadPDF}>
              <Text style={styles.pdfText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 120 }}>
            {Object.keys(grouped).length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No records yet. Tap + to add.</Text>
              </View>
            )}

            {Object.keys(grouped).map((name) => {
              const records = grouped[name];
              const netAmount = records.reduce((s, r) => s + (r.amount || 0), 0);
              const type = records[0].type;

              return (
                <View key={name} style={styles.personCard}>
                  <TouchableOpacity style={styles.personHeader} onPress={() => toggleExpand(name)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {toTitleCase(name)}
                      </Text>
                      <Text style={styles.personSub}>
                        {records.length} record{records.length > 1 ? "s" : ""}
                      </Text>
                    </View>

                    <View style={styles.personAmountBox}>
                      <Text
                        style={[
                          styles.personAmount,
                          type === "given" ? styles.givenValue : styles.takenValue,
                        ]}
                      >
                        ₹ {formatAmountIndian(netAmount)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {expanded === name && (
                    <View style={styles.recordsContainer}>
                      {records.map((rec) => (
                        <View key={String(rec.id)} style={styles.recordCard}>
                          <View style={styles.recordTop}>
                            <Text
                              style={[
                                styles.recordType,
                                rec.type === "given" ? styles.givenValue : styles.takenValue,
                              ]}
                            >
                              {rec.type === "given" ? "Money Taken By You" : "Money Given By You"}
                            </Text>

                            <TouchableOpacity onPress={() => onEditOpen(rec)} style={styles.recordEditBtn}>
                              <FontAwesome name="edit" size={16} color="#007bff" />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.recordRow}>
                            <Text style={styles.recordLabel}>Amount</Text>
                            <Text style={styles.recordValue}>₹ {formatAmountIndian(rec.amount)}</Text>
                          </View>

                          <View style={styles.recordRow}>
                            <Text style={styles.recordLabel}>Interest</Text>
                            <Text style={styles.recordValue}>{rec.rate ?? 0} %</Text>
                          </View>

                          <View style={styles.recordRow}>
                            <Text style={styles.recordLabel}>Date</Text>
                            <Text style={styles.recordValue}>
                              {formatDateForDisplay(rec.startDate)}
                            </Text>
                          </View>

                          {rec.comment ? (
                            <View style={styles.recordRow}>
                              <Text style={styles.recordLabel}>Comment</Text>
                              <Text style={styles.recordValue}>{rec.comment}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Add Button */}
        <TouchableOpacity style={styles.fab} onPress={onAddPress}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
          onRequestClose={() => !saving && setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? "Edit Record" : "Add Record"}</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (!saving) {
                      setShowModal(false);
                      setEditingId(null);
                      setFormData(emptyForm());
                    }
                  }}
                >
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }}>
                <TextInput
                  placeholder="Name"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={String(formData.name ?? "")}
                  onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
                  editable={!saving}
                />

                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, formData.type === "taken" && styles.typeBtnActive]}
                    onPress={() => setFormData((p) => ({ ...p, type: "taken" }))}
                    disabled={saving}
                  >
                    <Text style={styles.typeBtnText}>Money Given By You</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, formData.type === "given" && styles.typeBtnActive]}
                    onPress={() => setFormData((p) => ({ ...p, type: "given" }))}
                    disabled={saving}
                  >
                    <Text style={styles.typeBtnText}>Money Taken By You</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Amount"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={
                    formData.amount !== undefined && formData.amount !== null
                      ? String(formData.amount)
                      : ""
                  }
                  onChangeText={(t) => {
                    const num = t.replace(/[^0-9.]/g, "");
                    setFormData((p) => ({
                      ...p,
                      amount: num === "" ? undefined : Number(num),
                    }));
                  }}
                  keyboardType="numeric"
                  editable={!saving}
                />

                <TextInput
                  placeholder="Rate of Interest (%)"
                  placeholderTextColor="#888"
                  style={styles.input}
                  value={
                    formData.rate !== undefined && formData.rate !== null
                      ? String(formData.rate)
                      : ""
                  }
                  onChangeText={(t) =>
                    setFormData((p) => ({
                      ...p,
                      rate: t === "" ? undefined : Number(t),
                    }))
                  }
                  keyboardType="numeric"
                  editable={!saving}
                />

                {/* Start Date */}
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TextInput
                    style={[styles.input, styles.dateInput]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#888"
                    value={formData.startDate ?? ""}
                    onChangeText={(t) => setFormData((p) => ({ ...p, startDate: t }))}
                    editable={!saving}
                  />
                </View>

                {/* End Date */}
                {editingId && (
                  <View style={styles.dateRow}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <TextInput
                      style={[styles.input, styles.dateInput]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#888"
                      value={formData.endDate ?? ""}
                      onChangeText={(t) => setFormData((p) => ({ ...p, endDate: t }))}
                      editable={!saving}
                    />
                  </View>
                )}

                <TextInput
                  placeholder="Comment"
                  placeholderTextColor="#888"
                  style={[styles.input, styles.textarea]}
                  value={formData.comment ?? ""}
                  onChangeText={(t) => setFormData((p) => ({ ...p, comment: t }))}
                  editable={!saving}
                  multiline
                />
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={() => {
                    if (!saving) {
                      setShowModal(false);
                      setEditingId(null);
                      setFormData(emptyForm());
                    }
                  }}
                  disabled={saving}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.saveBtn]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.btnText, { color: "#fff" }]}>
                      {editingId ? "Update" : "Save"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

/* Styles (unchanged) */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f4f6f9" },
  container: {
    flex: 1,
    padding: 14,
    position: "relative",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#222" },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  summaryLabel: { color: "#666", fontSize: 14 },
  summaryAmount: { fontSize: 18, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#f0f0f0", marginVertical: 8 },
  dividerThin: { height: 1, backgroundColor: "#fbfbfb", marginVertical: 6 },
  summaryActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  activeBtn: {
    backgroundColor: "#eef6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeText: { color: "#007bff", fontWeight: "700" },
  pdfBtn: {
    backgroundColor: "#f11515",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfText: { color: "#fff", fontWeight: "700" },
  totalValue: { color: "#007bff" },
  givenValue: { color: "red" },
  takenValue: { color: "green" },

  list: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", flex: 1 },

  emptyBox: { padding: 20, alignItems: "center" },
  emptyText: { color: "#666" },

  personCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 1,
  },
  personHeader: { flexDirection: "row", alignItems: "center", padding: 12 },
  personName: { fontSize: 16, fontWeight: "700", maxWidth: "80%" },
  personSub: { color: "#666", fontSize: 12 },
  personAmountBox: { alignItems: "flex-end", minWidth: 100 },
  personAmount: { fontSize: 16, fontWeight: "800" },

  recordsContainer: { padding: 12, backgroundColor: "#fafafa" },

  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
  },
  recordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordType: { fontSize: 13, fontWeight: "700" },
  recordEditBtn: { padding: 6 },

  recordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  recordLabel: { color: "#666", fontSize: 12 },
  recordValue: { fontSize: 14, fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007bff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 28, lineHeight: 28 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    color: "#222",
  },

  textarea: { height: 80, textAlignVertical: "top" },

  typeRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  typeBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: "#eaf5ff", borderColor: "#007bff" },
  typeBtnText: { fontSize: 13 },

  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  dateLabel: { width: 90, fontWeight: "700" },
  dateInput: { flex: 1 },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelBtn: { backgroundColor: "#f13535" },
  saveBtn: { backgroundColor: "#007bff" },
  btnText: { fontWeight: "700", color: "#fff" },
});
