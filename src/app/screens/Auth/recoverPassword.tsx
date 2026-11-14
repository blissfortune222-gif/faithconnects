import { gql, useMutation } from "@apollo/client";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import * as Yup from "yup";

import {
  ActivityIndicator,
  Alert,
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

/* =========================================================
   DEBUG HELPERS
   ========================================================= */

const DEBUG_TAG = "[RECOVER PASSWORD]";

const debugLog = (message: string, data?: unknown) => {
  console.log(`${DEBUG_TAG} ${message}`, data ?? "");
};

const debugError = (message: string, error: any) => {
  console.error(`${DEBUG_TAG} ${message}`);
  console.error("Error name:", error?.name);
  console.error("Error message:", error?.message);
  console.error("GraphQL errors:", error?.graphQLErrors);
  console.error("Network error:", error?.networkError);
  console.error("Extensions:", error?.extensions);
  console.error("Cause:", error?.cause);
  console.error("Stack:", error?.stack);
};

/* =========================================================
   GRAPHQL MUTATIONS
   ========================================================= */

const REQUEST_PASSWORD_RESET_OTP = gql`
  mutation RequestPasswordResetOTP($email: String!) {
    requestPasswordResetOTP(email: $email)
  }
`;

const VERIFY_PASSWORD_RESET_OTP = gql`
  mutation VerifyPasswordResetOTP($email: String!, $otp: String!) {
    verifyPasswordResetOTP(email: $email, otp: $otp)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetPassword($resetToken: String!, $newPassword: String!) {
    resetPassword(resetToken: $resetToken, newPassword: $newPassword)
  }
`;

/* =========================================================
   VALIDATION
   ========================================================= */

const recoverySchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address.")
    .required("Email address is required."),
});

