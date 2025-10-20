import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export function RateUsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(0);

  const openStore = () => {
    const appId = Platform.OS === "android" 
      ? "com.yourapp.android" 
      : "id1234567890"; // replace with your app IDs
    const url = Platform.OS === "android"
      ? `market://details?id=${appId}`
      : `itms-apps://itunes.apple.com/app/${appId}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else alert("Cannot open store");
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Rate Us</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons name={i <= rating ? "star" : "star-outline"} size={32} color="#FFD700" />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.rateBtn} onPress={openStore}>
            <Text style={styles.rateBtnText}>Go to Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalBox: { width: 300, backgroundColor: "#fff", borderRadius: 10, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  starsRow: { flexDirection: "row", marginBottom: 20 },
  rateBtn: { backgroundColor: "#007bff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, marginBottom: 10 },
  rateBtnText: { color: "#fff", fontWeight: "bold" },
  closeBtnText: { color: "#007bff", fontWeight: "bold" },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#007bff",
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  }
});
