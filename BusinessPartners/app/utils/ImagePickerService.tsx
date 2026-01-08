import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

/**
 * Pick image from camera
 */
export const pickImageFromCamera = async (): Promise<ImageFile | null> => {
  try {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    let finalStatus = status;

    if (status !== "granted") {
      const req = await ImagePicker.requestCameraPermissionsAsync();
      finalStatus = req.status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Camera permission is needed to take pictures."
      );
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    return {
      uri: manipulated.uri,
      name: asset.uri.split("/").pop() || "image.jpg",
      type: "image/jpeg",
    };
  } catch (err) {
    console.log("Camera error:", err);
    Alert.alert("Error", "Could not open camera.");
    return null;
  }
};

/**
 * Pick image from gallery
 */
export const pickImageFromGallery = async (): Promise<ImageFile | null> => {
  try {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    let finalStatus = status;

    if (status !== "granted") {
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      finalStatus = req.status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Permission required",
        "Gallery permission is needed to select pictures."
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
    );

    return {
      uri: manipulated.uri,
      name: asset.uri.split("/").pop() || "image.jpg",
      type: "image/jpeg",
    };
  } catch (err) {
    console.log("Gallery error:", err);
    Alert.alert("Error", "Could not open gallery.");
    return null;
  }
};
