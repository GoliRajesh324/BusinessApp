import AppHeader from "@/src/components/AppHeader";
import BASE_URL from "@/src/config/config";
import { getVideoId } from "@/src/utils/VideoStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { t } from "i18next";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FieldChange {
  oldValue: string | null;
  newValue: string | null;
}

interface PartnerChange {
  partnerName: string;
  changes: Record<string, FieldChange>;
}

interface AuditCard {
  investmentGroupId: number;
  modifiedBy: string;
  modifiedAt: string;
  headerChanges: Record<string, FieldChange>;
  partnerChanges: PartnerChange[];
}

export default function ChangeHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const businessId = params.businessId as string;
  const businessName = params.businessName as string;
  const [cards, setCards] = useState<AuditCard[]>([]);

  const [videoId, setVideoId] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true); // initial load
  const [loadingMore, setLoadingMore] = useState(false); // pagination

  useEffect(() => {
    loadVideo();
  }, []);
  useEffect(() => {
    setPage(0);
  }, [businessId]);
  const loadVideo = async () => {
    const id = await getVideoId("changeHistory");
    setVideoId(id);
  };
  useEffect(() => {
    if (!businessId) return;
    const fetchAuditLogs = async () => {
      try {
        if (page === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const token = await AsyncStorage.getItem("token");

        const response = await fetch(
          `${BASE_URL}/api/audit/business/${businessId}?page=${page}&size=5`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 204) {
          setCards([]);
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch audit logs");

        const data = await response.json();

        const newData = data?.content ?? [];

        if (page === 0) {
          setCards(newData);
        } else {
          setCards((prev) => [...prev, ...newData]);
        }

        setHasMore(!data?.last);
      } catch (err) {
        console.log("Error fetching audit logs:", err);
      } finally {
        if (page === 0) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    };

    fetchAuditLogs();
  }, [businessId, page]);
  const partnerAllowedFields = [
    "investedAmount",
    "investableAmount",
    "soldAmount",
    "withdrawn",
    "transactionType",
  ];
  const renderCard = ({ item }: { item: AuditCard }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/investmentDetail",
          params: {
            investmentGroupId: item.investmentGroupId,
            businessId: businessId,
            businessName: businessName,
          },
        })
      }
    >
      {/* HEADER CHANGES */}
      {Object.entries(item.headerChanges).map(([key, change]) => (
        <View key={key} style={{ marginBottom: 6 }}>
          <Text style={styles.fieldName}>{formatFieldName(key)}</Text>

          <View style={styles.valueWrapper}>
            <Text style={styles.oldValue}>{change.oldValue ?? "-"}</Text>
            <Text style={styles.arrow}>→</Text>
            <Text style={styles.newValue}>{change.newValue ?? "-"}</Text>
          </View>
        </View>
      ))}

      {/* PARTNER CHANGES */}
      {item.partnerChanges.map((partner, index) => (
        <View key={index} style={styles.partnerCard}>
          <Text style={styles.partnerTitle}>
            Partner: {partner.partnerName}
          </Text>

          {Object.entries(partner.changes)
            .filter(([key]) => partnerAllowedFields.includes(key))
            .map(([key, change]) => (
              <View key={key} style={{ marginBottom: 4 }}>
                <Text style={styles.partnerField}>{formatFieldName(key)}</Text>

                <View style={styles.valueWrapper}>
                  <Text style={styles.oldValue}>{change.oldValue ?? "-"}</Text>
                  <Text style={styles.arrow}>→</Text>
                  <Text style={styles.newValue}>{change.newValue ?? "-"}</Text>
                </View>
              </View>
            ))}
        </View>
      ))}

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.modifiedBy}>By: {item.modifiedBy}</Text>
        <Text style={styles.modifiedAt}>
          {new Date(item.modifiedAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={t("changeHistory")} videoId={videoId} />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#3498db"
              style={{ marginTop: 20 }}
            />
          ) : !cards || cards.length === 0 ? (
            <Text style={styles.noDataText}>
              No changes found for this business.
            </Text>
          ) : (
            <FlatList
              data={cards}
              renderItem={renderCard}
              keyExtractor={(_, index) => index.toString()}
              onEndReached={() => {
                if (hasMore && !loadingMore) {
                  setPage((prev) => prev + 1);
                }
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator
                    size="small"
                    style={{ marginVertical: 10 }}
                  />
                ) : null
              }
              contentContainerStyle={{ padding: 16 }}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}
const formatFieldName = (field: string) => {
  const map: Record<string, string> = {
    description: "Description",
    totalAmount: "Total Amount",
    splitType: "Split Type",
    investedAmount: "Invested Amount",
    investableAmount: "Investable Amount",
    soldAmount: "Sold Amount",
    withdrawn: "Withdrawn Amount",
    comments: "Comments",
  };

  return map[field] || field;
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  headerLeft: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerRight: { width: 40 },

  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  fieldName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#333",
  },

  valueWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },

  oldValue: {
    color: "#d9534f",
    textDecorationLine: "line-through",
    fontWeight: "600",
    fontSize: 15,
  },

  arrow: {
    marginHorizontal: 6,
    fontSize: 16,
    fontWeight: "bold",
  },

  newValue: {
    color: "#28a745",
    fontWeight: "700",
    fontSize: 15,
  },

  investmentId: {
    fontSize: 13,
    color: "#555",
    marginTop: 4,
    marginBottom: 4,
    fontStyle: "italic",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },

  modifiedBy: {
    fontSize: 12,
    color: "#777",
  },

  modifiedAt: {
    fontSize: 12,
    color: "#999",
  },
  partnerCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },

  partnerTitle: {
    fontWeight: "700",
    marginBottom: 6,
    fontSize: 14,
    color: "#333",
  },

  partnerField: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  versionText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 6,
    fontWeight: "600",
  },
});
