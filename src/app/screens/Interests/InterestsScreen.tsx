import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Interest = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export default function InterestScreen() {
  const interests: Interest[] = [
    { name: "Music", icon: "musical-notes" },
    { name: "Sports", icon: "football" },
    { name: "Gaming", icon: "game-controller" },
    { name: "Travel", icon: "airplane" },
    { name: "Food", icon: "restaurant" },
    { name: "Movies", icon: "film" },
    { name: "Fashion", icon: "shirt" },
    { name: "Technology", icon: "laptop" },
    { name: "Photography", icon: "camera" },
    { name: "Fitness", icon: "barbell" },
    { name: "Art", icon: "color-palette" },
    { name: "Business", icon: "briefcase" },
  ];

  const [selected, setSelected] = useState<string[]>([]);

  const toggleInterest = (item: string) => {
    if (selected.includes(item)) {
      setSelected(selected.filter((interest) => interest !== item));
    } else {
      setSelected([...selected, item]);
    }
  };

  const continueNext = () => {
    console.log("Selected Interests:", selected);

    // save interests here

    router.push("/tabs/Main/mainPage");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color={PURPLE} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Choose your interests</Text>

        <Text style={styles.subtitle}>
          Select topics you love so we can personalize your experience.
        </Text>

        <View style={styles.grid}>
          {interests.map((item) => (
            <TouchableOpacity
              key={item.name}
              onPress={() => toggleInterest(item.name)}
              style={[
                styles.card,
                selected.includes(item.name) && styles.selectedCard,
              ]}
            >
              <View
                style={[
                  styles.iconBox,
                  selected.includes(item.name) && styles.selectedIconBox,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={26}
                  color={selected.includes(item.name) ? "#fff" : PURPLE}
                />
              </View>

              <Text
                style={[
                  styles.cardText,
                  selected.includes(item.name) && styles.selectedText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* extra bottom space for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Button */}
      <TouchableOpacity
        disabled={selected.length === 0}
        onPress={continueNext}
        style={[styles.button, selected.length === 0 && styles.disabledButton]}
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },

  header: {
    marginTop: 15,
  },

  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#777",
    lineHeight: 22,
  },

  grid: {
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },

  card: {
    width: "47%",
    height: 105,
    backgroundColor: "#F8F8F8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  selectedCard: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#EFE9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedIconBox: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  scrollContent: {
    paddingBottom: 30,
  },
  cardText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },

  selectedText: {
    color: "#fff",
  },

  check: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.45,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
});
