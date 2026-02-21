import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AddBusinessPopup from "../src/components/AddBusinessPopup";
import BASE_URL from "../src/config/config";

export default function Dashboard() {
  const [showPopup, setShowPopup] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  const [confirmStart, setConfirmStart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("User");
  const { t, i18n } = useTranslation();
  const [showPlusOnly, setShowPlusOnly] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Business");
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [longPressedId, setLongPressedId] = useState<number | null>(null);
  const deleteTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      setActiveMenu("Business");
    }, []),
  );
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
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/business/user/${userId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      // 👇 HANDLE EXPIRED TOKEN
      if (response.status === 401 || response.status === 403) {
        console.log("🔒 Token expired, logging out");

        await AsyncStorage.multiRemove(["token", "userId", "userName"]);
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch businesses");
      const data = await response.json();
      const updated = data.map((b: any) => {
        let inProgress = false;
        if (b.crops && b.crops.length > 0) {
          inProgress = b.crops.some((c: any) => c.cropInProgress === true);
        }
        return { ...b, cropInProgress: inProgress };
      });

      setBusinesses(updated);
    } catch (err) {
      console.log("❌ Fetch error:", err);
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
          },
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
      console.log("❌ Start crop error:", err.response?.data || err.message);
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
      console.log("❌ Delete error:", err);
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

        <TouchableOpacity
          onPress={() => alert("Notifications feature coming soon")}
        >
          <Ionicons name="notifications-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      {/* HEADER END */}

      <View style={styles.menuTabsContainer}>
        <TouchableOpacity
          style={[
            styles.menuTab,
            activeMenu === "Business" && styles.activeMenuTab,
          ]}
          onPress={() => setActiveMenu("Business")}
        >
          <MaterialCommunityIcons
            name="alpha-b-box"
            size={18}
            color={activeMenu === "Business" ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.menuTabText,
              activeMenu === "Business" && styles.activeMenuTabText,
            ]}
          >
            Business
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuTab,
            activeMenu === "Interest" && styles.activeMenuTab,
          ]}
          onPress={() => {
            setActiveMenu("Interest");
            router.push("/simpleInterest");
          }}
        >
          <MaterialCommunityIcons
            name="alpha-i-box"
            size={18}
            color={activeMenu === "Interest" ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.menuTabText,
              activeMenu === "Interest" && styles.activeMenuTabText,
            ]}
          >
            Interest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.menuTab,
            activeMenu === "Settings" && styles.activeMenuTab,
          ]}
          onPress={() => setActiveMenu("Settings")}
        >
          <Ionicons
            name="settings-outline"
            size={18}
            color={activeMenu === "Settings" ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.menuTabText,
              activeMenu === "Settings" && styles.activeMenuTabText,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
      <View style={{ padding: 16, backgroundColor: "#fff" }}>
        <Text>{t("YourBusinesses")}</Text>
      </View>
      {/* BUSINESS LIST */}
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 180 }} // ✅ add this
        onScroll={(e) => {
          const position = e.nativeEvent.contentOffset.y;
          if (position > 50) {
            setShowPlusOnly(true);
          } else {
            setShowPlusOnly(false);
          }
        }}
        scrollEventThrottle={16} // smooth performance
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={require("../assets/stickers/business-idea.png")}
              style={styles.emptySticker}
            />

            <Text style={styles.emptyMessage}>No Businesses Added Yet</Text>
            <Text style={styles.emptySubText}>
              Tap the “+ Add Business” button below to start
            </Text>
          </View>
        }
        /*  renderItem={({ item }) => (
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
        )} */

        renderItem={({ item }) => {
          const scale = new Animated.Value(1);

          const onPressIn = () => {
            Animated.spring(scale, {
              toValue: 0.97,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          };

          const onPressOut = () => {
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 50,
              bounciness: 0,
            }).start();
          };

          return (
            <Pressable
              onLongPress={async () => {
                // Haptic feedback
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                setLongPressedId(item.id);

                // Clear existing timer
                if (deleteTimeoutRef.current) {
                  clearTimeout(deleteTimeoutRef.current);
                }

                // Auto hide after 4 seconds
                deleteTimeoutRef.current = setTimeout(() => {
                  setLongPressedId(null);
                }, 2000);
              }}
            >
              <Animated.View
                style={[styles.businessCard, { transform: [{ scale }] }]}
              >
                <Text style={styles.bizName}>{item.name}</Text>

                <View style={styles.bizActions}>
                  {longPressedId === item.id ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        if (deleteTimeoutRef.current) {
                          clearTimeout(deleteTimeoutRef.current);
                        }

                        Alert.alert("Delete", "Delete coming soon");
                        setLongPressedId(null);
                      }}
                    >
                      <Text style={styles.btnText}>Delete</Text>
                    </TouchableOpacity>
                  ) : item.cropInProgress ? (
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
              </Animated.View>
            </Pressable>
          );
        }}
      />
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
              Start
              <Text style={styles.bold}> {confirmStart?.name}</Text> Business ?
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
  menuTabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
  },

  menuTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    marginRight: 10,
  },

  activeMenuTab: {
    backgroundColor: "#4f93ff",
  },

  menuTabText: {
    fontSize: 14,
    marginLeft: 6,
    color: "#333",
    fontWeight: "500",
  },

  activeMenuTabText: {
    color: "#fff",
    fontWeight: "600",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptySticker: {
    width: 150,
    height: 150,
    marginBottom: 16,
    opacity: 0.9,
    resizeMode: "contain",
  },
  emptySubText: {
    color: "#777",
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },

  // ------------------------------Floating Add business button ------------------------------
  floatingButton: {
    position: "absolute",
    bottom: 110, // above bottom buttons
    right: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: "#1E90FF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
