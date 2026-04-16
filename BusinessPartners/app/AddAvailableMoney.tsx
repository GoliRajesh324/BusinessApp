import AppHeader from "@/src/components/AppHeader";
import BASE_URL from "@/src/config/config";
import { numberToWords } from "@/src/utils/numberToWords";
import { showToast } from "@/src/utils/ToastService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AddAvailableMoney = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const businessId = params.businessId as string;
  const businessName = params.businessName as string;
  const cropId = params.cropId as string;

  const { mode, investmentGroupId } = params;
  const isEdit = mode === "edit";

  const [rows, setRows] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // ✅ Load token
  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    load();
  }, []);

  // ✅ Fetch partners (ONLY for ADD mode)
  useEffect(() => {
    if (!token || !businessId || isEdit) return;

    const fetchPartners = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/business/${businessId}/partners`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await res.json();

        if (data?.partners) {
          const mapped = data.partners.map((p: any) => ({
            id: p.partnerId,
            name: p.username,
            amount: "",
          }));

          setRows(mapped);
        }
      } catch (err) {
        console.log("❌ Partner fetch failed:", err);
      }
    };

    fetchPartners();
  }, [token, businessId, isEdit]);

  // ✅ FETCH EXISTING DEPOSIT DATA (EDIT MODE)
  useEffect(() => {
    if (!isEdit || !investmentGroupId || !token) return;

    fetchDepositData();
  }, [isEdit, investmentGroupId, token]);

  const fetchDepositData = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/investment/all-group-investments/${investmentGroupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      preloadDepositData(data);
    } catch (e) {
      showToast("Failed to load deposit data", "error");
    }
  };

  // ✅ PRELOAD LOGIC (FIXED)
  const preloadDepositData = (data: any[]) => {
    if (!data || !data.length) return;

    const first = data[0];

    // ✅ description
    setDescription(first.description || "");

    // ✅ map partner-wise amounts
    const mapped = data.map((inv) => ({
      id: inv.partnerId,
      name: inv.partnerName,
      amount: String(inv.totalAmount || 0),
    }));

    setRows(mapped);
  };

  // ✅ SAVE (UNCHANGED for now)
  const handleSave = async () => {
    if (!description || description.trim() === "") {
      Alert.alert("Error", "Description is required");
      return;
    }

    const hasValidAmount = rows.some((r) => r.amount && Number(r.amount) > 0);

    if (!hasValidAmount) {
      Alert.alert("Error", "Enter at least one partner amount");
      return;
    }

    try {
      const payload = {
        businessId: Number(businessId),
        cropId: Number(cropId),
        description,
        createdBy: await AsyncStorage.getItem("userName"),
        // ✅ ADD THIS LINE
        investmentGroupId: isEdit ? Number(investmentGroupId) : null,

        partners: rows
          .filter((r) => r.amount && Number(r.amount) > 0)
          .map((r) => ({
            partnerId: r.id,
            availableMoney: Number(r.amount),
          })),
      };

      console.log("🚀 Payload:", payload);

      const res = await fetch(`${BASE_URL}/api/investment/initial-deposit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to save");
      }

      Alert.alert("Success", "Available money saved successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.log("❌ Save error:", err);
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  const isValid =
    description && rows.some((r) => r.amount && Number(r.amount) > 0);

  return (
    <>
      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />

        <AppHeader
          title={isEdit ? "Edit Available Money" : "Add Available Money"}
          rightComponent={
            <TouchableOpacity onPress={handleSave} disabled={!isValid}>
              <Text style={{ color: isValid ? "#fff" : "#ccc" }}>Save</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>

      {/* BODY */}
      <View style={{ flex: 1, backgroundColor: "#f5f7fb" }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Business Name */}
          <Text style={styles.businessName}>{businessName}</Text>

          {/* Edit Mode Info */}
          {isEdit && (
            <Text style={{ marginBottom: 10, color: "#666" }}>
              Editing existing deposit
            </Text>
          )}

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.inputBox}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Partners */}
          <View style={{ marginTop: 10 }}>
            <Text style={styles.sectionTitle}>Partners</Text>

            {rows.map((r, index) => (
              <View key={r.id} style={styles.partnerCard}>
                <Text style={styles.partnerName}>{r.name.toUpperCase()}</Text>

                <TextInput
                  style={styles.partnerInput}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  value={r.amount}
                  onChangeText={(val) => {
                    const updated = [...rows];
                    updated[index].amount = val;
                    setRows(updated);
                  }}
                />

                {!!r.amount && Number(r.amount) > 0 && (
                  <Text style={styles.amountWords}>
                    {numberToWords(Number(r.amount))}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
};

export default AddAvailableMoney;

const styles = StyleSheet.create({
  container: {
    padding: 15,
    paddingTop: 10,
    backgroundColor: "#f5f7fb",
  },

  businessName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },

  inputContainer: {
    marginBottom: 10,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },

  inputBox: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },

  partnerCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6e6e6",
    marginBottom: 12,
  },

  partnerName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },

  partnerInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
  },

  amountWords: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    marginTop: 4,
  },
});
