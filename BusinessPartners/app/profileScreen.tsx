import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RateUsModal } from "./components/RateUsModal";

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [rateModalVisible, setRateModalVisible] = useState(false);

  AsyncStorage.getItem("userName").then((name) => setUserName(name));

  // Logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");
      router.replace("/login"); // Navigate to login page
    } catch (err) {
      console.error("❌ Logout error:", err);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleShareApp = async () => {
    try {
      const result = await Share.share({
        title: "Check out this awesome app!",
        message:
          "Hey! Check out this awesome app I’ve been using. Download it here:\nhttps://play.google.com/store/apps/details?id=com.BusinessMoney",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared with activity:", result.activityType);
        } else {
          console.log("App shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }
    } catch (error) {
      console.error("Error sharing app:", error);
    }
  };

  const options = [
    {
      icon: "diamond",
      text: "Business Money Pro",
      action: () => alert("Business Money Pro Feature Coming Soon"),
      color: "#ab429bd0",
    },
    {
      icon: "settings-outline",
      text: "Settings",
      action: () => router.push("/settingsScreen"),
    },
    {
      icon: "share-social-outline",
      text: "Share",
      action: () => handleShareApp(),
    },
    {
      icon: "star",
      text: "Rate Us",
      action: () => setRateModalVisible(true), // <-- Open Rate Us modal
    },
    {
      icon: "help-circle-outline",
      text: "Help & Support",
      action: () => alert("Help & Support Coming Soon"),
    },
    { icon: "log-out-outline", text: "Logout", action: handleLogout },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity>
            <Feather name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PROFILE INFO */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              }}
              style={styles.avatar}
            />
            <Text style={styles.name}>{userName}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>{userName}@gmail.com</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>+91 91544 32738</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={styles.infoText}>₹ (INR)</Text>
            </View>
          </View>

          {/* OPTIONS */}
          <View style={styles.cardContainer}>
            {options.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  item.color ? { backgroundColor: item.color } : null,
                ]}
                onPress={item.action}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={item.icon as any} size={18} color="#000" />
                  <Text style={styles.optionText}>{item.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#000" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
       {/* Rate Us Modal */}
    <RateUsModal
      visible={rateModalVisible}
      onClose={() => setRateModalVisible(false)}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#e8eaf6", // soft background behind card
  },
  container: { flex: 1, backgroundColor: "#4f93ff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 12,
    backgroundColor: "#4f93ff",
    elevation: 4,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  profileSection: { alignItems: "center", marginTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#fff" },
  name: { fontSize: 22, color: "#fff", marginVertical: 8, fontWeight: "bold" },
  infoRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  infoText: { color: "#fff", marginLeft: 8 },
  cardContainer: {
    flex: 1,
    backgroundColor: "#f8f6fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    //marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,

    // shadow for elevation effect
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  option: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
  },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionText: { marginLeft: 12, fontSize: 16, color: "#000" },
});
