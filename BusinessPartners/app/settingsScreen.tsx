import React, { useState } from "react";
import {
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function SettingsScreen() {
  const router = useRouter();
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const { t, i18n } = useTranslation();
  const [isTelugu, setIsTelugu] = useState(false);
  const [isLangLoaded, setIsLangLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Load Language
        const savedLang = await AsyncStorage.getItem("appLanguage");
        const langToUse = savedLang || "en";
        await i18n.changeLanguage(langToUse);
        setIsTelugu(langToUse === "te");
        setIsLangLoaded(true);

        // Load App Lock
        const savedLock = await AsyncStorage.getItem("appLockEnabled");
        setAppLockEnabled(savedLock === "true");
      } catch (e) {
        console.log("Language/AppLock load error:", e);
      }
    })();
  }, []);

  const setLanguage = async (lang: "en" | "te") => {
    try {
      await AsyncStorage.setItem("appLanguage", lang);
      await i18n.changeLanguage(lang);
      setIsTelugu(lang === "te");
    } catch (e) {
      console.log("Language change error:", e);
    }
  };

  // Check device support for biometrics
  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible) {
      Alert.alert(
        "Not Supported",
        "Biometric authentication is not supported on this device.",
      );
      return false;
    }

    if (!enrolled) {
      Alert.alert(
        "Not Set Up",
        "Please set up Face ID or Fingerprint on your device first.",
      );
      return false;
    }

    return true;
  };

  // Perform biometric authentication
  const handleBiometricAuth = async () => {
    const supported = await checkBiometricSupport();
    if (!supported) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to enable App Lock",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      console.log("✅ Authentication successful");
      Alert.alert("Success", "App Lock enabled successfully!");
      return true;
    } else {
      console.log("❌ Authentication failed or cancelled");
      Alert.alert("Failed", "Authentication failed or cancelled.");
      return false;
    }
  };

  // Toggle App Lock
  const toggleAppLock = async (value: boolean) => {
    if (value) {
      const authSuccess = await handleBiometricAuth();
      if (authSuccess) {
        await AsyncStorage.setItem("appLockEnabled", "true");
        setAppLockEnabled(true);
      } else {
        await AsyncStorage.setItem("appLockEnabled", "false");
        setAppLockEnabled(false);
      }
    } else {
      await AsyncStorage.setItem("appLockEnabled", "false");
      setAppLockEnabled(false);
    }
  };

  const handleBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {/* SETTINGS CONTENT */}
      <View style={styles.card}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="lock-closed-outline" size={22} color="#333" />
            <Text style={styles.optionText}>App Lock</Text>
          </View>
          <Switch
            value={appLockEnabled}
            onValueChange={toggleAppLock}
            trackColor={{ false: "#ccc", true: "#4f93ff" }}
            thumbColor={appLockEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Language Toggle */}

      <View style={styles.card}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Ionicons name="language-outline" size={22} color="#333" />
            <Text style={styles.optionText}>Language</Text>
          </View>

          {/* Segmented Toggle */}
          <View style={styles.languageToggleContainer}>
            <TouchableOpacity
              disabled={!isLangLoaded}
              onPress={() => setLanguage("en")}
              style={[
                styles.languageOption,
                !isTelugu && styles.languageSelected,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  !isTelugu && styles.languageTextSelected,
                ]}
              >
                English
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!isLangLoaded}
              onPress={() => setLanguage("te")}
              style={[
                styles.languageOption,
                isTelugu && styles.languageSelected,
              ]}
            >
              <Text
                style={[
                  styles.languageText,
                  isTelugu && styles.languageTextSelected,
                ]}
              >
                తెలుగు
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8eaf6",
  },

  // HEADER
  header: {
    height:
      Platform.OS === "android" ? 80 + (StatusBar.currentHeight || 0) : 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 20 : 40,
    backgroundColor: "#4f93ff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 100,
  },
  headerLeft: { width: 40, justifyContent: "center", alignItems: "flex-start" },
  headerRight: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  // CONTENT CARD
  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5, // ✅ keeps toggle inside card
  },

  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 10,
  },
  languageToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 10,
    overflow: "hidden",
    width: 130, // ✅ fixed width for proper fit
    height: 35,
    marginRight: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },

  languageOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },

  languageSelected: {
    backgroundColor: "#4f93ff",
    borderRadius: 8,
  },

  languageText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 13,
  },

  languageTextSelected: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
