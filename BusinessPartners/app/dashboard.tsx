import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../src/config/config";
import AddBusinessPopup from "./components/AddBusinessPopup";

export default function Dashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [confirmStart, setConfirmStart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Load token & userId before fetching
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");
      console.log("📌 Loaded token:", t);
      console.log("📌 Loaded userId:", u);
      setToken(t);
      setUserId(u);
    };
    loadData();
  }, []);

  // ✅ Fetch businesses
  const fetchBusinesses = async () => {
    if (!token || !userId) return;
    try {
      console.log("📡 Fetching businesses...");
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/business/user/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch businesses");
      const data = await response.json();
      console.log("✅ Businesses:", data);

      const updated = data.map((b: any) => {
        let inProgress = false;
        if (b.crops && b.crops.length > 0) {
          inProgress = b.crops.some((c: any) => c.cropInProgress === true);
        }
        return { ...b, cropInProgress: inProgress };
      });

      setBusinesses(updated);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      Alert.alert("Error", "Error loading businesses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && userId) {
      fetchBusinesses();
    }
  }, [token, userId]);

  // Save (add/edit)
  const handleSaveBusiness = async () => {
    await fetchBusinesses();
    setShowPopup(false);
    setEditingBusiness(null);
  };

  // Start crop & navigate
  const handleStartCrop = async (business: any) => {
    try {
      if (!business.cropInProgress) {
        const url = `${BASE_URL}/api/crop/create/${business.id}/${userId}`;
        await axios.post(
          url,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        await fetchBusinesses();
      }
      // In handleStartCrop
      router.push({
        pathname: "/businessDetail",
        params: {
          businessId: business.id.toString(), // convert number to string
          businessName: business.name,
        },
      });
    } catch (err: any) {
      console.error("❌ Start crop error:", err.response?.data || err.message);
      Alert.alert("Error", "Error while starting crop");
    } finally {
      setConfirmStart(null);
    }
  };

  // ✅ Delete
  const handleDeleteBusiness = async () => {
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/business/${confirmDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfirmDelete(null);
      await fetchBusinesses();
    } catch (err) {
      console.error("❌ Delete error:", err);
      Alert.alert("Error", "Error deleting business");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No Businesses Added yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.businessCard}>
            <Text style={styles.bizName}>{item.name}</Text>
            <View style={styles.bizActions}>
              {item.cropInProgress ? (
                <TouchableOpacity
                  style={styles.inprogressBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/businessDetail",
                      params: { businessId:  item.id.toString(), businessName: item.name },
                    })
                  }
                >
                  <Text style={styles.btnText}>In Progress</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => setConfirmStart(item)}
                >
                  <Text style={styles.btnText}>Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowPopup(true)}
      >
        <Text style={styles.addBtnText}>+ Add Business</Text>
      </TouchableOpacity>

      {/* Add/Edit Popup */}
      <Modal visible={showPopup} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <AddBusinessPopup
            onClose={() => {
              setShowPopup(false);
              setEditingBusiness(null);
            }}
            onSave={handleSaveBusiness}
            editingBusiness={editingBusiness}
          />
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Start */}
      <Modal visible={!!confirmStart} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>
              Start a new crop for{" "}
              <Text style={styles.bold}>{confirmStart?.name}</Text>?
            </Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => handleStartCrop(confirmStart)}
              >
                <Text style={styles.btnText}>Yes, Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmStart(null)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm Delete */}
      <Modal visible={!!confirmDelete} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>
              Delete <Text style={styles.bold}>{confirmDelete?.name}</Text>?
            </Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleDeleteBusiness}
              >
                <Text style={styles.btnText}>Yes, Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmDelete(null)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", padding: 16 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyMessage: { textAlign: "center", marginTop: 20, color: "#777" },
  businessCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
  bizName: { fontSize: 16, fontWeight: "600" },
  bizActions: { flexDirection: "row" },
  startBtn: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inprogressBtn: {
    backgroundColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  addBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  addBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  popupBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
  },
  popupTitle: { fontSize: 16, textAlign: "center", marginBottom: 20 },
  bold: { fontWeight: "700" },
  popupButtons: { flexDirection: "row", justifyContent: "space-around" },
  confirmBtn: {
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
});
