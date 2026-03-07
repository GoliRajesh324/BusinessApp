import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AppHeader from "@/src/components/AppHeader";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HelpAndSupportScreen() {
  return (
    <>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#4f93ff" }}>
        <StatusBar style="light" backgroundColor="#4f93ff" />
        <AppHeader title={String("Help & Support")} videoId="ogns8WiacUI" />
      </SafeAreaView>
      <SafeAreaView
        edges={["bottom"]}
        style={{ flex: 1, backgroundColor: "#fff" }}
      >
        <View style={styles.container}>
          {/* PAGE CONTENT */}
          <View style={styles.contentContainer}>
            <Text style={styles.infoText}>
              We're here to help! If you have questions, issues, or feedback,
              feel free to reach out to our support team anytime.
            </Text>

            {/* CALL CENTER SUPPORT STICKER */}
            <View style={styles.stickerWrapper}>
              <TouchableOpacity
                style={styles.supportSticker}
                onPress={() =>
                  Linking.openURL(
                    "mailto:bizmoney324@gmail.com?subject=App Support&body=Hi, I need assistance regarding your Business Money app.",
                  )
                }
              >
                <Ionicons name="headset" size={32} color="#fff" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.stickerTitle}>Contact Support</Text>
                  <Text style={styles.stickerSubtitle}>
                    bizmoney324@gmail.com
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e8eaf6",
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
  contentContainer: {
    padding: 20,
    alignItems: "center",
  },

  infoText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
    paddingHorizontal: 10,
  },

  stickerWrapper: {
    width: "100%",
    alignItems: "center",
  },

  supportSticker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f93ff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: "95%",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 4,
  },

  stickerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  stickerSubtitle: {
    color: "#e8eaf6",
    fontSize: 14,
    marginTop: 2,
  },
});
