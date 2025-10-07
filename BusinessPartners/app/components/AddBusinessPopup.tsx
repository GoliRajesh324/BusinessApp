import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import BASE_URL from "../../src/config/config";

interface Partner {
  name: string;
  share: string;
}
interface Props {
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
}: Props) {
  const [businessName, setBusinessName] = useState<string>(
    editingBusiness?.name || ""
  );
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

  const slideAnim = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Smooth entrance
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  const translateY = Animated.add(
    slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [600, 0],
    }),
    panY
  );

  // Detect swipe down to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150) {
          Animated.timing(panY, {
            toValue: 600,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            panY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

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
      Alert.alert("Error", "Share % must be positive");
      return;
    }

    const totalShare =
      partners.reduce((sum, p, idx) => {
        if (idx === editingIndex) return sum;
        return sum + Number(p.share);
      }, 0) + shareNum;

    if (totalShare > 100) {
      Alert.alert("Error", "Total share cannot exceed 100%");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...partners];
      updated[editingIndex] = {
        name: partnerName.trim(),
        share: shareNum.toString(),
      };
      setPartners(updated);
      setEditingIndex(null);
    } else {
      setPartners([
        ...partners,
        { name: partnerName.trim(), share: shareNum.toString() },
      ]);
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
      partners: partners.map((p) => ({
        username: p.name,
        share: Number(p.share),
      })),
    };

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Session expired", "Please login again.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (editingBusiness) {
        await axios.put(
          `${BASE_URL}/api/business/${editingBusiness.id}`,
          payload,
          { headers }
        );
      } else {
        await axios.post(`${BASE_URL}/api/business/create`, payload, {
          headers,
        });
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
        Alert.alert(
          "Unauthorized",
          serverMsg || "Access denied (403). Please login or check permissions."
        );
        // do not auto-navigate away — keep behaviour unchanged
      } else {
        Alert.alert("Error", serverMsg || "Failed to save business");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveDisabled =
    businessName.trim() === "" || partners.length === 0 || loading;

  return (
    <View style={styles.overlay}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.bottomSheet, { transform: [{ translateY }] }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.dragHandle} />

          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {editingBusiness ? "Edit Business" : "Add Business"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <Text style={styles.label}>Business Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Business Name"
              placeholderTextColor="#888"   // Add this line
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Partner Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Partner Name"
              placeholderTextColor="#888"   // Add this line
              value={partnerName}
              onChangeText={setPartnerName}
            />

            <View style={styles.partnerRow}>
              <TextInput
                style={[styles.input, styles.shareInput]}
                placeholder="Enter Share %"
                placeholderTextColor="#888"   // Add this line
                keyboardType="numeric"
                value={share}
                onChangeText={setShare}
              />
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  editingIndex !== null && styles.updateBtn,
                ]}
                onPress={handleAddOrUpdatePartner}
              >
                <Text style={styles.addBtnText}>
                  {editingIndex !== null ? "Update" : "Add"}
                </Text>
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
                      onPress={() => {
                        setEditingIndex(idx);
                        setPartnerName(p.name);
                        setShare(p.share);
                      }}
                      style={styles.smallBtn}
                    >
                      <Text style={styles.smallBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        setPartners(partners.filter((_, i) => i !== idx))
                      }
                      style={[styles.smallBtn, styles.deleteBtn]}
                    >
                      <Text style={styles.smallBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saveDisabled && styles.disabledBtn]}
              onPress={handleSave}
              disabled={saveDisabled}
            >
              {loading ? (
                <Text style={styles.saveBtnText}>Saving...</Text>
              ) : (
                <Text style={styles.saveBtnText}>Save Business</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 10,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold" },
  closeBtn: { padding: 5 },
  closeText: { fontSize: 18 },
  scrollContent: { paddingBottom: 20 },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  partnerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  shareInput: { flex: 1, marginRight: 10 },
  addBtn: { backgroundColor: "#2563eb", padding: 10, borderRadius: 8 },
  updateBtn: { backgroundColor: "#16a34a" },
  addBtnText: { color: "#fff", fontWeight: "bold" },
  partnerCard: {
    flexDirection: "row",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 5,
    alignItems: "center",
  },
  partnerName: { fontWeight: "bold", fontSize: 16 },
  partnerShare: { color: "#555" },
  partnerActions: { flexDirection: "row", gap: 5 },
  smallBtn: { padding: 5, backgroundColor: "#2563eb", borderRadius: 5, marginLeft: 5 },
  deleteBtn: { backgroundColor: "#dc2626" },
  smallBtnText: { color: "#fff" },
  emptyPartners: { textAlign: "center", color: "#888", marginVertical: 10 },
  saveBtn: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  disabledBtn: { backgroundColor: "#999" },
});
