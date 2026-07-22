import { FontAwesome, Ionicons } from "@expo/vector-icons";
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

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    router.push("/screens/Interests/InterestsScreen");
    console.log({
      email,
      password,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={PURPLE} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Login</Text>

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
          placeholder="Email Address"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#777"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password */}
      <TouchableOpacity style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      {/* Login Button */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Signup */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account?</Text>

        <TouchableOpacity onPress={() => router.push("/screens/Auth/signUp")}>
          <Text style={styles.signup}> Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Social Icons */}
      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialIcon}>
          <FontAwesome name="google" size={24} color="orange" />
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
    marginTop: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 22,
    marginBottom: 10,
    fontWeight: "700",
    color: "#222",
  },

  image: {
    width: "100%",
    height: 250,
    marginTop: 20,
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

  forgot: {
    alignItems: "flex-end",
    marginTop: 15,
  },

  forgotText: {
    color: PRIMARY,
    fontWeight: "600",
  },

  button: {
    marginTop: 25,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
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

  footerText: {
    color: "#777",
    fontSize: 15,
  },

  signup: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 35,
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
    elevation: 2,
  },
});
