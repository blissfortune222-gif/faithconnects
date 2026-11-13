import Feed from "@/components/home/Feed";
import HomeHeader from "@/components/home/HomeHeader";
import Trending from "@/components/home/Trending";
import { useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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

const TAB_BAR_STYLE = {
  backgroundColor: "#121212",
  borderTopColor: "#252525",
  borderTopWidth: 1,
  height: 76,
  paddingTop: 8,
  paddingBottom: 8,
  elevation: 0,
  shadowOpacity: 0,
};

export default function HomeScreen({ currentUserId }: HomeScreenProps) {
  const [dailyVerse, setDailyVerse] = useState(bibleVerses[0]);

  const navigation = useNavigation();

  const lastScrollY = useRef(0);
  const tabsHidden = useRef(false);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * bibleVerses.length);
    setDailyVerse(bibleVerses[randomIndex]);
  }, []);

  // SHOW BOTTOM TABS
  const showTabs = useCallback(() => {
    if (tabsHidden.current) {
      tabsHidden.current = false;

      navigation.setOptions({
        tabBarStyle: TAB_BAR_STYLE,
      });
    }
  }, [navigation]);

  // HIDE BOTTOM TABS
  const hideTabs = useCallback(() => {
    if (!tabsHidden.current) {
      tabsHidden.current = true;

      navigation.setOptions({
        tabBarStyle: {
          display: "none",
        },
      });
    }
  }, [navigation]);

  // DETECT SCROLL DIRECTION
  const handleFeedScroll = useCallback(
    (event: any) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const difference = currentY - lastScrollY.current;

      if (currentY <= 10) {
        showTabs();
      } else if (difference > 3) {
        hideTabs();
      } else if (difference < -3) {
        showTabs();
      }

      lastScrollY.current = currentY;
    },
    [hideTabs, showTabs],
  );

  // RESET TABS WHEN SCREEN LOSES FOCUS
  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      showTabs();
      lastScrollY.current = 0;
    });

    return unsubscribe;
  }, [navigation, showTabs]);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <HomeHeader onNotificationPress={() => console.log("Notifications")} />

      <FlatList
        data={[{ id: "main-feed" }]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onScroll={handleFeedScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View>
            {/* DAILY VERSE */}
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
