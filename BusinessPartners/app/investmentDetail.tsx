import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EditInvestmentPopup from "../src/components/EditInvestmentPopup";
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
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("token").then(setToken);
  }, []);

  useEffect(() => {
    if (!token || !investmentGroupId) return;
    fetchGroupInvestments();
  }, [token, investmentGroupId]);

  const fetchGroupInvestments = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/investment/all-group-investments/${investmentGroupId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      //   console.log("Fetching business name:", businessName);
      if (!res.ok) throw new Error("Failed to fetch group investments");
      const data = await res.json();
      setInvestments(Array.isArray(data) ? data : []);
      // ✅ Filter using data (not state)
      const editInvestmentDetails = data.filter(
        (inv: InvestmentDTO) =>
          !(inv.withdrawFlag === "Y" && inv.reduceLeftOverFlag === "Y"),
      );
      setEditInvestments(editInvestmentDetails);
      console.log("Fetched investments for group:", editInvestmentDetails);
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Failed to fetch group investments");
    }
  };

  const normalizeForEditPopup = (rows: InvestmentDTO[]) => {
    if (!rows.length) return [];

    return rows.map((inv) => {
      // SOLD
      if (inv.soldFlag === "Y") {
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
      if (inv.withdrawFlag === "Y") {
        return {
          ...inv,
          transactionType: "Withdraw",
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Transaction Details</Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => {
              setEditInvestments(normalizeForEditPopup(editInvestments));
              setEditVisible(true);
            }}
          >
            <MaterialIcons name="edit" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Alert.alert("Delete feature coming soon")}
          >
            <MaterialIcons name="delete" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Meta Section */}
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
                    <Text style={styles.shareText}>{inv.share}%</Text>
                  )}
                </View>

                {/* Description */}
                {inv.description && (
                  <Text style={styles.descriptionText}>{inv.description}</Text>
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
      </ScrollView>

      {/* Popup */}
      {editVisible && investmentGroupId && (
        <EditInvestmentPopup
          visible={editVisible}
          businessId={investmentGroupId || ""}
          businessName={businessName || ""}
          investmentData={editInvestments}
          onClose={() => setEditVisible(false)}
          onUpdated={fetchGroupInvestments}
        />
      )}
    </View>
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
});
