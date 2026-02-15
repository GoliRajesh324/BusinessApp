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

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        onStartShouldSetResponderCapture={() => true}
      >
        {investments.length === 0 ? (
          <Text>No investments found for this group</Text>
        ) : (
          investments.map((inv, idx) => (
            <View
              key={idx}
              style={{
                padding: 12,
                marginBottom: 12,
                borderRadius: 10,
                backgroundColor: "#f0f4f7",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 14 }}>
                {inv.description ?? inv.comments ?? "-"}
              </Text>

              {inv.investmentId != null && (
                <Text>Investment Id: {inv.investmentId}</Text>
              )}
              {inv.createdAt && (
                <Text>Created At: {formatDateTime(inv.createdAt)}</Text>
              )}
              {inv.createdBy && <Text>Created By: {inv.createdBy}</Text>}
              {inv.cropId != null && <Text>Crop Id: {inv.cropId}</Text>}
              {inv.description && <Text>Description: {inv.description}</Text>}
              {inv.investable != null && (
                <Text>Investable: {inv.investable}</Text>
              )}
              {inv.invested != null && <Text>Invested: {inv.invested}</Text>}
              {inv.partnerId != null && (
                <Text>Partner Id: {inv.partnerId}</Text>
              )}
              {inv.share != null && <Text>Share: {inv.share}</Text>}
              {inv.soldAmount != null && (
                <Text>Sold Amount: {inv.soldAmount}</Text>
              )}
              {inv.soldFlag && <Text>Sold Flag: {inv.soldFlag}</Text>}
              {inv.withdrawn != null && <Text>Withdrawn: {inv.withdrawn}</Text>}
              {inv.comments && <Text>Comments: {inv.comments}</Text>}
              {inv.withdrawFlag && (
                <Text>Withdraw Flag: {inv.withdrawFlag}</Text>
              )}
              {inv.partnerName && <Text>Partner Name: {inv.partnerName}</Text>}
              {inv.investmentGroupId != null && (
                <Text>Investment Group Id: {inv.investmentGroupId}</Text>
              )}
              {inv.totalAmount != null && (
                <Text>Total Amount: {inv.totalAmount}</Text>
              )}
              {inv.imageUrl && <Text>Image URL: {inv.imageUrl}</Text>}
              {inv.splitType && <Text>Split Type: {inv.splitType}</Text>}
              {inv.supplierName && (
                <Text>Supplier Name: {inv.supplierName}</Text>
              )}
              {inv.supplierId != null && (
                <Text>Supplier Id: {inv.supplierId}</Text>
              )}
              {inv.updatedBy && <Text>Updated By: {inv.updatedBy}</Text>}
              {inv.reduceLeftOver != null && (
                <Text>Reduce Left Over: {inv.reduceLeftOver}</Text>
              )}
              {inv.reduceLeftOverFlag && (
                <Text>Reduce Left Over Flag: {inv.reduceLeftOverFlag}</Text>
              )}
            </View>
          ))
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
});
