import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logo}>
        <Text style={styles.logoText}>❤✝</Text>
      </View>

      {/* App Name */}
      <Text style={styles.title}>FaithConnect</Text>

      {/* Tagline */}
      <Text style={styles.subtitle}> Love. Purpose.</Text>

      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/screens/Onboarding/OnboardingScreen")}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0623",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FF4FA3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },

  logoText: {
    color: "#fff",
    fontSize: 50,
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#ddd",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 60,
  },

  button: {
    backgroundColor: "#FF4FA3",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
