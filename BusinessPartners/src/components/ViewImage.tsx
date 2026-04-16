import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: string[]; // array of image URLs
  initialIndex?: number;
  onClose: () => void;
}

export default function ViewImage({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        {/* CLOSE BUTTON */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={30} color="#fff" />
        </TouchableOpacity>

        {/* IMAGE SLIDER */}
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({
            length: width,
            offset: width * i,
            index: i,
          })}
          onMomentumScrollEnd={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / width);
            setIndex(i);
          }}
          renderItem={({ item }) => (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: item }} style={styles.image} />
            </View>
          )}
        />

        {/* INDEX INDICATOR */}
        {images.length > 1 && (
          <View style={styles.footer}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === index && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
  },

  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },

  imageWrapper: {
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: width,
    height: height * 0.8,
    resizeMode: "contain",
  },

  footer: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    alignSelf: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#777",
    margin: 4,
  },

  activeDot: {
    backgroundColor: "#fff",
  },
});
