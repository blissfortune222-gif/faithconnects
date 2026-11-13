import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
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
const STORY_DURATION = 6000;
const STORY_EXPIRY = 24 * 60 * 60 * 1000;

const STORIES = [
  {
    id: "1",
    name: "Sarah",
    image: "https://i.pravatar.cc/300?img=47",
    storyImage: "https://picsum.photos/id/1011/600/1000",
    seen: false,
    createdAt: Date.now(),
  },
  {
    id: "2",
    name: "David",
    image: "https://i.pravatar.cc/300?img=12",
    storyImage: "https://picsum.photos/id/1012/600/1000",
    seen: false,
    createdAt: Date.now(),
  },
  {
    id: "3",
    name: "Grace",
    image: "https://i.pravatar.cc/300?img=44",
    storyImage: "https://picsum.photos/id/1015/600/1000",
    seen: true,
    createdAt: Date.now(),
  },
  {
    id: "4",
    name: "Michael",
    image: "https://i.pravatar.cc/300?img=11",
    storyImage: "https://picsum.photos/id/1016/600/1000",
    seen: false,
    createdAt: Date.now(),
  },
  {
    id: "5",
    name: "Jessica",
    image: "https://i.pravatar.cc/300?img=49",
    storyImage: "https://picsum.photos/id/1025/600/1000",
    seen: false,
    createdAt: Date.now(),
  },
  {
    id: "6",
    name: "Daniel",
    image: "https://i.pravatar.cc/300?img=13",
    storyImage: "https://picsum.photos/id/1035/600/1000",
    seen: true,
    createdAt: Date.now(),
  },
];

type Story = (typeof STORIES)[number];

export default function Trending() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [seenStories, setSeenStories] = useState<string[]>([]);

  const progress = useRef(new Animated.Value(0)).current;

  // Only show stories that have not expired.
  const availableStories = STORIES.filter(
    (story) => Date.now() - story.createdAt < STORY_EXPIRY,
  );

  const selectedStory =
    selectedIndex !== null ? availableStories[selectedIndex] : null;

  const markAsSeen = (story: Story) => {
    setSeenStories((previous) =>
      previous.includes(story.id) ? previous : [...previous, story.id],
    );
  };

  const closeStory = () => {
    setSelectedIndex(null);
    progress.stopAnimation();
    progress.setValue(0);
  };

  const openStory = (story: Story) => {
    const index = availableStories.findIndex((item) => item.id === story.id);

    if (index === -1) return;

    markAsSeen(story);
    setSelectedIndex(index);
  };

  const nextStory = () => {
    if (selectedIndex === null) return;

    const nextIndex = selectedIndex + 1;

    if (nextIndex >= availableStories.length) {
      closeStory();
      return;
    }

    markAsSeen(availableStories[nextIndex]);
    setSelectedIndex(nextIndex);
  };

  const previousStory = () => {
    if (selectedIndex === null) return;

    if (selectedIndex > 0) {
      const previousIndex = selectedIndex - 1;
      markAsSeen(availableStories[previousIndex]);
      setSelectedIndex(previousIndex);
    } else {
      progress.stopAnimation();
      progress.setValue(0);
    }
  };

  // Automatically advance after six seconds.
  useEffect(() => {
    if (selectedIndex === null || !selectedStory) return;

    progress.stopAnimation();
    progress.setValue(0);

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start();

    const timer = setTimeout(() => {
      const nextIndex = selectedIndex + 1;

      if (nextIndex >= availableStories.length) {
        closeStory();
      } else {
        markAsSeen(availableStories[nextIndex]);
        setSelectedIndex(nextIndex);
      }
    }, STORY_DURATION);

    return () => {
      clearTimeout(timer);
      animation.stop();
    };
  }, [selectedIndex]);

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={availableStories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.storyItem}
            activeOpacity={0.85}
            onPress={() => {
              // Connect your create-story screen here.
            }}>
            <View style={styles.myStoryWrapper}>
              <Image
                source={{
                  uri: "https://i.pravatar.cc/300?img=68",
                }}
                style={styles.storyImage}
              />

              <View style={styles.myStoryOverlay}>
                <Text style={styles.myStoryText}>Your Story</Text>
              </View>

              <View style={styles.addIcon}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const seen = item.seen || seenStories.includes(item.id);

          return (
            <TouchableOpacity
              style={styles.storyItem}
              activeOpacity={0.85}
              onPress={() => openStory(item)}>
              <View
                style={[
                  styles.storyRing,
                  seen ? styles.seenRing : styles.unseenRing,
                ]}>
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
        onRequestClose={closeStory}>
        {selectedStory && (
          <View style={styles.viewer}>
            <Image
              source={{ uri: selectedStory.storyImage }}
              style={styles.viewerImage}
              resizeMode="cover"
            />

            <View style={styles.viewerOverlay}>
              {/* PROGRESS */}
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>

              {/* HEADER */}
              <View style={styles.viewerHeader}>
                <Image
                  source={{ uri: selectedStory.image }}
                  style={styles.viewerAvatar}
                />

                <View style={styles.viewerUserInfo}>
                  <Text style={styles.viewerName}>{selectedStory.name}</Text>
                  <Text style={styles.viewerTime}>Just now</Text>
                </View>

                <Pressable onPress={closeStory} hitSlop={12}>
                  <Ionicons name="close" size={28} color="#FFFFFF" />
                </Pressable>
              </View>

              {/* LEFT AND RIGHT TAP AREAS */}
              <View style={styles.navigationAreas}>
                <Pressable
                  style={styles.previousArea}
                  onPress={previousStory}
                />
                <Pressable style={styles.nextArea} onPress={nextStory} />
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

  storyRing: {
    width: 105,
    height: 145,
    borderRadius: 13,
    padding: 2.5,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },

  // Neutral ring for unviewed stories.
  unseenRing: {
    borderColor: "#E5E5E5",
    backgroundColor: "#E5E5E5",
  },

  // Dark grey ring for viewed stories.
  seenRing: {
    borderColor: "#555555",
    backgroundColor: "#555555",
  },

  myStoryWrapper: {
    width: 105,
    height: 145,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#444444",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#191919",
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
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  myStoryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

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

  nameOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 7,
    paddingTop: 22,
    paddingBottom: 9,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  storyNameOverlay: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowRadius: 4,
  },

  // VIEWER
  viewer: {
    flex: 1,
    backgroundColor: "#000000",
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
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  progressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 5,
    overflow: "hidden",
  },

  progressFill: {
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 5,
  },

  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
    zIndex: 3,
  },

  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },

  viewerUserInfo: {
    flex: 1,
  },

  viewerName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  viewerTime: {
    color: "#DDDDDD",
    fontSize: 11,
    marginTop: 2,
  },

  navigationAreas: {
    position: "absolute",
    top: 110,
    bottom: 85,
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 1,
  },

  previousArea: {
    flex: 1,
  },

  nextArea: {
    flex: 1,
  },

  viewerFooter: {
    padding: 15,
    zIndex: 2,
  },

  viewerText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
});
