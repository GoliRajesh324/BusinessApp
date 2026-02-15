import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
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
import { RateUsModal } from "../src/components/RateUsModal";

export default function ProfileScreen() {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [rateModalVisible, setRateModalVisible] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem("userName").then((name) => setUserName(name));
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userId");
      router.replace("/login");
    } catch (err) {
      console.log("❌ Logout error:", err);
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        title: "Check out this awesome app!",
        message:
          "Hey! Check out this awesome app I’ve been using. Download it here:\n https://play.google.com/store/apps/details?id=com.srilekhaapps.businessmoney",
      });
    } catch (error) {
      console.log("Error sharing app:", error);
    }
  };

  const options = [
    {
      icon: "settings-outline",
      text: "Settings",
      action: () => router.push("/settingsScreen"),
    },
    {
      icon: "share-social-outline",
      text: "Share",
      action: handleShareApp,
    },
    {
      icon: "star",
      text: "Rate Us",
      action: () => setRateModalVisible(true),
    },
    {
      icon: "help-circle-outline",
      text: "Help & Support",
      action: () => router.push("/helpandSupportScreen"),
    },
    {
      icon: "log-out-outline",
      text: "Logout",
      action: handleLogout,
    },
  ];

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.headerCurve}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Edit profile feature is coming soon 🚀",
              )
            }
          >
            <Feather name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{
              uri: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userName?.toUpperCase()}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={18} color="#fff" />
            <Text style={styles.infoText}>₹ (INR)</Text>
          </View>
        </View>
      </View>

      {/* OPTIONS */}
      <ScrollView
        style={styles.optionsScroll}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {options.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.option}
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

      {/* Rate Us Modal */}
      <RateUsModal
        visible={rateModalVisible}
        onClose={() => setRateModalVisible(false)}
      />

      {/* APP VERSION */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          Version {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerCurve: {
    backgroundColor: "#4f93ff",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    paddingBottom: 40,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  profileSection: {
    alignItems: "center",
    marginTop: 10,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 22,
    color: "#fff",
    marginVertical: 8,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 2,
  },
  infoText: {
    color: "#fff",
    marginLeft: 8,
  },
  optionsScroll: {
    flex: 1,
    backgroundColor: "#fff",
  },
  cardContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  option: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#000",
  },
  versionContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: "#999",
  },
});
