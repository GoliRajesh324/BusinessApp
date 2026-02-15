import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  category: any;
  onPress: () => void;
};

export default function CategoryCard({ category, onPress }: Props) {
  const {
    name,
    description,
    imageUrl,
    availableQuantity,
    totalQuantity,
    quantityType,
  } = category;

  const progress =
    totalQuantity > 0 ? (availableQuantity / totalQuantity) * 100 : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.noImageBox}>
          <Ionicons name="image" size={30} color="#999" />
        </View>
      )}

      <View style={styles.content}>
        {/* Name - truncates long text */}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>

        {/* Description - truncates long text */}
        <Text style={styles.desc} numberOfLines={1} ellipsizeMode="tail">
          {description}
        </Text>

        <Text style={styles.qty}>
          {availableQuantity} / {totalQuantity} {quantityType}
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 14,
    borderRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eee",
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#f5f5f5",
  },

  content: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    maxWidth: "100%",
  },

  desc: {
    color: "#777",
    marginTop: 3,
    fontSize: 13,
    maxWidth: "100%",
  },

  qty: {
    marginTop: 6,
    fontWeight: "600",
    color: "#444",
  },

  progressBar: {
    height: 7,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4f93ff",
    borderRadius: 10,
  },
  noImageBox: {
  width: 70,
  height: 70,
  borderRadius: 8,
  backgroundColor: "#f0f0f0",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},

});
