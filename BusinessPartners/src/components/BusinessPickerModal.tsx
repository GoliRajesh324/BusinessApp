import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  businesses: any[];
  onSelect: (business: any) => void;
  onClose: () => void;
}

const BusinessPickerModal: React.FC<Props> = ({
  visible,
  businesses,
  onSelect,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const renderItem = ({ item }: any) => {
    const isSelected = selectedId === item.id;

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedId(item.id);

          // small delay for UX (show tick before closing)
          setTimeout(() => {
            onSelect(item);
          }, 150);
        }}
      >
        {/* Business Name */}
        <Text style={styles.businessName} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            isSelected ? styles.checkboxSelected : styles.checkboxUnselected,
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Business</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* LIST */}
          {businesses.length === 0 ? (
            <Text style={styles.emptyText}>No business available</Text>
          ) : (
            <FlatList
              data={businesses}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default BusinessPickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  container: {
    backgroundColor: "#fff",
    borderRadius: 14,
    maxHeight: "70%", // ✅ prevents overflow
    paddingVertical: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#f2f2f2",
  },

  businessName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#222",
    flex: 1,
    marginRight: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxSelected: {
    backgroundColor: "#25D366", // WhatsApp green
  },

  checkboxUnselected: {
    borderWidth: 2,
    borderColor: "#ccc",
    backgroundColor: "transparent",
  },

  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#777",
  },
});
