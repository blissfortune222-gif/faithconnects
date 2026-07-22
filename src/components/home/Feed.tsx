import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const posts = [
  {
    id: "1",
    user: "Sophia",
    avatar: "https://i.pravatar.cc/100?img=32",
    image: "https://picsum.photos/600/800?random=1",
    caption: "God's timing is always perfect. ❤️🙏",
    likes: 124,
    comments: 18,
    time: "2 mins ago",
  },
  {
    id: "2",
    user: "Emma",
    avatar: "https://i.pravatar.cc/100?img=47",
    image: "https://picsum.photos/600/800?random=2",
    caption: "Beautiful sunset after church today ✨",
    likes: 98,
    comments: 12,
    time: "15 mins ago",
  },
];

export default function Feed() {
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.userRow}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />

              <View>
                <Text style={styles.name}>{item.user}</Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>
            </View>

            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </View>

          {/* Image */}
          <Image source={{ uri: item.image }} style={styles.postImage} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{item.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="chatbubble-outline" size={22} color="#fff" />
              <Text style={styles.actionText}>{item.comments}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.action}>
              <Ionicons name="paper-plane-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity>
              <Ionicons name="bookmark-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.caption}>
            <Text style={{ fontWeight: "700" }}>{item.user}</Text>{" "}
            {item.caption}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    backgroundColor: "#181818",
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },

  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  time: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },

  postImage: {
    width: "100%",
    height: 430,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },

  actionText: {
    color: "#fff",
    marginLeft: 5,
    fontWeight: "600",
  },

  caption: {
    color: "#fff",
    paddingHorizontal: 15,
    paddingBottom: 15,
    lineHeight: 22,
  },
});
