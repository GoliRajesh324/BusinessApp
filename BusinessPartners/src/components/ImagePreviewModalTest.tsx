import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import ImagePickerModal from "./ImagePickerModal"; // ✅ NEW
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

const ImagePreviewModalTest: React.FC<Props> = ({
  visible,
  images,
  selectedIndex,
  setSelectedIndex,
  onClose,
  onSend,
  setImages,
  businessName,
  caption,
  setCaption,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false); // ✅ NEW

  const flatListRef = useRef<FlatList>(null);

  // Keyboard
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

  // ✅ CAMERA
  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Camera permission is needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (!result.canceled) {
      const newImgs = result.assets.map((a) => ({
        uri: a.uri,
        type: "image/jpeg",
        name: a.fileName || "camera.jpg",
      }));

      setImages([...images, ...newImgs]);
    }
  };

  // ✅ GALLERY
  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const newImgs = result.assets.map((a) => ({
        uri: a.uri,
        type: "image/jpeg",
        name: a.fileName || "gallery.jpg",
      }));

      setImages([...images, ...newImgs]);
    }
  };

  // ✅ DELETE
  const handleDelete = () => {
    const updated = images.filter((_, i) => i !== selectedIndex);

    if (updated.length === 0) {
      setImages([]);
      onClose();
      return;
    }

    setImages(updated);
    setSelectedIndex(0);
  };

  // ✅ SAVE
  const handleSend = async () => {
    if (isSending) return;

    try {
      setIsSending(true);
      await onSend();
    } catch (e) {
      console.log("ERROR:", e);
      Alert.alert("Error", "Failed to save");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* TOP */}
        <SafeAreaView edges={["top"]}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="close" size={25} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* IMAGE */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedIndex(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            )}
          />
        </View>

        {/* THUMBNAILS */}
        <View style={styles.thumbnailRow}>
          <FlatList
            horizontal
            data={images}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedIndex(index);
                  flatListRef.current?.scrollToOffset({
                    offset: index * width,
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

          {/* ✅ FIXED ADD BUTTON */}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setPickerVisible(true)}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* BOTTOM */}
        <SafeAreaView
          edges={["bottom"]}
          style={{ marginBottom: keyboardHeight }}
        >
          <View style={styles.captionContainer}>
            <TextInput
              placeholder="Add caption..."
              placeholderTextColor="#ccc"
              value={caption}
              onChangeText={setCaption}
              style={styles.captionInput}
            />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.businessName}>{businessName}</Text>

            <TouchableOpacity onPress={handleSend}>
              <Ionicons name="send" size={35} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <LoadingOverlay visible={isSending} message="Saving..." />

        {/* ✅ IMAGE PICKER MODAL (WORKING FIX) */}
        <ImagePickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onCamera={handleCamera}
          onGallery={handleGallery}
        />
      </View>
    </Modal>
  );
};

export default ImagePreviewModalTest;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: Platform.OS === "ios" ? 6 : 2,
  },

  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
