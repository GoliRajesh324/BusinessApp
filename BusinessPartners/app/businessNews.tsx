import AppHeader from "@/src/components/AppHeader";
import { getVideoId } from "@/src/utils/VideoStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../src/config/config";

export default function BusinessNews() {
  const router = useRouter();
  const { businessId, businessName, cropId } = useLocalSearchParams();

  const safeBusinessId = String(businessId || "");

  const [newsList, setNewsList] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showPopup, setShowPopup] = useState(false);
  const [newsFeed, setNewsFeed] = useState("");

  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  /* ---------------- LOAD TOKEN ---------------- */
  useEffect(() => {
    const load = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userName");
      setToken(t);
      setUserName(u);
    };
    load();
  }, []);

  const [videoId, setVideoId] = useState("");

  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("businessNews");
    setVideoId(id);
  };
  /* ---------------- RESET ON SCREEN FOCUS ---------------- */
  useFocusEffect(
    useCallback(() => {
      if (token && safeBusinessId && cropId) {
        setPage(0);
        setHasMore(true);
        setNewsList([]);
        fetchNews(0, true);
      }
    }, [token, safeBusinessId, cropId]),
  );

  /* ---------------- FETCH NEWS ---------------- */
  const fetchNews = async (pageNumber = 0, reset = false) => {
    if (loading && !reset) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${BASE_URL}/api/news/${cropId}/${safeBusinessId}?page=${pageNumber}&size=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        console.log("HTTP Error:", res.status);
        return;
      }

      const text = await res.text();
      if (!text) return;

      const data = JSON.parse(text);
      const content = data?.content || [];

      if (reset) {
        setNewsList(content);
      } else {
        setNewsList((prev) => [...prev, ...content]);
      }

      setHasMore(!data?.last);
      setPage(pageNumber);
    } catch (err) {
      console.log("Pagination Error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ---------------- LOAD MORE ---------------- */
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNews(page + 1);
    }
  };

  /* ---------------- PULL TO REFRESH ---------------- */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchNews(0, true);
  };

  /* ---------------- SAVE NEWS ---------------- */
  const handleSave = async () => {
    if (!newsFeed.trim()) {
      Alert.alert("Please enter news content");
      return;
    }

    try {
      await fetch(`${BASE_URL}/api/news`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: safeBusinessId,
          cropId: cropId,
          newsFeed: newsFeed,
          createdBy: userName,
        }),
      });

      Keyboard.dismiss();
      setShowPopup(false);
      setNewsFeed("");

      // Reset and reload first page
      setPage(0);
      setHasMore(true);
      setNewsList([]);
      fetchNews(0, true);
    } catch (err) {
      console.log("Save Error:", err);
    }
  };

  /* ---------------- RENDER ITEM ---------------- */
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.newsText}>{item.newsFeed}</Text>

      <View style={styles.footerRow}>
        <Text style={styles.footerLeft}>Created by: {item.createdBy}</Text>
        <Text style={styles.footerRight}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={String("Business News")} videoId={videoId} />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          {/* LIST */}
          <FlatList
            data={newsList}
            keyExtractor={(item, index) =>
              item.newsId?.toString() || index.toString()
            }
            renderItem={renderItem}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 180,
            }}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="small" color="#4f93ff" />
              ) : null
            }
          />

          {/* FAB */}
          <View style={styles.fabContainer}>
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setShowPopup(true)}
            >
              <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* ADD NEWS MODAL */}
          <Modal visible={showPopup} transparent animationType="slide">
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                  <View style={styles.popup}>
                    <Text style={styles.popupTitle}>Add News</Text>

                    <View style={styles.inputContainer}>
                      <TextInput
                        placeholder="Enter business update..."
                        multiline
                        value={newsFeed}
                        onChangeText={setNewsFeed}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSave}
                      >
                        <Text style={styles.btnText}>Send</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          Keyboard.dismiss();
                          setShowPopup(false);
                        }}
                      >
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </SafeAreaView>
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  card: {
    backgroundColor: "rgb(248, 246, 246)",
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  newsText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#111",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
  },

  footerLeft: { fontSize: 12, color: "#6B7280" },
  footerRight: { fontSize: 12, color: "#6B7280" },

  fabContainer: {
    position: "absolute",
    bottom: 110,
    right: 25,
  },

  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
  },

  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  popup: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
  },

  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },

  inputContainer: {
    height: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
  },

  input: {
    flex: 1,
    textAlignVertical: "top",
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 14,
  },

  saveBtn: {
    flex: 1,
    backgroundColor: "#4f93ff",
    padding: 12,
    borderRadius: 8,
    marginRight: 6,
    alignItems: "center",
  },

  cancelBtn: {
    flex: 1,
    backgroundColor: "#999",
    padding: 12,
    borderRadius: 8,
    marginLeft: 6,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
