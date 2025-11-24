import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export function RateUsModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);

  const openStore = () => {
    const appId =
      Platform.OS === "android" ? "com.yourapp.android" : "id1234567890"; // replace with your real IDs

    const url =
      Platform.OS === "android"
        ? `market://details?id=${appId}`
        : `itms-apps://itunes.apple.com/app/${appId}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) Linking.openURL(url);
      else alert("Cannot open store");
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modalBox}>
          {/* CLOSE BUTTON */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={26} color="#444" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Enjoying the App?</Text>
          <Text style={styles.modalSubtitle}>
            Tap a star to rate us. Your feedback helps us improve!
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons
                  name={i <= rating ? "star" : "star-outline"}
                  size={40}
                  color="#FFD700"
                  style={{ marginHorizontal: 4 }}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.rateBtn} onPress={openStore}>
            <Text style={styles.rateBtnText}>Rate on Store</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtnText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalBox: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
    textAlign: "center",
  },

  modalSubtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#555",
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  starsRow: {
    flexDirection: "row",
    marginBottom: 25,
  },

  rateBtn: {
    backgroundColor: "#4f93ff",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignSelf: "center",
    shadowColor: "#4f93ff",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 15,
  },

  rateBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  closeBtnText: {
    color: "#4f93ff",
    fontSize: 16,
    fontWeight: "600",
  },
  closeIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 10,
  },
});