const passwordSchema = Yup.object({
  password: Yup.string()
    .min(6, "Password must be at least 6 characters.")
    .required("Please enter your new password."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match.")
    .required("Please confirm your new password."),
});

type RecoveryErrors = {
  email?: string;
};

type ModalStep = "otp" | "password";

const RESEND_SECONDS = 60;
const LOGIN_ROUTE = "/screens/Auth/login";

/* =========================================================
   RECOVER PASSWORD SCREEN
   ========================================================= */

export default function RecoverPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<RecoveryErrors>({});

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("otp");

  // OTP state
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Password state
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Prevent duplicate submissions and navigation.
  const recoveryRequestRef = useRef(false);
  const resendRequestRef = useRef(false);
  const verifyRequestRef = useRef(false);
  const resetRequestRef = useRef(false);
  const navigationStartedRef = useRef(false);

  /* =========================================================
     COMPONENT LIFECYCLE
     ========================================================= */

  useEffect(() => {
    debugLog("Screen mounted.");

    return () => {
      debugLog("Screen unmounted.");
    };
  }, []);

  useEffect(() => {
    debugLog("Email state changed:", {
      emailEntered: Boolean(email),
      emailLength: email.length,
    });
  }, [email]);

  useEffect(() => {
    debugLog("Modal state changed:", {
      modalVisible,
      modalStep,
    });
  }, [modalVisible, modalStep]);

  useEffect(() => {
    debugLog("OTP state changed:", {
      otpLength: otp.length,
      isSixDigits: /^\d{6}$/.test(otp),
    });
  }, [otp]);

  useEffect(() => {
    debugLog("Resend countdown:", resendTimer);
  }, [resendTimer]);

  useEffect(() => {
    debugLog("Password form state changed:", {
      newPasswordEntered: Boolean(newPassword),
      newPasswordLength: newPassword.length,
      confirmPasswordEntered: Boolean(confirmPassword),
      passwordsMatch: Boolean(newPassword) && newPassword === confirmPassword,
      resetTokenAvailable: Boolean(resetToken),
    });
  }, [newPassword, confirmPassword, resetToken]);

  /* =========================================================
     FONT LOADING
     ========================================================= */

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    debugLog("Font loading status:", {
      fontsLoaded,
      fontError: fontError?.message ?? null,
    });
  }, [fontsLoaded, fontError]);

  /* =========================================================
     APOLLO MUTATIONS
     ========================================================= */

  const [requestOTP, requestOTPResult] = useMutation(
    REQUEST_PASSWORD_RESET_OTP,
  );

  const [verifyOTP, verifyOTPResult] = useMutation(VERIFY_PASSWORD_RESET_OTP);

  const [resetPassword, resetPasswordResult] = useMutation(RESET_PASSWORD);

  const requestingOTP = requestOTPResult.loading;
  const verifyingOTP = verifyOTPResult.loading;
  const resettingPassword = resetPasswordResult.loading;

  const isLoading = requestingOTP || verifyingOTP || resettingPassword;

  useEffect(() => {
    debugLog("Request OTP mutation state:", {
      loading: requestOTPResult.loading,
      called: requestOTPResult.called,
      hasData: Boolean(requestOTPResult.data),
      error: requestOTPResult.error?.message ?? null,
    });
  }, [
    requestOTPResult.loading,
    requestOTPResult.called,
    requestOTPResult.data,
    requestOTPResult.error,
  ]);

  useEffect(() => {
    debugLog("Verify OTP mutation state:", {
      loading: verifyOTPResult.loading,
      called: verifyOTPResult.called,
      hasData: Boolean(verifyOTPResult.data),
      error: verifyOTPResult.error?.message ?? null,
    });
  }, [
    verifyOTPResult.loading,
    verifyOTPResult.called,
    verifyOTPResult.data,
    verifyOTPResult.error,
  ]);

  useEffect(() => {
    debugLog("Reset password mutation state:", {
      loading: resetPasswordResult.loading,
      called: resetPasswordResult.called,
      hasData: Boolean(resetPasswordResult.data),
      error: resetPasswordResult.error?.message ?? null,
    });
  }, [
    resetPasswordResult.loading,
    resetPasswordResult.called,
    resetPasswordResult.data,
    resetPasswordResult.error,
  ]);

  /* =========================================================
     RESEND COUNTDOWN
     ========================================================= */

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setTimeout(() => {
      setResendTimer((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendTimer]);

  /* =========================================================
     FIELD HANDLING
     ========================================================= */

  const handleEmailChange = (value: string) => {
    const cleanedEmail = value.replace(/\s/g, "");

    setEmail(cleanedEmail);

    if (errors.email) {
      setErrors({});
    }
  };

  const handleOTPChange = (value: string) => {
    const cleanedOTP = value.replace(/\D/g, "").slice(0, 6);

    setOtp(cleanedOTP);
    setOtpError("");
  };

  /* =========================================================
     EMAIL VALIDATION
     ========================================================= */

  const validateForm = async (): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();

    debugLog("Validating recovery email:", {
      emailEntered: Boolean(normalizedEmail),
      emailLength: normalizedEmail.length,
    });

    try {
      await recoverySchema.validate(
        { email: normalizedEmail },
        { abortEarly: false },
      );

      setErrors({});
      debugLog("Email validation passed.");

      return true;
    } catch (error: unknown) {
      const validationErrors: RecoveryErrors = {};

      if (error instanceof Yup.ValidationError) {
        error.inner.forEach((item) => {
          if (item.path === "email" && !validationErrors.email) {
            validationErrors.email = item.message;
          }
        });

        if (!validationErrors.email) {
          validationErrors.email = error.message;
        }
      } else {
        debugError("Unexpected email validation error", error);
        validationErrors.email = "Please enter a valid email address.";
      }

      setErrors(validationErrors);

      debugLog("Email validation failed:", validationErrors);

      return false;
    }
  };

  /* =========================================================
     REQUEST OTP
     ========================================================= */

  const handleRecovery = async () => {
    if (recoveryRequestRef.current || requestingOTP) {
      debugLog("OTP request ignored: request already in progress.");
      return;
    }

    recoveryRequestRef.current = true;

    console.log("\n========== REQUEST PASSWORD RESET OTP ==========");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const isValid = await validateForm();

      if (!isValid) {
        debugLog("OTP request stopped because email is invalid.");
        return;
      }

      debugLog("Sending requestPasswordResetOTP mutation.");

      const response = await requestOTP({
        variables: {
          email: normalizedEmail,
        },
      });

      const requestResult = response.data?.requestPasswordResetOTP;

      debugLog("OTP request response:", {
        success: requestResult === true,
      });

      if (requestResult !== true) {
        Alert.alert("Unable to process request", "Please try again later.");
        return;
      }

      setOtp("");
      setOtpError("");
      setModalStep("otp");
      setModalVisible(true);
      setResendTimer(RESEND_SECONDS);

      debugLog("OTP modal opened successfully.");

      console.log("========== OTP REQUEST FINISHED ==========\n");
    } catch (error: any) {
      debugError("REQUEST OTP MUTATION FAILED", error);

      Alert.alert(
        "Unable to send code",
        error?.graphQLErrors?.[0]?.message ||
          error?.networkError?.message ||
          error?.message ||
          "Please try again later.",
      );
    } finally {
      recoveryRequestRef.current = false;
    }
  };

  /* =========================================================
     RESEND OTP
     ========================================================= */

  const handleResendOTP = async () => {
    if (resendTimer > 0 || resendRequestRef.current || requestingOTP) {
      return;
    }

    resendRequestRef.current = true;

    console.log("\n========== RESEND OTP STARTED ==========");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        setOtpError("Your email address is missing. Please start again.");
        return;
      }

      const response = await requestOTP({
        variables: {
          email: normalizedEmail,
        },
      });

      const requestResult = response.data?.requestPasswordResetOTP;

      if (requestResult !== true) {
        debugLog("Resend request was not accepted.");
        return;
      }

      setOtp("");
      setOtpError("");
      setResendTimer(RESEND_SECONDS);

      Alert.alert(
        "Request submitted",
        "If your account is registered with this email, a new verification code will be sent.",
      );

      debugLog("OTP resend completed.");
    } catch (error: any) {
      debugError("RESEND OTP FAILED", error);

      Alert.alert(
        "Unable to resend code",
        error?.graphQLErrors?.[0]?.message ||
          error?.networkError?.message ||
          error?.message ||
          "Please try again later.",
      );
    } finally {
      resendRequestRef.current = false;
    }
  };

  /* =========================================================
     VERIFY OTP
     ========================================================= */

  const handleVerifyOTP = async () => {
    if (verifyRequestRef.current || verifyingOTP) {
      return;
    }

    verifyRequestRef.current = true;

    console.log("\n========== VERIFY PASSWORD RESET OTP ==========");

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Please enter the complete 6-digit code.");
      verifyRequestRef.current = false;
      return;
    }

    try {
      debugLog("Sending OTP verification request.");

      const response = await verifyOTP({
        variables: {
          email: normalizedEmail,
          otp,
        },
      });

      const token = response.data?.verifyPasswordResetOTP;

      debugLog("OTP verification response:", {
        tokenReturned: Boolean(token),
        tokenLength: typeof token === "string" ? token.length : 0,
      });

      if (!token || typeof token !== "string") {
        setOtpError("Unable to verify your code. Please try again.");
        return;
      }

      setResetToken(token);
      setOtpError("");
      setModalStep("password");

      debugLog("OTP verified. Password creation step opened.");

      console.log("========== OTP VERIFICATION SUCCESS ==========\n");
    } catch (error: any) {
      debugError("OTP VERIFICATION FAILED", error);

      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Incorrect or expired verification code.";

      setOtpError(message);
    } finally {
      verifyRequestRef.current = false;
    }
  };

  /* =========================================================
     NAVIGATE TO LOGIN
     ========================================================= */

  const navigateToLogin = () => {
    if (navigationStartedRef.current) {
      return;
    }

    navigationStartedRef.current = true;

    debugLog("Password reset confirmed. Navigating to login screen.");

    // Close the modal and replace the recovery screen.
    setModalVisible(false);

    router.replace(LOGIN_ROUTE as any);
  };

  /* =========================================================
     RESET PASSWORD
     ========================================================= */

  const handleResetPassword = async () => {
    if (resetRequestRef.current || resettingPassword) {
      debugLog("Password reset ignored: request already in progress.");
      return;
    }

    resetRequestRef.current = true;

    console.log("\n========== RESET PASSWORD STARTED ==========");

    setPasswordError("");

    try {
      await passwordSchema.validate(
        {
          password: newPassword,
          confirmPassword,
        },
        { abortEarly: false },
      );

      debugLog("New password validation passed.");

      if (!resetToken) {
        setPasswordError(
          "Your reset session has expired. Please request a new code.",
        );
        return;
      }

      debugLog("Sending resetPassword mutation.");

      const response = await resetPassword({
        variables: {
          resetToken,
          newPassword,
        },
      });

      const resetResult = response.data?.resetPassword;

      debugLog("Backend password reset result:", resetResult);

      if (resetResult !== true) {
        setPasswordError("Unable to reset your password. Please try again.");
        return;
      }

      /*
       * IMPORTANT:
       * The backend has confirmed the password was changed.
       * Navigate immediately. Do not wait for Alert.alert()
       * or require the user to press another button.
       */

      debugLog("Password successfully updated on backend.");

      // Clear sensitive recovery state.
      setOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpError("");
      setPasswordError("");
      setResendTimer(0);
      setShowPassword(false);
      setShowConfirmPassword(false);

      console.log("========== PASSWORD RESET SUCCESS ==========\n");

      navigateToLogin();
    } catch (error: any) {
      debugError("RESET PASSWORD MUTATION FAILED", error);

      const message =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message ||
        "Unable to reset your password. Please try again.";

      setPasswordError(message);

      console.log("========== PASSWORD RESET FAILED ==========\n");
    } finally {
      resetRequestRef.current = false;
    }
  };

  /* =========================================================
     CLOSE MODAL
     ========================================================= */

  const closeModal = () => {
    if (isLoading) {
      debugLog("Cannot close modal while a request is running.");
      return;
    }

    setModalVisible(false);
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpError("");
    setPasswordError("");
    setModalStep("otp");
    setShowPassword(false);
    setShowConfirmPassword(false);

    debugLog("Recovery modal closed.");
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

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={21} color={TEXT} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Recover Password</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* BRANDING */}

          <View style={styles.brandSection}>
            <Image
              source={require("../../../../assets/images/FaithConnect.png")}
              resizeMode="contain"
              style={styles.image}
              onError={(event) =>
                console.error(
                  "[RECOVER PASSWORD] Image loading failed:",
                  event.nativeEvent,
                )
              }
            />
          </View>

          {/* FORM */}

          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email address</Text>

              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                ]}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={MUTED}
                  style={styles.inputIcon}
                />

                <TextInput
                  placeholder="Enter your registered email"
                  placeholderTextColor={PLACEHOLDER}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  spellCheck={false}
                  style={styles.input}
                  value={email}
                  onChangeText={handleEmailChange}
                  returnKeyType="done"
                  onSubmitEditing={handleRecovery}
                />
              </View>

              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            {/* INFORMATION */}

            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color={PRIMARY}
              />

              <Text style={styles.infoText}>
                Enter the email address associated with your FaithConnect
                account. We will send you a verification code to reset your
                password.
              </Text>
            </View>
          </View>

          {/* RECOVERY BUTTON */}

          <TouchableOpacity
            style={[styles.button, requestingOTP && styles.buttonDisabled]}
            onPress={handleRecovery}
            activeOpacity={0.85}
            disabled={requestingOTP}>
            {requestingOTP ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered your password?</Text>

            <TouchableOpacity
              onPress={() => router.replace(LOGIN_ROUTE as any)}
              activeOpacity={0.7}>
              <Text style={styles.loginText}> Login</Text>
            </TouchableOpacity>
          </View>

          {/* BOTTOM BRANDING */}

          <View style={styles.bottomBrand}>
            <View style={styles.bottomDivider} />
            <Text style={styles.bottomText}>Faith. Love. Purpose.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* =====================================================
          OTP & PASSWORD RESET MODAL
         ===================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            {/* MODAL HEADER */}

            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name={
                    modalStep === "otp" ? "mail-outline" : "lock-closed-outline"
                  }
                  size={25}
                  color={PRIMARY}
                />
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                disabled={isLoading}>
                <Ionicons name="close" size={22} color={MUTED} />
              </TouchableOpacity>
            </View>

            {modalStep === "otp" ? (
              <>
                <Text style={styles.modalTitle}>Verify your email</Text>

                <Text style={styles.modalDescription}>
                  We've sent a 6-digit verification code to
                </Text>

                <Text style={styles.modalEmail}>{email}</Text>

                {/* OTP INPUT */}

                <View style={styles.modalField}>
                  <Text style={styles.label}>Verification code</Text>

                  <TextInput
                    value={otp}
                    onChangeText={handleOTPChange}
                    placeholder="000000"
                    placeholderTextColor={PLACEHOLDER}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    style={[
                      styles.otpInput,
                      otpError ? styles.inputError : null,
                    ]}
                  />

                  {otpError ? (
                    <Text style={styles.errorText}>{otpError}</Text>
                  ) : null}
                </View>

                {/* RESEND */}

                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>
                    Didn't receive the code?
                  </Text>

                  <TouchableOpacity
                    onPress={handleResendOTP}
                    disabled={resendTimer > 0 || requestingOTP}>
                    <Text
                      style={[
                        styles.resendLink,
                        (resendTimer > 0 || requestingOTP) &&
                          styles.disabledText,
                      ]}>
                      {requestingOTP
                        ? "Sending..."
                        : resendTimer > 0
                          ? `Resend in ${resendTimer}s`
                          : "Resend code"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* VERIFY BUTTON */}

                <TouchableOpacity
                  style={[styles.button, verifyingOTP && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={verifyingOTP}
                  activeOpacity={0.85}>
                  {verifyingOTP ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Verify code</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>Create new password</Text>

                <Text style={styles.modalDescription}>
                  Your email has been verified. Choose a strong new password for
                  your FaithConnect account.
                </Text>

                {/* NEW PASSWORD */}

                <View style={styles.modalField}>
                  <Text style={styles.label}>New password</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={19}
                      color={MUTED}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      value={newPassword}
                      onChangeText={(value) => {
                        setNewPassword(value);
                        setPasswordError("");
                      }}
                      placeholder="Enter new password"
                      placeholderTextColor={PLACEHOLDER}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={MUTED}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* CONFIRM PASSWORD */}

                <View style={styles.modalField}>
                  <Text style={styles.label}>Confirm new password</Text>

                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={19}
                      color={MUTED}
                      style={styles.inputIcon}
                    />

                    <TextInput
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setPasswordError("");
                      }}
                      placeholder="Confirm new password"
                      placeholderTextColor={PLACEHOLDER}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      style={styles.input}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }>
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={MUTED}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}

                <View style={styles.passwordInfo}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={PRIMARY}
                  />

                  <Text style={styles.passwordInfoText}>
                    Your password must contain at least 6 characters.
                  </Text>
                </View>

                {/* RESET BUTTON */}

                <TouchableOpacity
                  style={[
                    styles.button,
                    resettingPassword && styles.buttonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={resettingPassword}
                  activeOpacity={0.85}>
                  {resettingPassword ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Reset password</Text>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.modalFooter}>
              FaithConnect · Faith. Love. Purpose.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingBottom: 35,
  },

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

  brandSection: {
    alignItems: "center",
    marginTop: 25,
    marginBottom: 38,
  },

  image: {
    width: 300,
    height: 170,
    marginBottom: 1,
  },

  form: {
    gap: 10,
  },

  fieldContainer: {
    gap: 9,
  },

  label: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: "#E8E3F0",
  },

  inputContainer: {
    height: 52,
    backgroundColor: CARD,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 11,
  },

  input: {
    flex: 1,
    height: "100%",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    color: TEXT,
    paddingVertical: 0,
    includeFontPadding: false,
  },

  inputError: {
    borderColor: DANGER,
  },

  errorText: {
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    color: DANGER,
    marginTop: 5,
  },

  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 13,
  },

  infoText: {
    flex: 1,
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
    lineHeight: 19,
    color: MUTED,
  },

  button: {
    marginTop: 30,
    height: 52,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
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
    marginTop: 25,
  },

  footerText: {
    fontFamily: "Manrope_400Regular",
    color: MUTED,
    fontSize: 13,
  },

  loginText: {
    fontFamily: "Manrope_800ExtraBold",
    color: PRIMARY,
    fontSize: 13,
  },

  bottomBrand: {
    marginTop: "auto",
    paddingTop: 55,
    alignItems: "center",
  },

  bottomDivider: {
    width: 45,
    height: 3,
    borderRadius: 5,
    backgroundColor: PRIMARY,
    marginBottom: 12,
  },

  bottomText: {
    fontFamily: "Manrope_600SemiBold",
    color: MUTED,
    fontSize: 11,
    letterSpacing: 1.2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  modalCard: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#130B25",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 23,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(255,79,154,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
  },

  modalTitle: {
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 21,
    color: TEXT,
    marginBottom: 9,
  },

  modalDescription: {
    fontFamily: "Manrope_400Regular",
    fontSize: 12,
    lineHeight: 20,
    color: MUTED,
  },

  modalEmail: {
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    color: PRIMARY,
    marginTop: 5,
    marginBottom: 24,
  },

  modalField: {
    marginTop: 17,
    gap: 9,
  },

  otpInput: {
    height: 58,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: TEXT,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 25,
    letterSpacing: 12,
    textAlign: "center",
    paddingLeft: 12,
  },

  resendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 20,
  },

  resendText: {
    color: MUTED,
    fontFamily: "Manrope_400Regular",
    fontSize: 11,
  },

  resendLink: {
    color: PRIMARY,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
  },

  disabledText: {
    color: PLACEHOLDER,
  },

  passwordInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
  },

  passwordInfoText: {
    flex: 1,
    color: MUTED,
    fontFamily: "Manrope_400Regular",
    fontSize: 10,
    lineHeight: 16,
  },

  modalFooter: {
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
    color: PLACEHOLDER,
    textAlign: "center",
    marginTop: 25,
  },
});
