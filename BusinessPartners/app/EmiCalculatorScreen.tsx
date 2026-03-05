import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EmiCalculatorScreen() {
  const router = useRouter();

  const [loanAmount, setLoanAmount] = useState(1000000);
  const [interestValue, setInterestValue] = useState(6.5);
  const [interestMode, setInterestMode] = useState<"percent" | "rupee">(
    "percent",
  );
  const [tenureYears, setTenureYears] = useState(5);

  // Convert rupee to percentage
  const interestPercent =
    interestMode === "percent" ? interestValue : interestValue * 12; // 1₹ = 12%

  const emiDetails = useMemo(() => {
    const P = loanAmount;
    const annualRate = interestPercent;
    const r = annualRate / 12 / 100;
    const n = tenureYears * 12;

    if (r === 0) {
      const emi = P / n;
      return {
        emi,
        totalAmount: P,
        totalInterest: 0,
      };
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    const totalAmount = emi * n;
    const totalInterest = totalAmount - P;

    return {
      emi,
      totalAmount,
      totalInterest,
    };
  }, [loanAmount, interestPercent, tenureYears]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>EMI Calculator</Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Loan Amount */}
        <Text style={styles.label}>Loan Amount</Text>

        <View style={styles.valueBox}>
          <TextInput
            style={styles.valueText}
            keyboardType="numeric"
            value={String(loanAmount)}
            onChangeText={(t) => setLoanAmount(Number(t) || 0)}
          />
        </View>

        <Slider
          minimumValue={10000}
          maximumValue={50000000}
          step={10000}
          value={loanAmount}
          onValueChange={(val) => setLoanAmount(val)}
          minimumTrackTintColor="#16a34a"
        />

        {/* Interest */}
        <Text style={styles.label}>Rate of Interest</Text>

        <View style={styles.row}>
          <View style={styles.valueBox}>
            {interestMode === "rupee" && <Text style={styles.prefix}>₹</Text>}
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={interestValue.toFixed(2)}
              onChangeText={(t) => setInterestValue(Number(t) || 0)}
            />
            {interestMode === "percent" && <Text style={styles.suffix}>%</Text>}
          </View>

          <TouchableOpacity
            style={styles.modeBtn}
            onPress={() =>
              setInterestMode((prev) =>
                prev === "percent" ? "rupee" : "percent",
              )
            }
          >
            <Text style={styles.modeText}>
              {interestMode === "percent" ? "%" : "₹"}
            </Text>
          </TouchableOpacity>
        </View>

        <Slider
          minimumValue={0}
          maximumValue={interestMode === "percent" ? 30 : 3}
          step={0.1}
          value={interestValue}
          onValueChange={(val) => setInterestValue(Number(val.toFixed(2)))}
          minimumTrackTintColor="#16a34a"
        />

        {/* Tenure */}
        <Text style={styles.label}>Loan Tenure (Years)</Text>

        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{tenureYears} Yr</Text>
        </View>

        <Slider
          minimumValue={1}
          maximumValue={30}
          step={1}
          value={tenureYears}
          onValueChange={(val) => setTenureYears(val)}
          minimumTrackTintColor="#16a34a"
        />

        {/* Result Card */}
        <View style={styles.resultCard}>
          <Row label="Monthly EMI" value={`₹ ${emiDetails.emi.toFixed(0)}`} />
          <Row
            label="Principal amount"
            value={`₹ ${loanAmount.toLocaleString("en-IN")}`}
          />
          <Row
            label="Total interest"
            value={`₹ ${emiDetails.totalInterest.toFixed(0)}`}
          />
          <Row
            label="Total amount"
            value={`₹ ${emiDetails.totalAmount.toFixed(0)}`}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const Row = ({ label, value }: any) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={styles.resultValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    position: "relative",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },

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
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  label: {
    marginTop: 16,
    fontWeight: "600",
    fontSize: 15,
  },
  valueBox: {
    backgroundColor: "#e6f4ea",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  valueText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16a34a",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16a34a",
    minWidth: 50,
  },
  prefix: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 5,
  },
  suffix: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 5,
  },
  modeBtn: {
    backgroundColor: "#4f93ff",
    padding: 10,
    borderRadius: 8,
  },
  modeText: {
    color: "#fff",
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#fff",
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 14,
    color: "#555",
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
