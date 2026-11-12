import Feed from "@/components/home/Feed";
import HomeHeader from "@/components/home/HomeHeader";
import Trending from "@/components/home/Trending";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const bibleVerses = [
  {
    verse:
      "Be strong and courageous. Do not be afraid or discouraged, for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
  },
  {
    verse: "I can do all things through Christ who strengthens me.",
    reference: "Philippians 4:13",
  },
  {
    verse: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
  },
  {
    verse:
      "Trust in the Lord with all your heart and lean not on your own understanding.",
    reference: "Proverbs 3:5",
  },
  {
    verse:
      "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
  },
];

type HomeScreenProps = {
  currentUserId?: string;
};

export default function HomeScreen({ currentUserId }: HomeScreenProps) {
  const [dailyVerse, setDailyVerse] = useState(bibleVerses[0]);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    setDailyVerse(bibleVerses[randomIndex]);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <HomeHeader onNotificationPress={() => console.log("Notifications")} />

      <FlatList
        data={[{ id: "main-feed" }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            {/* <DailyVerse
              verse={dailyVerse.verse}
              reference={dailyVerse.reference}
              onPress={() => console.log("Read Verse:", dailyVerse.reference)}
            /> */}

            <Trending />
          </View>
        }
        renderItem={() => <Feed currentUserId={currentUserId} />}
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
