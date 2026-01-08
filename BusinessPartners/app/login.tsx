// app/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import BASE_URL from "../src/config/config";
import ConnectionStatus from "./components/ConnectionStatus";

export const unstable_settings = {
  headerShown: false, // hide header
};
export default function LoginScreen() {
  const router = useRouter();

  // ⬇️ AUTO ROUTE LOGGED-IN + BIOMETRIC USERS
  useEffect(() => {
    const checkBiometricAndToken = async () => {
      const bio = await AsyncStorage.getItem("appLockLastAuth");
      const token = await AsyncStorage.getItem("token");

      if (bio === "yes" && token) {
        router.replace("/dashboard");
      }
    };

    checkBiometricAndToken();
  }, []);

  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ new state

  const handleSubmit = async () => {
    if (loading) return; // prevent double clicks
    setMessage("");
    setLoading(true); // start loading

    const url = isLogin
      ? `${BASE_URL}/api/auth/login`
      : `${BASE_URL}/api/auth/register`;

    try {
      const res = await axios.post(url, { username, password });

      if (isLogin) {
        const token = res?.data?.token || null;
        const userId = res?.data?.userId || null;

        if (!token) {
          setMessage("No token received from server");
          return;
        }

        await AsyncStorage.setItem("token", token);
        await AsyncStorage.setItem("userName", username);
        await AsyncStorage.setItem("userId", String(userId));

        setMessage("Login successful!");
        router.replace("/dashboard"); // ✅ route to dashboard
      } else {
        setMessage("Registered successfully. You can now login.");
        setIsLogin(true);
        setUsername("");
        setPassword("");
      }

      setUsername("");
      setPassword("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Something went wrong";
      setMessage(errorMsg);
      setPassword("");
    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              {isLogin ? "Business Login" : "Register New User"}
            </Text>

            {/* Username */}
            <View style={styles.inputGroup}>
              <ConnectionStatus />
              <Text style={styles.label}>Username:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={(t) =>
                  setUsername(t.replace(/\s+/g, "").toLowerCase())
                }
                placeholderTextColor="#847575ff"
                autoCapitalize="none"
                placeholder="Enter username"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#847575ff"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.showBtn}
                >
                  <Text style={styles.showBtnText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Message */}
            {message ? (
              <Text
                style={[
                  styles.message,
                  message.toLowerCase().includes("success")
                    ? { color: "green" }
                    : { color: "red" },
                ]}
              >
                {message}
              </Text>
            ) : null}

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              style={[styles.button, loading && { opacity: 0.6 }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading
                  ? isLogin
                    ? "Logging in..."
                    : "Registering..."
                  : isLogin
                  ? "Login"
                  : "Register"}
              </Text>
            </Pressable>

            {/* Switch Mode */}
            <View style={{ marginTop: 16, alignItems: "center" }}>
              <Text>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </Text>
              <Pressable
                onPress={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                  setPassword("");
                }}
                disabled={loading}
              >
                <Text style={styles.link}>
                  {isLogin ? "Register here" : "Login here"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f3f4f6" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: { marginBottom: 14 },
  label: { marginBottom: 6, fontWeight: "500", fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: "#000",  // <-- add this
  },
  passwordRow: { flexDirection: "row", alignItems: "center" },
  showBtn: { paddingHorizontal: 10, justifyContent: "center" },
  showBtnText: { color: "#2563eb", fontWeight: "600" },
  button: {
    marginTop: 10,
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  message: { marginTop: 12, marginBottom: 8, textAlign: "center" },
  link: { color: "#2563eb", marginTop: 6, fontWeight: "600" },
});
