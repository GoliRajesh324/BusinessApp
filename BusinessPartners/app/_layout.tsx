import { useColorScheme } from "@/hooks/use-color-scheme";
import GlobalToast from "@/src/components/GlobalToast";
import BASE_URL from "@/src/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import axios from "axios";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  StyleSheet,
  Text,
  View,
} from "react-native";
import "../src/i18n/i18n";
import i18n from "../src/i18n/i18n";
import NoInternet from "./NoInternet";

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
  const [langReady, setLangReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(!!state.isConnected);
    });

    return () => unsubscribe();
  }, []);
  // 1️⃣ Run biometric if needed
  const runBiometric = async () => {
    const lockEnabled = await AsyncStorage.getItem("appLockEnabled");
    if (lockEnabled !== "true") return true; // app lock off → allow

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Unlock App",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });
    if (lockEnabled !== "true") return true;
    if (result.success) {
      await AsyncStorage.setItem("appLockLastAuth", "yes");
      return true;
    }
    return false;
  };
  const getAuthHeaders = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      return {
        Authorization: token ? `Bearer ${token}` : undefined,
        "Content-Type": "application/json",
      };
    } catch (e) {
      console.log("Error getting token from storage", e);
      return { "Content-Type": "application/json" };
    }
  };
  const checkAppVersion = async () => {
    try {
      const currentVersion =
        Application.nativeApplicationVersion || Constants.expoConfig?.version;
      console.log("Current version:", currentVersion);
      const headers = await getAuthHeaders();
      const res = await axios.get(
        `${BASE_URL}/api/app/config?platform=android`,
        { headers },
      );

      const { latestVersion, forceUpdate, playStoreUrl } = res.data;

      if (forceUpdate && currentVersion !== latestVersion) {
        Alert.alert(
          "Update Required",
          "Please update the app to continue.",
          [
            {
              text: "Update",
              onPress: () => Linking.openURL(playStoreUrl),
            },
          ],
          { cancelable: false },
        );
      }
    } catch (error) {
      console.log("Version check failed", error);
    }
  };

  const fetchVideoIds = async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await axios.get(`${BASE_URL}/api/help-videos`, { headers });

      const data = res.data;
      console.log("Fetched video IDs:", data);
      for (const key in data) {
        await AsyncStorage.setItem(key, data[key]);
      }

      console.log("Video IDs stored successfully");
    } catch (error) {
      console.log("Failed to load help videos", error);
    }
  };
  useEffect(() => {
    checkAppVersion();
    fetchVideoIds();
  }, []);
  useEffect(() => {
    const setDefaultAppLock = async () => {
      const lock = await AsyncStorage.getItem("appLockEnabled");

      if (lock === null) {
        // ✅ First time install
        await AsyncStorage.setItem("appLockEnabled", "true");
      }
    };

    setDefaultAppLock();
  }, []);
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("appLanguage");

        const langToUse = savedLang || "en";

        await i18n.changeLanguage(langToUse);

        setLangReady(true);
      } catch (e) {
        console.log("Language load error:", e);
        setLangReady(true);
      }
    };

    loadLanguage();
  }, []);
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

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  const router = useRouter();

  // prevents duplicate navigation
  const lastHandledNotification = useRef<string | null>(null);

  const openInvestmentFromNotification = (data: any) => {
    console.log("NOTIFICATION DATA:", data);

    const type = data?.type;
    const investmentGroupId = data?.investmentGroupId;

    const uniqueKey = type + "_" + (investmentGroupId || data.businessId);

    if (lastHandledNotification.current === uniqueKey) return;
    lastHandledNotification.current = uniqueKey;

    if (type === "TRANSACTION_ADDED") {
      router.push({
        pathname: "/investmentDetail",
        params: {
          investmentGroupId,
          businessId: data.businessId,
          businessName: data.businessName,
        },
      });
    } else if (type === "TRANSACTION_UPDATED") {
      router.push({
        pathname: "/ChangeHistoryScreen",
        params: {
          businessId: data.businessId,
          businessName: data.businessName,
        },
      });
    } else if (type === "BUSINESS_CREATED") {
      router.push({
        pathname: "/businessDetail",
        params: {
          businessId: data.businessId,
          businessName: data.businessName,
        },
      });
    } else if (type === "IMAGE_UPLOADED" || type === "IMAGE_UPDATED") {
      router.push({
        pathname: "/businessDetail",
        params: {
          businessId: data.businessId,
          businessName: data.businessName,
        },
      });
    }
  };

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        openInvestmentFromNotification(data);
      },
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!lastNotificationResponse) return;

    // ✅ Only handle when user clicks notification
    if (
      lastNotificationResponse.actionIdentifier !==
      Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }

    const data = lastNotificationResponse.notification.request.content.data;

    if (!data) return;

    setTimeout(() => {
      openInvestmentFromNotification(data);
    }, 500);
  }, [lastNotificationResponse]);

  // 2️⃣ Auto-lock when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (nextState) => {
      const lockEnabled = await AsyncStorage.getItem("appLockEnabled");

      if (
        lockEnabled === "true" &&
        appState.current === "active" &&
        nextState.match(/inactive|background/)
      ) {
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
        <Text style={styles.lockNote}>
          Close and reopen the app to try again.
        </Text>
      </View>
    );
  }

  // 🚨 No Internet Screen
  if (!isConnected) {
    return <NoInternet onRetry={(status) => setIsConnected(status)} />;
  }

  // 6️⃣ Normal app content
  return (
    <View style={{ flex: 1 }} onTouchStart={handleTouch}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
            }}
          />
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
            name="resetPasswordScreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="forgotPasswordScreen"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="EmiCalculatorScreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AddTransactionScreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="EditTransactionScreen"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ChangeHistoryScreen"
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
            name="addEditInterest"
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
          <Stack.Screen
            name="AddAvailableMoney"
            options={{
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="businessNews"
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
        <GlobalToast />
      </ThemeProvider>
    </View>
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
