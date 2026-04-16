import { registerToast } from "@/src/utils/ToastService";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";

const GlobalToast = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error" | "info">("success");

  const translateY = useRef(new Animated.Value(-100)).current;
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    registerToast((msg, t = "success") => {
      setMessage(msg);
      setType(t as any);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (visible) {
      progress.setValue(1);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();

      Animated.timing(progress, {
        toValue: 0,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 3000);
    }
  }, [visible]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ✅ UPDATED COLORS
  const bgColor =
    type === "success"
      ? "#28a745" // green
      : type === "error"
        ? "#dc3545" // red
        : "#007bff"; // blue (info)

  const progressColor =
    type === "success"
      ? "#b9f6ca" // light green
      : type === "error"
        ? "#ffb3b3" // light red
        : "#b3d7ff"; // light blue

  const icon = type === "success" ? "✅ " : type === "error" ? "❌ " : "ℹ️ ";

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], backgroundColor: bgColor },
      ]}
    >
      <Text style={styles.text}>
        {icon}
        {message}
      </Text>

      <Animated.View
        style={[
          styles.progress,
          {
            width,
            backgroundColor: progressColor,
          },
        ]}
      />
    </Animated.View>
  );
};

export default GlobalToast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    width: "90%",
    padding: 14,
    borderRadius: 12,
    elevation: 5,
  },
  text: {
    color: "#fff",
    fontWeight: "600",
  },
  progress: {
    height: 5,
    marginTop: 10,
    borderRadius: 2,
  },
});
