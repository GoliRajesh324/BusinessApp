import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingOverlay from "./LoadingOverlay";

const { width } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: any[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  onClose: () => void;
  onAddMore: () => void;
  onSend: () => Promise<void>;
  setImages: (imgs: any[]) => void;
  businessName: string;
  caption: string;
  setCaption: (text: string) => void;
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
  caption,
  setCaption,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const flatListRef = React.useRef<FlatList>(null);

  // ✅ KEYBOARD LISTENER (MAIN FIX)
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [loadingMap, setLoadingMap] = useState<Record<number, boolean>>({});

  const handleDelete = () => {
    if (images.length === 0) return;

    const updated = images.filter((_, i) => i !== selectedIndex);

    if (updated.length === 0) {
      setImages([]);
      setSelectedIndex(0);
      return;
    }

    const newIndex =
      selectedIndex >= updated.length ? updated.length - 1 : selectedIndex;

    setImages(updated);
    setSelectedIndex(newIndex);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* 🔝 TOP */}
        <SafeAreaView edges={["top"]} style={styles.topSafe}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Ionicons name="close" size={25} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* 🔥 IMAGE SWIPE */}
        <View style={styles.imageContainer}>
          {images.length > 0 && (
            <FlatList
              key={images.length}
              data={images}
              horizontal
              pagingEnabled
              keyboardShouldPersistTaps="always"
              showsHorizontalScrollIndicator={false}
              extraData={images}
              initialScrollIndex={0}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setSelectedIndex(index);
              }}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    width,
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {loadingMap[index] !== false && (
                    <Text style={{ color: "#aaa" }}> Image Loading...</Text>
                    // 👉 You can replace this with ActivityIndicator or GIF
                  )}

                  <Image
                    source={{ uri: item.uri }}
                    style={[styles.mainImage, { position: "absolute" }]}
                    onLoadStart={() =>
                      setLoadingMap((prev) => ({ ...prev, [index]: true }))
                    }
                    onLoadEnd={() =>
                      setLoadingMap((prev) => ({ ...prev, [index]: false }))
                    }
                  />
                </View>
              )}
              ref={flatListRef}
              onScrollToIndexFailed={() => {}}
            />
          )}
        </View>

        {/* 🔽 THUMBNAILS */}
        <View style={styles.thumbnailRow}>
          <FlatList
            horizontal
            data={images}
            keyExtractor={(_, i) => i.toString()}
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

        {/* 🔥 FLOATING BOTTOM (KEY FIX) */}
        <SafeAreaView
          edges={["bottom"]}
          style={[
            styles.bottomSafe,
            { marginBottom: keyboardHeight }, // ✅ PUSHES UP WITHOUT OVERLAY
          ]}
        >
          {/* Caption */}
          <View style={styles.captionContainer}>
            <TextInput
              placeholderTextColor={"#ccc"}
              placeholder="Add a caption..."
              value={caption}
              onChangeText={setCaption}
              style={styles.captionInput}
              blurOnSubmit={false}
            />
          </View>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName}
            </Text>

            <TouchableOpacity
              disabled={isSending}
              style={{ opacity: isSending ? 0.5 : 1 }}
              onPress={async () => {
                if (isSending) return;

                try {
                  setIsSending(true);

                  await onSend(); // ✅ IMPORTANT: must return promise from parent
                } catch (e) {
                  console.error("Send failed:", e);
                } finally {
                  setIsSending(false);
                }
              }}
            >
              <Ionicons name="send" size={35} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <LoadingOverlay visible={isSending} message="Saving images..." />
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
    paddingVertical: 10,
    paddingTop: Platform.OS === "ios" ? 6 : 2, // ✅ FIX
  },

  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    paddingTop: 20,
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  loadingBox: {
    backgroundColor: "#111",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
