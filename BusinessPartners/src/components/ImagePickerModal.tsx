import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCamera: () => Promise<void>;
  onGallery: () => Promise<void>;
}

const ImagePickerModal: React.FC<Props> = ({
  visible,
  onClose,
  onCamera,
  onGallery,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const translateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(300);
    }
  }, [visible]);

  const handlePress = async (fn: () => Promise<void>) => {
    if (isProcessing) return;

    setIsProcessing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await fn();
    } catch (e) {
      console.log("Picker error", e);
    } finally {
      setIsProcessing(false); // ✅ ALWAYS RESET
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.background} onPress={onClose} />

        <Animated.View
          style={[styles.container, { transform: [{ translateY }] }]}
        >
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.handle} />

            <Text style={styles.title}>Add Image</Text>

            <View style={styles.row}>
              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
                onPress={() => handlePress(onCamera)}
              >
                <Text style={styles.icon}>📷</Text>
                <Text style={styles.text}>Camera</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.option,
                  { transform: [{ scale: pressed ? 0.95 : 1 }] },
                ]}
                onPress={() => handlePress(onGallery)}
              >
                <Text style={styles.icon}>🖼️</Text>
                <Text style={styles.text}>Gallery</Text>
              </Pressable>
            </View>

            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ImagePickerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)", // ✅ ADD THIS
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  option: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 36,
  },
  text: {
    marginTop: 6,
    fontWeight: "600",
  },
  cancelBtn: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
