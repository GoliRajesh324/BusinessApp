import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import DropDownPicker from "react-native-dropdown-picker";

import { Entypo, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";

import BASE_URL from "../src/config/config";
import AddInvestmentPopup from "./addInvestmentPopup";
import InvestmentAudit from "./components/InvestmentAudit";

export default function BusinessDetail() {
  const { businessId, businessName } = useLocalSearchParams<{
    businessId?: string;
    businessName?: string;
  }>();
  const router = useRouter();

  // //console.log("➡️ Params received:", businessId, businessName);

  // Ensure safe usage
  const safeBusinessId = businessId ? String(businessId) : "";
  const safeBusinessName = businessName ? String(businessName) : "";
  // AsyncStorage.setItem("businessName", safeBusinessName);

  const [partners, setPartners] = useState<any[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [leftOver, setLeftOver] = useState(0);
  const [yourInvestment, setYourInvestment] = useState(0);
  const [investmentDetails, setInvestmentDetails] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]); // <-- new
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalSoldAmount, setTotalSoldAmount] = useState(0);
  const [cropDetails, setCropDetails] = useState<any>(null);
  const [withdrawPopup, setWithdrawPopup] = useState(false);
  const [showAuditPopup, setShowAuditPopup] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState<
    { partnerName: string; leftOver: number }[]
  >([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const [expanded, setExpanded] = useState(false);

  const [selectedFilter, setSelectedFilter] = useState("byLoggedInUser"); // default
  const [open, setOpen] = useState(false);

  const [items, setItems] = useState([
    { label: "Your Records", value: "byLoggedInUser" },
    { label: "Your Investments", value: "byInvestment" },
    { label: "Your Withdraws", value: "byWithdraw" },
    { label: "Your Sold", value: "bySold" },
    { label: "All Records", value: "allInvestments" },
  ]);

  // 🏷 Get label text dynamically based on selected value
  const currentLabel =
    items.find((item) => item.value === selectedFilter)?.label ||
    "Select Filter";

  // enable LayoutAnimation for Android
  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    fetchBusinessDetails();
  }, [safeBusinessId, token]);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const tableMaxHeight = Math.round(Dimensions.get("window").height * 0.55); // adjust as needed

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      const u = await AsyncStorage.getItem("userId");
      const uName = await AsyncStorage.getItem("userName");
      setUserName(uName);
      console.log("📌 Loaded username:", uName);
      setToken(t);
      setUserId(u);
    };
    loadData();
  }, []);

  const parseAmount = (v: any) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const cleaned = String(v).replace(/,/g, "").trim();
    const n = Number(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const formatAmount = (v: any) =>
    Number(parseAmount(v)).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });

  const formatDateTime = (isoOrObj: any) => {
    if (!isoOrObj) return "-";
    try {
      const d = new Date(isoOrObj);
      return isNaN(d.getTime()) ? String(isoOrObj) : d.toLocaleString();
    } catch {
      return String(isoOrObj);
    }
  };

  // Fetch business info
  useEffect(() => {
    if (!token || !safeBusinessId) return;
    const fetchBusinessInfo = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const text = await response.text();
        if (!response.ok || !text) return;
        const data = JSON.parse(text);

        setTotalInvestment(data.totalInvestment || 0);
        setTotalSoldAmount(data.totalSoldAmount || 0);
        setInvestmentDetails(data.investmentDetails || []);

        if (data.crop) {
          setCropDetails({
            id: data.crop.id,
            cropNumber: data.crop.cropNumber,
          });
        }
      } catch (err) {
        console.error("❌ Error fetching business info:", err);
      }
    };

    fetchBusinessInfo();
  }, [safeBusinessId, token]);

  // Fetch partners
  useEffect(() => {
    if (!token || !safeBusinessId) return;

    const fetchPartners = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/business/${safeBusinessId}/partners`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const text = await response.text();
        if (!response.ok || !text) return;
        const data = JSON.parse(text);

        if (data?.partners) {
          setPartners(
            data.partners.map((p: any) => ({
              id: p.partnerId,
              username: p.username,
              share: p.share,
            }))
          );
        }
      } catch (err) {
        console.error("❌ Error fetching partners:", err);
      }
    };

    fetchPartners();
  }, [safeBusinessId, token]);

  // --- NEW: fetch investments when businessId or token changes ---
  const [allInvestments, setAllInvestments] = useState<any[]>([]);

  // fetch once
  useEffect(() => {
    if (safeBusinessId && token) fetchInvestments();
    //businessDetails();
  }, [safeBusinessId, token]);

  const fetchInvestments = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/investment/all-investments/${safeBusinessId}`,
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
      setAllInvestments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Error fetching investments");
    }
  };
  const fetchBusinessDetails = async () => {
    if (!token || !safeBusinessId) return;
    try {
      const response = await fetch(
        `${BASE_URL}/api/business/${safeBusinessId}/business-details-by-id`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();

      // 🧮 Safely update top-level totals
      setTotalInvestment(data?.totalInvestment || 0);
      setTotalSoldAmount(data?.totalSoldAmount || 0);
      setInvestmentDetails(
        Array.isArray(data?.investmentDetails) ? data.investmentDetails : []
      );
      setCropDetails(data?.crop || null);

      // 🧍‍♂️ Find record for logged-in user safely
      if (Array.isArray(data?.investmentDetails) && userName) {
        const myRecord =
          data.investmentDetails.find((inv: any) => {
            const partnerName =
              inv?.partnerName ?? inv?.partner?.username ?? "";
            return (
              partnerName.toString().toLowerCase() ===
              userName.toString().toLowerCase()
            );
          }) || null;

        if (myRecord) {
          setYourInvestment(myRecord.yourInvestment || 0);
          setLeftOver(myRecord.leftOver || 0);
        } else {
          setYourInvestment(0);
          setLeftOver(0);
        }
      }
    } catch (err) {
      console.error("❌ Error fetching business details:", err);
    }
  };

  const filteredInvestments = useMemo(() => {
    if (!allInvestments) return [];

    switch (selectedFilter) {
      case "byLoggedInUser":
        return allInvestments.filter(
          (inv) => inv.partnerName?.toString() === userName?.toString()
        );
      case "byInvestment":
        return allInvestments.filter(
          (inv) => inv?.soldFlag === "N" && inv?.withdrawFlag === "N"
        );
      case "byWithdraw":
        return allInvestments.filter((inv) => inv?.withdrawFlag === "Y");
      case "bySold":
        return allInvestments.filter((inv) => inv?.soldFlag === "Y");
      case "allInvestments":
      default:
        return allInvestments;
    }
  }, [allInvestments, selectedFilter, userId]);

  // Handle "Restart" (End Crop) click
  const handleRestartClick = () => {
    if (!investmentDetails || investmentDetails.length === 0) {
      handleRestartCrop();
      return;
    }

    // Check leftover money for partners
    const leftovers = investmentDetails
      .map((inv) => ({
        partnerName: inv?.partner?.username || "Unknown",
        leftOver: parseAmount(inv?.leftOver),
      }))
      .filter((p) => p.leftOver !== 0);

    if (!leftovers || leftovers.length === 0) {
      handleRestartCrop();
    } else {
      setConfirmRestart(leftovers);
    }
  };

  // Restart crop API call
  const handleRestartCrop = async () => {
    try {
      const cropId = cropDetails?.id;
      if (!cropId) return;

      await axios.post(
        `${BASE_URL}/api/crop/end/${cropId}/${userId}`,
        investmentDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      // Refresh and navigate
      router.push("/dashboard");
    } catch (err: any) {
      console.error("❌ Restart crop error:", err);
      if (err.response?.status === 400) alert("Invalid partner data.");
      else if (err.response?.status === 403) alert("Access forbidden!");
      else alert("Error restarting crop.");
    }
    setConfirmRestart([]);
  };

  // Handle Withdraw from confirm popup
  const handleWithdrawFromPopup = () => {
    setWithdrawPopup(true);
    setConfirmRestart([]);
  };

  const handlePopupSave = async ({ investmentData, images }: any) => {
    console.log("➡️ Popup images :", images);
    try {
      const response = await axios.post(
        `${BASE_URL}/api/investment/add-investment`,
        investmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const investmentGroupId = response?.data;
      console.log("➡️ Investment Group ID:", investmentGroupId);
      if (images && images.length > 0) {
        for (let file of images) {
          const formData = new FormData();
          formData.append("file", file);
          await axios.post(
            `${BASE_URL}/api/investment-images/upload/${investmentGroupId}`,
            formData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      }
      /* 
      const res = await fetch(
        `${BASE_URL}/api/business/${businessId}/business-details-by-id`,
        { method: "GET", headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await res.json();
      setTotalInvestment(data.totalInvestment);
      setTotalSoldAmount(data.totalSoldAmount);
      setCropDetails(data.crop);
      setInvestmentDetails(data.investmentDetails);

      investmentDetails.forEach((item) => {
        const partner = item.partner; // partner object
        console.log("➡️ Your investment item:", item);
        if (partner.username === userName) {
          console.log("➡️ Your investment item:", item);
          setYourInvestment(item.yourInvestment);
          setLeftOver(item.leftOver);
        }
      }); */
      // refresh investments list
      await fetchBusinessDetails();
      fetchInvestments();
    } catch (error) {
      console.error(error);
    }
  };

  const handleBack = () => router.back();

  // Render a small label-value row
  const RowKV = ({ k, v }: { k: string; v: any }) => (
    <View style={styles.invRow}>
      <Text style={styles.invLabel}>{k}</Text>
      <Text style={styles.invValue}>{v ?? "-"}</Text>
    </View>
  );

  // Render intelligent card based on flags
  const renderInvestmentCard = (inv: any, idx: number) => {
    // Choose background color based on investmentGroupId
    const bgColor =
      (inv?.investmentGroupId ?? 0) % 2 === 0 ? "#e1e3e6ff" : "#fff";

    const soldFlag = inv?.soldFlag ?? inv?.soldflag ?? "N";
    const withdrawFlag = inv?.withdrawFlag ?? inv?.withdrawflag ?? "N";

    // Normalize names
    const description = inv?.description || inv?.comments || "-";
    const partnerName = inv?.partnerName || inv?.supplierName || "-";
    const totalAmount =
      inv?.totalAmount ?? inv?.invested ?? inv?.investable ?? 0;
    const invested = inv?.invested ?? inv?.investable ?? 0;
    const investable = inv?.investable ?? 0;
    const withdrawn = inv?.withdrawn ?? 0;
    const soldAmount = inv?.soldAmount ?? 0;
    const splitType = inv?.splitType ?? inv?.splittype ?? "-";
    const updatedBy = inv?.updatedBy || inv?.createdBy || "-";
    const shareAmount = inv?.share ?? inv?.soldAmount ?? inv?.soldAmount ?? 0;
    const imageUrl = inv?.imageUrl || null;
    const createdAt = inv?.createdAt || inv?.createdDate || null;

    return (
      <View
        key={String(inv?.investmentId ?? idx)}
        style={[styles.investmentCard, { backgroundColor: bgColor }]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {description}
            </Text>
            <Text style={styles.cardSubtitle}>{partnerName}</Text>
          </View>

          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.imageThumb} />
          ) : (
            <View style={styles.imageThumbPlaceholder}>
              <Ionicons name="cash-outline" size={22} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <RowKV k="Total Amount" v={`₹${formatAmount(totalAmount)}`} />
          {soldFlag === "N" && withdrawFlag === "N" && (
            <>
              <RowKV k="Invested" v={`₹${formatAmount(invested)}`} />
              <RowKV k="Investable" v={`₹${formatAmount(investable)}`} />
              <RowKV k="Split Type" v={splitType} />
              <RowKV k="Updated" v={updatedBy} />
            </>
          )}

          {soldFlag === "N" && withdrawFlag === "Y" && (
            <>
              <RowKV k="Withdrawn" v={`₹${formatAmount(withdrawn)}`} />
              <RowKV k="Split" v={splitType} />
              <RowKV k="Updated" v={updatedBy} />
            </>
          )}

          {soldFlag === "Y" && withdrawFlag === "N" && (
            <>
         {/*      <RowKV k="Share" v={`₹${formatAmount(shareAmount)}`} /> */}
              <RowKV k="sold Amount" v={`₹${formatAmount(soldAmount)}`} />
              <RowKV k="Split" v={splitType} />
              <RowKV k="Updated" v={updatedBy} />
            </>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.createdAtText}>{formatDateTime(createdAt)}</Text>

          {/*   <TouchableOpacity
            onPress={() => {
              // light action: maybe open audit or navigate to detailed view later
              Alert.alert("Investment", `${description}\n\nID: ${inv?.investmentId}`);
            }}
          >
            <Text style={styles.viewMore}>View</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    );
  };
  const handleSelect = (val: string) => {
    setSelectedFilter(val);
    setOpen(false); // ✅ closes the dropdown when selected
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{String(businessName || "")}</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => alert("Header actions comming soon")}
        >
          <Entypo name="dots-three-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 180,
          paddingHorizontal: 16,
          paddingTop: 16, // spacing from header
        }}
      >
        {/* Summary Card (tap to expand/collapse) */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() =>
            router.push({
              pathname: "/partnerWiseDetails",
              params: {
                businessId: safeBusinessId,
                businessName: safeBusinessName,
                investmentDetails: investmentDetails,
              },
            })
          }
          style={[styles.summaryCard, expanded && styles.summaryCardExpanded]}
        >
          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabelSmall}>Total Investment :</Text>
            <Text style={styles.summaryValueLarge}>
              {formatAmount(totalInvestment)}
            </Text>
          </View>

          <View style={styles.summaryItemRow}>
            <Text style={styles.summaryLabelSmall}>Total Sold :</Text>
            <Text style={styles.summaryValueLarge}>
              {formatAmount(totalSoldAmount)}
            </Text>
          </View>

          <View style={styles.summaryVertical}>
            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Availabe Money :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(leftOver)}
              </Text>
            </View>

            <View style={styles.summaryItemRow}>
              <Text style={styles.summaryLabelSmall}>Your Investment :</Text>
              <Text style={styles.summaryValueLarge}>
                {formatAmount(yourInvestment)}
              </Text>
            </View>

            {/*   <View style={{ alignItems: "center", marginTop: 4 }}>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={22}
                color="#666"
              />
            </View> */}
          </View>

          {/* optional expanded summary area (additional details) */}
          {/* {expanded && (
            <View style={styles.expandedContent}>
              
              <Text style={{ color: "#666" }}>
                Tap the card to collapse. Scroll the table below for more
                details.
              </Text>
            </View>
          )} */}
        </TouchableOpacity>

        {/* Expanded table area */}
        {/* {expanded && (
          <View style={[styles.tableContainer, { maxHeight: tableMaxHeight }]}>
            <ScrollView nestedScrollEnabled>
              <InvestmentTable investmentDetails={investmentDetails} />
            </ScrollView>
          </View>
        )} */}

        {/* --- FILTER SECTION --- */}
        <View style={{ marginVertical: 12, zIndex: 1000 }}>
          {/* Row with text + filter icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600" }}>
              {currentLabel}
            </Text>

            <TouchableOpacity onPress={() => setOpen((prev) => !prev)}>
              <Ionicons
                name={open ? "filter-circle" : "filter"}
                size={24}
                color="#333"
              />
            </TouchableOpacity>
          </View>

          {/* Dropdown - only visible when open */}
          {open && (
            <DropDownPicker
              open={open}
              value={selectedFilter}
              items={items}
              setOpen={setOpen}
              setItems={setItems}
              setValue={() => {}}
              onSelectItem={(item) => handleSelect(item.value ?? "")} // ✅ Works now
              placeholder="Select Filter"
              listMode="SCROLLVIEW"
              style={{
                marginTop: 8,
                backgroundColor: "#fff",
                borderColor: "#ccc",
                borderRadius: 8,
              }}
              dropDownContainerStyle={{
                backgroundColor: "#fff",
                borderColor: "#ccc",
              }}
            />
          )}
        </View>

        {/* --- New section: list of investment cards --- */}
        {/* Investment Cards */}
        <View style={{ marginTop: 12 }}>
          {filteredInvestments.length === 0 ? (
            <Text style={{ color: "#666", padding: 12 }}>
              No investments found.
            </Text>
          ) : (
            filteredInvestments.map((inv, idx) =>
              renderInvestmentCard(inv, idx)
            )
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {/*       <View style={styles.fabContainer}>
        {fabOpen && (
          <View style={styles.fabOptions}>
            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#ff9900" }]}
              onPress={() => {
                setSoldPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Sold</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#4f93ff" }]}
              onPress={() => {
                setShowPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Add Expense</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, { backgroundColor: "#f44336" }]}
              onPress={() => {
                setWithdrawPopup(true);
                setFabOpen(false);
              }}
            >
              <Text style={styles.fabOptionText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => setFabOpen(!fabOpen)}
        >
          <Text style={styles.fabText}>{fabOpen ? "×" : "+"}</Text>
        </TouchableOpacity>
      </View> */}

      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setShowPopup(true);
            setFabOpen(false);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Footer Buttons */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={styles.bottomButtonIcon}
          onPress={() => router.push("/dashboard")}
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
          onPress={() => setShowAuditPopup(true)}
        >
          <Ionicons name="time" size={28} color="#4f93ff" />
          <Text style={styles.bottomButtonText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Popups */}
      {/* inside BusinessDetail */}

      {showPopup && (
        <AddInvestmentPopup
          visible={showPopup}
          businessId={String(businessId || "")}
          businessName={String(businessName || "")}
          partners={partners}
          cropDetails={cropDetails}
          onClose={() => setShowPopup(false)}
          onSave={(data) => {
            handlePopupSave(data);
            setShowPopup(false);
          }}
        />
      )}
      {/* 
      {withdrawPopup && (
        <WithdrawAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          investmentDetails={investmentDetails}
          visible={withdrawPopup}
          onClose={() => setWithdrawPopup(false)}
          onSave={handlePopupSave}
        />
      )}
      {soldPopup && (
        <SoldAmountPopup
          partners={partners}
          cropDetails={cropDetails}
          visible={soldPopup}
          onClose={() => setSoldPopup(false)}
          onSave={(data) => {
            handlePopupSave(data);
            setSoldPopup(false);
          }}
        />
      )}
 */}
      {showAuditPopup && (
        <InvestmentAudit
          businessId={String(businessId || "")}
          businessName={String(businessName || "")}
          visible={showAuditPopup}
          onClose={() => setShowAuditPopup(false)}
        />
      )}

      {confirmRestart && confirmRestart.length > 0 && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContent}>
            <Text style={styles.popupTitle}>
              Do you really want to restart crop?{"\n"}Leftover money exists for
              some partners.
            </Text>

            <View style={styles.leftoverList}>
              {confirmRestart.map((p, idx) => (
                <View key={idx} style={styles.leftoverItem}>
                  <Text style={styles.partnerName}>
                    {String(p.partnerName)}
                  </Text>
                  <Text style={styles.partnerAmount}>
                    ₹{formatAmount(p.leftOver)}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.popupButtons}>
              <TouchableOpacity
                style={styles.moveBtn}
                onPress={handleRestartCrop}
              >
                <Text style={styles.buttonText}>Move</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={handleWithdrawFromPopup}
              >
                <Text style={styles.buttonText}>Withdraw</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmRestart([])}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Existing styles + new styles for header & bottom buttons + investment cards
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // page background
  },

  // -------- Header --------
  header: {
    height:
      Platform.OS === "android" ? 80 + (StatusBar.currentHeight || 0) : 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 100,
  },
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 40, justifyContent: "center", alignItems: "flex-end" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  // -------- Business Name --------
  businessName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 12,
    color: "#000",
  },

  // -------- Summary Row --------
  /*   summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  }, */
  summaryInfo: { flex: 1 },
  summaryText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#000",
  },
  /*   summaryLabel: { color: "#555" },
  summaryValue: { color: "#222", fontWeight: "700" }, */
  summaryCard: {
    backgroundColor: "#a5c4f5ff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  summaryCardExpanded: {
    // tiny visual difference when expanded
    borderColor: "#e6f0ff",
    borderWidth: 1,
  },
  summaryTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    paddingHorizontal: 6,
  },

  summaryLabelSmall: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  summaryValueLarge: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  tableContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryVertical: {
    flexDirection: "column",
    gap: 6,
  },
  summaryItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },

  // -------- Investment Card styles (new) --------
  investmentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
    resizeMode: "cover",
    backgroundColor: "#eee",
  },
  imageThumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 12,
    backgroundColor: "#4f93ff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  invRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  invLabel: { color: "#6b7280", fontSize: 13, fontWeight: "600" },
  invValue: { color: "#111827", fontSize: 13, fontWeight: "700" },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createdAtText: { color: "#9ca3af", fontSize: 12 },
  viewMore: { color: "#4f93ff", fontWeight: "700" },

  // -------- Buttons --------
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginHorizontal: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  addBtn: { backgroundColor: "#4f93ff" },
  withdrawBtn: { backgroundColor: "#f44336" },
  soldBtn: { backgroundColor: "#ff9900" },
  invBtn: { backgroundColor: "#4f93ff" },
  restartBtn: { backgroundColor: "#f44336" },
  auditBtn: { backgroundColor: "#999a9c" },
  buttonText: { color: "#fff", fontWeight: "500", fontSize: 13 },

  // -------- Popup --------
  popupOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  popupContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: "#333",
  },
  leftoverList: { marginBottom: 20 },
  leftoverItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  partnerName: { fontSize: 16, fontWeight: "500", color: "#444" },
  partnerAmount: { fontSize: 16, fontWeight: "700", color: "#222" },
  popupButtons: { flexDirection: "row", justifyContent: "space-between" },
  moveBtn: {
    flex: 1,
    backgroundColor: "#4f93ff",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#999a9c",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },

  // -------- Floating Action Button --------
  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 110 : 90, // ⬆️ lifted to sit nicely above bottom bar
    right: 25,
    zIndex: 1000,
    alignItems: "flex-end",
  },

  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },

  fabText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
  },

  fabOptions: {
    marginBottom: 14,
    alignItems: "flex-end",
  },

  fabOption: {
    width: 150,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginBottom: 12,
    backgroundColor: "#4F93FF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  fabOptionText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
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
    bottom: 0, // ⬅️ lifts bar a bit upward
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
  cardContainer: {
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
