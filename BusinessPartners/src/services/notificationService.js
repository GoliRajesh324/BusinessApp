import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    alert("Must use physical device");
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    alert("Permission not granted");
    return;
  }

  const tokenData = await Notifications.getDevicePushTokenAsync();

  const token = tokenData.data;

  console.log("FCM TOKEN:", token);

  return token;
}
