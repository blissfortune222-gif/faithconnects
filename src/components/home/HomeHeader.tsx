import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type HomeHeaderProps = {
  name?: string;
  profileImage?: string;
  onNotificationPress?: () => void;
};

export default function HomeHeader({
  name = "Fortune",
  profileImage = "https://i.pravatar.cc/300?img=12",
  onNotificationPress,
}: HomeHeaderProps) {
  const [viewerVisible, setViewerVisible] = useState(false);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => setViewerVisible(true)}>
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          </TouchableOpacity>

          <View style={{ marginLeft: 14 }}>
            <Text style={styles.greeting}>Welcome Back</Text>
            <Text style={styles.name}>Hi, {name} 👋</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setViewerVisible(false)}
          >
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <Image
            source={{ uri: profileImage }}
            resizeMode="contain"
            style={styles.fullImage}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },

  greeting: {
    color: "#8A8A8A",
    fontSize: 13,
    fontWeight: "500",
  },

  name: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: "700",
    color: "#FAFAFA",
  },

  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1F1F1F",
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.97)",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "100%",
    height: "80%",
  },

  closeButton: {
    position: "absolute",
    top: 60,
    right: 25,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
});
