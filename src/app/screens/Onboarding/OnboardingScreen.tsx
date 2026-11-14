import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(sparkle, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [sparkle]);

  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 1, 0.35],
  });

  const sparkleScale = sparkle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.25, 0.8],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />

        <View style={styles.dots}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* CONTENT */}
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
          source={require("../../../../assets/images/connectss.png")}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* GLITTER BUTTON */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.buttonWrapper}
        onPress={() => router.push("/screens/Auth/signUp")}>
        <LinearGradient
          colors={["#FF78B0", "#FF4F9A", "#E93683"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}>
          {/* TOP SHIMMER */}
          <View style={styles.topShimmer} />

          {/* SPARKLES */}
          <Animated.View
            style={[
              styles.sparkleOne,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}>
            <Ionicons name="sparkles" size={17} color="#FFFFFF" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkleTwo,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
              },
            ]}>
            <Ionicons name="sparkles" size={11} color="#FFE5F0" />
          </Animated.View>

          <Text style={styles.buttonText}>Next</Text>

          {/* <Ionicons
            name="arrow-forward"
            size={18}
            color="#FFFFFF"
            style={styles.arrow}
          /> */}
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* =========================================================
   THEME
   ========================================================= */

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000fa",
    paddingHorizontal: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 20,
  },

  headerSpacer: {
    width: 30,
  },

  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#514660",
  },

  activeDot: {
    width: 22,
    backgroundColor: PRIMARY,
  },

  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 24,
  },

  textContainer: {
    alignItems: "center",
    marginTop: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 14,
    letterSpacing: -0.5,
  },

  description: {
    textAlign: "center",
    color: "#AFA7BF",
    fontSize: 15,
    lineHeight: 25,
    paddingHorizontal: 12,
    fontWeight: "400",
  },

  image: {
    width: "100%",
    height: 460,
    marginBottom: 20,
  },

  /* GLITTER BUTTON */

  buttonWrapper: {
    width: "100%",
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: "#FF4F9A",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },

  button: {
    height: 54,
    width: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#FF9BC5",
  },

  topShimmer: {
    position: "absolute",
    top: 1,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.55)",
  },

  sparkleOne: {
    position: "absolute",
    left: 25,
    top: 10,
  },

  sparkleTwo: {
    position: "absolute",
    right: 27,
    top: 9,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  arrow: {
    position: "absolute",
    right: 19,
  },
});
