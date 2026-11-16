import { SIGNUP_MUTATION } from "@/graphql/mutations/outh";
import { saveToken } from "@/lib/apollo/auth";
import { gql } from "@apollo/client";
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
import { useEffect, useState } from "react";
import * as Yup from "yup";

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// ======================================================
// GRAPHQL MUTATIONS
// ======================================================

const VERIFY_SIGNUP_OTP_MUTATION = gql`
  mutation VerifySignupOTP($email: String!, $otp: String!) {
    verifySignupOTP(email: $email, otp: $otp) {
      token
      user {
        id
        fullName
        email
        username
        isEmailVerified
      }
    }
  }
`;

const RESEND_SIGNUP_OTP_MUTATION = gql`
  mutation ResendSignupOTP($email: String!) {
    resendSignupOTP(email: $email)
  }
`;

// ======================================================
// VALIDATION
// ======================================================

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

const OTP_RESEND_SECONDS = 60;

// ======================================================
// SCREEN
// ======================================================

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");

  // OTP states
  const [otpVisible, setOtpVisible] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Resend states
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");

  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [signup, { loading }] = useMutation(SIGNUP_MUTATION);

  const [verifySignupOTP] = useMutation(VERIFY_SIGNUP_OTP_MUTATION);

  const [resendSignupOTP] = useMutation(RESEND_SIGNUP_OTP_MUTATION);

  const normalizedEmail = email.trim().toLowerCase();

  // ======================================================
  // RESEND COUNTDOWN
  // ======================================================

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setTimeout(() => {
      setResendCountdown((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // ======================================================
  // ERROR HANDLER
  // ======================================================

  const getErrorMessage = (error: any) => {
    const graphQLErrors = error?.graphQLErrors || [];

    if (graphQLErrors.length > 0) {
      return graphQLErrors
        .map((item: any) => item.message)
        .filter(Boolean)
        .join("\n");
    }

    if (error?.networkError) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    return error?.message || "Something went wrong. Please try again.";
  };

  // ======================================================
  // FIELD UPDATES
  // ======================================================

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

  // ======================================================
  // FORM VALIDATION
  // ======================================================

  const validateForm = async () => {
    try {
      await signupSchema.validate(
        {
          fullName: fullName.trim(),
          email: normalizedEmail,
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

  // ======================================================
  // STEP 1: CREATE ACCOUNT AND SEND REAL OTP
  // ======================================================

  const handleSignup = async () => {
    if (loading || verifying || resending) return;

    setServerError("");

    const isValid = await validateForm();

    if (!isValid) return;

    const trimmedName = fullName.trim();
    const trimmedEmail = normalizedEmail;

    try {
      console.log("========== SIGNUP STARTED ==========");
      console.log("Signup name:", trimmedName);
      console.log("Signup email:", trimmedEmail);

      const result = await signup({
        variables: {
          fullName: trimmedName,
          email: trimmedEmail,
          password,
        },
      });

      console.log("SIGNUP RESPONSE:", result.data?.signup);

      const signupResponse = result.data?.signup;

      if (!signupResponse?.success) {
        throw new Error(
          signupResponse?.message ||
            "Unable to create your account. Please try again.",
        );
      }

      setOtp("");
      setOtpError("");
      setResendMessage("");
      setResendCountdown(OTP_RESEND_SECONDS);
      setOtpVisible(true);

      console.log("Signup successful. Verification email requested.");
    } catch (error: any) {
      console.error("SIGNUP ERROR:", error);
      console.error("GraphQL errors:", error?.graphQLErrors);
      console.error("Network error:", error?.networkError);

      setServerError(getErrorMessage(error));
    }
  };

  // ======================================================
  // STEP 2: VERIFY REAL EMAIL OTP
  // ======================================================

  const handleVerifyOtp = async () => {
    if (verifying || resending) return;

    const cleanOTP = otp.trim();

    if (cleanOTP.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!/^\d{6}$/.test(cleanOTP)) {
      setOtpError("Your verification code must contain six numbers.");
      return;
    }

    try {
      setVerifying(true);
      setOtpError("");
      setResendMessage("");

      console.log("========== OTP VERIFICATION STARTED ==========");
      console.log("Verification email:", normalizedEmail);

      const result = await verifySignupOTP({
        variables: {
          email: normalizedEmail,
          otp: cleanOTP,
        },
      });

      const authData = result.data?.verifySignupOTP;

      console.log("OTP VERIFICATION RESPONSE:", {
        hasToken: Boolean(authData?.token),
        userId: authData?.user?.id,
        emailVerified: authData?.user?.isEmailVerified,
      });

      if (!authData?.token) {
        throw new Error(
          "Verification succeeded but no authentication token was returned.",
        );
      }

      if (authData?.user?.isEmailVerified === false) {
        throw new Error("Your email has not been verified yet.");
      }

      await saveToken(authData.token);

      console.log("Authentication token saved successfully.");

      setOtpVisible(false);
      setOtp("");
      setOtpError("");
      setResendCountdown(0);

      setPassword("");
      setConfirmPassword("");

      console.log("Navigating to Interests screen.");

      router.replace("/screens/Interests/InterestsScreen");
    } catch (error: any) {
      console.error("OTP VERIFICATION ERROR:", error);
      console.error("GraphQL errors:", error?.graphQLErrors);
      console.error("Network error:", error?.networkError);

      setOtpError(getErrorMessage(error));
    } finally {
      setVerifying(false);
    }
  };

  // ======================================================
  // STEP 3: RESEND OTP
  // ======================================================

  const handleResendOtp = async () => {
    if (resending || resendCountdown > 0 || verifying) return;

    try {
      setResending(true);
      setOtpError("");
      setResendMessage("");

      console.log("========== RESENDING SIGNUP OTP ==========");
      console.log("Resending to:", normalizedEmail);

      const result = await resendSignupOTP({
        variables: {
          email: normalizedEmail,
        },
      });

      const success = result.data?.resendSignupOTP;

      console.log("RESEND OTP RESPONSE:", success);

      if (!success) {
        throw new Error(
          "The verification code could not be resent. Please try again.",
        );
      }

      setOtp("");
      setResendCountdown(OTP_RESEND_SECONDS);
      setResendMessage("A new verification code has been sent to your email.");

      console.log("New verification code requested successfully.");
    } catch (error: any) {
      console.error("RESEND OTP ERROR:", error);
      console.error("GraphQL errors:", error?.graphQLErrors);
      console.error("Network error:", error?.networkError);

      setOtpError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  // ======================================================
  // LOADING SCREEN
  // ======================================================

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}>
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
                editable={!loading && !otpVisible}
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
                editable={!loading && !otpVisible}
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
                  editable={!loading && !otpVisible}
                  returnKeyType="next"
                />

                <TouchableOpacity
                  onPress={() => setShowPassword((previous) => !previous)}
                  disabled={loading || otpVisible}
                  style={styles.eyeButton}>
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
                  editable={!loading && !otpVisible}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />

                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword((previous) => !previous)
                  }
                  disabled={loading || otpVisible}
                  style={styles.eyeButton}>
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

          {serverError ? (
            <View style={styles.serverErrorContainer}>
              <Ionicons name="alert-circle-outline" size={19} color={DANGER} />
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* SIGNUP BUTTON */}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading || otpVisible}
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
              disabled={loading || otpVisible}>
              <Text style={styles.login}> Log in</Text>
            </TouchableOpacity>
          </View>

          {/* SOCIAL BUTTONS */}

          <View style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.orText}>OR CONTINUE WITH</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading || otpVisible}>
                <AntDesign name="google" size={21} color="#B03333" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialIcon}
                disabled={loading || otpVisible}>
                <Ionicons name="call-outline" size={21} color="#218F28" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================================================
          REAL EMAIL OTP MODAL
      ================================================== */}

      <Modal
        visible={otpVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          // Keep verification open until completed.
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.otpModal}>
            <View style={styles.otpIcon}>
              <Ionicons name="mail-open-outline" size={32} color={PRIMARY} />
            </View>

            <Text style={styles.otpTitle}>Verify your email</Text>

            <Text style={styles.otpDescription}>
              We've sent a 6-digit verification code to your email address.
              Enter the code below to activate your account.
            </Text>

            <Text style={styles.otpEmail}>{normalizedEmail}</Text>

            <Text style={styles.otpLabel}>Verification code</Text>

            {/* CENTRED OTP INPUT */}

            <View
              style={[
                styles.otpInputWrapper,
                otpError && styles.otpInputError,
              ]}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#777087"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(value) => {
                  setOtp(value.replace(/\D/g, "").slice(0, 6));
                  setOtpError("");
                  setResendMessage("");
                }}
                textAlign="center"
                textAlignVertical="center"
                selectionColor={PRIMARY}
                editable={!verifying && !resending}
                returnKeyType="done"
                onSubmitEditing={handleVerifyOtp}
                autoFocus
              />
            </View>

            {otpError ? <Text style={styles.otpError}>{otpError}</Text> : null}

            {resendMessage ? (
              <View style={styles.successMessage}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={17}
                  color="#45D483"
                />
                <Text style={styles.successMessageText}>{resendMessage}</Text>
              </View>
            ) : null}

            {/* VERIFY BUTTON */}

            <TouchableOpacity
              style={[
                styles.button,
                styles.verifyButton,
                verifying && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOtp}
              disabled={verifying || resending}
              activeOpacity={0.85}>
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Verify and continue</Text>
              )}
            </TouchableOpacity>

            {/* RESEND BUTTON */}

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the email?</Text>

              <TouchableOpacity
                onPress={handleResendOtp}
                disabled={resending || verifying || resendCountdown > 0}>
                {resending ? (
                  <ActivityIndicator size="small" color={PRIMARY} />
                ) : (
                  <Text
                    style={[
                      styles.resendButton,
                      resendCountdown > 0 && styles.resendDisabled,
                    ]}>
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : "Resend code"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.expiryInfo}>
              <Ionicons name="time-outline" size={15} color={MUTED} />
              <Text style={styles.expiryText}>
                Your verification code expires after 5 minutes.
              </Text>
            </View>

            <Text style={styles.otpFooter}>
              Check your inbox or spam folder for the verification email.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ======================================================
// THEME
// ======================================================

const PRIMARY = "#FF4F9A";
const BACKGROUND = "#000000fa";
const CARD = "#19102F";
const TEXT = "#FFFFFF";
const MUTED = "#AFA7BF";
const PLACEHOLDER = "#777087";
const BORDER = "#302347";
const DANGER = "#FF647C";

// ======================================================
// STYLES
// ======================================================

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

  // OTP MODAL

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },

  otpModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#19102F",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#38234F",
    paddingHorizontal: 23,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
  },

  otpIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "rgba(255,79,154,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  otpTitle: {
    fontFamily: "Manrope_800ExtraBold",
    color: TEXT,
    fontSize: 21,
    marginBottom: 9,
    textAlign: "center",
  },

  otpDescription: {
    fontFamily: "Manrope_400Regular",
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 13,
  },

  otpEmail: {
    fontFamily: "Manrope_700Bold",
    color: PRIMARY,
    fontSize: 12,
    marginBottom: 23,
    textAlign: "center",
  },

  otpLabel: {
    alignSelf: "flex-start",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
    color: "#E8E3F0",
    marginBottom: 9,
  },

  // Wrapper ensures the input is centred within the full available width.
  otpInputWrapper: {
    width: "100%",
    height: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#0F0623",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  otpInputError: {
    borderColor: DANGER,
  },

  // Centred horizontally AND vertically.
  otpInput: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 12,
    paddingVertical: 0,
    margin: 0,
    color: TEXT,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 23,
    fontWeight: "800",
    letterSpacing: 3,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },

  otpError: {
    alignSelf: "flex-start",
    fontFamily: "Manrope_500Medium",
    color: DANGER,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 17,
  },

  successMessage: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 12,
  },

  successMessageText: {
    flex: 1,
    fontFamily: "Manrope_500Medium",
    color: "#45D483",
    fontSize: 11,
    lineHeight: 17,
  },

  verifyButton: {
    width: "100%",
    marginTop: 20,
  },

  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 20,
  },

  resendText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    color: MUTED,
  },

  resendButton: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
    color: PRIMARY,
  },

  resendDisabled: {
    color: "#898098",
  },

  expiryInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 17,
  },

  expiryText: {
    fontFamily: "Manrope_400Regular",
    fontSize: 10,
    color: MUTED,
  },

  otpFooter: {
    fontFamily: "Manrope_400Regular",
    fontSize: 10,
    color: "#898098",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 13,
  },
});
