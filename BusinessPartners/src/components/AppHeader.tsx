import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ScreenHelpVideo from "./ScreenHelpVideo";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  videoId?: string;
  showMenu?: boolean;
  onMenuPress?: () => void;
  rightComponent?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = true,
  videoId,
  showMenu = false,
  onMenuPress,
  rightComponent,
}) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {/* LEFT */}
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* TITLE */}
      <Text style={styles.title}>{title}</Text>

      {/* RIGHT */}
      <View style={styles.right}>
        {videoId && (
          <View style={{ marginRight: 12 }}>
            <ScreenHelpVideo videoId={videoId} />
          </View>
        )}

        {rightComponent}

        {showMenu && (
          <TouchableOpacity onPress={onMenuPress}>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default AppHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 6,
    backgroundColor: "#4f93ff",
  },

  left: {
    width: 40,
  },

  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 40,
    justifyContent: "flex-end",
  },
});
