import AsyncStorage from "@react-native-async-storage/async-storage";

export const getVideoId = async (key: string) => {
  try {
    const id = await AsyncStorage.getItem(key);
    console.log(" video Id : ", id);
    return id || "";
  } catch (e) {
    console.log("Error reading videoId", e);
    return "";
  }
};
