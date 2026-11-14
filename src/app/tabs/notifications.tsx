import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const notifications = [
  {
    id: "1",
    user: "Sophia",
    avatar: "https://i.pravatar.cc/150?img=32",
    text: "liked your profile ❤️",
    time: "2 min ago",
    section: "Today",
    verified: true,
  },
  {
    id: "2",
    user: "Emma",
    avatar: "https://i.pravatar.cc/150?img=47",
    text: "matched with you 🎉",
    time: "15 min ago",
    section: "Today",
    verified: false,
  },
  {
    id: "3",
    user: "Grace",
    avatar: "https://i.pravatar.cc/150?img=44",
    text: "sent you a message 💬",
    time: "1 hour ago",
    section: "Today",
    verified: true,
  },
  {
    id: "4",
    user: "Olivia",
    avatar: "https://i.pravatar.cc/150?img=48",
    text: "started following you",
    time: "Yesterday",
    section: "Yesterday",
    verified: false,
    follow: true,
  },
  {
    id: "5",
    user: "Sarah",
    avatar: "https://i.pravatar.cc/150?img=20",
    text: "viewed your profile 👀",
    time: "Yesterday",
    section: "Yesterday",
    verified: false,
  },
  {
    id: "6",
    user: "Ella",
    avatar: "https://i.pravatar.cc/150?img=19",
    text: "liked your latest photo",
    time: "3 days ago",
    section: "Earlier",
    verified: false,
  },
];

const PRIMARY = "#FF4F9A";

export default function Notifications() {
  let currentSection = "";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const showHeader = item.section !== currentSection;
          currentSection = item.section;

          return (
            <>
              {showHeader && <Text style={styles.section}>{item.section}</Text>}

              <TouchableOpacity style={styles.card}>
                <Image source={{ uri: item.avatar }} style={styles.avatar} />

                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.name}>{item.user}</Text>

                    {item.verified && (
                      <Ionicons
                        name="checkmark-circle"
                        color={PRIMARY}
                        size={16}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>

                  <Text style={styles.text}>{item.text}</Text>

                  <Text style={styles.time}>{item.time}</Text>
                </View>

                {item.follow ? (
                  <TouchableOpacity style={styles.follow}>
                    <Text style={styles.followText}>Follow</Text>
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="chevron-forward" color="#666" size={20} />
                )}
              </TouchableOpacity>
            </>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000fa",
    paddingHorizontal: 18,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 25,
  },

  section: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    marginTop: 10,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  body: {
    flex: 1,
    marginLeft: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  text: {
    color: "#D1D5DB",
    marginTop: 3,
    fontSize: 14,
  },

  time: {
    color: "#777",
    fontSize: 12,
    marginTop: 6,
  },

  follow: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },

  followText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
});
