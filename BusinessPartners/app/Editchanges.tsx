import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { ImageFile, pickImageFromCamera, pickImageFromGallery } from "./utils/ImagePickerService";

interface Partner {
  id: string;
  username: string;
  share?: number;
}

interface InvestmentRow {
  id: string;
  name: string;
  share: number;
  actual: string;
  investing: string;
  leftOver?: number;
  checked?: boolean;
  reduceLeftOver?: string;
}

interface EditInvestmentScreenProps {
  visible: boolean;
  investmentData: {
    groupId: string;
    totalAmount: any;
    description: any;
    partners: Partner[];
    images: any[];
    transactionType: any;
  };
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
}

const EditInvestmentScreen: React.FC<EditInvestmentScreenProps> = ({
  visible,
  investmentData,
  onClose,
  onUpdated,
}) => {
  const { groupId, totalAmount: initialAmount, description: initialDesc, partners, images: initialImages, transactionType: initialTransactionType } = investmentData;

  const [token, setToken] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<string>(initialAmount?.toString() || "");
  const [description, setDescription] = useState<string>(initialDesc || "");
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [images, setImages] = useState<ImageFile[]>(initialImages || []);
  const [transactionType, setTransactionType] = useState<"Investment" | "Sold" | "Withdraw" | null>(initialTransactionType || "Investment");
  const [errorVisible, setErrorVisible] = useState(false);
  const shakeAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem("token");
      setToken(t);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (!partners.length) return;
    const mappedRows: InvestmentRow[] = partners.map((p) => ({
      id: p.id,
      name: p.username,
      share: p.share || 0,
      actual: ((p.share || 0) / 100 * expected).toFixed(2),
      investing: ((p.share || 0) / 100 * expected).toFixed(2),
    }));
    setRows(mappedRows);
  }, [partners, expected]);

  const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], investing: value, actual: value };
      return next;
    });
  };

  const pickImageCamera = async () => {
    const file = await pickImageFromCamera();
    if (file) setImages((prev) => [...prev, file]);
  };

  const pickImageGallery = async () => {
    const file = await pickImageFromGallery();
    if (file) setImages((prev) => [...prev, file]);
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  const handleSave = () => {
    const totalEntered = rows.reduce((sum, r) => sum + (parseFloat(r.actual) || 0), 0);
    if (Math.round((totalEntered - expected) * 100) / 100 !== 0) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    }

    console.log("Updated investment:", { rows, totalAmount, description, images, transactionType });

    onUpdated();
    onClose();
  };

  const extraText = (r: InvestmentRow) => {
    const diff = Math.round((parseFloat(r.actual) - parseFloat(r.investing)) * 100) / 100;
    if (diff > 0) return `Extra +${diff.toFixed(2)}`;
    if (diff < 0) return `Pending -${Math.abs(diff).toFixed(2)}`;
    return "Settled";
  };

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container}>
            <Text style={styles.title}>Edit Investments</Text>

            <TextInput
              style={styles.input}
              placeholder="Total Amount"
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.rowsContainer}>
              {rows.map((r, i) => (
                <View key={r.id || i} style={styles.row}>
                  <Text style={styles.name}>{r.name}</Text>
                  <TextInput
                    style={styles.rowInput}
                    value={r.investing}
                    keyboardType="numeric"
                    onChangeText={(v) => handleInvestingChange(i, v)}
                  />
                  <Text>{extraText(r)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.imagesContainer}>
              {images.map((img, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <Image source={{ uri: img.uri }} style={styles.image} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={pickImageCamera}>
                <Ionicons name="camera" size={30} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity onPress={pickImageGallery}>
                <Ionicons name="image" size={30} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={{ color: "#fff" }}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 10 }} onPress={onClose}>
              <Text style={{ textAlign: "center", color: "red" }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditInvestmentScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 12 },
  rowsContainer: { marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12, alignItems: "center" },
  rowInput: { borderWidth: 1, borderColor: "#ccc", padding: 6, width: 80, borderRadius: 6, textAlign: "center" },
  name: { fontSize: 16 },
  imagesContainer: { flexDirection: "row", alignItems: "center", marginVertical: 12, flexWrap: "wrap" },
  image: { width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 8 },
  removeBtn: { position: "absolute", top: -6, right: -6 },
  saveButton: { backgroundColor: "green", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 16 },
});
