import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="dashboard"
          options={{
            headerShown: false, // or false if you don’t want a header at all
            title: "Business Dashboard", // custom title
          }}
        />
        <Stack.Screen
          name="businessDetail"
          options={{
            headerShown: false, // or false if you don’t want a header at all
            title: "Business Details", // custom title
          }}
        />
        <Stack.Screen
          name="profileScreen"
          options={{
            headerShown: false, // or false if you don’t want a header at all
          }}
        />
        <Stack.Screen
          name="settingsScreen"
          options={{
            headerShown: false, // or false if you don’t want a header at all
          }}
        />
        <Stack.Screen
          name="partnerWiseDetails"
          options={{
            headerShown: false, // or false if you don’t want a header at all
          }}
        />
       {/*   <Stack.Screen
          name="SimpleInterestScreen"
          options={{
            headerShown: false, // or false if you don’t want a header at all
          }}
        />
         <Stack.Screen
          name="AddEditInterestScreen"
          options={{
            headerShown: false, // or false if you don’t want a header at all
          }}
        /> */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
