import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BASE_URL from "../src/config/config";
import AddBusinessPopup from "./components/AddBusinessPopup";

export default function Dashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [confirmStart, setConfirmStart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("User");
  const { t, i18n } = useTranslation();

  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");
      router.replace("/login"); // Navigate to login page
    } catch (err) {
      console.error("❌ Logout error:", err);
      Alert.alert("Error", "Failed to logout");
    }
  };

  // ✅ Load token & userId before fetching
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");
      const n = await AsyncStorage.getItem("userName");
      setToken(t);
      setUserId(u);
      if (n) {
        // Convert to Camel Case (Title Case)
        const formatted = n
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        setUsername(formatted);
      }
    };
    loadData();
  }, []);

  // ✅ Fetch businesses
  const fetchBusinesses = async () => {
    if (!token || !userId) return;
    try {
      //console.log("📡 Fetching businesses...");
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/business/user/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch businesses");
      const data = await response.json();
      //console.log("✅ Businesses:", data);

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
    if (token && userId) fetchBusinesses();
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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => router.push("/profileScreen")}
        >
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.profileIcon}
          />
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{username}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => alert("Notifications feature coming soon")}>
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
          <View style={{ padding: 16,backgroundColor: '#fff'}}>
        <Text>{t("YourBusinesses")}</Text>
      </View>

      {/* BUSINESS LIST */}
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
                      params: {
                        businessId: item.id.toString(),
                        businessName: item.name,
                      },
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

     

      {/* FOOTER BAR */}
      {/*   <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}>
          <Ionicons name="home" size={26} color="#2563eb" />
          <Text style={styles.footerText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingBusiness(null);
            setShowPopup(true);
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerItem}>
          <MaterialIcons name="manage-history" size={26} color="#2563eb" />
          <Text style={styles.footerText}>History</Text>
        </TouchableOpacity>
      </View> */}

      {/* Bottom Footer Buttons */}
      <View style={styles.bottomButtonsContainer}>
         <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => {
          setEditingBusiness(null);
          setShowPopup(true);
        }}
      >
        <Text style={styles.floatingButtonText}>+ Add business</Text>
      </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          // onPress={()=>router.push("/dashboard")}
        >
          <Ionicons name="home" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("Charts Feature coming soon")}
        >
          <Ionicons name="bar-chart" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Charts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("Inventory Feature coming soon")}
        >
          <Ionicons name="cube" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>Inventory</Text>
        </TouchableOpacity>

        {/*  <TouchableOpacity
                style={styles.bottomButtonIcon}
                onPress={() => alert("All Investments Feature coming soon")}
              >
                <Ionicons name="cash-outline" size={28} color="#4f93ff" />
                <Text style={styles.bottomButtonText}>Investments</Text>
              </TouchableOpacity> */}

        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => alert("History Feature coming soon")}
        >
          <Ionicons name="time" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* ADD BUSINESS POPUP */}
      {showPopup && (
        <AddBusinessPopup
          visible={showPopup}
          onClose={() => setShowPopup(false)}
          onSave={handleSaveBusiness}
          editingBusiness={editingBusiness}
        />
      )}

      {/* CONFIRM START */}
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

      {/* CONFIRM DELETE */}
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
  container: { flex: 1, backgroundColor: "#f9fafb" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },

  // HEADER
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
  profileSection: { flexDirection: "row", alignItems: "center" },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#eef1f6ff",
  },
  usernameContainer: { marginLeft: 10 },
  username: { fontSize: 16, fontWeight: "700", color: "#333" },

  // BUSINESS CARD
  emptyMessage: { textAlign: "center", marginTop: 20, color: "#777" },
  businessCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    marginHorizontal: 16,
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

  // FOOTER BAR
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 40,
    elevation: 10,
  },
  footerItem: { alignItems: "center" },
  footerText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
    marginTop: 4,
  },
  addButton: {
    backgroundColor: "#2563eb",
    width: 65,
    height: 65,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    elevation: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 2,
  },

  // POPUP
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
  logoutBtn: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  logoutBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#2563eb",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 2,
  },

  // -------- Bottom Buttons --------
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 8,
    paddingBottom: Platform.OS === "ios" ? 30 : 16, // safe area spacing
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: Platform.OS === "ios" ? 10 : 0, // ⬅️ lifts bar a bit upward
    left: 0,
    right: 0,
    elevation: 10, // Android shadow
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
  },

  bottomButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  bottomButtonText: {
    fontSize: 13,
    color: "#4f93ff",
    marginTop: 2,
    textAlign: "center",
  },

  // ------------------------------Floating Add business button ------------------------------
floatingButton: {
  position: 'absolute',
  bottom: 110, // above bottom buttons
  right: 15,
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 30,
  backgroundColor: '#1E90FF',
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 5,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
},
floatingButtonText: {
  fontSize: 16,
  color: '#fff',
  fontWeight: '600',
},
});
