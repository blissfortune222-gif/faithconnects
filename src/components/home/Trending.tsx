import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#FF4F9A";
const BACKGROUND = "#0F0623";

const STORIES = [
  {
    id: "1",
    name: "Sarah",
    image: "https://i.pravatar.cc/300?img=47",
    storyImage: "https://picsum.photos/id/1011/600/1000",
    seen: false,
  },
  {
    id: "2",
    name: "David",
    image: "https://i.pravatar.cc/300?img=12",
    storyImage: "https://picsum.photos/id/1012/600/1000",
    seen: false,
  },
  {
    id: "3",
    name: "Grace",
    image: "https://i.pravatar.cc/300?img=44",
    storyImage: "https://picsum.photos/id/1015/600/1000",
    seen: true,
  },
  {
    id: "4",
    name: "Michael",
    image: "https://i.pravatar.cc/300?img=11",
    storyImage: "https://picsum.photos/id/1016/600/1000",
    seen: false,
  },
  {
    id: "5",
    name: "Jessica",
    image: "https://i.pravatar.cc/300?img=49",
    storyImage: "https://picsum.photos/id/1025/600/1000",
    seen: false,
  },
  {
    id: "6",
    name: "Daniel",
    image: "https://i.pravatar.cc/300?img=13",
    storyImage: "https://picsum.photos/id/1035/600/1000",
    seen: true,
  },
];

type Story = (typeof STORIES)[number];

export default function Trending() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [seenStories, setSeenStories] = useState<string[]>([]);

  const openStory = (story: Story) => {
    setSelectedStory(story);

    setSeenStories((previous) =>
      previous.includes(story.id) ? previous : [...previous, story.id],
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={STORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        // YOUR STORY - FIRST CARD
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.85}
            onPress={() => {
              // Connect to create-story screen later.
            }}>
            <View style={styles.myStoryWrapper}>
              <Image
                source={{
                  uri: "https://i.pravatar.cc/300?img=68",
                }}
                style={styles.storyImage}
              />

              {/* DARK GRADIENT-STYLE OVERLAY */}
              <View style={styles.myStoryOverlay}>
                <Text style={styles.myStoryText}>Your Story</Text>
              </View>

              {/* PLUS BUTTON AT BOTTOM CENTRE */}
              <View style={styles.addIcon}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        }
        // OTHER STORIES
        renderItem={({ item }) => {
          const seen = item.seen || seenStories.includes(item.id);

          return (
            <TouchableOpacity
              style={styles.storyItem}
              activeOpacity={0.85}
              onPress={() => openStory(item)}>
              <View style={[styles.storyRing, seen && styles.seenRing]}>
                <Image source={{ uri: item.image }} style={styles.storyImage} />

                <View style={styles.nameOverlay}>
                  <Text style={styles.storyNameOverlay} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* STORY VIEWER */}
      <Modal
        visible={!!selectedStory}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedStory(null)}>
        {selectedStory && (
          <View style={styles.viewer}>
            <Image
              source={{ uri: selectedStory.storyImage }}
              style={styles.viewerImage}
              resizeMode="cover"
            />

            <View style={styles.viewerOverlay}>
              <View style={styles.progressTrack}>
                <View style={styles.progressFill} />
              </View>

              <View style={styles.viewerHeader}>
                <Image
                  source={{ uri: selectedStory.image }}
                  style={styles.viewerAvatar}
                />

                <Text style={styles.viewerName}>{selectedStory.name}</Text>

                <Pressable onPress={() => setSelectedStory(null)} hitSlop={10}>
                  <Ionicons name="close" size={28} color="#fff" />
                </Pressable>
              </View>

              <View style={styles.viewerFooter}>
                <Text style={styles.viewerText}>Story preview</Text>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    marginTop: 2,
  },

  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },

  storyItem: {
    width: 105,
    marginRight: 10,
  },

  /* OTHER STORY CARDS */

  storyRing: {
    width: 105,
    height: 145,
    borderRadius: 13,
    padding: 2.5,
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: "#8B5CF6",
    overflow: "hidden",
    position: "relative",
  },

  seenRing: {
    borderColor: "#555",
    backgroundColor: "#555",
  },

  /* YOUR STORY CARD */

  myStoryWrapper: {
    width: 105,
    height: 145,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#49305F",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#19102F",
  },

  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#292929",
  },

  myStoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 9,
    backgroundColor: "rgba(0,0,0,0.38)",
  },

  myStoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* PLUS BUTTON */

  addIcon: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: BACKGROUND,
    zIndex: 2,
  },

  /* OTHER STORY NAME */

  nameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingTop: 22,
    paddingBottom: 9,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  storyNameOverlay: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 4,
  },

  /* STORY VIEWER */

  viewer: {
    flex: 1,
    backgroundColor: "#000",
  },

  viewerImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  viewerOverlay: {
    flex: 1,
    paddingTop: 55,
    paddingHorizontal: 14,
    paddingBottom: 25,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 5,
  },

  progressFill: {
    width: "55%",
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 5,
  },

  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  viewerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },

  viewerFooter: {
    padding: 15,
  },

  viewerText: {
    color: "#fff",
    fontSize: 14,
  },
});
