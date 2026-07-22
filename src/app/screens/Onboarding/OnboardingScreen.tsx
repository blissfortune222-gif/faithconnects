import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Empty view to keep dots centered */}
        <View style={{ width: 30 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome!</Text>

          <Text style={styles.description}>
            Find meaningful connections{"\n"}
            with Christian singles{"\n"}
            who share your faith.
          </Text>
        </View>

        <Image
          source={require("../../../../assets/images/onboarding-couple.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/screens/Auth/signUp")}
        // onPress={() => router.push("/signup")}
      >
        <Text style={styles.buttonText}>Next</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 20,
  },

  back: {
    fontSize: 28,
    color: PURPLE,
    fontWeight: "700",
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 4,
  },

  activeDot: {
    width: 24,
    backgroundColor: PURPLE,
  },

  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },

  textContainer: {
    alignItems: "center",
    marginTop: 10,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#222",
    marginBottom: 14,
  },

  description: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: 20,
  },

  image: {
    width: "100%",
    height: 360,
    marginBottom: 20,
  },

  button: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
