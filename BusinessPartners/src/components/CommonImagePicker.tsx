import {
    ImageFile,
    pickImageFromCamera,
    pickImageFromGallery,
} from "@/src/utils/ImagePickerService";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  title?: string;
  maxImages?: number;
}

const CommonImagePicker: React.FC<Props> = ({
  images,
  onChange,
  title = "Images",
  maxImages = 10,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const addImage = async (type: "camera" | "gallery") => {
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const file =
      type === "camera"
        ? await pickImageFromCamera()
        : await pickImageFromGallery();

    if (file) {
      onChange([...images, file]);
    }
  };

  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.title}>{title}</Text>

      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => addImage("camera")}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#28a745" }]}
          onPress={() => addImage("gallery")}
        >
          <Ionicons name="image" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((file, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.imageContainer}
            onPress={() => setPreviewImage(file.uri)}
          >
            <Image source={{ uri: file.uri }} style={styles.thumbnail} />

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => removeImage(idx)}
            >
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={!!previewImage} transparent>
        <View style={styles.previewContainer}>
          <Image source={{ uri: previewImage! }} style={styles.fullPreview} />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setPreviewImage(null)}
          >
            <Ionicons name="close" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

export default CommonImagePicker;

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  button: {
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  imageContainer: {
    position: "relative",
    marginRight: 10,
  },
  thumbnail: {
    width: 65,
    height: 65,
    borderRadius: 10,
  },
  deleteBtn: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "red",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullPreview: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
    borderRadius: 12,
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
  },
});
