import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const activeUsers = [
  { id: "1", image: "https://i.pravatar.cc/150?img=32" },
  { id: "2", image: "https://i.pravatar.cc/150?img=47" },
  { id: "3", image: "https://i.pravatar.cc/150?img=20" },
  { id: "4", image: "https://i.pravatar.cc/150?img=48" },
  { id: "5", image: "https://i.pravatar.cc/150?img=44" },
];

const chats = [
  {
    id: "1",
    name: "Sophia",
    image: "https://i.pravatar.cc/150?img=32",
    message: "Hey 😊 How's your day going?",
    time: "2m",
    unread: 2,
    online: true,
  },
  {
    id: "2",
    name: "Emma",
    image: "https://i.pravatar.cc/150?img=47",
    message: "I'd love to meet sometime ❤️",
    time: "10m",
    unread: 1,
    online: true,
  },
  {
    id: "3",
    name: "Olivia",
    image: "https://i.pravatar.cc/150?img=48",
    message: "See you tomorrow!",
    time: "1h",
    unread: 0,
    online: false,
  },
  {
    id: "4",
    name: "Grace",
    image: "https://i.pravatar.cc/150?img=44",
    message: "😂😂 You're funny.",
    time: "Yesterday",
    unread: 0,
    online: true,
  },
  {
    id: "5",
    name: "Sarah",
    image: "https://i.pravatar.cc/150?img=20",
    message: "Good night 🌙",
    time: "Yesterday",
    unread: 3,
    online: false,
  },
];

const PRIMARY = "#FF4F9A";

export default function Messages() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          placeholder="Search conversations"
          placeholderTextColor="#888"
          style={styles.input}
        />
      </View>

      <Text style={styles.section}>Active Now</Text>

      <FlatList
        horizontal
        data={activeUsers}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.story}>
            <Image source={{ uri: item.image }} style={styles.storyImage} />
            <View style={styles.onlineDot} />
          </View>
        )}
      />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chat}>
            <View>
              <Image source={{ uri: item.image }} style={styles.avatar} />
              {item.online && <View style={styles.chatOnline} />}
            </View>

            <View style={styles.chatBody}>
              <Text style={styles.name}>{item.name}</Text>

              <Text numberOfLines={1} style={styles.message}>
                {item.message}
              </Text>
            </View>

            <View style={styles.right}>
              <Text style={styles.time}>{item.time}</Text>

              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 18,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 18,
  },

  search: {
    backgroundColor: "#1E1E1E",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },

  input: {
    color: "#fff",
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
  },

  section: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 14,
  },

  story: {
    marginRight: 16,
  },

  storyImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#2ED573",
    borderWidth: 3,
    borderColor: "#121212",
  },

  chat: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1F1F1F",
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 32,
  },

  chatOnline: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2ED573",
    borderWidth: 2,
    borderColor: "#121212",
  },

  chatBody: {
    flex: 1,
    marginLeft: 15,
  },

  name: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  message: {
    color: "#888",
    marginTop: 5,
    fontSize: 14,
  },

  right: {
    alignItems: "flex-end",
  },

  time: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
  },

  badge: {
    backgroundColor: PRIMARY,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
