// app/login.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConnectionStatus from "../src/components/ConnectionStatus";
import BASE_URL from "../src/config/config";
import { registerForPushNotificationsAsync } from "../src/services/notificationService";

export default function LoginScreen() {
  const router = useRouter();

  useEffect(() => {
    const checkBiometricAndToken = async () => {
      const bio = await AsyncStorage.getItem("appLockLastAuth");
      const token = await AsyncStorage.getItem("token");
      const lockEnabled = await AsyncStorage.getItem("appLockEnabled");

      if (token && (lockEnabled !== "true" || bio === "yes")) {
        router.replace("/dashboard");
      }
    };

    checkBiometricAndToken();
  }, []);

  const [isLogin, setIsLogin] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;

    setMessage("");
    setLoading(true);

    if (!isLogin) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        setMessage("Invalid email format");
        setLoading(false);
        return;
      }

      if (phone.length !== 10) {
        setMessage("Phone must be 10 digits");
        setLoading(false);
        return;
      }
    }

    const url = isLogin
      ? `${BASE_URL}/api/auth/login`
      : `${BASE_URL}/api/auth/register`;

    try {
      const payload = isLogin
        ? { username: username.toLowerCase(), password } // ✅ FIX
        : { username: username.toLowerCase(), password, email, phone };

      const res = await axios.post(url, payload);

      if (isLogin) {
        const token = res?.data?.token || null;

        if (!token) {
          setMessage("No token received from server");
          return;
        }

        await AsyncStorage.setItem("token", String(res.data.token));
        await AsyncStorage.setItem("userId", String(res.data.userId));
        await AsyncStorage.setItem("userName", String(res.data.username));
        await AsyncStorage.setItem("email", String(res.data.email || ""));
        await AsyncStorage.setItem("phone", String(res.data.phone || ""));

        try {
          const pushToken = await registerForPushNotificationsAsync();

          if (pushToken) {
            await axios.post(
              `${BASE_URL}/api/auth/save-token`,
              { pushToken },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );
          }
        } catch (error) {
          console.log("Push token failed", error);
        }

        router.replace("/dashboard");
      } else {
        setMessage("Registered successfully. You can now login.");
        setIsLogin(true);
        setUsername("");
        setPassword("");
        setEmail("");
        setPhone("");
      }

      setUsername("");
      setPassword("");
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Something went wrong";
      setMessage(errorMsg);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        colors={["#1e3a8a", "#2563eb", "#60a5fa"]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>BizMoney</Text>
              <Text style={styles.subtitle}>
                {isLogin ? "Welcome back 👋" : "Create your account 🚀"}
              </Text>
            </View>

            <View style={styles.card}>
              <ConnectionStatus />

              <Input
                icon="person-outline"
                placeholder="Username / Email / Phone"
                value={username}
                onChangeText={
                  (t: string) => setUsername(t.trim().toLowerCase()) // ✅ lowercase fix
                }
              />

              {!isLogin && (
                <Input
                  icon="mail-outline"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                />
              )}

              {!isLogin && (
                <Input
                  icon="call-outline"
                  placeholder="Phone"
                  value={phone}
                  onChangeText={(t: string) =>
                    setPhone(t.replace(/[^0-9]/g, ""))
                  }
                />
              )}

              <Input
                icon="lock-closed-outline"
                placeholder="Password"
                value={password}
                secure={!showPassword}
                onChangeText={setPassword}
                rightIcon={
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {isLogin && (
                <Pressable onPress={() => router.push("/forgotPasswordScreen")}>
                  <Text style={styles.forgot}>Forgot Password?</Text>
                </Pressable>
              )}

              {message ? <Text style={styles.error}>{message}</Text> : null}

              <Pressable style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>
                  {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
                </Text>
              </Pressable>

              <View style={styles.switchWrap}>
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
                >
                  <Text style={styles.switchText}>
                    {isLogin ? "Register" : "Login"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

/* INPUT COMPONENT */
const Input = ({
  icon,
  placeholder,
  value,
  onChangeText,
  secure,
  rightIcon,
}: any) => (
  <View style={styles.inputBox}>
    <Ionicons name={icon} size={18} color="#64748b" />
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secure}
      style={styles.input}
      placeholderTextColor="#94a3b8"
      autoCapitalize="none"
    />
    {rightIcon}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },

  header: {
    marginBottom: 30,
  },

  title: {
    fontSize: 34,
    color: "#fff",
    fontWeight: "800",
  },

  subtitle: {
    color: "#e0e7ff",
    marginTop: 6,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 20,
    borderRadius: 20,
    elevation: 6,
  },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    padding: 12,
  },

  forgot: {
    alignSelf: "flex-end",
    color: "#2563eb",
    marginBottom: 10,
    fontWeight: "600",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  error: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },

  switchWrap: {
    marginTop: 18,
    alignItems: "center",
  },

  switchText: {
    color: "#2563eb",
    fontWeight: "700",
    marginTop: 4,
  },
});
