import AppHeader from "@/src/components/AppHeader";
import BASE_URL from "@/src/config/config";
import { getVideoId } from "@/src/utils/VideoStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CategoryCard from "../src/components/CategoryCard";
import { fetchCategories } from "../src/services/inventory";

export default function InventoryScreen() {
  const router = useRouter();

  const { businessId, businessName } = useLocalSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const [videoId, setVideoId] = useState("");

  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    loadVideo();
  }, []);

  const loadVideo = async () => {
    const id = await getVideoId("inventoryScreen");
    setVideoId(id);
  };
  // Reload on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        const t = await AsyncStorage.getItem("token");
        if (!t || !businessId || !isActive) return;

        await loadCategories(t);
        await fetchLogs(0);
      };

      load();

      return () => {
        isActive = false;
      };
    }, [businessId]),
  );

  // Load categories
  const loadCategories = async (t: string) => {
    try {
      const response = await fetchCategories(Number(businessId), t);
      setCategories(response);
    } catch (err) {
      console.log("❌ Category Fetch Error:", err);
    }
  };

  const fetchLogs = async (pageNumber = 0) => {
    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(
        `${BASE_URL}/api/inventory/logs/${businessId}?page=${pageNumber}&size=${PAGE_SIZE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();
      const safeContent = data?.content ?? [];

      if (pageNumber === 0) {
        setLogs(safeContent);
      } else {
        setLogs((prev) => [...prev, ...safeContent]);
      }

      setHasMore(!data?.last);
    } catch (e) {
      console.log("❌ Logs error", e);
    }
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={String("Inventory")}
          videoId={videoId}
          rightComponent={
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/addCategory",
                  params: { businessId },
                })
              }
            >
              <Text style={styles.addText}>{t("addCategory")}</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          {/* Category list */}
          <FlatList
            data={logs || []} // 👈 MAIN LIST = LOGS
            keyExtractor={(item, index) => String(item?.id ?? index)}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            /* 🔥 HEADER = CATEGORIES */
            ListHeaderComponent={
              <>
                {/* Categories */}
                {categories.length === 0 ? (
                  <Text style={styles.empty}>
                    No categories yet. Click "Add Category".
                  </Text>
                ) : (
                  categories.map((item) => (
                    <CategoryCard
                      key={item.id}
                      category={item}
                      onPress={() =>
                        router.push({
                          pathname: "/categoryDetails",
                          params: { categoryId: item.id },
                        })
                      }
                    />
                  ))
                )}

                {/* 🔥 HISTORY TITLE */}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    marginTop: 30,
                    marginBottom: 12,
                  }}
                >
                  History
                </Text>
              </>
            }
            /* 🔥 HISTORY LIST (STEP 5 HERE) */
            renderItem={({ item }) => {
              if (!item) return null;

              return (
                <View style={styles.logCard}>
                  {/* Top Row */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.logTitle}>
                      Category: {item.categoryName} {item.quantityType}
                    </Text>

                    <Text
                      style={{
                        color: item.changeType === "ADD" ? "green" : "red",
                        fontWeight: "700",
                      }}
                    >
                      {item.changeType}
                    </Text>
                  </View>

                  {/* Quantity */}
                  <Text>
                    <Text style={styles.logTitle}>Qty: </Text>
                    <Text style={styles.quantity}>{item.quantity} </Text>
                    <Text style={styles.unit}>{item.quantityType}</Text>
                  </Text>

                  {/* Note */}
                  {item.note && <Text>Note: {item.note}</Text>}

                  {/* Footer */}
                  <View style={styles.footerRow}>
                    <Text style={styles.userText}>👤 {item.username}</Text>

                    <Text style={styles.dateText}>
                      {new Date(item.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
            /* 🔥 STEP 6 (PAGINATION HERE) */
            onEndReached={() => {
              if (hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchLogs(nextPage);
              }
            }}
            onEndReachedThreshold={0.5}
          />
          {/* FOOTER BUTTONS */}
          <View style={styles.footer}>
            {/* Add Stock */}
            <TouchableOpacity
              style={[styles.footerBtn, styles.addStockBtn]}
              onPress={() => {
                if (categories.length === 0) {
                  return alert("Please add at least one category first.");
                }

                router.push({
                  pathname: "/addStock",
                  params: { businessId },
                });
              }}
            >
              <Text style={styles.footerBtnText}>{t("add")}</Text>
            </TouchableOpacity>

            {/* Consume Stock */}
            <TouchableOpacity
              style={[styles.footerBtn, styles.consumeBtn]}
              onPress={() => {
                if (categories.length === 0) {
                  return alert("Please add at least one category first.");
                }

                const hasStock = categories.some(
                  (c: any) => Number(c.availableQuantity) > 0,
                );

                if (!hasStock) {
                  return alert("No stock available to consume.");
                }

                router.push({
                  pathname: "/consumeStock",
                  params: { businessId },
                });
              }}
            >
              <Text style={styles.footerBtnText}>{t("consume")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  headerLeft: { width: 40 },

  addText: { color: "#fff", fontWeight: "600" },

  empty: {
    textAlign: "center",
    marginTop: 30,
    color: "#777",
  },

  /* ----- Footer buttons ----- */

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 5,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },

  footerBtn: {
    flex: 1,
    paddingVertical: 14,
    marginHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
  },

  addStockBtn: {
    backgroundColor: "#28a745",
    justifyContent: "center",
    position: "relative",
    padding: 14,
  },

  consumeBtn: {
    justifyContent: "center",
    backgroundColor: "#dc3545", // Red
    position: "relative",
    padding: 14,
  },

  footerBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  logCard: {
    backgroundColor: "#ffffff",
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 14,
    borderRadius: 14,

    // Shadow (iOS)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },

    // Android
    elevation: 4,

    // Border for separation
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },

  logTitle: {
    fontWeight: "700",
    fontSize: 14,
  },

  logFooter: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
  },
  unit: {
    fontSize: 15,
    color: "#777",
    fontWeight: "500",
  },
  quantity: {
    fontSize: 20,
    color: "#777",
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  userText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "600",
  },

  dateText: {
    fontSize: 12,
    color: "#888",
  },
});
