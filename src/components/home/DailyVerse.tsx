import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type DailyVerseProps = {
  verse?: string;
  reference?: string;
  onPress?: () => void;
};

export default function DailyVerse({
  verse = "Be strong and courageous. Do not be afraid or discouraged, for the Lord your God will be with you wherever you go.",
  reference = "Joshua 1:9",
  onPress,
}: DailyVerseProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="book-outline" size={20} color="#FFFFFF" />

          <Text style={styles.title}>Daily Verse</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
      </View>

      <Text numberOfLines={4} style={styles.verse}>
        "{verse}"
      </Text>

      <View style={styles.footer}>
        <Text style={styles.reference}>{reference}</Text>

        <TouchableOpacity style={styles.readButton}>
          <Text style={styles.readText}>Read More</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 24,
    backgroundColor: PRIMARY,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  verse: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 28,
    fontWeight: "400",
  },

  footer: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  reference: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  readButton: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  readText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
});
