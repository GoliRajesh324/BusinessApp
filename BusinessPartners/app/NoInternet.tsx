import { MaterialIcons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  onRetry: (status: boolean) => void;
}

export default function NoInternet({ onRetry }: Props) {
  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    onRetry(!!state.isConnected);
  };

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Icon Section */}
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <MaterialIcons name="signal-wifi-off" size={90} color="#ee3e1f" />
      </Animated.View>

      {/* Title */}
      <Text style={styles.title}>No Internet</Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Please check your network and try again.
      </Text>

      {/* Retry Button */}
      <TouchableOpacity style={styles.button} onPress={handleRetry}>
        <Text style={styles.buttonText}>Retry</Text>
      </TouchableOpacity>

      {/* Small hint */}
      <Text style={styles.footerText}>
        We’ll reconnect automatically when you're back online
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f9ff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  iconWrapper: {
    backgroundColor: "#e3edff",
    padding: 25,
    borderRadius: 100,
    marginBottom: 25,
    shadowColor: "#4f93ff",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },

  button: {
    backgroundColor: "#4f93ff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#4f93ff",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  footerText: {
    marginTop: 20,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
