import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type Story = {
  id: string;
  name: string;
  image: string;
  mine?: boolean;
};

const stories: Story[] = [
  {
    id: "1",
    name: "Your Story",
    image: "https://i.pravatar.cc/200?img=12",
    mine: true,
  },
  {
    id: "2",
    name: "Alex",
    image: "https://i.pravatar.cc/200?img=15",
  },
  {
    id: "3",
    name: "Sarah",
    image: "https://i.pravatar.cc/200?img=20",
  },
  {
    id: "4",
    name: "Mike",
    image: "https://i.pravatar.cc/200?img=31",
  },
  {
    id: "5",
    name: "Emma",
    image: "https://i.pravatar.cc/200?img=45",
  },
];

export default function Stories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result.assets[0].uri);
      // Upload or save the image here
    }
  };

  const openGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result.assets[0].uri);
      // Upload or save the image here
    }
  };

  const showPicker = () => {
    Alert.alert("Create Story", "Choose an option", [
      {
        text: "📷 Camera",
        onPress: openCamera,
      },
      {
        text: "🖼 Gallery",
        onPress: openGallery,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Stories</Text>

        <TouchableOpacity>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={stories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => setSelectedStory(item)}
          >
            <Image source={{ uri: item.image }} style={styles.image} />

            {item.mine && (
              <TouchableOpacity style={styles.plus} onPress={showPicker}>
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={styles.overlay}>
              <Text numberOfLines={1} style={styles.name}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <Modal
        visible={!!selectedStory}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setSelectedStory(null)}
      >
        {selectedStory && (
          <View style={styles.modalContainer}>
            <Image
              source={{ uri: selectedStory.image }}
              style={styles.fullImage}
              resizeMode="cover"
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedStory(null)}
            >
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.storyNameContainer}>
              <Text style={styles.storyName}>{selectedStory.name}</Text>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F3F4F6",
  },

  viewAll: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  list: {
    paddingHorizontal: 20,
  },

  card: {
    width: 95,
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    marginRight: 14,
    backgroundColor: "#2A2A2A",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  name: {
    color: "#F3F4F6",
    fontSize: 13,
    fontWeight: "600",
  },

  plus: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  fullImage: {
    width: "100%",
    height: "100%",
  },

  closeButton: {
    position: "absolute",
    top: 55,
    right: 20,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  storyNameContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
  },

  storyName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
});
