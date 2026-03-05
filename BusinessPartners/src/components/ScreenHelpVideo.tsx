import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";

interface ScreenHelpVideoProps {
  videoId: string;
}

const { height, width } = Dimensions.get("window");

const ScreenHelpVideo: React.FC<ScreenHelpVideoProps> = ({ videoId }) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* YouTube Icon */}
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Ionicons name="logo-youtube" size={35} color="red" />
      </TouchableOpacity>

      {/* Fullscreen Modal */}
      <Modal visible={visible} animationType="fade">
        <StatusBar hidden />

        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            activeOpacity={0.8}
            onPress={() => setVisible(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          {/* Fullscreen Shorts Player */}
          <YoutubePlayer
            height={height * 0.25}
            width={width}
            play={true}
            videoId={videoId}
            forceAndroidAutoplay
            initialPlayerParams={{
              rel: 0,
              modestbranding: true,
              controls: true,
            }}
          />
        </View>
      </Modal>
    </>
  );
};

export default ScreenHelpVideo;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
});
