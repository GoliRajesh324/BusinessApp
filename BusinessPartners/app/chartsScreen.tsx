import React from "react";
import { Dimensions, Text, View } from "react-native";
import { PieChart } from "react-native-chart-kit";

export default function chartsScreen() {
  const chartData = [
    {
      name: "Rajesh",
      population: 40,
      color: "#2563EB",
      legendFontColor: "#000",
      legendFontSize: 14,
    },
    {
      name: "Ravi",
      population: 60,
      color: "#16A34A",
      legendFontColor: "#000",
      legendFontSize: 14,
    },
  ];

  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <Text style={{ textAlign: "center", fontSize: 20 }}>
        Test PieChart
      </Text>

      <PieChart
        data={chartData}
        width={Dimensions.get("window").width}
        height={260}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="20"
        absolute
      />
    </View>
  );
}
