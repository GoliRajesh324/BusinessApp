import AppHeader from "@/src/components/AppHeader";
import { showToast } from "@/src/utils/ToastService";
import axios from "axios";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from "../src/config/config";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState(1);

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // SEND OTP
  const sendOtp = async () => {
    if (!email) {
      setMessage("Enter email");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${BASE_URL}/api/auth/forgot-password`, null, {
        params: { email },
      });

      setIsSuccess(true);
      setMessage("OTP sent to your email");
      setStep(2);
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const verifyOtp = async () => {
    if (!otp) {
      setMessage("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${BASE_URL}/api/auth/verify-otp`, null, {
        params: { email, otp },
      });

      setIsSuccess(true);
      setMessage("OTP verified");
      setStep(3);
    } catch (err: any) {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setIsSuccess(false);
      setMessage("Enter password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsSuccess(false);
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/auth/reset-password-by-otp`,
        null,
        {
          params: { email, newPassword },
        },
      );

      showToast(res?.data?.message || "Password reset successful", "success");

      setTimeout(() => {
        router.replace("/login");
      }, 2500); // slightly faster than 3s feels better here
    } catch (err: any) {
      /*  Alert.alert("Error", err.response?.data?.message || "Reset failed", [
        {
          text: "OK",
          onPress: () => router.replace("/login"),
        },
      ]); */
      showToast(err.response?.data?.message || "Reset failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <StatusBar style="light" backgroundColor="#4f93ff" />

        <AppHeader title="Forgot Password" />
      </SafeAreaView>
      <SafeAreaView edges={["bottom"]} style={styles.safeBottom}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>

            {/* STEP 1 EMAIL */}

            {step === 1 && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your registered email"
                  value={email}
                  onChangeText={setEmail}
                />

                <Pressable
                  style={[styles.button, loading && { opacity: 0.6 }]}
                  onPress={sendOtp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Sending..." : "Send OTP"}
                  </Text>
                </Pressable>
              </>
            )}

            {/* STEP 2 OTP */}

            {step === 2 && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="numeric"
                />

                <Pressable style={styles.button} onPress={verifyOtp}>
                  <Text style={styles.buttonText}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Text>
                </Pressable>
              </>
            )}

            {/* STEP 3 RESET PASSWORD */}

            {step === 3 && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  value={newPassword}
                  secureTextEntry
                  onChangeText={setNewPassword}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  secureTextEntry
                  onChangeText={setConfirmPassword}
                />

                <Pressable style={styles.button} onPress={resetPassword}>
                  <Text style={styles.buttonText}>
                    {loading ? "Updating..." : "Reset Password"}
                  </Text>
                </Pressable>
              </>
            )}

            {message !== "" && (
              <Text
                style={[styles.message, { color: isSuccess ? "green" : "red" }]}
              >
                {message}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeTop: { backgroundColor: "#4f93ff" },
  safeBottom: { flex: 1, backgroundColor: "#f3f4f6" },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 16,
    backgroundColor: "#f3f4f6",
  },

  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  message: {
    marginTop: 12,
    textAlign: "center",
    color: "red",
  },
});
