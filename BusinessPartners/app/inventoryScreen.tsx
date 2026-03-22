import AppHeader from "@/src/components/AppHeader";
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
            data={categories}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No categories yet. Click "Add Category".
              </Text>
            }
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                onPress={() =>
                  router.push({
                    pathname: "/categoryDetails",
                    params: { categoryId: item.id },
                  })
                }
              />
            )}
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
});
