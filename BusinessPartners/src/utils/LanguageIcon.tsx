import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LanguageIcon() {
  return (
    <View style={styles.container}>
      <Text style={styles.mainText}>A</Text>
      <Text style={styles.smallText}>తె</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1f2230",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  mainText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    lineHeight: 30,
  },

  smallText: {
    position: "absolute",
    top: 7,
    right: 6,
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});
