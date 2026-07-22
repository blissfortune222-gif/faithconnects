import DailyVerse from "@/components/home/DailyVerse";
import Feed from "@/components/home/Feed";
import HomeHeader from "@/components/home/HomeHeader";
import Trending from "@/components/home/Trending";
import { FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  {
    id: "3",
    user: "Grace",
    avatar: "https://i.pravatar.cc/100?img=44",
    image: "https://picsum.photos/600/800?random=3",
    caption: "Feeling blessed today 💕",
    likes: 211,
    comments: 31,
    time: "30 mins ago",
  },
  {
    id: "4",
    user: "Olivia",
    avatar: "https://i.pravatar.cc/100?img=48",
    image: "https://picsum.photos/600/800?random=4",
    caption: "Sunday vibes 🌸",
    likes: 145,
    comments: 20,
    time: "1 hr ago",
  },
];
export default function HomeScreen() {
  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      {/* Fixed Header */}
      <HomeHeader
        name="Fortune"
        onNotificationPress={() => console.log("Notifications")}
      />

      {/* Scrollable Content */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <DailyVerse
              verse="Be strong and courageous. Do not be afraid or discouraged, for the Lord your God will be with you wherever you go."
              reference="Joshua 1:9"
              onPress={() => console.log("Read Verse")}
            />

            <Trending />
          </>
        }
        renderItem={({ item }) => <Feed />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },

  listContent: {
    paddingBottom: 40,
  },
});
