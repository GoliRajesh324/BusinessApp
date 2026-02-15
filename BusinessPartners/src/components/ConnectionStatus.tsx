import axios from "axios";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import BASE_URL from "../config/config";

export default function ConnectionStatus() {
  const [status, setStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");

  const checkConnection = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
      if (res.status === 200) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch (err) {
      setStatus("disconnected");
    }
  };

  useEffect(() => {
    // Run once immediately
    checkConnection();

    // Run every 7 seconds, no matter what
    const interval = setInterval(() => {
      setStatus("checking");
      checkConnection();
    }, 7000);

    return () => clearInterval(interval);
  }, []); // ✅ empty deps → runs only once on mount

  return (
    <View style={styles.container}>
      {status === "connected" && <Text style={styles.green}>🟢 Connected</Text>}
      {status === "disconnected" && (
        <Text style={styles.red}>🔴 No Connection</Text>
      )}
      {status === "checking" && (
        <Text style={styles.orange}>⏳ Please Wait Getting Connection...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  green: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
  },
  red: {
    fontSize: 16,
    fontWeight: "bold",
    color: "red",
  },
  orange: {
    fontSize: 16,
    fontWeight: "bold",
    color: "orange",
  },
});
