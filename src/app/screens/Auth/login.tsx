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
import { router } from "expo-router";
import { useState } from "react";
import * as Yup from "yup";

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

import { Ionicons } from "@expo/vector-icons";
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
   YUP VALIDATION
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

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [login, { loading }] = useMutation<LoginResponse>(LOGIN_MUTATION);

  /* =======================================================
     FIELD HANDLING
     ======================================================= */

  const handleEmailChange = (value: string) => {
    const cleanedEmail = value.replace(/\s/g, "");

    setEmail(cleanedEmail);

    if (errors.email) {
      setErrors((prev) => ({
        ...prev,
        email: undefined,
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    const cleanedPassword = value.replace(/\s/g, "");

    setPassword(cleanedPassword);

    if (errors.password) {
      setErrors((prev) => ({
        ...prev,
        password: undefined,
      }));
    }
  };

  /* =======================================================
     VALIDATE FORM
     ======================================================= */

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

  /* =======================================================
     HANDLE LOGIN
     ======================================================= */

  const handleLogin = async () => {
    if (loading) return;

    const isValid = await validateForm();

    if (!isValid) return;

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log("LOGIN STARTED");
      console.log("Email:", cleanEmail);

      const { data } = await login({
        variables: {
          email: cleanEmail,
          password,
        },
      });

      console.log("LOGIN RAW RESULT:", JSON.stringify(data));

      if (!data?.login?.token) {
        Alert.alert(
          "Login Failed",
          "The server did not return an authentication token.",
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
      console.error("LOGIN ERROR:", error);

      let message = "Something went wrong while logging in.";

      if (error?.graphQLErrors?.length) {
        message = error.graphQLErrors.map((err: any) => err.message).join("\n");
      } else if (error?.networkError) {
        message =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Login Failed", message);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={loading}
              style={styles.backButton}>
              <Ionicons name="arrow-back" size={25} color={PURPLE} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Welcome Back</Text>

            <View style={styles.headerSpacer} />
          </View>
          {/* LOGO */}

          <Image
            source={require("../../../../assets/images/appLogo.png")}
            resizeMode="contain"
            style={styles.image}
          />

          <Text style={styles.subtitle}>
            Sign in to continue connecting with your community.
          </Text>

          {/* FORM */}

          <View style={styles.form}>
            {/* EMAIL */}

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                placeholder="Enter your email address"
                placeholderTextColor="#A0A0AA"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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
                  placeholderTextColor="#A0A0AA"
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
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  style={styles.showButton}>
                  <Text style={styles.showText}>
                    {showPassword ? "Hide" : "Show"}
                  </Text>
                </TouchableOpacity>
              </View>

              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
          </View>

          {/* FORGOT PASSWORD */}

          <TouchableOpacity
            style={styles.forgot}
            disabled={loading}
            onPress={() => {
              console.log("Forgot password pressed");
            }}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* LOGIN BUTTON */}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* SIGNUP */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>

            <TouchableOpacity
              onPress={() => router.push("/screens/Auth/signUp")}
              disabled={loading}>
              <Text style={styles.signup}> Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* DIVIDER */}

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />

            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>

            <View style={styles.divider} />
          </View>

          {/* TEXT-ONLY SOCIAL OPTIONS */}

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              disabled={loading}
              onPress={() => console.log("Google login pressed")}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              disabled={loading}
              onPress={() => console.log("Phone login pressed")}>
              <Text style={styles.socialButtonText}>Phone</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================
   COLORS
   ========================================================= */

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingBottom: 35,
  },

  header: {
    marginTop: 17,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    width: 45,
    height: 40,
    justifyContent: "center",
  },

  backText: {
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
    color: PURPLE,
  },

  headerTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 21,
    color: "#222222",
    letterSpacing: -0.6,
  },

  headerSpacer: {
    width: 45,
  },

  image: {
    width: "100%",
    height: 220,
    marginTop: 15,
    marginBottom: 5,
  },

  subtitle: {
    fontFamily: "Manrope_400Regular",
    fontSize: 13,
    color: "#85858F",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },

  form: {
    gap: 20,
  },

  fieldContainer: {
    gap: 9,
  },

  label: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: "#30303A",
  },

  input: {
    height: 57,
    backgroundColor: "#F7F7FA",
    borderRadius: 14,
    paddingHorizontal: 17,
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#222222",
    borderWidth: 1,
    borderColor: "#EEEEF2",
  },

  passwordContainer: {
    height: 57,
    backgroundColor: "#F7F7FA",
    borderRadius: 14,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEF2",
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: "#222222",
  },

  showButton: {
    paddingVertical: 10,
    paddingLeft: 12,
  },

  showText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: PURPLE,
  },

  inputError: {
    borderColor: "#E53935",
  },

  errorText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: "#E53935",
    marginTop: 1,
  },

  forgot: {
    alignItems: "flex-end",
    marginTop: 16,
  },

  forgotText: {
    fontFamily: "Manrope_700Bold",
    color: PRIMARY,
    fontSize: 12,
  },

  button: {
    marginTop: 27,
    height: 56,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontFamily: "Manrope_800ExtraBold",
    color: "#FFFFFF",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 27,
  },

  footerText: {
    fontFamily: "Manrope_400Regular",
    color: "#777780",
    fontSize: 13,
  },

  signup: {
    fontFamily: "Manrope_800ExtraBold",
    color: PRIMARY,
    fontSize: 13,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 34,
    gap: 13,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#EEEEF2",
  },

  dividerText: {
    fontFamily: "Manrope_700Bold",
    color: "#9999A2",
    fontSize: 10,
    letterSpacing: 1,
  },

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 23,
    gap: 14,
  },

  socialButton: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8E8EF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  socialButtonText: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: "#454550",
  },
});
