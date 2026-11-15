import { saveToken } from "@/lib/apollo/auth";
import { gql, useMutation } from "@apollo/client";
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
   USER FRAGMENT
   ========================================================= */

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    fullName
    username
    email
    age
    bio
    profileImage
    location
    isVerified
    isOnline
    lastSeen
    followersCount
    followingCount
    likesCount
    postsCount
    interests

    appearance {
      theme
      accentColor
    }

    privacy {
      profileVisibility
      showOnlineStatus
      allowMessagesFrom
      showAge
    }

    createdAt
    updatedAt
  }
`;

/* =========================================================
   LOGIN MUTATION
   ========================================================= */

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token

      user {
        ...UserFields
      }
    }
  }

  ${USER_FRAGMENT}
`;

/* =========================================================
   TYPES
   ========================================================= */

type LoginResponse = {
  login: {
    token: string;
    user: {
      id: string;
      fullName: string;
      username: string | null;
      email: string;
      age: number | null;
      bio: string | null;
      profileImage: string | null;
      location: string | null;
      isVerified: boolean;
      isOnline: boolean;
      lastSeen: string | null;
      followersCount: number;
      followingCount: number;
      likesCount: number;
      postsCount: number;
      interests: string[];
      appearance: {
        theme: string;
        accentColor: string;
      };
      privacy: {
        profileVisibility: string;
        showOnlineStatus: boolean;
        allowMessagesFrom: string;
        showAge: boolean;
      };
      createdAt: string;
      updatedAt: string;
    };
  };
};

type LoginErrors = {
  email?: string;
  password?: string;
};

/* =========================================================
   VALIDATION
   ========================================================= */

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address.")
    .required("Email address is required."),

  password: Yup.string().required("Password is required."),
});

/* =========================================================
   LOGIN SCREEN
   ========================================================= */

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [serverError, setServerError] = useState("");

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [login, { loading }] = useMutation<LoginResponse>(LOGIN_MUTATION);

  /* =========================================================
     FIELD HANDLING
     ========================================================= */

  const handleEmailChange = (value: string) => {
    const cleanedEmail = value.replace(/\s/g, "");

    setEmail(cleanedEmail);
    setServerError("");

    if (errors.email) {
      setErrors((previous) => ({
        ...previous,
        email: undefined,
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    const cleanedPassword = value.replace(/\s/g, "");

    setPassword(cleanedPassword);
    setServerError("");

    if (errors.password) {
      setErrors((previous) => ({
        ...previous,
        password: undefined,
      }));
    }
  };

  /* =========================================================
     VALIDATE FORM
     ========================================================= */

  const validateForm = async (): Promise<boolean> => {
    try {
      await loginSchema.validate(
        {
          email: email.trim().toLowerCase(),
          password,
        },
        { abortEarly: false },
      );

      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: LoginErrors = {};

      if (error.inner) {
        error.inner.forEach((item: Yup.ValidationError) => {
          if (item.path && !validationErrors[item.path as keyof LoginErrors]) {
            validationErrors[item.path as keyof LoginErrors] = item.message;
          }
        });
      }

      setErrors(validationErrors);
      return false;
    }
  };

  /* =========================================================
     HANDLE LOGIN
     ========================================================= */

  const handleLogin = async () => {
    if (loading) return;

    setServerError("");

    const isValid = await validateForm();

    if (!isValid) return;

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("========== LOGIN STARTED ==========");
      console.log("Email:", cleanEmail);

      const { data } = await login({
        variables: {
          email: cleanEmail,
          password,
        },
      });

      console.log("LOGIN RAW RESULT:", JSON.stringify(data));

      if (!data?.login?.token) {
        setServerError(
          "Login failed. The server did not return an authentication token. Please try again.",
        );
        return;
      }

      const token = data.login.token;
      const user = data.login.user;

      await saveToken(token);

      console.log("LOGIN TOKEN SAVED");
      console.log("LOGGED IN USER:", user);

      router.replace("/tabs/Main/mainPage");
    } catch (error: any) {
      // console.error("========== LOGIN ERROR ==========");
      // console.error("LOGIN ERROR:", error);
      // console.error("MESSAGE:", error?.message);
      // console.error("GRAPHQL ERRORS:", error?.graphQLErrors);
      // console.error("NETWORK ERROR:", error?.networkError);

      let message = "Something went wrong while logging in. Please try again.";

      if (error?.graphQLErrors?.length) {
        message = error.graphQLErrors
          .map((err: any) => err.message)
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

  /* =========================================================
     FONT LOADING
     ========================================================= */

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          {/* 
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={21} color={TEXT} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Login</Text>

            <View style={styles.headerSpacer} />
          </View> */}

          {/* BRANDING */}

          <View style={styles.brandSection}>
            <Image
              source={require("../../../../assets/images/FaithConnect.png")}
              resizeMode="contain"
              style={styles.image}
            />

            <Text style={styles.subtitle}>
              Sign in to continue connecting with your community.
            </Text>
          </View>

          {/* FORM */}

          <View style={styles.form}>
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
                editable={!loading}
                style={[styles.input, errors.email && styles.inputError]}
                value={email}
                onChangeText={handleEmailChange}
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
                  placeholder="Enter your password"
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={handlePasswordChange}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
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
          </View>

          {/* SERVER ERROR MESSAGE */}

          {serverError ? (
            <View style={styles.serverErrorContainer}>
              <Ionicons name="alert-circle-outline" size={19} color={DANGER} />

              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* FORGOT PASSWORD */}

          <TouchableOpacity
            style={styles.forgot}
            disabled={loading}
            onPress={() => router.push("/screens/Auth/recoverPassword")}
            activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* SIGNUP */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>

            <TouchableOpacity
              onPress={() => router.push("/screens/Auth/signUp")}
              disabled={loading}
              activeOpacity={0.7}>
              <Text style={styles.signup}> Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL DIVIDER */}

          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />

              <Text style={styles.orText}>OR CONTINUE WITH</Text>

              <View style={styles.divider} />
            </View>

            {/* GOOGLE AND PHONE ICONS */}

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading}
                activeOpacity={0.7}
                onPress={() => console.log("Google login pressed")}>
                <AntDesign name="google" size={21} color="#B03333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading}
                activeOpacity={0.7}
                onPress={() => console.log("Phone login pressed")}>
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
    marginTop: 14,
    marginBottom: 30,
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

  /* PASSWORD */

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

  /* FORGOT PASSWORD */

  forgot: {
    alignItems: "flex-end",
    marginTop: 15,
  },

  forgotText: {
    fontFamily: "Manrope_700Bold",
    color: PRIMARY,
    fontSize: 12,
  },

  /* LOGIN BUTTON */

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

  /* SIGNUP FOOTER */

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

  signup: {
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
