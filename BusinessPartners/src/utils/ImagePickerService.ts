import * as ImagePicker from "expo-image-picker";

export interface ImageFile {
  uri: string;
  name?: string;
  type?: string;
  existing?: boolean; // ✅ ADD THIS
}

export const pickImageFromGallery = async (): Promise<ImageFile | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.7,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.type || "image/jpeg",
  };
};

export const pickImageFromCamera = async (): Promise<ImageFile | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.7,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `camera_${Date.now()}.jpg`,
    type: asset.type || "image/jpeg",
  };
};
