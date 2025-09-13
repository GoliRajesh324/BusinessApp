import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type Partner = {
  id: string;
  username: string;
  share?: number;
};

type AddInvestmentPopupProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  partners: Partner[];
  cropDetails?: any;
};

const numberToWords = (num: number): string => {
  const IntlNF = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  });
  if (!num) return "";
  return IntlNF.format(num) + " rupees"; // simple fallback
};

const AddInvestmentPopup: React.FC<AddInvestmentPopupProps> = ({
  visible,
  onClose,
  onSave,
  partners,
  cropDetails,
}) => {
  const [splitMode, setSplitMode] = useState<"share" | "equal" | "manual">(
    "share"
  );
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const createdBy = "CurrentUser"; // Replace with AsyncStorage/context

  useEffect(() => {
    const initial = partners.map((p) => ({
      id: p.id,
      name: p.username,
      share: p.share ?? 0,
      actual: "",
      investing: "",
    }));
    setRows(initial);
  }, [partners]);

  const expected = useMemo(() => parseFloat(totalAmount) || 0, [totalAmount]);

  useEffect(() => {
    if (!partners.length) return;

    setRows((prev) =>
      partners.map((p, idx) => {
        const prevRow = prev[idx] || {};
        if (!totalAmount)
          return { ...prevRow, actual: "", investing: "" };

        if (splitMode === "share") {
          const actual = ((p.share ?? 0) / 100 * expected).toFixed(2);
          return { ...prevRow, actual, investing: actual };
        }

        if (splitMode === "equal") {
          const per = (expected / partners.length).toFixed(2);
          return { ...prevRow, actual: per, investing: per };
        }

        return {
          ...prevRow,
          actual: prevRow.investing || "",
          investing: prevRow.investing || "",
        };
      })
    );
  }, [splitMode, totalAmount, partners]);

  const handleInvestingChange = (index: number, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[index].investing = value.replace(/^0+(?=\d)/, "");
      if (splitMode === "manual") next[index].actual = next[index].investing;
      return next;
    });
  };

  const handleSave = () => {
    const totalEntered = rows.reduce(
      (sum, r) => sum + (parseFloat(r.investing) || 0),
      0
    );
    if (
      Math.round((totalEntered - expected) * 100) / 100 !== 0
    ) {
      Alert.alert("Error", "Total entered does not match expected amount");
      return;
    }

    const investmentData = rows.map((r) => ({
      partnerId: r.id,
      cropId: cropDetails?.id,
      description,
      totalAmount: expected,
      invested: parseFloat(r.investing || 0),
      splitType: splitMode.toUpperCase(),
      createdBy,
    }));

    onSave({ investmentData, images });
    onClose();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((i) => i !== uri));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add Investment</Text>
          <ScrollView>
            <TextInput
              style={styles.input}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
            />
            <TextInput
              style={styles.input}
              placeholder="Total Amount"
              keyboardType="numeric"
              value={totalAmount}
              onChangeText={setTotalAmount}
            />
            {!!totalAmount && (
              <Text style={styles.amountWords}>
                {numberToWords(Number(totalAmount))}
              </Text>
            )}

            <View style={styles.splitContainer}>
              {["share", "equal", "manual"].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setSplitMode(mode as any)}
                  style={[
                    styles.splitButton,
                    splitMode === mode && styles.splitButtonActive,
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: splitMode === mode ? "white" : "black",
                    }}
                  >
                    {mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Table Headers */}
            <View style={[styles.row, styles.headerRow]}>
              <Text style={styles.cell}>User</Text>
              {splitMode === "share" && <Text style={styles.cell}>Share %</Text>}
              <Text style={styles.cell}>Actual</Text>
              <Text style={styles.cell}>Investing</Text>
              <Text style={styles.cell}>Diff</Text>
            </View>

            {/* Table Rows */}
            <View style={styles.table}>
              {rows.map((row, idx) => {
                const actualNum = parseFloat(row.actual) || 0;
                const investNum = parseFloat(row.investing) || 0;
                const diff = investNum - actualNum;

                return (
                <View key={row.id} style={styles.row}>
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: row.name.length > 10 ? 11 : 13 },
                      ]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    {splitMode === "share" && (
                      <Text style={styles.cell}>{row.share}%</Text>
                    )}
                    <Text
                      style={[
                        styles.cell,
                        { fontSize: row.actual.length > 6 ? 11 : 13 },
                      ]}
                    >
                      {row.actual}
                    </Text>
                  <TextInput
                    style={[styles.cell, styles.inputCell]}
                    value={row.investing}
                    keyboardType="numeric"
                    onChangeText={(val) => handleInvestingChange(idx, val)}
                  />
                    <Text
                      style={[
                        styles.cell,
                        { color: diff > 0 ? "green" : diff < 0 ? "red" : "black" },
                      ]}
                    >
                      {diff !== 0 ? diff.toFixed(2) : ""}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Image Upload Section */}
            <Text style={styles.sectionTitle}>Upload Images</Text>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={{ color: "white" }}>Pick Image</Text>
            </TouchableOpacity>
            <ScrollView horizontal style={{ marginTop: 8 }}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.imagePreview}>
                  <Image source={{ uri }} style={styles.previewThumb} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(uri)}
                  >
                    <Text style={{ color: "white", fontSize: 10 }}>X</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </ScrollView>

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

export default AddInvestmentPopup;

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
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  amountWords: { fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  splitContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  splitButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#e0e0e0",
  },
  splitButtonActive: {
    backgroundColor: "#007bff",
  },
  table: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  headerRow: { borderBottomWidth: 1, borderColor: "#ccc", paddingBottom: 4 },
  cell: { flex: 1, textAlign: "center", fontSize: 13 },
  inputCell: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 4,
  },
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
  sectionTitle: { marginTop: 12, fontWeight: "bold" },
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
    width: 70,
    height: 70,
    borderRadius: 6,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 10,
    padding: 2,
  },
});
