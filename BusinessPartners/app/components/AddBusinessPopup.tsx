// app/components/AddBusinessPopup.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import axios from "axios";
import BASE_URL from "../../src/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AddBusinessPopupProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingBusiness?: any;
}

export default function AddBusinessPopup({
  visible,
  onClose,
  onSave,
  editingBusiness,
}: AddBusinessPopupProps) {
  const [businessName, setBusinessName] = useState(editingBusiness?.name || "");
  const [partners, setPartners] = useState(editingBusiness?.partners || []);
  const [partnerName, setPartnerName] = useState("");
  const [partnerShare, setPartnerShare] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const businessInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => businessInputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleAddOrUpdatePartner = () => {
    if (!partnerName.trim() || !partnerShare) {
      return Alert.alert("Error", "Enter partner name & share");
    }

    const shareNum = Number(partnerShare);
    if (isNaN(shareNum) || shareNum <= 0) {
      return Alert.alert("Error", "Share % must be a positive number");
    }

    const totalShare =
      partners.reduce((sum, p, idx) => (idx === editingIndex ? sum : sum + p.share), 0) +
      shareNum;

    if (totalShare > 100) return Alert.alert("Error", "Total share cannot exceed 100%");

    const updated = [...partners];
    if (editingIndex !== null) {
      updated[editingIndex] = { name: partnerName.trim(), share: shareNum };
      setEditingIndex(null);
    } else {
      updated.push({ name: partnerName.trim(), share: shareNum });
    }

    setPartners(updated);
    setPartnerName("");
    setPartnerShare("");
  };

  const handleEditPartner = (idx: number) => {
    setPartnerName(partners[idx].name);
    setPartnerShare(partners[idx].share.toString());
    setEditingIndex(idx);
  };

  const handleRemovePartner = (idx: number) => {
    const updated = [...partners];
    updated.splice(idx, 1);
    setPartners(updated);
  };

  const handleSaveBusiness = async () => {
    if (!businessName.trim()) return Alert.alert("Error", "Enter business name");

    const totalShare = partners.reduce((sum, p) => sum + p.share, 0);
    if (totalShare !== 100) return Alert.alert("Error", "Total share must be 100%");

    const username = await AsyncStorage.getItem("username");
    const token = await AsyncStorage.getItem("token");

    const payload = {
      name: businessName.trim(),
      createdBy: username,
      partners: partners.map((p) => ({ username: p.name, share: p.share })),
    };

    try {
      setLoading(true);

      if (editingBusiness) {
        await axios.put(`${BASE_URL}/api/business/${editingBusiness.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert("Success", "Business updated!");
      } else {
        await axios.post(`${BASE_URL}/api/business/create`, payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        Alert.alert("Success", "Business added!");
      }

      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Error saving business");
    } finally {
      setLoading(false);
    }
  };

  const screenHeight = Dimensions.get("window").height;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay}>
            <View style={[styles.popup, { maxHeight: screenHeight * 0.85 }]}>
              <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.title}>
                  {editingBusiness ? "Edit Business" : "Add Business"}
                </Text>

                <TextInput
                  ref={businessInputRef}
                  placeholder="Business Name"
                  value={businessName}
                  onChangeText={setBusinessName}
                  style={styles.input}
                  returnKeyType="done"
                />

                <Text style={styles.sectionTitle}>Partners</Text>
                <View style={styles.partnerInputs}>
                  <TextInput
                    placeholder="Partner Name"
                    value={partnerName}
                    onChangeText={setPartnerName}
                    style={[styles.input, { flex: 2 }]}
                  />
                  <TextInput
                    placeholder="Share %"
                    value={partnerShare}
                    onChangeText={setPartnerShare}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleAddOrUpdatePartner}
                  >
                    <Text style={{ color: "white" }}>
                      {editingIndex !== null ? "Update" : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {partners.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    {partners.map((p, idx) => (
                      <View key={idx} style={styles.partnerRow}>
                        <Text>
                          {p.name} : {p.share}%
                        </Text>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          <TouchableOpacity
                            onPress={() => handleEditPartner(idx)}
                            style={styles.editBtn}
                          >
                            <Text>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemovePartner(idx)}
                            style={styles.deleteBtn}
                          >
                            <Text style={{ color: "white" }}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.bottomBtns}>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#16a34a" }]}
                    onPress={handleSaveBusiness}
                    disabled={loading}
                  >
                    <Text style={{ color: "white" }}>
                      {loading ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, { backgroundColor: "#e5e7eb" }]}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
  },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  sectionTitle: { fontWeight: "bold", marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  partnerInputs: { flexDirection: "row", alignItems: "center", gap: 6 },
  addBtn: { backgroundColor: "#2563eb", padding: 8, borderRadius: 6 },
  partnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  editBtn: { padding: 6, backgroundColor: "#facc15", borderRadius: 6 },
  deleteBtn: { padding: 6, backgroundColor: "#ef4444", borderRadius: 6 },
  bottomBtns: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 6, alignItems: "center" },
});
