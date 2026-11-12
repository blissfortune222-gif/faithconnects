import { useState } from "react";
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
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <View style={styles.card}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.accentLine} />
          <Text style={styles.title}>Daily Verse</Text>
        </View>

        <TouchableOpacity
          onPress={() => setVisible(false)}
          style={styles.hideButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Hide daily verse">
          {/* <Text style={styles.hideText}>Hide</Text> */}
        </TouchableOpacity>
      </View>

      {/* VERSE */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
        disabled={!onPress}>
        <Text numberOfLines={4} style={styles.verse}>
          "{verse}"
        </Text>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.reference}>{reference}</Text>

          {onPress && <Text style={styles.readText}>Read more →</Text>}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#19191F",
    borderWidth: 1,
    borderColor: "#303039",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  accentLine: {
    width: 3,
    height: 17,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginRight: 9,
  },

  title: {
    color: "#F5F5F7",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  hideButton: {
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  hideText: {
    color: "#858591",
    fontSize: 12,
    fontWeight: "500",
  },

  verse: {
    color: "#E2E2E8",
    fontSize: 14,
    lineHeight: 23,
    fontWeight: "400",
  },

  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#303039",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  reference: {
    color: "#B7B7C2",
    fontSize: 12,
    fontWeight: "600",
  },

  readText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "600",
  },
});
