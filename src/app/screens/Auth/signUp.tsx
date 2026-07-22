// import { Ionicons } from "@expo/vector-icons";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = () => {
    router.push("/screens/Interests/InterestsScreen");
    console.log({
      fullName,
      email,
      password,
      confirmPassword,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Sign Up</Text>

        <View style={{ width: 28 }} />
      </View>

      {/* Logo */}
      <Image
        source={require("../../../../assets/images/appLogo.png")}
        resizeMode="contain"
        style={styles.image}
      />

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#999"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        {/* Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />

          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Account Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      {/* Login */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>

        <TouchableOpacity onPress={() => router.push("/screens/Auth/login")}>
          <Text style={styles.login}> Login</Text>
        </TouchableOpacity>
      </View>

      {/* Social Login Icons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialIcon}>
          <AntDesign name="google" size={24} color="orange" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialIcon}>
          <FontAwesome name="facebook" size={24} color="#1877F2" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialIcon}>
          <Ionicons name="call" size={24} color="#34C759" />
        </TouchableOpacity>
      </View>
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
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  back: {
    fontSize: 28,
    color: PURPLE,
    fontWeight: "700",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  image: {
    width: "100%",
    height: 250,
    marginTop: 10,
    marginBottom: 20,
  },

  form: {
    gap: 16,
  },

  input: {
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: "#222",
  },

  button: {
    marginTop: 30,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordContainer: {
    height: 56,
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    gap: 18,
  },

  socialIcon: {
    width: 55,
    height: 55,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  footerText: {
    color: "#777",
    fontSize: 15,
  },

  login: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
});
