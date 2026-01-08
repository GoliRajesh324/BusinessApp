import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import BASE_URL from "../../src/config/config";

// Import your popup components (you need to convert them to RN too)
//import EditInvestmentPopup from "../components/EditInvestmentPopup";
//import EditSoldAmountPopup from "../components/EditSoldAmountPopup";
//import EditWithdrawAmountPopup from "../components/EditWithdrawAmountPopup";
//import Header from "../components/Header";

const CropDetailsPage = () => {
  const { businessId, businessName } = useLocalSearchParams();
  const [investments, setInvestments] = useState<any[]>([]);
  const [token, setToken] = useState<string | null>(null);

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showEditSoldPopup, setShowEditSoldPopup] = useState(false);
  const [showEditWithdrawPopup, setShowEditWithdrawPopup] = useState(false);
  const [editGroup, setEditGroup] = useState<any[] | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (businessId && token) {
      fetchInvestments();
    }
  }, [businessId, token]);

  const fetchInvestments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/investment/all-investments/${businessId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch investments");

      const data = await response.json();
      setInvestments(
        Array.isArray(data)
          ? data.sort((a, b) => b.investmentId - a.investmentId)
          : []
      );
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Error fetching investments");
    }
  };

  // Group by investmentGroupId
  const groupedInvestments = investments.reduce((acc: any, inv) => {
    if (!acc[inv.investmentGroupId]) {
      acc[inv.investmentGroupId] = [];
    }
    acc[inv.investmentGroupId].push(inv);
    return acc;
  }, {});

  // Sort groups by highest investmentId DESC
  const sortedGroups = Object.values(groupedInvestments).sort(
    (a: any, b: any) => b[0].investmentId - a[0].investmentId
  );

  // Handle clicking on investmentId for EDIT
  const handleInvestmentClick = (inv: any) => {
    const group = groupedInvestments[inv.investmentGroupId] || [];
    if (inv.soldFlag === "N" && inv.withdrawFlag === "N") {
      setEditGroup(group);
      setShowEditPopup(true);
    } else if (inv.soldFlag === "Y" && inv.withdrawFlag === "N") {
      setEditGroup(group);
      setShowEditSoldPopup(true);
    } else if (inv.soldFlag === "N" && inv.withdrawFlag === "Y") {
      setEditGroup(group);
      setShowEditWithdrawPopup(true);
    } else {
      Alert.alert("Invalid", "This is Not a valid investment type");
    }
  };

  const handleEditSave = () => {
    if (businessId && token) {
      fetchInvestments();
    }
    setShowEditPopup(false);
    setShowEditSoldPopup(false);
    setShowEditWithdrawPopup(false);
    setEditGroup(null);
  };

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>
        ALL Investments for {businessName || "Unknown"}
      </Text>

      <ScrollView horizontal>
        <View>
          <View style={styles.tableHeader}>
            {[
              "ID",
              "Partner",
              "Description",
              "Total",
              "Investable",
              "Invested",
              "Sold",
              "Withdrawn",
              "Group",
              "Comments",
              "Created By",
              "Created At",
              "Image",
            ].map((h, idx) => (
              <Text key={idx} style={styles.headerCell}>
                {h}
              </Text>
            ))}
          </View>

          {sortedGroups.map((group: any, groupIndex: number) =>
            group.map((inv: any, idx: number) => (
              <View
                key={inv.investmentId}
                style={[
                  styles.row,
                  groupIndex % 2 === 0 ? styles.groupGrey : styles.groupLight,
                ]}
              >
                <TouchableOpacity onPress={() => handleInvestmentClick(inv)}>
                  <Text style={styles.link}>{inv.investmentId}</Text>
                </TouchableOpacity>
                <Text style={styles.cell}>{inv.partnerName || "-"}</Text>
                <Text style={styles.cell}>{inv.description}</Text>
                <Text style={styles.cell}>{inv.totalAmount}</Text>
                <Text style={styles.cell}>{inv.investable}</Text>
                <Text style={styles.cell}>{inv.invested}</Text>
                <Text style={styles.cell}>{inv.soldAmount}</Text>
                <Text style={styles.cell}>{inv.withdrawn}</Text>
                <Text style={styles.cell}>{inv.investmentGroupId}</Text>
                <Text style={styles.cell}>{inv.comments}</Text>
                <Text style={styles.cell}>{inv.createdBy || "-"}</Text>
                <Text style={styles.cell}>
                  {new Date(inv.createdAt).toLocaleString()}
                </Text>
                {idx === 0 ? (
                  <View style={styles.cell}>
                    {inv.imageUrl ? (
                      inv.imageUrl.split(",").map((url: string, i: number) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => Alert.alert("Open Image", url)}
                        >
                          <Text style={styles.imageLink}>
                            Image {i + 1}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text>-</Text>
                    )}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Investment Popup */}
      {/* {showEditPopup && editGroup && (
        <EditInvestmentPopup
          investment={editGroup}
          onClose={() => {
            setShowEditPopup(false);
            setEditGroup(null);
          }}
          onSave={handleEditSave}
        />
      )} */}

      {/* Edit Sold Popup */}
   {/*    {showEditSoldPopup && editGroup && (
        <EditSoldAmountPopup
          soldData={editGroup}
          onClose={() => {
            setShowEditSoldPopup(false);
            setEditGroup(null);
          }}
          onSave={handleEditSave}
        />
      )} */}

      {/* Edit Withdraw Popup */}
   {/*    {showEditWithdrawPopup && editGroup && (
        <EditWithdrawAmountPopup
          withdrawData={editGroup}
          onClose={() => {
            setShowEditWithdrawPopup(false);
            setEditGroup(null);
          }}
          onSave={handleEditSave}
        />
      )} */}
    </View>
  );
};

export default CropDetailsPage;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, backgroundColor: "#f9fafb" },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
    color: "#2c3e50",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#3498db",
  },
  headerCell: {
    flex: 1,
    padding: 8,
    color: "#fff",
    fontWeight: "600",
    minWidth: 100,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  cell: {
    flex: 1,
    padding: 8,
    minWidth: 100,
  },
  groupGrey: { backgroundColor: "#f9f9f9" },
  groupLight: { backgroundColor: "#e6f0ff" },
  link: {
    color: "#0077cc",
    textDecorationLine: "underline",
    padding: 8,
    minWidth: 100,
  },
  imageLink: {
    color: "#0077cc",
    textDecorationLine: "underline",
  },
});
