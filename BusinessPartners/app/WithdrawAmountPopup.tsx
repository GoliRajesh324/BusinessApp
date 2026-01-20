import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

type Partner = {
  id: string | number;
  username: string;
};

type InvestmentDetail = {
  partner?: Partner;
  leftOver: number;
};

type WithdrawAmountPopupProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  partners: Partner[];
  cropDetails?: any;
  investmentDetails?: InvestmentDetail[];
};

const WithdrawAmountPopup: React.FC<WithdrawAmountPopupProps> = ({
  visible,
  onClose,
  onSave,
  partners = [],
  cropDetails,
  investmentDetails = [],
}) => {
 
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [images, setImages] = useState<any[]>([]);

  const [eligibleAmount, setEligibleAmount] = useState(0);

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Load token & userId
  useEffect(() => {
    const loadData = async () => {
      const n = await AsyncStorage.getItem("userName");
      const u = await AsyncStorage.getItem("userId");

      setUserName(n);
      setUserId(u);
    };
    loadData();
  }, []);

  const createdBy = userName; 



  useEffect(() => {
    if (selectedPartner) {
      const partnerData = investmentDetails.find(
        (inv) =>
          inv.partner?.username?.trim().toLowerCase() ===
          selectedPartner.username?.trim().toLowerCase()
      );
      const leftover = partnerData?.leftOver ?? 0;
      setEligibleAmount(leftover);
      setWithdrawAmount("");
    } else {
      setEligibleAmount(0);
      setWithdrawAmount("");
    }
  }, [selectedPartner, investmentDetails]);
  // Save handler
  const handleSave = () => {
    if (!selectedPartner) {
      Alert.alert("Error", "Please select a partner.");
      return;
    }
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Error", "Please enter a valid withdraw amount.");
      return;
    }
    if (amt > eligibleAmount) {
      Alert.alert("Error", "Withdraw amount exceeds eligible amount!");
      return;
    }

    const withdrawData = {
      partnerId: selectedPartner.id,
      cropId: cropDetails?.id,
      description: description || "",
      comments: description || "",
      totalAmount: 0,
      investable: 0,
      invested: 0,
      withdrawn: parseFloat(withdrawAmount),
      soldAmount: 0,
      soldFlag: "N",
      withdrawFlag: "Y",
      splitType: "MANUAL",
      createdBy,
      investmentGroupId: null, // new group id will be generated for withdraw
    };

    onSave({
      investmentData: [withdrawData],
      images: images,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Withdraw Amount</Text>
          <ScrollView>
            {/* Partner Dropdown */}
            <Text style={styles.label}>Select Partner</Text>
            <Picker
            selectedValue={selectedPartner?.id || ""}
            onValueChange={(value) => {
              const partner = partners.find((p) => p.id === value) || null;
              setSelectedPartner(partner);
            }}
          >
            <Picker.Item label="-- Select Partner --" value="" />
            {partners.map((p) => (
              <Picker.Item key={p.id} label={p.username} value={p.id} />
            ))}
          </Picker>

            {/* Eligible + Withdraw */}
            {selectedPartner && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.infoText}>
                  Username: {selectedPartner.username}
                </Text>
                <Text style={styles.infoText}>
                  Eligible Amount: {eligibleAmount.toFixed(2)}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Withdraw Amount"
                  keyboardType="numeric"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                />
              </View>
            )}

            {/* Description */}
            <Text style={styles.label}>Description / Payment Method</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter description"
              value={description}
              onChangeText={setDescription}
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.buttons}>
            <TouchableOpacity onPress={onClose} style={styles.buttonCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.buttonSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default WithdrawAmountPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    maxHeight: "90%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  label: { marginTop: 12, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  partnerOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    marginTop: 6,
  },
  partnerOptionActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  infoText: { marginTop: 6, fontSize: 14 },
  imageButton: {
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 6,
    marginTop: 4,
    alignItems: "center",
  },
  imagePreview: {
    position: "relative",
    marginRight: 10,
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  deleteBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "black",
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: { color: "white", fontSize: 12, fontWeight: "bold" },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  buttonCancel: {
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 6,
    marginRight: 8,
  },
  buttonSave: {
    padding: 10,
    backgroundColor: "#28a745",
    borderRadius: 6,
  },
  buttonText: { color: "white", fontWeight: "bold" },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewClose: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
  },
  previewLarge: {
    width: "90%",
    height: "80%",
  },
});
