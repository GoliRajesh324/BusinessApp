import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export interface ImageFile {
  uri: string;
  name?: string;
  type?: string;
  existing?: boolean; // ✅ ADD THIS
}

async function compressImage(uri: string) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [], // no resize needed usually
    {
      compress: 0.6, // 60% quality (best balance)
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  return result.uri;
}

export const pickImageFromGallery = async (): Promise<ImageFile[]> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true, // ✅ multi select
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled) {
    const compressedImages = await Promise.all(
      result.assets.map(async (asset) => {
        const compressedUri = await compressImage(asset.uri);

        return {
          uri: compressedUri,
          name: "image.jpg",
          type: "image/jpeg",
        };
      }),
    );

    return compressedImages;
  }

  return [];
};
export const pickImageFromCamera = async (): Promise<ImageFile | null> => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
  });

  if (!result.canceled) {
    const compressedUri = await compressImage(result.assets[0].uri);

    return {
      uri: compressedUri,
      name: "image.jpg",
      type: "image/jpeg",
    };
  }

  return null;
};
