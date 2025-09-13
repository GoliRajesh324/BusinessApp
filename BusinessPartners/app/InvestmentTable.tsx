import React from "react";
import { View, Text, FlatList, ScrollView, StyleSheet } from "react-native";

type Partner = {
  username: string;
  share?: number;
};

type InvestmentDetail = {
  partner?: Partner;
  leftOver: number;
  actualInvestment: number;
  yourInvestment: number;
  actualSold: number;
  withdrawn: number;
};

type InvestmentTableProps = {
  investmentDetails: InvestmentDetail[];
};

const InvestmentTable: React.FC<InvestmentTableProps> = ({
  investmentDetails,
}) => {
  if (!investmentDetails || investmentDetails.length === 0) {
    return (
      <Text style={styles.noDataText}>No investment details available.</Text>
    );
  }

  const renderRow = ({ item }: { item: InvestmentDetail }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.nameCol]}>
        {item.partner?.username || "-"}
      </Text>
      <Text style={[styles.cell, styles.shareCol]}>
        {item.partner?.share !== undefined ? `${item.partner.share}%` : "-"}
      </Text>
      <Text style={[styles.cell, styles.moneyCol]}>₹{item.leftOver}</Text>
      <Text style={[styles.cell, styles.moneyCol]}>
        ₹{item.actualInvestment}
      </Text>
      <Text style={[styles.cell, styles.moneyCol]}>₹{item.yourInvestment}</Text>
      <Text style={[styles.cell, styles.moneyCol]}>₹{item.actualSold}</Text>
      <Text style={[styles.cell, styles.moneyCol]}>₹{item.withdrawn}</Text>
    </View>
  );

  return (
    <ScrollView horizontal style={styles.tableWrapper}>
      <View>
        {/* Header */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, styles.nameCol]}>
            Name
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.shareCol]}>
            Share %
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.moneyCol]}>
            Left Over
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.moneyCol]}>
            Actual Investment
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.moneyCol]}>
            You Invested
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.moneyCol]}>
            Actual Sold
          </Text>
          <Text style={[styles.cell, styles.headerCell, styles.moneyCol]}>
            Withdrawn
          </Text>
        </View>

        {/* Data */}
        <FlatList
          data={investmentDetails}
          renderItem={renderRow}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
    </ScrollView>
  );
};

export default InvestmentTable;

const styles = StyleSheet.create({
  tableWrapper: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerRow: {
    backgroundColor: "#3498db",
  },
  cell: {
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontSize: 14,
    textAlign: "center",
  },
  headerCell: {
    color: "#fff",
    fontWeight: "600",
  },

  // 👇 fixed widths
  nameCol: { width: 120, textAlign: "left" },
  shareCol: { width: 80 },
  moneyCol: { width: 120 },

  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});
