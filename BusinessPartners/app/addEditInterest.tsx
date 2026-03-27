import AppHeader from "@/src/components/AppHeader";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addInterest, updateInterest } from "../src/services/interestService";

type Interest = {
  id?: number | string;
  name: string;
  type: "given" | "taken";
  amount: number;
  rate?: number;
  startDate?: string;
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

export default function AddEditInterest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);

  const [formData, setFormData] = useState<Partial<Interest>>(emptyForm());
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [saving, setSaving] = useState(false);

  // ✅ NEW: Rate type
  const [rateType, setRateType] = useState<"percent" | "rupee">("percent");

  useEffect(() => {
    if (params.id) {
      setEditingId(params.id as string);

      setFormData({
        name: (params.name as string) || "",
        type: (params.type as "given" | "taken") || "taken",
        amount: params.amount ? Number(params.amount) : undefined,
        rate: params.rate ? Number(params.rate) : undefined,
        startDate: (params.startDate as string) || "",
        endDate: (params.endDate as string) || "",
        comment: (params.comment as string) || "",
      });

      // backend always % → default
      setRateType("percent");
    }
  }, []);

  const formatDate = (date?: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-GB");
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

          if (formData.startDate && iso < formData.startDate) {
            Alert.alert("Invalid Date", "End date cannot be before start date");
            return;
          }

          setFormData((p) => ({ ...p, endDate: iso }));
        }
      },
    });
  };

  const handleSave = async () => {
    if (!formData.name) return Alert.alert("Validation", "Name is required");
    if (!formData.amount)
      return Alert.alert("Validation", "Amount is required");
    if (!formData.rate)
      return Alert.alert("Validation", "Interest rate is required");
    if (!formData.startDate)
      return Alert.alert("Validation", "Start date is required");

    setSaving(true);

    const today = new Date().toISOString().split("T")[0];

    const convertedRate =
      rateType === "percent"
        ? Number(formData.rate)
        : Number(formData.rate) * 12;

    const dto: any = {
      name: toTitleCase(String(formData.name)),
      type: formData.type,
      amount: Number(formData.amount),
      rate: convertedRate,
      startDate: formData.startDate || today,
      endDate: formData.endDate || null,
      comment: formData.comment,
    };

    try {
      if (editingId) {
        await updateInterest(editingId, dto);
      } else {
        await addInterest(dto);
      }

      Alert.alert("Success", editingId ? "Updated" : "Saved");
      router.back();
    } catch {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={editingId ? "Edit Record" : "Add Record"}
          rightComponent={
            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.headerRight,
                {
                  opacity:
                    saving ||
                    !formData.name ||
                    !formData.amount ||
                    !formData.rate ||
                    !formData.startDate
                      ? 0.5
                      : 1,
                },
              ]}
              disabled={
                saving ||
                !formData.name ||
                !formData.amount ||
                !formData.rate ||
                !formData.startDate
              }
            >
              <Text style={styles.saveText}>
                {saving ? "Saving..." : editingId ? "Update" : "Save"}
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, padding: 16 }}>
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 120 }}
              >
                {/* Name */}
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  placeholder="Enter Name"
                  style={styles.input}
                  value={String(formData.name ?? "")}
                  onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
                />

                {/* Type */}
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      formData.type === "taken" && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      setFormData((p) => ({ ...p, type: "taken" }))
                    }
                  >
                    <Text style={{ color: "green", fontWeight: "600" }}>
                      Money Given
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      formData.type === "given" && styles.typeBtnActive,
                    ]}
                    onPress={() =>
                      setFormData((p) => ({ ...p, type: "given" }))
                    }
                  >
                    <Text style={{ color: "red", fontWeight: "600" }}>
                      Money Taken
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <Text style={styles.label}>Amount *</Text>
                <TextInput
                  placeholder="Enter Amount"
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.amount != null ? String(formData.amount) : ""}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.]/g, "");
                    const valid = cleaned.replace(/(\..*?)\..*/g, "$1");

                    setFormData((p) => ({
                      ...p,
                      amount: valid === "" ? undefined : Number(valid), // ✅ CORRECT
                    }));
                  }}
                />
                {/* Rate */}
                <Text style={styles.label}>Interest Rate *</Text>

                <Text
                  style={{
                    paddingBottom: 5,
                    fontSize: 11,
                    color: "#888",
                    marginTop: 4,
                  }}
                >
                  {rateType === "rupee"
                    ? "Enter Rupee (₹1 = 12%, ₹1.5 = 18%)"
                    : "Enter percentage (e.g. 12%)"}
                </Text>

                {/* 🔥 SEGMENT CONTROL */}
                <View style={styles.segmentContainer}>
                  <View
                    style={[
                      styles.segmentIndicator,
                      {
                        left: rateType === "rupee" ? "0%" : "50%",
                      },
                    ]}
                  />

                  <TouchableOpacity
                    style={styles.segmentItem}
                    onPress={() => setRateType("rupee")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        rateType === "rupee" && styles.segmentTextActive,
                      ]}
                    >
                      ₹
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.segmentItem}
                    onPress={() => setRateType("percent")}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        rateType === "percent" && styles.segmentTextActive,
                      ]}
                    >
                      %
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Rate Input */}
                <TextInput
                  placeholder="Enter Rate of Interest"
                  placeholderTextColor="#999" // ✅ FIX
                  style={[styles.input, { color: "#000" }]} // ✅ FIX
                  keyboardType="numeric"
                  value={formData.rate != null ? String(formData.rate) : ""}
                  onChangeText={(t) =>
                    setFormData((p) => ({
                      ...p,
                      rate: t === "" ? undefined : Number(t),
                    }))
                  }
                />

                {/* Start Date */}
                <Text style={styles.label}>Start Date *</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={openStartDatePicker}
                >
                  <View style={styles.dateRow}>
                    <Text>
                      {formData.startDate
                        ? formatDate(formData.startDate)
                        : "Select Start Date"}
                    </Text>
                    <Text>📅</Text>
                  </View>
                </TouchableOpacity>

                {/* End Date */}
                <Text style={styles.label}>End Date</Text>
                <View
                  style={[
                    styles.input,
                    { flexDirection: "row", alignItems: "center" },
                  ]}
                >
                  {/* Date Picker Click */}
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={openEndDatePicker}
                  >
                    <Text>
                      {formData.endDate
                        ? formatDate(formData.endDate)
                        : "Select End Date"}
                    </Text>
                  </TouchableOpacity>
                  {/* ❌ Clear Button */}
                  {formData.endDate && (
                    <TouchableOpacity
                      onPress={() =>
                        setFormData((p) => ({ ...p, endDate: "" }))
                      }
                    >
                      <Text
                        style={{
                          marginRight: 10,
                          color: "red",
                          fontWeight: "700",
                        }}
                      >
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                  {/* 📅 Icon */}
                  <TouchableOpacity onPress={openEndDatePicker}>
                    <Text>📅</Text>
                  </TouchableOpacity>
                </View>

                {/* Comment */}
                <Text style={styles.label}>Comment</Text>
                <TextInput
                  placeholder="Enter Comment"
                  placeholderTextColor="#999" // ✅ FIX
                  style={[styles.input, { height: 80 }]}
                  multiline
                  onFocus={() =>
                    scrollRef.current?.scrollToEnd({ animated: true })
                  }
                  value={formData.comment ?? ""}
                  onChangeText={(t) =>
                    setFormData((p) => ({ ...p, comment: t }))
                  }
                />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#4f4949",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  typeBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  typeBtnActive: { backgroundColor: "#eaf5ff", borderColor: "#007bff" },
  headerRight: { justifyContent: "center", alignItems: "flex-end" },
  saveText: { color: "#fff", fontWeight: "700" },
  dateRow: { flexDirection: "row", justifyContent: "space-between" },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  rateTypeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  rateTypeText: { fontWeight: "700", fontSize: 16 },
  pillContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f3f6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },

  pillButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },

  pillActive: {
    backgroundColor: "#007bff",
    elevation: 2, // Android shadow
  },

  pillText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 14,
  },

  pillTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#e6f0fa",
    borderRadius: 14,
    position: "relative",
    height: 45,
    marginBottom: 12,
    overflow: "hidden",
  },

  segmentIndicator: {
    position: "absolute",
    width: "50%",
    height: "100%",
    backgroundColor: "#36c21a",
    borderRadius: 12,
    elevation: 3, // Android shadow
  },

  segmentItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },

  segmentText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
  },

  segmentTextActive: {
    fontWeight: "700",
  },
});
