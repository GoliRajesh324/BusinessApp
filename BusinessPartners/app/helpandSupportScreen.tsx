import React from "react";
import {
    Linking,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HelpAndSupportScreen() {
  const router = useRouter();
  const handleBack = () => router.back();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerLeft}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.headerRight} />
      </View>
      {/* PAGE CONTENT */}
      <View style={styles.contentContainer}>
        <Text style={styles.infoText}>
          We're here to help! If you have questions, issues, or feedback, feel
          free to reach out to our support team anytime.
        </Text>

        {/* CALL CENTER SUPPORT STICKER */}
        <View style={styles.stickerWrapper}>
          <TouchableOpacity
            style={styles.supportSticker}
            onPress={() =>
              Linking.openURL(
                "mailto:bizmoney324@gmail.com?subject=App Support&body=Hi, I need assistance regarding your Business Money app."
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
