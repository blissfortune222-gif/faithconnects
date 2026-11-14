import { SIGNUP_MUTATION } from "@/graphql/mutations/outh";
import { saveToken } from "@/lib/apollo/auth";
import { useMutation } from "@apollo/client/react";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import * as Yup from "yup";

import {
  ActivityIndicator,
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

/* =========================================================
   VALIDATION
   ========================================================= */

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

/* =========================================================
   SIGNUP SCREEN
   ========================================================= */

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

  /* =======================================================
     FIELD HANDLING
     ======================================================= */

  const updateField = (
    field: keyof FormErrors,
    value: string,
    setter: (value: string) => void,
  ) => {
    setter(value);
    setServerError("");

    setErrors((previous) => ({
      ...previous,
      [field]: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
  };

  /* =======================================================
     VALIDATION
     ======================================================= */

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

  /* =======================================================
     SIGNUP
     ======================================================= */

  const handleSignup = async () => {
    if (loading) return;

    setServerError("");

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

      await saveToken(data.signup.token);

      console.log("Signup successful:", data.signup.user);

      router.replace("/screens/Interests/InterestsScreen");
    } catch (error: any) {
      console.error("========== SIGNUP ERROR ==========");
      console.error("Error:", error);
      console.error("Message:", error?.message);
      console.error("GraphQL errors:", error?.graphQLErrors);
      console.error("Network error:", error?.networkError);
      console.error("==================================");

      let message =
        "Something went wrong while creating your account. Please try again.";

      if (error?.graphQLErrors?.length) {
        message = error.graphQLErrors
          .map((item: any) => item.message)
          .filter(Boolean)
          .join("\n");
      } else if (error?.networkError) {
        message =
          "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error?.message) {
        message = error.message;
      }

      setServerError(message);
    }
  };

  /* =======================================================
     FONT LOADING
     ======================================================= */

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={21} color={TEXT} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create account</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* BRANDING */}

          <View style={styles.brandSection}>
            <Image
              source={require("../../../../assets/images/FaithConnect.png")}
              resizeMode="contain"
              style={styles.image}
            />

            <Text style={styles.subtitle}>
              Join the community and start connecting with people.
            </Text>
          </View>

          {/* FORM */}

          <View style={styles.form}>
            {/* FULL NAME */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Full name</Text>

              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={PLACEHOLDER}
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

            {/* EMAIL */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email address</Text>

              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor={PLACEHOLDER}
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

            {/* PASSWORD */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Password</Text>

              <View
                style={[
                  styles.passwordContainer,
                  errors.password && styles.inputError,
                ]}>
                <TextInput
                  placeholder="Create a password"
                  placeholderTextColor={PLACEHOLDER}
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
                  style={styles.eyeButton}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* CONFIRM PASSWORD */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Confirm password</Text>

              <View
                style={[
                  styles.passwordContainer,
                  errors.confirmPassword && styles.inputError,
                ]}>
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={PLACEHOLDER}
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
                  style={styles.eyeButton}
                  activeOpacity={0.7}>
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={20}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>

              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* SERVER ERROR MESSAGE */}

          {serverError ? (
            <View style={styles.serverErrorContainer}>
              <Ionicons name="alert-circle-outline" size={19} color={DANGER} />

              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* CREATE ACCOUNT */}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create account</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>

            <TouchableOpacity
              onPress={() => router.push("/screens/Auth/login")}
              disabled={loading}
              activeOpacity={0.7}>
              <Text style={styles.login}> Log in</Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL LOGIN */}

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
                <AntDesign name="google" size={21} color="#B03333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading}
                activeOpacity={0.7}>
                <Ionicons name="call-outline" size={21} color="#218F28" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================
   THEME
   ========================================================= */

const PRIMARY = "#FF4F9A";
const BACKGROUND = "#000000fa";
const CARD = "#19102F";
const TEXT = "#FFFFFF";
const MUTED = "#AFA7BF";
const PLACEHOLDER = "#777087";
const BORDER = "#302347";
const DANGER = "#FF647C";

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 24,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  /* HEADER */

  header: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },

  headerTitle: {
    fontFamily: "Manrope_700Bold",
    fontSize: 16,
    color: TEXT,
  },

  headerSpacer: {
    width: 40,
  },

  /* BRANDING */

  brandSection: {
    alignItems: "center",
    marginTop: 1,
    marginBottom: 27,
  },

  image: {
    width: 300,
    height: 170,
    marginBottom: 1,
  },

  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },

  /* FORM */

  form: {
    gap: 19,
  },

  fieldContainer: {
    gap: 8,
  },

  label: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: "#E8E3F0",
  },

  input: {
    height: 52,
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
  },

  /* PASSWORD INPUT */

  passwordContainer: {
    height: 52,
    backgroundColor: CARD,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: TEXT,
    paddingHorizontal: 12,
    paddingVertical: 0,
    margin: 0,
    includeFontPadding: false,
  },

  eyeButton: {
    width: 42,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },

  inputError: {
    borderColor: DANGER,
  },

  errorText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: DANGER,
    marginTop: 2,
  },

  /* SERVER ERROR */

  serverErrorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255, 100, 124, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(255, 100, 124, 0.35)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 18,
    gap: 9,
  },

  serverErrorText: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    color: DANGER,
    lineHeight: 19,
  },

  /* CREATE ACCOUNT BUTTON */

  button: {
    marginTop: 26,
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFFFFF",
    fontSize: 15,
  },

  /* LOGIN FOOTER */

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 23,
  },

  footerText: {
    fontFamily: "Manrope_400Regular",
    color: MUTED,
    fontSize: 13,
  },

  login: {
    fontFamily: "Manrope_800ExtraBold",
    color: PRIMARY,
    fontSize: 13,
  },

  /* SOCIAL SECTION */

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
    backgroundColor: BORDER,
  },

  orText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 10,
    color: MUTED,
    letterSpacing: 0.7,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 17,
    gap: 14,
  },

  socialIcon: {
    width: 48,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: CARD,
  },
});
