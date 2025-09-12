import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../src/config/config";
import AddBusinessPopup from "./components/AddBusinessPopup";

export default function Dashboard() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<any>(null);
  const [confirmStart, setConfirmStart] = useState<any>(null);

  const token = AsyncStorage.getItem("token");
  const userId = AsyncStorage.getItem("userId");

  const fetchBusinesses = async () => {
    try {
      const storedToken = await token;
      const storedUserId = await userId;
      const res = await axios.get(`${BASE_URL}/api/business/user/${storedUserId}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const updated = res.data.map((b: any) => ({
        ...b,
        cropInProgress: b.crops?.some((c: any) => c.cropInProgress) || false,
      }));

      setBusinesses(updated);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to fetch businesses");
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const handleStartCrop = async (business: any) => {
    try {
      const storedToken = await token;
      const storedUserId = await userId;

      if (!business.cropInProgress) {
        await axios.post(
          `${BASE_URL}/api/crop/create/${business.id}/${storedUserId}`,
          {},
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
        fetchBusinesses();
      }
      router.push(`/business/${business.id}/${business.name}`);
    } catch (err: any) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Error while starting crop");
    } finally {
      setConfirmStart(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {businesses.length === 0 ? (
          <Text style={styles.empty}>No Businesses Added yet.</Text>
        ) : (
          businesses.map((b: any) => (
            <View key={b.id} style={styles.card}>
              <Text style={styles.cardText}>{b.name}</Text>
              <TouchableOpacity
                style={[styles.btn, b.cropInProgress ? styles.inProgress : styles.start]}
                onPress={() =>
                  b.cropInProgress ? router.push(`/business/${b.id}/${b.name}`) : setConfirmStart(b)
                }
              >
                <Text style={styles.btnText}>
                  {b.cropInProgress ? "In Progress" : "Start"}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => setShowPopup(true)}>
          <Text style={styles.addBtnText}>+ Add Business</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Business Popup */}
      <Modal visible={showPopup} transparent animationType="slide">
        <AddBusinessPopup
          visible={showPopup}
          editingBusiness={editingBusiness}
          onClose={() => {
            setShowPopup(false);
            setEditingBusiness(null);
          }}
          onSave={fetchBusinesses}
        />
      </Modal>

      {/* Start Crop Confirmation */}
      <Modal visible={!!confirmStart} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popup}>
            <Text style={{ marginBottom: 16 }}>
              Start a new crop for <Text style={{ fontWeight: "bold" }}>{confirmStart?.name}</Text>?
            </Text>
            <View style={styles.popupButtons}>
              <TouchableOpacity style={styles.popupBtn} onPress={() => handleStartCrop(confirmStart)}>
                <Text style={styles.popupBtnText}>Yes, Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.popupBtn, { backgroundColor: "#e5e7eb" }]}
                onPress={() => setConfirmStart(null)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", paddingTop: 60 },
  content: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardText: { fontSize: 16, fontWeight: "600", flex: 1 },
  btn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  start: { backgroundColor: "#2563eb" },
  inProgress: { backgroundColor: "#f59e0b" },
  btnText: { color: "#fff", fontWeight: "bold" },
  addBtn: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  addBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  empty: { textAlign: "center", color: "#6b7280", marginTop: 40 },
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  popupButtons: { flexDirection: "row", justifyContent: "space-around", width: "100%", marginTop: 16 },
  popupBtn: { flex: 1, padding: 8, backgroundColor: "#2563eb", borderRadius: 8, marginHorizontal: 6, alignItems: "center" },
  popupBtnText: { color: "#fff", fontWeight: "bold" },
});
