// AddBusinessPopup.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../../src/config/config";

interface Partner {
  name: string;
  share: string;
}
interface Props {
  onClose: () => void;
  onSave: () => void;
  editingBusiness?: any;
}

/**
 * NOTE:
 * - This component is a *content view* (no internal Modal) — it is designed
 *   to be placed inside the Modal wrapper you're already using in Dashboard.
 */
export default function AddBusinessPopup({ onClose, onSave, editingBusiness }: Props) {
  const [businessName, setBusinessName] = useState<string>(editingBusiness?.name || "");
  const [partnerName, setPartnerName] = useState<string>("");
  const [share, setShare] = useState<string>("");
  const [partners, setPartners] = useState<Partner[]>(
    editingBusiness?.partners
      ? editingBusiness.partners.map((p: any) => ({
          name: p.username ?? p.name,
          share: String(p.share),
        }))
      : []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Keep form synced when editingBusiness prop changes
  useEffect(() => {
    if (editingBusiness) {
      setBusinessName(editingBusiness.name || "");
      setPartners(
        (editingBusiness.partners || []).map((p: any) => ({
          name: p.username ?? p.name,
          share: String(p.share),
        }))
      );
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingBusiness]);

  const resetForm = () => {
    setBusinessName("");
    setPartnerName("");
    setShare("");
    setPartners([]);
    setEditingIndex(null);
  };

  const handleAddOrUpdatePartner = () => {
    if (!partnerName.trim() || !share.trim()) {
      Alert.alert("Error", "Enter partner name and share %");
      return;
    }
    const shareNum = Number(share);
    if (isNaN(shareNum) || shareNum <= 0) {
      Alert.alert("Error", "Share % must be a positive number");
      return;
    }
    const totalShare =
      partners.reduce((sum, p, idx) => {
        if (idx === editingIndex) return sum; // skip old when editing
        return sum + Number(p.share);
      }, 0) + shareNum;

    if (totalShare > 100) {
      Alert.alert("Error", "Total share cannot exceed 100%");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...partners];
      updated[editingIndex] = { name: partnerName.trim(), share: shareNum.toString() };
      setPartners(updated);
      setEditingIndex(null);
    } else {
      setPartners([...partners, { name: partnerName.trim(), share: shareNum.toString() }]);
    }

    setPartnerName("");
    setShare("");
  };

  const handleEditPartner = (index: number) => {
    setPartnerName(partners[index].name);
    setShare(partners[index].share);
    setEditingIndex(index);
  };

  const handleRemovePartner = (index: number) => {
    const updated = [...partners];
    updated.splice(index, 1);
    setPartners(updated);
    // if we removed the editing index, reset it
    if (editingIndex === index) setEditingIndex(null);
  };

  // Save (create or update)
  const handleSave = async () => {
    if (!businessName.trim() || partners.length === 0) {
      Alert.alert("Error", "Enter business name and partners");
      return;
    }

    const totalShare = partners.reduce((sum, p) => sum + Number(p.share), 0);
    if (totalShare !== 100) {
      Alert.alert("Error", "Total share must be exactly 100%");
      return;
    }

    const payload = {
      name: businessName.trim(),
      partners: partners.map((p) => ({ username: p.name, share: Number(p.share) })),
    };

    try {
      setLoading(true);

      // ALWAYS read token right before the call (helps avoid stale/undefined token)
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session expired", "Please login again.");
        return;
      }

      // DEBUG: uncomment if you need to see token (do NOT keep in prod)
      // //console.log('token startsWith:', token?.slice(0, 8));

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (editingBusiness) {
        await axios.put(`${BASE_URL}/api/business/${editingBusiness.id}`, payload, { headers });
      } else {
        await axios.post(`${BASE_URL}/api/business/create`, payload, { headers });
      }

      // successful save: call parent handlers and reset
      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      // Detailed logging for debugging 403
      console.error("AddBusiness save error:", {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      });

      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data;

      if (status === 403) {
        Alert.alert("Unauthorized", serverMsg || "Access denied (403). Please login or check permissions.");
        // do not auto-navigate away — keep behaviour unchanged
      } else {
        Alert.alert("Error", serverMsg || "Failed to save business");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDisabled = businessName.trim() === "" || partners.length === 0 || loading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.wrapper}
    >
      <View style={styles.container}>
        {/* header row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{editingBusiness ? "Edit Business" : "Add Business"}</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              onClose();
            }}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          style={{ width: "100%" }}
        >
          <Text style={styles.label}>Business name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Business Name"
            value={businessName}
            onChangeText={setBusinessName}
            returnKeyType="done"
          />

          <Text style={[styles.label, { marginTop: 8 }]}>Add partner</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            value={partnerName}
            onChangeText={setPartnerName}
          />

          <View style={styles.partnerRow}>
            <TextInput
              style={[styles.input, styles.shareInput]}
              placeholder="Enter Share %"
              keyboardType="numeric"
              value={share}
              onChangeText={setShare}
            />
            <TouchableOpacity
              style={[styles.addBtn, editingIndex !== null ? styles.updateBtn : {}]}
              onPress={handleAddOrUpdatePartner}
            >
              <Text style={styles.addBtnText}>{editingIndex !== null ? "Update" : "Add"}</Text>
            </TouchableOpacity>
          </View>

          {partners.length === 0 ? (
            <Text style={styles.emptyPartners}>No partners added</Text>
          ) : (
            partners.map((p, idx) => (
              <View key={idx} style={styles.partnerCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerName}>{p.name}</Text>
                  <Text style={styles.partnerShare}>{p.share}%</Text>
                </View>
                <View style={styles.partnerActions}>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => handleEditPartner(idx)}
                  >
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.removeBtn]}
                    onPress={() => handleRemovePartner(idx)}
                  >
                    <Text style={[styles.smallBtnText, { color: "white" }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelAction]}
            onPress={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
            <Text style={styles.actionText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.saveAction,
              saveDisabled ? styles.disabledSave : {},
            ]}
            onPress={handleSave}
            disabled={saveDisabled}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%", alignItems: "center" },
  container: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    maxHeight: "86%",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 6 },
  closeText: { fontSize: 18, color: "#444" },
  scrollContent: { paddingVertical: 12 },
  label: { color: "#374151", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fbfbfb",
  },
  partnerRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  shareInput: { flex: 1, marginRight: 8, minWidth: 80 },
  addBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  updateBtn: { backgroundColor: "#f59e0b" },
  addBtnText: { color: "#fff", fontWeight: "700" },
  emptyPartners: { textAlign: "center", color: "#9ca3af", marginTop: 12 },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  partnerName: { fontWeight: "600" },
  partnerShare: { color: "#6b7280", marginTop: 4 },
  partnerActions: { flexDirection: "row" },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 10, marginLeft: 8, borderRadius: 8, backgroundColor: "#fde68a" },
  removeBtn: { backgroundColor: "#ef4444" },
  smallBtnText: { fontWeight: "600", color: "#1f2937" },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center", marginHorizontal: 6 },
  cancelAction: { backgroundColor: "#ef4444" },
  saveAction: { backgroundColor: "#16a34a" },
  disabledSave: { backgroundColor: "#9ca3af" },
  actionText: { color: "#fff", fontWeight: "700" },
});
