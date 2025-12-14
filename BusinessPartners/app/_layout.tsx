import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export const unstable_settings = {
  anchor: "(tabs)",
};

const INACTIVITY_LIMIT = 30 * 1000; // 30 seconds

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [checkingLock, setCheckingLock] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const appState = useRef(AppState.currentState);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1️⃣ Run biometric if needed
  const runBiometric = async () => {
    const lockEnabled = await AsyncStorage.getItem("appLockEnabled");
    if (lockEnabled !== "true") return true; // app lock off → allow

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock App",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      await AsyncStorage.setItem("appLockLastAuth", "yes");
      return true;
    }
    return false;
  };

  const checkLock = async () => {
    try {
      const lockEnabled = await AsyncStorage.getItem("appLockEnabled");

      // App lock disabled → no biometric
      if (lockEnabled !== "true") {
        setIsAuthenticated(true);
        setCheckingLock(false);
        return;
      }

      const lastAuth = await AsyncStorage.getItem("appLockLastAuth");

      // Already authenticated in this session
      if (lastAuth === "yes") {
        setIsAuthenticated(true);
        setCheckingLock(false);
        return;
      }

      // Need biometric
      const unlocked = await runBiometric();
      setIsAuthenticated(unlocked);
    } catch (e) {
      console.log("App Lock Error:", e);
      setIsAuthenticated(true); // fail-safe
    } finally {
      setCheckingLock(false);
    }
  };

  useEffect(() => {
    checkLock();
  }, []);

  // 2️⃣ Auto-lock when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      if (appState.current === "active" && nextState.match(/inactive|background/)) {
        await AsyncStorage.setItem("appLockLastAuth", "no");
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  // 3️⃣ Auto-lock after inactivity
  const resetInactivityTimer = async () => {
    const lockEnabled = await AsyncStorage.getItem("appLockEnabled");
    if (lockEnabled !== "true") return; // don't track if disabled

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }

    inactivityTimer.current = setTimeout(async () => {
      await AsyncStorage.setItem("appLockLastAuth", "no");
      // If you want to immediately show lock screen instead of next launch:
      // setIsAuthenticated(false);
    }, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    resetInactivityTimer();

    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  const handleTouch = () => {
    resetInactivityTimer();
  };

  // 4️⃣ Loading UI
  if (checkingLock) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f93ff" />
      </View>
    );
  }

  // 5️⃣ Locked UI (biometric failed / cancelled on launch)
  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockTitle}>Authentication Required</Text>
        <Text style={styles.lockNote}>Close and reopen the app to try again.</Text>
      </View>
    );
  }

  // 6️⃣ Normal app content
  return (
    <TouchableWithoutFeedback onPress={handleTouch}>
      <View style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen
              name="dashboard"
              options={{
                headerShown: false,
                title: "Business Dashboard",
              }}
            />
            <Stack.Screen
              name="businessDetail"
              options={{
                headerShown: false,
                title: "Business Details",
              }}
            />
            <Stack.Screen
              name="profileScreen"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="settingsScreen"
              options={{
                headerShown: false,
              }}
            />
             <Stack.Screen
              name="helpandSupportScreen"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="partnerWiseDetails"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="investmentDetail"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="inventoryScreen"
              options={{
                headerShown: false,
              }}
            />
              <Stack.Screen
              name="chartsScreen"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="addCategory"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="categoryDetails"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="addStock"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="consumeStock"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="simpleInterest"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>

          <StatusBar style="auto" />
        </ThemeProvider>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  lockTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  lockNote: {
    marginTop: 10,
    color: "#777",
  },
});
