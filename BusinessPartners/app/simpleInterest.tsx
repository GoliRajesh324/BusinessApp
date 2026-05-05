// SimpleInterestPage.tsx
import AppHeader from "@/src/components/AppHeader";
import { getVideoId } from "@/src/utils/VideoStorage";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  addInterest,
  getAllInterests,
  updateInterest,
} from "../src/services/interestService";
import { generateInterestPDF } from "../src/services/pdfGenerator";

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
  startDate: "",
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

  const date = new Date(dateStr);

  const day = date.getDate().toString().padStart(2, "0");

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const month = months[date.getMonth()];
  const year = date.getFullYear();

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
  const [showSummaryAmounts, setShowSummaryAmounts] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [showActive]),
  );

  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("simpleInterest");
    setVideoId(id);
  };
  async function fetchAll() {
    setLoading(true);
    try {
      const data = await getAllInterests();
      setPersons(data || []);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Failed to fetch interests");
    } finally {
      setLoading(false);
    }
  }

  /* ************************************
     ALWAYS SHOW TOTALS FROM ALL RECORDS
     ************************************ */
  const activePersons = persons.filter((p) => !p.endDate || p.endDate === "");

  // ✅ Only ACTIVE records
  const totalTakenAll = activePersons
    .filter((p) => p.type === "given")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalGivenAll = activePersons
    .filter((p) => p.type === "taken")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const totalAmountAll = totalGivenAll - totalTakenAll;

  /* ************************************
     FILTER ONLY FOR DISPLAY (LIST)
     ************************************ */
  const filteredPersons = persons.filter((p) =>
    showActive ? !p.endDate || p.endDate === "" : !!p.endDate,
  );

  const grouped = filteredPersons.reduce<Record<string, Interest[]>>(
    (acc, p) => {
      if (!acc[p.name]) acc[p.name] = [];
      acc[p.name].push(p);
      return acc;
    },
    {},
  );

  const onAddPress = () => {
    router.push("/addEditInterest");
  };

  const onEditOpen = (rec: Interest) => {
    router.push({
      pathname: "/addEditInterest",
      params: {
        id: rec.id,
        name: rec.name,
        type: rec.type,
        amount: rec.amount,
        rate: rec.rate,
        startDate: rec.startDate,
        endDate: rec.endDate,
        comment: rec.comment,
      },
    });
  };

  const handleDownloadPDF = async () => {
    await generateInterestPDF(
      grouped,
      totalAmountAll,
      totalTakenAll,
      totalGivenAll,
      formatAmountIndian,
      formatDateForDisplay,
      undefined,
      false,
    );
  };

  const handleDownloadUserPDF = async (name: string) => {
    const userRecords = grouped[name];
    if (!userRecords || userRecords.length === 0) return;

    // Group ONLY this user
    const singleUserGrouped = {
      [name]: userRecords,
    };

    const totalTaken = userRecords
      .filter((r) => r.type === "given")
      .reduce((s, r) => s + (r.amount || 0), 0);

    const totalGiven = userRecords
      .filter((r) => r.type === "taken")
      .reduce((s, r) => s + (r.amount || 0), 0);

    const totalAmount = totalGiven - totalTaken;

    await generateInterestPDF(
      singleUserGrouped,
      totalAmount,
      totalTaken,
      totalGiven,
      formatAmountIndian,
      formatDateForDisplay,
      name,
      true, // ✅ hide comments
    );
  };
  const openStartDatePicker = () => {
    DateTimePickerAndroid.open({
      value: formData.startDate ? new Date(formData.startDate) : new Date(),
      mode: "date",
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed") return;

        if (selectedDate) {
          const iso = selectedDate.toISOString().split("T")[0];
          setFormData((p) => ({ ...p, startDate: iso }));
        }
      },
    });
  };

  const openEndDatePicker = () => {
    DateTimePickerAndroid.open({
      value: formData.endDate ? new Date(formData.endDate) : new Date(),
      mode: "date",
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed") return;

        if (selectedDate) {
          const iso = selectedDate.toISOString().split("T")[0];
          setFormData((p) => ({ ...p, endDate: iso }));
        }
      },
    });
  };
  const handleSave = async () => {
    if (!formData.name || formData.amount == null) {
      Alert.alert("Validation", "Name and Amount are required");
      return;
    }
    if (formData.startDate && !isValidDateFormat(formData.startDate)) {
      Alert.alert("Invalid Date", "Start Date must be YYYY-MM-DD");
      return;
    }

    if (formData.endDate && !isValidDateFormat(formData.endDate)) {
      Alert.alert("Invalid Date", "End Date must be YYYY-MM-DD");
      return;
    }
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];

    const dto: any = {
      name: toTitleCase(String(formData.name)),
      type: formData.type,
      amount: Number(formData.amount),
      rate: formData.rate ? Number(formData.rate) : 0,

      // ✅ If startDate empty → take today
      startDate:
        formData.startDate && formData.startDate !== ""
          ? formData.startDate
          : today,

      // ✅ End date completely optional
      endDate:
        formData.endDate && formData.endDate !== "" ? formData.endDate : null,

      comment: formData.comment,
    };

    try {
      if (editingId) {
        const updated = await updateInterest(editingId, dto);
        if (updated) {
          setPersons((prev) =>
            prev.map((p) => (p.id === editingId ? updated : p)),
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
      console.log(e);
      Alert.alert("Error", "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (name: string) =>
    setExpanded((prev) => (prev === name ? null : name));
  const isValidDateFormat = (value: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(value);
  };

  const getDueInfo = (records: Interest[]) => {
    const today = new Date();

    const list = records
      .filter((r) => r.startDate)
      .map((r) => {
        const start = new Date(r.startDate!);

        const currentYear = today.getFullYear();

        // 🔥 current year cycle
        let due = new Date(start);
        due.setFullYear(currentYear);

        let overdueYears = 0;

        if (due < today) {
          // ❌ this year already passed → move to next year
          due.setFullYear(currentYear + 1);

          // calculate overdue
          overdueYears = currentYear - start.getFullYear();
        } else {
          // still upcoming this year
          overdueYears = currentYear - start.getFullYear() - 1;
        }

        if (overdueYears < 0) overdueYears = 0;

        return {
          dueDate: due,
          overdueYears,
        };
      });

    if (list.length === 0) return null;

    return list.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];
  };
  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={String("Interest Money")} videoId={videoId} />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Your Remaining Money</Text>
              <Text style={[styles.summaryAmount, styles.totalValue]}>
                {showSummaryAmounts
                  ? `₹ ${formatAmountIndian(totalAmountAll)}`
                  : "********"}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Money Taken By You</Text>
              <Text style={[styles.summaryAmount, styles.givenValue]}>
                {showSummaryAmounts
                  ? `₹ ${formatAmountIndian(totalTakenAll)}`
                  : "********"}
              </Text>
            </View>

            <View style={styles.dividerThin} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Money Given By You</Text>
              <Text style={[styles.summaryAmount, styles.takenValue]}>
                {showSummaryAmounts
                  ? `₹ ${formatAmountIndian(totalGivenAll)}`
                  : "********"}
              </Text>
            </View>

            <View style={styles.summaryActions}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                {/* Active / InActive */}
                <TouchableOpacity
                  style={styles.activeBtn}
                  onPress={() => setShowActive((s) => !s)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={styles.activeText}>
                      {showActive ? "Active" : "InActive"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#007bff" />
                  </View>
                </TouchableOpacity>

                {/* Eye Button */}
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowSummaryAmounts((s) => !s)}
                >
                  <Ionicons
                    name={showSummaryAmounts ? "eye" : "eye-off"}
                    size={18}
                    color="#007bff"
                  />
                </TouchableOpacity>
              </View>

              {/* PDF */}
              <TouchableOpacity
                style={styles.pdfBtn}
                onPress={handleDownloadPDF}
              >
                <Text style={styles.pdfText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

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

              {Object.keys(grouped)
                .sort((a, b) => {
                  if (!showActive) return 0;

                  const aInfo = getDueInfo(grouped[a]);
                  const bInfo = getDueInfo(grouped[b]);

                  if (!aInfo || !bInfo) return 0;

                  // 🔥 Priority: overdue first
                  if (aInfo.overdueYears > 0 && bInfo.overdueYears === 0)
                    return -1;
                  if (aInfo.overdueYears === 0 && bInfo.overdueYears > 0)
                    return 1;

                  // 🔥 More overdue years first
                  if (aInfo.overdueYears !== bInfo.overdueYears) {
                    return bInfo.overdueYears - aInfo.overdueYears;
                  }

                  // 🔥 Then nearest due date
                  return aInfo.dueDate.getTime() - bInfo.dueDate.getTime();
                })
                .map((name) => {
                  const records = grouped[name];
                  // ✅ Upcoming date only for Active records
                  let upcomingDate;

                  if (showActive) {
                    const today = new Date();

                    const upcomingRecord = records
                      .filter((r) => r.startDate)
                      .map((r) => {
                        const start = new Date(r.startDate!);

                        // ✅ ADD 1 YEAR
                        const nextDue = new Date(start);
                        nextDue.setFullYear(start.getFullYear() + 1);

                        return {
                          ...r,
                          dueDate: nextDue,
                        };
                      })
                      .sort((a, b) => {
                        const aDiff = a.dueDate.getTime() - today.getTime();
                        const bDiff = b.dueDate.getTime() - today.getTime();

                        // future first
                        if (aDiff >= 0 && bDiff >= 0) return aDiff - bDiff;
                        if (aDiff >= 0) return -1;
                        if (bDiff >= 0) return 1;

                        // past → latest
                        return b.dueDate.getTime() - a.dueDate.getTime();
                      })[0];

                    upcomingDate = upcomingRecord
                      ? upcomingRecord.dueDate.toISOString().split("T")[0]
                      : undefined;
                  }
                  const netAmount = records.reduce(
                    (s, r) => s + (r.amount || 0),
                    0,
                  );
                  const type = records[0].type;

                  return (
                    <View key={name} style={styles.personCard}>
                      <View style={styles.personHeader}>
                        <TouchableOpacity
                          style={{ flex: 1 }}
                          onPress={() => toggleExpand(name)}
                        >
                          <Text style={styles.personName} numberOfLines={1}>
                            {toTitleCase(name)}
                          </Text>
                          <Text style={styles.personSub}>
                            {records.length} record
                            {records.length > 1 ? "s" : ""}
                          </Text>

                          {showActive &&
                            (() => {
                              const info = getDueInfo(records);
                              if (!info) return null;

                              const dateStr = info.dueDate
                                .toISOString()
                                .split("T")[0];

                              return (
                                <>
                                  {/* ✅ Upcoming */}
                                  <Text style={{ fontSize: 12, marginTop: 2 }}>
                                    <Text style={{ color: "#000" }}>
                                      Upcoming:{" "}
                                    </Text>
                                    <Text
                                      style={
                                        type === "given"
                                          ? styles.givenValue
                                          : styles.takenValue
                                      }
                                    >
                                      {formatDateForDisplay(dateStr)}
                                    </Text>
                                  </Text>

                                  {/* ✅ Overdue */}
                                  {info.overdueYears > 0 && (
                                    <Text style={{ fontSize: 12 }}>
                                      <Text style={{ color: "#000" }}>
                                        Overdue:{" "}
                                      </Text>
                                      <Text style={{ color: "red" }}>
                                        {info.overdueYears} year
                                        {info.overdueYears > 1 ? "s" : ""}
                                      </Text>
                                    </Text>
                                  )}
                                </>
                              );
                            })()}
                        </TouchableOpacity>

                        {/* PER-USER PDF DOWNLOAD */}
                        <TouchableOpacity
                          onPress={() => handleDownloadUserPDF(name)}
                          style={{ padding: 8, marginRight: 6 }}
                        >
                          <Ionicons
                            name="download-outline"
                            size={20}
                            color="#007bff"
                          />
                        </TouchableOpacity>

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
                      </View>

                      {expanded === name && (
                        <View style={styles.recordsContainer}>
                          {records.map((rec) => (
                            <View
                              key={String(rec.id)}
                              style={styles.recordCard}
                            >
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
                                <Text style={styles.recordLabel}>
                                  Interest %
                                </Text>
                                <Text style={styles.recordValue}>
                                  {rec.rate ?? 0} %
                                </Text>
                              </View>
                              <View style={styles.recordRow}>
                                <Text style={styles.recordLabel}>
                                  Interest in Rupee
                                </Text>
                                <Text style={styles.recordValue}>
                                  ₹
                                  {rec.rate
                                    ? (rec.rate / 12).toFixed(2)
                                    : "0.00"}
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
                                  <Text style={styles.recordLabel}>
                                    Comment
                                  </Text>
                                  <Text
                                    style={styles.commentText}
                                    numberOfLines={3}
                                    ellipsizeMode="tail"
                                  >
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

          {/* Add Button */}
          <TouchableOpacity style={styles.fab} onPress={onAddPress}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

/* Styles (unchanged) */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    position: "relative",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
    elevation: 4,
  },
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 40, justifyContent: "center", alignItems: "flex-end" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  backBtn: { padding: 8, marginRight: 8 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    marginHorizontal: 14,
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
    marginHorizontal: 14,
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
    alignItems: "flex-start", // ✅ important for multiline
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
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    maxHeight: "85%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 10,
    paddingBottom: 6, // 👈 ADD THIS
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
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

  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelBtn: { backgroundColor: "#f13535" },
  saveBtn: { backgroundColor: "#007bff" },
  btnText: { fontWeight: "700", color: "#fff" },
  eyeBtn: {
    backgroundColor: "#eef6ff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  datePickerBox: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  dateInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },

  dateTextInput: {
    flex: 1,
    height: 45,
    fontSize: 14,
  },
  commentText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flexShrink: 1, // ✅ prevents overflow
    maxWidth: "70%", // ✅ keeps layout intact
  },
});
