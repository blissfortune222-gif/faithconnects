import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const photos = [
  "https://picsum.photos/400/400?random=11",
  "https://picsum.photos/400/400?random=12",
  "https://picsum.photos/400/400?random=13",
  "https://picsum.photos/400/400?random=14",
  "https://picsum.photos/400/400?random=15",
  "https://picsum.photos/400/400?random=16",
];

const PRIMARY = "#FF4F9A";

export default function Profile() {
  const [settingsVisible, setSettingsVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={photos}
        numColumns={3}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setSettingsVisible(true)}>
                <Ionicons name="settings-outline" size={28} color="#fff" />
              </TouchableOpacity>

              <Text style={styles.headerTitle}>Profile</Text>

              {/* <TouchableOpacity>
                <Ionicons name="create-outline" size={26} color="#fff" />
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.addPost}>
                <Ionicons name="add-circle" size={22} color="#fff" />
                <Text style={styles.addPostText}>New Post</Text>
              </TouchableOpacity>
            </View>

            <Image
              source={{
                uri: "https://i.pravatar.cc/400?img=32",
              }}
              style={styles.avatar}
            />

            <View style={styles.nameRow}>
              <Text style={styles.name}>Sophia, 22</Text>

              <Ionicons name="checkmark-circle" color={PRIMARY} size={22} />
            </View>

            <Text style={styles.username}>@sophia</Text>

            <Text style={styles.bio}>
              ✨ Coffee lover • Traveller • Jesus First ❤️{"\n"}
              Looking for meaningful connections.
            </Text>

            <View style={styles.location}>
              <Ionicons name="location-outline" color="#999" size={16} />

              <Text style={styles.locationText}>Lagos, Nigeria</Text>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.number}>1.2K</Text>
                <Text style={styles.label}>Followers</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.number}>348</Text>
                <Text style={styles.label}>Following</Text>
              </View>

              <View style={styles.stat}>
                <Text style={styles.number}>7.4K</Text>
                <Text style={styles.label}>Likes</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>

            <Text style={styles.photosTitle}>Photos</Text>
          </>
        }
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.photo} />
        )}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      />
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Settings</Text>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="person-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="lock-closed-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Privacy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="moon-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Appearance</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="bookmark-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Saved Posts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons name="help-circle-outline" size={22} color="#fff" />
              <Text style={styles.itemText}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.item}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#fff"
              />
              <Text style={styles.itemText}>About</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logout}>
              <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  name: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginRight: 6,
  },

  username: {
    textAlign: "center",
    color: "#888",
    marginTop: 5,
    fontSize: 15,
  },

  bio: {
    color: "#ddd",
    textAlign: "center",
    marginTop: 18,
    lineHeight: 24,
    fontSize: 15,
    paddingHorizontal: 15,
  },

  location: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  locationText: {
    color: "#999",
    marginLeft: 5,
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 30,
    marginBottom: 25,
  },

  stat: {
    alignItems: "center",
  },

  number: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
  },

  label: {
    color: "#777",
    marginTop: 6,
  },

  editButton: {
    backgroundColor: PRIMARY,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#1B1B1B",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },

  sheetTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  itemText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 16,
  },

  logout: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },

  logoutText: {
    color: "#ff4d4d",
    fontWeight: "700",
    fontSize: 17,
    marginLeft: 16,
  },

  addPost: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },

  addPostText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
  },

  editText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  photosTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  photo: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 14,
    marginBottom: 8,
  },
});
