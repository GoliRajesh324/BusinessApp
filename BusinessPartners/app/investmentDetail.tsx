import AppHeader from "@/src/components/AppHeader";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../src/config/config";
import { InvestmentDTO } from "../src/types/types";

export default function InvestmentDetail() {
  const { investmentGroupId, businessId, businessName } = useLocalSearchParams<{
    investmentGroupId?: string;
    businessId?: string;
    businessName?: string;
  }>();
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [investments, setInvestments] = useState<InvestmentDTO[]>([]);
  const [editInvestments, setEditInvestments] = useState<InvestmentDTO[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("token");
          if (!storedToken || !investmentGroupId) return;

          if (!isActive) return;

          setToken(storedToken);

          const res = await fetch(
            `${BASE_URL}/api/investment/all-group-investments/${investmentGroupId}`,
            {
              headers: { Authorization: `Bearer ${storedToken}` },
            },
          );

          if (!res.ok) throw new Error("Failed to fetch group investments");

          const data = await res.json();

          if (data.length > 0 && data[0].images) {
            setImages(data[0].images);
          }

          if (!isActive) return;

          setInvestments(Array.isArray(data) ? data : []);

          const editInvestmentDetails = data.filter(
            (inv: InvestmentDTO) =>
              !(
                inv.transactionType === "WITHDRAW" &&
                inv.reduceLeftOverFlag === "Y"
              ),
          );

          setEditInvestments(editInvestmentDetails);
        } catch (err) {
          console.log(err);
          Alert.alert("Error", "Failed to fetch group investments");
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [investmentGroupId]),
  );
  const normalizeForEditPopup = (rows: InvestmentDTO[]) => {
    if (!rows.length) return [];

    return rows.map((inv) => {
      // SOLD
      if (inv.transactionType === "SOLD") {
        return {
          ...inv,
          transactionType: "Sold",
          invested: 0,
          investable: 0,
          withdrawn: 0,
          soldAmount: Number(inv.soldAmount ?? 0),
        };
      }

      // WITHDRAW
      if (inv.transactionType === "WITHDRAW") {
        return {
          ...inv,
          transactionType: "Withdraw",
          invested: 0,
          investable: 0,
          soldAmount: 0,
          withdrawn: Number(inv.withdrawn ?? 0),
        };
      }

      if (inv.transactionType === "INVESTMENT_WITHDRAW") {
        return {
          ...inv,
          transactionType: "Investment_Withdraw",
          invested: 0,
          investable: 0,
          soldAmount: 0,
          withdrawn: Number(inv.withdrawn ?? 0),
        };
      }

      // INVESTMENT
      return {
        ...inv,
        transactionType: "Investment",
        invested: Number(inv.invested ?? 0),
        investable: Number(inv.investable ?? inv.invested ?? 0),
        soldAmount: 0,
        withdrawn: 0,
      };
    });
  };

  const formatAmount = (v: any) =>
    Number(v ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  // Prepare group-level investment data for EditInvestmentPopup
  const getGroupInvestmentData = () => {
    if (!investmentGroupId) throw new Error("Invalid groupId");

    const first = investments[0];

    return {
      groupId: investmentGroupId,
      totalAmount: first?.totalAmount ?? first?.invested ?? 0, // ✅ take from one record only
      description: first?.description ?? "",
      partners: investments.map((inv) => ({
        id: inv.partnerId,
        username: inv.partnerName,
        share: inv.share ?? 0,
        invested: inv.invested ?? 0,
        investable: inv.investable ?? 0,
      })),
      images: first?.images ?? [],
      transactionType: first?.transactionType ?? "Investment",
    };
  };

  /*   useEffect(() => {
    console.log("Fetched investments:", getGroupInvestmentData());
  }, [investments]);
 */
  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader
          title={String("Transaction Details")}
          videoId="ogns8WiacUI"
          rightComponent={
            <TouchableOpacity
              onPress={() => {
                if (!investmentGroupId) return;

                router.push({
                  pathname: "/EditTransactionScreen",
                  params: {
                    businessId: businessId || "",
                    businessName: businessName || "",
                    investmentData: JSON.stringify(
                      normalizeForEditPopup(editInvestments),
                    ),
                    images: JSON.stringify(images),
                  },
                });
              }}
            >
              <MaterialIcons name="edit" size={26} color="#fff" />
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>
              Created By: {investments[0]?.createdBy || "-"}
            </Text>

            <Text style={styles.metaText}>
              Created At:{" "}
              {investments[0]?.createdAt
                ? formatDateTime(investments[0]?.createdAt)
                : "-"}
            </Text>
          </View>

          {/* ✅ FIXED ScrollView */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {investments.length === 0 ? (
              <Text>No investments found for this group</Text>
            ) : (
              investments.map((inv, idx) => {
                const totalAmount = Number(inv.totalAmount || 0);
                const investable = Number(inv.investable || 0);
                const invested = Number(inv.invested || 0);
                const soldAmount = Number(inv.soldAmount || 0);
                const withdrawn = Number(inv.withdrawn || 0);

                return (
                  <View key={idx} style={styles.card}>
                    {/* Top Row */}
                    <View style={styles.cardTopRow}>
                      <Text style={styles.partnerName}>
                        {inv.partnerName || "-"}
                      </Text>

                      {inv.share != null && (
                        <Text style={styles.shareText}>
                          Share: {inv.share}%
                        </Text>
                      )}
                    </View>

                    {/* Description */}
                    {inv.description && (
                      <Text style={styles.descriptionText}>
                        {inv.description}
                      </Text>
                    )}

                    <View style={styles.divider} />

                    {/* Show only > 0 values */}

                    {totalAmount > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>
                          ₹ {formatAmount(totalAmount)}
                        </Text>
                      </View>
                    )}

                    {investable > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Investable</Text>
                        <Text style={styles.amountValue}>
                          ₹ {formatAmount(investable)}
                        </Text>
                      </View>
                    )}

                    {invested > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Invested</Text>
                        <Text style={styles.amountValue}>
                          ₹ {formatAmount(invested)}
                        </Text>
                      </View>
                    )}

                    {soldAmount > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Sold Amount</Text>
                        <Text style={styles.amountValue}>
                          ₹ {formatAmount(soldAmount)}
                        </Text>
                      </View>
                    )}

                    {withdrawn > 0 && (
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Withdrawn</Text>
                        <Text style={styles.amountValue}>
                          ₹ {formatAmount(withdrawn)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
            {images.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: "600", marginBottom: 6 }}>
                  Images
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((img, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setPreviewImage(img)}
                    >
                      <Image
                        source={{ uri: img }}
                        style={{
                          width: 70,
                          height: 70,
                          borderRadius: 8,
                          marginRight: 8,
                        }}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {previewImage && (
              <Modal transparent animationType="fade">
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: previewImage }}
                    style={styles.fullPreview}
                  />

                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setPreviewImage(null)}
                  >
                    <Ionicons name="close" size={30} color="#fff" />
                  </TouchableOpacity>
                </View>
              </Modal>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerIcons: { flexDirection: "row", gap: 16 },
  content: { padding: 16 },
  metaContainer: {
    backgroundColor: "#eef3f8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e0e0e0",
  },

  metaText: {
    fontSize: 13,
    color: "#555",
  },

  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  partnerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  shareText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2563eb",
  },

  descriptionText: {
    fontSize: 14,
    color: "#555",
    marginTop: 6,
    marginBottom: 6,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 8,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  amountLabel: {
    fontSize: 14,
    color: "#6b7280",
  },

  amountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullPreview: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 12,
  },

  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 6,
  },
});
