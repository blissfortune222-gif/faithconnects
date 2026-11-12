import { SIGNUP_MUTATION } from "@/graphql/mutations/outh";
import { saveToken } from "@/lib/apollo/auth";
import { useMutation } from "@apollo/client/react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";

// Yup validation schema
const signupSchema = Yup.object({
  fullName: Yup.string()
    .trim()
    .min(2, "Full name must contain at least 2 characters.")
    .required("Please enter your full name."),

  email: Yup.string()
    .trim()
    .email("Please enter a valid email address.")
    .required("Please enter your email address."),

  password: Yup.string()
    .required("Please enter a password.")
    .min(6, "Password must be at least 6 characters long."),

  confirmPassword: Yup.string()
    .required("Please confirm your password.")
    .oneOf([Yup.ref("password")], "Passwords do not match."),
});

type FormErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});

  const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

  // Update field and clear its validation error
  const updateField = (
    field: keyof FormErrors,
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
  };

  // Validate form with Yup
  const validateForm = async () => {
    try {
      await signupSchema.validate(
        {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        },
        { abortEarly: false },
      );

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors: FormErrors = {};

        error.inner.forEach((item) => {
          if (item.path && !validationErrors[item.path as keyof FormErrors]) {
            validationErrors[item.path as keyof FormErrors] = item.message;
          }
        });

        setErrors(validationErrors);
      }

      return false;
    }
  };

  // Signup handler
  const handleSignup = async () => {
    if (loading) return;

    const isValid = await validateForm();

    if (!isValid) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    try {
      console.log("========== SIGNUP STARTED ==========");
      console.log("Name:", trimmedName);
      console.log("Email:", trimmedEmail);

      const result = await signup({
        variables: {
          fullName: trimmedName,
          email: trimmedEmail,
          password,
        },
      });

      console.log("SIGNUP RESULT:", result);

      const data = result.data;

      if (!data?.signup?.token) {
        throw new Error("No authentication token was returned.");
      }

      // Save authentication token
      await saveToken(data.signup.token);

      console.log("Signup successful:", data.signup.user);

      // Navigate to interests
      router.replace("/screens/Interests/InterestsScreen");
    } catch (error: any) {
      console.error("========== SIGNUP ERROR ==========");
      console.error("Error:", error);
      console.error("Message:", error?.message);
      console.error("GraphQL errors:", error?.graphQLErrors);
      console.error("Network error:", error?.networkError);
      console.error("==================================");

      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Something went wrong while creating your account.";

      Alert.alert("Signup Failed", message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={23} color={PURPLE} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create Account</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Logo */}
          <Image
            source={require("../../../../assets/images/appLogo.png")}
            resizeMode="contain"
            style={styles.image}
          />

          <Text style={styles.heading}>Join our community</Text>

          <Text style={styles.subtitle}>
            Create an account to connect with people and build meaningful
            relationships.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View>
              <Text style={styles.label}>Full Name</Text>

              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                style={[styles.input, errors.fullName && styles.inputError]}
                value={fullName}
                onChangeText={(value) =>
                  updateField("fullName", value, setFullName)
                }
                autoCapitalize="words"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="next"
              />

              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Email */}
            <View>
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={(value) =>
                  updateField("email", value.replace(/\s/g, ""), setEmail)
                }
                editable={!loading}
                returnKeyType="next"
              />

              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password */}
            <View>
              <Text style={styles.label}>Password</Text>

              <View
                style={[
                  styles.passwordContainer,
                  errors.password && styles.inputError,
                ]}>
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor="#999"
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={(value) =>
                    updateField(
                      "password",
                      value.replace(/\s/g, ""),
                      setPassword,
                    )
                  }
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="next"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={styles.label}>Confirm Password</Text>

              <View
                style={[
                  styles.passwordContainer,
                  errors.confirmPassword && styles.inputError,
                ]}>
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor="#999"
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={(value) =>
                    updateField(
                      "confirmPassword",
                      value.replace(/\s/g, ""),
                      setConfirmPassword,
                    )
                  }
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  disabled={loading}
                  style={styles.eyeButton}>
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={21}
                    color="#777"
                  />
                </TouchableOpacity>
              </View>

              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Create Account */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>

            <TouchableOpacity
              onPress={() => router.push("/screens/Auth/login")}
              disabled={loading}>
              <Text style={styles.login}> Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Social Login */}
          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR CONTINUE WITH</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading}
                activeOpacity={0.7}>
                <AntDesign name="google" size={23} color="#DB4437" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading}
                activeOpacity={0.7}>
                <Ionicons name="call-outline" size={23} color="#34C759" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  header: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
  },

  headerSpacer: {
    width: 38,
  },

  image: {
    width: "100%",
    height: 190,
    marginTop: 5,
    marginBottom: 8,
  },

  heading: {
    fontSize: 25,
    fontWeight: "800",
    color: "#21153A",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 25,
    paddingHorizontal: 8,
  },

  form: {
    gap: 17,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    height: 55,
    backgroundColor: "#F7F6FA",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#222",
    borderWidth: 1,
    borderColor: "#F0EDF5",
  },

  passwordContainer: {
    height: 55,
    backgroundColor: "#F7F6FA",
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0EDF5",
  },

  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    paddingVertical: 0,
  },

  eyeButton: {
    padding: 5,
  },

  inputError: {
    borderColor: "#E53935",
  },

  errorText: {
    color: "#E53935",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 3,
  },

  button: {
    marginTop: 28,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: PRIMARY,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },

  footerText: {
    color: "#777",
    fontSize: 14,
  },

  login: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 14,
  },

  socialSection: {
    marginTop: 30,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EAE7EF",
  },

  orText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 1,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    gap: 18,
  },

  socialIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAE7EF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
