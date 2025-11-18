// SimpleInterestPage.tsx
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
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

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<
    "startDate" | "endDate" | null
  >(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAll();
  }, [showActive]);

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

  // Filter active/inactive
  const filteredPersons = persons.filter((p) =>
    showActive
      ? !p.endDate || p.endDate === ""
      : !!p.endDate && p.endDate !== ""
  );

  // Totals
  const totalTakenByYou = filteredPersons
    .filter((p) => p.type === "given")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalGivenByYou = filteredPersons
    .filter((p) => p.type === "taken")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const totalAmount = totalGivenByYou - totalTakenByYou;

  // grouped by name
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

  const handleSave = async () => {
    if (
      !formData.name ||
      formData.amount === undefined ||
      formData.amount === null
    ) {
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
      endDate: formData.endDate || null,
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
        if (saved) {
          setPersons((prev) => [...prev, saved]);
        }
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

  const handleOpenDatePicker = (field: "startDate" | "endDate") => {
    // parse existing date if present
    const existing =
      field === "startDate" ? formData.startDate : formData.endDate;
    const parsed = existing ? new Date(existing) : new Date();
    setTempDate(parsed);
    setDatePickerField(field);
    setShowDatePicker(true);
  };
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");

    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dd = String(selectedDate.getDate()).padStart(2, "0");

      const formatted = `${yyyy}-${mm}-${dd}`;

      if (datePickerField === "startDate") {
        setFormData((p) => ({ ...p, startDate: formatted }));
      } else if (datePickerField === "endDate") {
        setFormData((p) => ({ ...p, endDate: formatted }));
      }
    }

    setDatePickerField(null);
  };

  // PDF placeholder (not implemented here)
  const handleDownloadPDF = () =>
    Alert.alert(
      "PDF Export",
      "PDF export requires native libs (use expo-print / react-native-html-to-pdf)."
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#222" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interest Money</Text>
        </View>

        {/* Single Summary Card (Option A) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Your Remaining Money</Text>
            <Text style={[styles.summaryAmount, styles.totalValue]}>
              ₹ {formatAmountIndian(totalAmount)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Money Taken By You</Text>
            <Text style={[styles.summaryAmount, styles.givenValue]}>
              ₹ {formatAmountIndian(totalTakenByYou)}
            </Text>
          </View>

          <View style={styles.dividerThin} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Money Given By You</Text>
            <Text style={[styles.summaryAmount, styles.takenValue]}>
              ₹ {formatAmountIndian(totalGivenByYou)}
            </Text>
          </View>

          {/* action row */}
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

        {/* Content list */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {Object.keys(grouped).length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>
                  No records yet. Tap + to add.
                </Text>
              </View>
            )}

            {Object.keys(grouped).map((name) => {
              const records = grouped[name];
              const netAmount = records.reduce(
                (s, r) => s + (r.amount || 0),
                0
              );
              const type = records[0].type;
              return (
                <View key={name} style={styles.personCard}>
                  <TouchableOpacity
                    style={styles.personHeader}
                    onPress={() => toggleExpand(name)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={styles.personName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
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
                          type === "given"
                            ? styles.givenValue
                            : styles.takenValue,
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
                                rec.type === "given"
                                  ? styles.givenValue
                                  : styles.takenValue,
                              ]}
                            >
                              {rec.type === "given"
                                ? "Money Taken By You"
                                : "Money Given By You"}
                            </Text>

                            <TouchableOpacity
                              onPress={() => onEditOpen(rec)}
                              style={styles.recordEditBtn}
                            >
                              <FontAwesome
                                name="edit"
                                size={16}
                                color="#007bff"
                              />
                            </TouchableOpacity>
                          </View>

                          <View style={styles.recordRow}>
                            <Text style={styles.recordLabel}>Amount</Text>
                            <Text style={styles.recordValue}>
                              ₹ {formatAmountIndian(rec.amount)}
                            </Text>
                          </View>

                          <View style={styles.recordRow}>
                            <Text style={styles.recordLabel}>Interest</Text>
                            <Text style={styles.recordValue}>
                              {rec.rate ?? 0} %
                            </Text>
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
                              <Text style={styles.recordValue}>
                                {rec.comment}
                              </Text>
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

        {/* Floating Add button */}
        <TouchableOpacity style={styles.fab} onPress={onAddPress}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Add / Edit Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent
          onRequestClose={() => {
            if (!saving) setShowModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingId ? "Edit Record" : "Add Record"}
                </Text>
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

                {/* Type selector */}
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      formData.type === "taken" && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      setFormData((p) => ({ ...p, type: "taken" }))
                    }
                    disabled={saving}
                  >
                    <Text style={styles.typeBtnText}>Money Given By You</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      formData.type === "given" && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      setFormData((p) => ({ ...p, type: "given" }))
                    }
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

                {/* Native Date pickers: open when user taps the row */}
                <TouchableOpacity
                  style={styles.dateRow}
                  onPress={() => handleOpenDatePicker("startDate")}
                >
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text
                    style={[
                      styles.input,
                      styles.dateInput,
                      { paddingVertical: 12 },
                    ]}
                  >
                    {formData.startDate ?? ""}
                  </Text>
                </TouchableOpacity>

                {editingId && (
                  <TouchableOpacity
                    style={styles.dateRow}
                    onPress={() => handleOpenDatePicker("endDate")}
                  >
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text
                      style={[
                        styles.input,
                        styles.dateInput,
                        { paddingVertical: 12 },
                      ]}
                    >
                      {formData.endDate ?? ""}
                    </Text>
                  </TouchableOpacity>
                )}

                <TextInput
                  placeholder="Comment"
                  placeholderTextColor="#888"
                  style={[styles.input, styles.textarea]}
                  value={formData.comment ?? ""}
                  onChangeText={(t) =>
                    setFormData((p) => ({ ...p, comment: t }))
                  }
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

        {/* 👇 Add the DateTimePicker HERE */}
        {showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event: DateTimePickerEvent, date?: Date) => {
              onDateChange(event, date);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/* Styles (kept clean and responsive) */
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
