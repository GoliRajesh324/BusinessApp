import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: any[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  onClose: () => void;
  onAddMore: () => void;
  onSend: () => void;
  setImages: (imgs: any[]) => void;
  businessName: string;
}

const ImagePreviewModal: React.FC<Props> = ({
  visible,
  images,
  selectedIndex,
  setSelectedIndex,
  onClose,
  onAddMore,
  onSend,
  setImages,
  businessName,
}) => {
  const [caption, setCaption] = useState("");

  const handleDelete = () => {
    if (images.length === 0) return;

    const updated = images.filter((_, i) => i !== selectedIndex);

    if (updated.length === 0) {
      setImages([]);
      onClose();
      return;
    }

    const newIndex =
      selectedIndex >= updated.length ? updated.length - 1 : selectedIndex;

    setImages(updated);
    setSelectedIndex(newIndex);
  };
  const flatListRef = React.useRef<FlatList>(null);
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* 🔝 TOP SAFE AREA */}
        <SafeAreaView edges={["top"]} style={styles.topSafe}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        {/* 🔥 IMAGE SWIPE */}
        <View style={styles.imageContainer}>
          {images.length > 0 && (
            <FlatList
              data={images}
              horizontal
              keyboardShouldPersistTaps="handled"
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              extraData={selectedIndex}
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedIndex(index);
              }}
              renderItem={({ item }) => (
                <Image source={{ uri: item.uri }} style={styles.mainImage} />
              )}
              ref={flatListRef}
            />
          )}
        </View>

        {/* 🔽 THUMBNAILS */}
        <View style={styles.thumbnailRow}>
          <FlatList
            horizontal
            data={images}
            keyExtractor={(_, i) => i.toString()}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedIndex(index);

                  flatListRef.current?.scrollToIndex({
                    index,
                    animated: true,
                  });
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={[
                    styles.thumbnail,
                    selectedIndex === index && styles.selectedThumbnail,
                  ]}
                />
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity style={styles.addBtn} onPress={onAddMore}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 🔻 BOTTOM SAFE AREA */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <SafeAreaView edges={["bottom"]} style={styles.bottomSafe}>
            {/* Caption */}
            <View style={styles.captionContainer}>
              <TextInput
                placeholder="Add a caption..."
                placeholderTextColor="#aaa"
                value={caption}
                onChangeText={setCaption}
                style={styles.captionInput}
              />
            </View>

            {/* Bottom Row */}
            <View style={styles.bottomRow}>
              <Text style={styles.businessName} numberOfLines={1}>
                {businessName}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  console.log("Caption:", caption);
                  onSend();
                }}
              >
                <Ionicons name="send" size={35} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ImagePreviewModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topSafe: {
    backgroundColor: "#000",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10, // ✅ FIX spacing
  },

  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  topButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  topText: {
    color: "#fff",
    fontWeight: "600",
  },

  deleteBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 20,
  },

  imageContainer: {
    flex: 1,
  },

  mainImage: {
    width: width,
    height: "100%",
    resizeMode: "contain",
  },

  thumbnailRow: {
    flexDirection: "row",
    padding: 10,
  },

  thumbnail: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 6,
  },

  selectedThumbnail: {
    borderWidth: 3,
    borderColor: "#4CAF50",
  },

  addBtn: {
    width: 60,
    height: 60,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },

  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },

  captionInput: {
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },

  bottomSafe: {
    backgroundColor: "#000",
    paddingBottom: 10,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  businessName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    maxWidth: "70%",
  },
});
