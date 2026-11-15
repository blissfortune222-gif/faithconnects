import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Yup from "yup";

/* =========================================================
   GRAPHQL
   ========================================================= */

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      username
      age
      bio
      location
      profileImage
      interests
      isVerified
      updatedAt
    }
  }
`;

/* =========================================================
   CONFIGURATION
   ========================================================= */

const COLORS = {
  background: "#0F0623",
  card: "#19102F",
  cardLight: "#21153A",
  primary: "#FF4F9A",
  purple: "#8B5CF6",
  white: "#FFFFFF",
  text: "#F8F4FF",
  muted: "#A99DBD",
  border: "rgba(255,255,255,0.08)",
};

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_UPLOAD_PRESET =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const INTERESTS = [
  "Music",
  "Sports",
  "Gaming",
  "Travel",
  "Food",
  "Movies",
  "Fashion",
  "Technology",
  "Photography",
  "Fitness",
  "Art",
  "Business",
  "Reading",
  "Cooking",
  "Nature",
  "Animals",
  "Dance",
  "Writing",
  "Relationships",
  "Spirituality",
  "Education",
  "Outdoor Activities",
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Republic of the Congo",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* =========================================================
   YUP VALIDATION
   ========================================================= */

const profileValidationSchema = Yup.object({
  username: Yup.string()
    .trim()
    .lowercase()
    .min(3, "Username must contain at least 3 characters.")
    .max(30, "Username cannot exceed 30 characters.")
    .matches(
      /^[a-z0-9_.]+$/,
      "Username can only contain lowercase letters, numbers, underscores and periods.",
    )
    .required("Please enter a username."),

  age: Yup.number()
    .typeError("Please select your date of birth.")
    .integer("Age must be a whole number.")
    .min(13, "You must be at least 13 years old.")
    .max(120, "Please enter a valid date of birth.")
    .required("Please select your date of birth."),

  location: Yup.string().trim().required("Please select your country."),

  bio: Yup.string()
    .max(160, "Your bio cannot exceed 160 characters.")
    .test(
      "plain-text-only",
      "Your bio must contain text only, not image data or URLs.",
      (value) => {
        if (!value) return true;

        return !(
          /^blob:/i.test(value.trim()) ||
          /^data:image\//i.test(value.trim()) ||
          /res\.cloudinary\.com/i.test(value) ||
          /image\/(png|jpeg|jpg|webp|gif)/i.test(value)
        );
      },
    )
    .defined(),

  interests: Yup.array()
    .of(Yup.string().required())
    .min(3, "Please select at least 3 interests.")
    .required("Please select your interests."),
});

/* =========================================================
   HELPERS
   ========================================================= */

const calculateAge = (birthDate: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const isSameDate = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear() &&
  first.getMonth() === second.getMonth() &&
  first.getDate() === second.getDate();

const sanitizeBio = (value: unknown): string => {
  if (typeof value !== "string") {
    throw new Error("Your bio must contain text only.");
  }

  const cleaned = value.trim();

  const looksLikeImage =
    /^blob:/i.test(cleaned) ||
    /^data:image\//i.test(cleaned) ||
    /res\.cloudinary\.com/i.test(cleaned) ||
    /image\/(png|jpeg|jpg|webp|gif)/i.test(cleaned) ||
    /"uri"\s*:\s*"(blob:|data:image)/i.test(cleaned);

  if (looksLikeImage) {
    console.error(
      "[BIO VALIDATION] Image data detected:",
      cleaned.slice(0, 150),
    );

    throw new Error(
      "Image data was detected in your bio. Please enter text only.",
    );
  }

  return cleaned;
};

const isValidCloudinaryUrl = (value: unknown): value is string => {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === "web") {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

/* =========================================================
   CLOUDINARY UPLOAD
   ========================================================= */

const uploadProfileImage = async (uri: string): Promise<string> => {
  console.log("[CLOUDINARY] Starting upload.");
  console.log("[CLOUDINARY] Platform:", Platform.OS);

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured. Check your Expo environment variables.",
    );
  }

  if (uri.startsWith("https://") && uri.includes("res.cloudinary.com/")) {
    console.log("[CLOUDINARY] Existing Cloudinary URL detected.");
    return uri;
  }

  const formData = new FormData();

  if (Platform.OS === "web") {
    const imageResponse = await fetch(uri);

    if (!imageResponse.ok) {
      throw new Error("Could not read the selected profile image.");
    }

    const blob = await imageResponse.blob();

    console.log("[CLOUDINARY] Web image blob:", {
      type: blob.type,
      size: blob.size,
    });

    formData.append("file", blob, "profile-image.jpg");
  } else {
    formData.append("file", {
      uri,
      name: "profile-image.jpg",
      type: "image/jpeg",
    } as any);
  }

  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  console.log("[CLOUDINARY] Uploading image...");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const result = await response.json();

  console.log("[CLOUDINARY] HTTP status:", response.status);
  console.log("[CLOUDINARY] Response:", result);

  if (!response.ok || !result?.secure_url) {
    throw new Error(result?.error?.message || "Profile image upload failed.");
  }

  if (!isValidCloudinaryUrl(result.secure_url)) {
    throw new Error("Cloudinary returned an invalid image URL.");
  }

  console.log("[CLOUDINARY] Upload successful:", result.secure_url);

  return result.secure_url;
};

/* =========================================================
   SCREEN
   ========================================================= */

export default function InterestScreen() {
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);

  const [calendarDate, setCalendarDate] = useState(new Date(2000, 0, 1));

  const [yearInput, setYearInput] = useState("2000");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [country, setCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // Inline Yup errors for individual fields.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Bio and image intentionally have separate states and refs.
  const [bio, setBio] = useState("");
  const bioRef = useRef("");

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileImageRef = useRef<string | null>(null);

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  /* =======================================================
     CLEAR FIELD ERROR
     ======================================================= */

  const clearFieldError = (field: string) => {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;

      const updated = { ...previous };
      delete updated[field];

      return updated;
    });
  };

  /* =======================================================
     BIO HANDLER
     ======================================================= */

  const handleBioChange = (value: string) => {
    console.log("[BIO INPUT] Received:", value);

    const trimmedValue = value.trim();

    const isImageData =
      /^blob:/i.test(trimmedValue) ||
      /^data:image\//i.test(trimmedValue) ||
      /res\.cloudinary\.com/i.test(trimmedValue) ||
      /image\/(png|jpeg|jpg|webp|gif)/i.test(trimmedValue);

    if (isImageData) {
      console.error("[BIO INPUT] Image data rejected:", value);
      return;
    }

    bioRef.current = value;
    setBio(value);
    clearFieldError("bio");

    console.log("[BIO INPUT] Updated bio:", value);
  };

  /* =======================================================
     PROFILE IMAGE HANDLER
     ======================================================= */

  const handleProfileImageChange = (uri: string) => {
    console.log("[IMAGE] Updating profile image:", uri);

    profileImageRef.current = uri;
    setProfileImage(uri);

    console.log("[IMAGE] Profile image updated.");
    console.log("[IMAGE] Bio remains:", bioRef.current);
  };

  /* =======================================================
     GRAPHQL
     ======================================================= */

  const [updateProfile, { loading: saving }] = useMutation(
    UPDATE_PROFILE_MUTATION,
    {
      onCompleted: (data) => {
        console.log("========== GRAPHQL SUCCESS ==========");
        console.log("[GRAPHQL] Returned data:", data);
        console.log("[GRAPHQL] Updated user:", data?.updateProfile);
        console.log("[GRAPHQL] Returned ID:", data?.updateProfile?.id);
        console.log(
          "[GRAPHQL] Returned username:",
          data?.updateProfile?.username,
        );
        console.log("[GRAPHQL] Returned age:", data?.updateProfile?.age);
        console.log("[GRAPHQL] Returned bio:", data?.updateProfile?.bio);
        console.log(
          "[GRAPHQL] Returned location:",
          data?.updateProfile?.location,
        );
        console.log(
          "[GRAPHQL] Returned image:",
          data?.updateProfile?.profileImage,
        );
        console.log(
          "[GRAPHQL] Returned interests:",
          data?.updateProfile?.interests,
        );
        console.log("=====================================");
      },
      onError: (error) => {
        console.error("========== GRAPHQL ERROR ==========");
        console.error("[GRAPHQL] Message:", error.message);
        console.error("[GRAPHQL] Network error:", error.networkError);
        console.error("[GRAPHQL] GraphQL errors:", error.graphQLErrors);
        console.error("[GRAPHQL] Full error:", error);
        console.error("===================================");
      },
    },
  );

  const age = useMemo(
    () => (dateOfBirth ? calculateAge(dateOfBirth) : null),
    [dateOfBirth],
  );

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return COUNTRIES;

    return COUNTRIES.filter((item) => item.toLowerCase().includes(search));
  }, [countrySearch]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    return [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
    ];
  }, [calendarDate]);

  /* =======================================================
     IMAGE PICKER
     ======================================================= */

  const pickProfileImage = async () => {
    try {
      console.log("[IMAGE PICKER] Opening picker.");

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      console.log("[IMAGE PICKER] Permission:", permission);

      if (!permission.granted) {
        showMessage(
          "Permission required",
          "Please allow access to your photos to select a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log("[IMAGE PICKER] Result:", {
        canceled: result.canceled,
        assetCount: result.assets?.length || 0,
      });

      if (result.canceled || !result.assets?.[0]?.uri) {
        console.log("[IMAGE PICKER] Selection cancelled.");
        return;
      }

      const selectedImage = result.assets[0];

      handleProfileImageChange(selectedImage.uri);

      console.log("[IMAGE PICKER] Selected image:", {
        uri: selectedImage.uri,
        width: selectedImage.width,
        height: selectedImage.height,
        mimeType: selectedImage.mimeType,
        fileName: selectedImage.fileName,
      });

      console.log("[IMAGE PICKER] Bio remains:", bioRef.current);
    } catch (error) {
      console.error("[IMAGE PICKER] Error:", error);
      showMessage("Error", "Unable to select an image.");
    }
  };

  /* =======================================================
     DATE PICKER
     ======================================================= */

  const openDatePicker = () => {
    Keyboard.dismiss();

    const initialDate = dateOfBirth || new Date(2000, 0, 1);

    setCalendarDate(
      new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
    );

    setYearInput(String(initialDate.getFullYear()));
    setShowDatePicker(true);

    console.log("[DATE PICKER] Opened.");
  };

  const changeMonth = (direction: number) => {
    setCalendarDate((previous) => {
      const next = new Date(
        previous.getFullYear(),
        previous.getMonth() + direction,
        1,
      );

      const today = new Date();

      if (
        next.getFullYear() > today.getFullYear() ||
        (next.getFullYear() === today.getFullYear() &&
          next.getMonth() > today.getMonth())
      ) {
        return previous;
      }

      setYearInput(String(next.getFullYear()));

      console.log("[DATE PICKER] Month:", {
        month: MONTHS[next.getMonth()],
        year: next.getFullYear(),
      });

      return next;
    });
  };

  const handleYearChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 4);

    setYearInput(digits);

    if (digits.length !== 4) return;

    const year = Number(digits);
    const currentYear = new Date().getFullYear();

    if (year < 1900 || year > currentYear) {
      console.log("[DATE PICKER] Invalid year:", year);
      return;
    }

    setCalendarDate((previous) => {
      const lastDay = new Date(year, previous.getMonth() + 1, 0).getDate();

      return new Date(
        year,
        previous.getMonth(),
        Math.min(previous.getDate(), lastDay),
      );
    });

    console.log("[DATE PICKER] Selected year:", year);
  };

  const selectBirthDate = (day: number) => {
    const selectedDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      day,
    );

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      console.warn("[DATE PICKER] Future date rejected.");
      return;
    }

    setDateOfBirth(selectedDate);
    setShowDatePicker(false);
    clearFieldError("age");

    console.log("[DATE PICKER] Selected:", selectedDate);
    console.log("[DATE PICKER] Formatted:", formatDate(selectedDate));
    console.log("[DATE PICKER] Age:", calculateAge(selectedDate));
  };

  /* =======================================================
     INTERESTS
     ======================================================= */

  const toggleInterest = (interest: string) => {
    setSelectedInterests((previous) => {
      const updated = previous.includes(interest)
        ? previous.filter((item) => item !== interest)
        : [...previous, interest];

      console.log("[INTERESTS] Selected:", updated);

      return updated;
    });

    clearFieldError("interests");
  };

  /* =======================================================
     SUBMIT PROFILE WITH YUP VALIDATION
     ======================================================= */

  const handleContinue = async () => {
    if (saving) return;

    Keyboard.dismiss();

    console.log("========== PROFILE SUBMISSION STARTED ==========");

    const cleanUsername = username.trim().toLowerCase();
    const cleanBio = bioRef.current.trim();
    const selectedProfileImage = profileImageRef.current;
    const calculatedAge = dateOfBirth ? calculateAge(dateOfBirth) : null;

    console.log("[FORM] Values before validation:", {
      username: cleanUsername,
      dateOfBirth: dateOfBirth ? formatDate(dateOfBirth) : null,
      age: calculatedAge,
      country,
      bio: cleanBio,
      profileImage: selectedProfileImage,
      interests: selectedInterests,
    });

    try {
      await profileValidationSchema.validate(
        {
          username: cleanUsername,
          age: calculatedAge,
          location: country,
          bio: cleanBio,
          interests: selectedInterests,
        },
        {
          abortEarly: false,
          stripUnknown: true,
        },
      );

      // Remove any old errors once all fields pass.
      setFieldErrors({});

      console.log("[YUP] All profile validations passed.");
    } catch (validationError: any) {
      if (validationError instanceof Yup.ValidationError) {
        const errors = validationError.inner.length
          ? validationError.inner
          : [validationError];

        const mappedErrors: Record<string, string> = {};

        errors.forEach((error) => {
          if (error.path && !mappedErrors[error.path]) {
            mappedErrors[error.path] = error.message;
          }
        });

        // console.error("[YUP] Validation failed:", mappedErrors);
        // console.error("[YUP] Full validation errors:", errors);

        // Display errors beneath their corresponding inputs.
        setFieldErrors(mappedErrors);

        return;
      }

      console.error("[YUP] Unexpected validation error:", validationError);

      showMessage(
        "Validation error",
        validationError?.message || "Please check your profile details.",
      );

      return;
    }

    try {
      let uploadedProfileImage: string | undefined;

      // Upload only the selected profile image.
      if (selectedProfileImage) {
        console.log("[SUBMISSION] Uploading selected profile image.");

        uploadedProfileImage = await uploadProfileImage(selectedProfileImage);

        if (!isValidCloudinaryUrl(uploadedProfileImage)) {
          throw new Error(
            "The profile image upload did not return a valid Cloudinary URL.",
          );
        }

        console.log("[SUBMISSION] Cloudinary URL:", uploadedProfileImage);
      }

      // Keep every field independent.
      const input = {
        username: cleanUsername,
        age: Number(calculatedAge),
        location: country.trim(),
        bio: cleanBio,
        profileImage: uploadedProfileImage,
        interests: [...selectedInterests],
      };

      console.log("========== FINAL GRAPHQL VARIABLES ==========");
      console.log("[GRAPHQL] username:", input.username);
      console.log("[GRAPHQL] age:", input.age);
      console.log("[GRAPHQL] location:", input.location);
      console.log("[GRAPHQL] bio:", input.bio);
      console.log("[GRAPHQL] profileImage:", input.profileImage);
      console.log("[GRAPHQL] interests:", input.interests);
      console.log("[GRAPHQL] Complete variables:", { input });
      console.log("==============================================");

      // Final independent field checks.
      sanitizeBio(input.bio);

      if (input.profileImage && !isValidCloudinaryUrl(input.profileImage)) {
        throw new Error("Invalid profile image URL. Submission stopped.");
      }

      console.log("[GRAPHQL] Sending updateProfile mutation...");

      const result = await updateProfile({
        variables: { input },
      });

      console.log("[GRAPHQL] Raw mutation result:", result);

      const updatedUser = result?.data?.updateProfile;

      console.log("[GRAPHQL] Returned user:", updatedUser);
      console.log("[GRAPHQL] Submitted bio:", input.bio);
      console.log("[GRAPHQL] Returned bio:", updatedUser?.bio);
      console.log("[GRAPHQL] Submitted image:", input.profileImage);
      console.log("[GRAPHQL] Returned image:", updatedUser?.profileImage);

      if (!updatedUser?.id) {
        throw new Error(
          "Profile update did not return a valid user. Please try again.",
        );
      }

      if (updatedUser.bio !== input.bio) {
        console.error("[PROFILE MISMATCH] Bio differs from submitted value.", {
          submittedBio: input.bio,
          returnedBio: updatedUser.bio,
        });

        showMessage(
          "Profile saved with a warning",
          "Your profile was saved, but the bio returned by the server differs from what was submitted. Please check your backend resolver.",
        );
      }

      console.log("[SUCCESS] Profile saved successfully.");
      console.log("[NAVIGATION] Replacing current screen with main page.");

      router.replace("/tabs/Main/mainPage");
    } catch (error: any) {
      console.error("========== PROFILE SUBMISSION FAILED ==========");
      console.error("[SUBMISSION] Message:", error?.message);
      console.error("[SUBMISSION] Full error:", error);
      console.error("[SUBMISSION] GraphQL errors:", error?.graphQLErrors);
      console.error("[SUBMISSION] Network error:", error?.networkError);
      console.error("================================================");

      showMessage(
        "Profile update failed",
        error?.message || "Unable to update your profile. Please try again.",
      );
    } finally {
      console.log("[SUBMISSION] Process finished.");
    }
  };

  const today = new Date();

  const isFutureMonth =
    calendarDate.getFullYear() === today.getFullYear() &&
    calendarDate.getMonth() === today.getMonth();

  /* =======================================================
     UI
     ======================================================= */

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add verification</Text>
        </View>

        {/* PROFILE IMAGE */}

        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarContainer} onPress={pickProfileImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>FC</Text>
              </View>
            )}

            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={17} color={COLORS.white} />
            </View>
          </Pressable>

          <Text style={styles.avatarLabel}>Add profile photo</Text>
        </View>

        <View style={styles.form}>
          {/* USERNAME */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>

            <View
              style={[
                styles.inputContainer,
                fieldErrors.username && styles.inputErrorBorder,
              ]}>
              <Ionicons name="at-outline" size={19} color={COLORS.muted} />

              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={COLORS.muted}
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  clearFieldError("username");
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {fieldErrors.username ? (
              <Text style={styles.errorText}>{fieldErrors.username}</Text>
            ) : null}
          </View>

          {/* AGE */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>

            <Pressable
              style={[
                styles.inputContainer,
                fieldErrors.age && styles.inputErrorBorder,
              ]}
              onPress={openDatePicker}>
              <Ionicons
                name="calendar-outline"
                size={19}
                color={COLORS.muted}
              />

              <View style={styles.ageDisplay}>
                <Text
                  style={[
                    styles.ageText,
                    !dateOfBirth && styles.placeholderText,
                  ]}>
                  {dateOfBirth
                    ? `${age} years old`
                    : "Select your date of birth"}
                </Text>
              </View>

              <Ionicons name="calendar" size={19} color={COLORS.primary} />
            </Pressable>

            {dateOfBirth && (
              <Text style={styles.helperText}>
                Date of birth: {formatDate(dateOfBirth)}
              </Text>
            )}

            {fieldErrors.age ? (
              <Text style={styles.errorText}>{fieldErrors.age}</Text>
            ) : null}
          </View>

          {/* COUNTRY */}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country</Text>

            <Pressable
              style={[
                styles.inputContainer,
                fieldErrors.location && styles.inputErrorBorder,
              ]}
              onPress={() => {
                Keyboard.dismiss();
                setCountrySearch("");
                setShowCountryPicker(true);
                console.log("[COUNTRY] Picker opened.");
              }}>
              <Ionicons
                name="location-outline"
                size={19}
                color={COLORS.muted}
              />

              <View style={styles.ageDisplay}>
                <Text
                  style={[styles.ageText, !country && styles.placeholderText]}>
                  {country || "Select your country"}
                </Text>
              </View>

              <Ionicons name="chevron-down" size={20} color={COLORS.muted} />
            </Pressable>

            {fieldErrors.location ? (
              <Text style={styles.errorText}>{fieldErrors.location}</Text>
            ) : null}
          </View>

          {/* BIO */}

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Bio</Text>
              <Text style={styles.optionalText}>Optional</Text>
            </View>

            <View
              style={[
                styles.inputContainer,
                styles.bioContainer,
                fieldErrors.bio && styles.inputErrorBorder,
              ]}>
              <TextInput
                style={styles.bioInput}
                placeholder="Tell people a little about yourself..."
                placeholderTextColor={COLORS.muted}
                value={bio}
                onChangeText={handleBioChange}
                multiline
                maxLength={160}
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
              />
            </View>

            <Text style={styles.characterCount}>{bio.length}/160</Text>

            {fieldErrors.bio ? (
              <Text style={styles.errorText}>{fieldErrors.bio}</Text>
            ) : null}
          </View>

          {/* INTERESTS */}

          <View style={styles.interestsSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Your interests</Text>
              <Text style={styles.optionalText}>Select at least 3</Text>
            </View>

            <View
              style={[
                styles.interestsContainer,
                fieldErrors.interests && styles.interestsErrorBorder,
              ]}>
              {INTERESTS.map((interest) => {
                const selected = selectedInterests.includes(interest);

                return (
                  <Pressable
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[
                      styles.interestChip,
                      selected && styles.selectedInterestChip,
                    ]}>
                    <Text
                      style={[
                        styles.interestText,
                        selected && styles.selectedInterestText,
                      ]}>
                      {interest}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={15}
                        color={COLORS.white}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {fieldErrors.interests ? (
              <Text style={styles.errorText}>{fieldErrors.interests}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Pressable
          style={[styles.continueButton, saving && styles.disabledButton]}
          onPress={handleContinue}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </Pressable>
      </View>

      {/* CUSTOM DATE PICKER */}

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dateModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Date of birth</Text>
                <Text style={styles.modalSubtitle}>
                  Select your day, month and year
                </Text>
              </View>

              <Pressable onPress={() => setShowDatePicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </Pressable>
            </View>

            <View style={styles.calendarNavigation}>
              <Pressable
                style={styles.monthArrow}
                onPress={() => changeMonth(-1)}>
                <Ionicons name="chevron-back" size={21} color={COLORS.white} />
              </Pressable>

              <Text style={styles.monthTitle}>
                {MONTHS[calendarDate.getMonth()]}
              </Text>

              <TextInput
                style={styles.yearInput}
                value={yearInput}
                onChangeText={handleYearChange}
                keyboardType="number-pad"
                maxLength={4}
                selectTextOnFocus
                placeholder="Year"
                placeholderTextColor={COLORS.muted}
              />

              <Pressable
                style={[
                  styles.monthArrow,
                  isFutureMonth && styles.disabledArrow,
                ]}
                onPress={() => changeMonth(1)}
                disabled={isFutureMonth}>
                <Ionicons
                  name="chevron-forward"
                  size={21}
                  color={isFutureMonth ? COLORS.muted : COLORS.white}
                />
              </Pressable>
            </View>

            <View style={styles.calendarGrid}>
              {WEEKDAYS.map((day) => (
                <View key={day} style={styles.calendarCell}>
                  <Text style={styles.weekdayText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return (
                    <View key={`empty-${index}`} style={styles.calendarCell} />
                  );
                }

                const thisDate = new Date(
                  calendarDate.getFullYear(),
                  calendarDate.getMonth(),
                  day,
                );

                const selected =
                  dateOfBirth !== null && isSameDate(thisDate, dateOfBirth);

                const isFuture = thisDate > today;

                return (
                  <View
                    key={`${calendarDate.getMonth()}-${day}`}
                    style={styles.calendarCell}>
                    <Pressable
                      disabled={isFuture}
                      onPress={() => selectBirthDate(day)}
                      style={[
                        styles.dayButton,
                        selected && styles.selectedDayButton,
                        isFuture && styles.disabledDayButton,
                      ]}>
                      <Text
                        style={[
                          styles.dayText,
                          selected && styles.selectedDayText,
                          isFuture && styles.disabledDayText,
                        ]}>
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Text style={styles.calendarHint}>
              Tap a date to calculate your age automatically.
            </Text>

            <Pressable
              style={styles.cancelDateButton}
              onPress={() => setShowDatePicker(false)}>
              <Text style={styles.cancelDateText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* COUNTRY PICKER */}

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.countryModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select your country</Text>

              <Pressable onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={19} color={COLORS.muted} />

              <TextInput
                style={styles.searchInput}
                placeholder="Search countries..."
                placeholderTextColor={COLORS.muted}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.countryItem}
                  onPress={() => {
                    setCountry(item);
                    setShowCountryPicker(false);
                    setCountrySearch("");
                    clearFieldError("location");

                    console.log("[COUNTRY] Selected:", item);
                  }}>
                  <Text style={styles.countryText}>{item}</Text>

                  {country === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries found.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000fa",
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 25,
  },
  header: {
    marginBottom: 25,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    width: 108,
    height: 108,
    position: "relative",
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: COLORS.cardLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: "800",
  },
  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  avatarLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  form: {
    gap: 21,
  },
  inputGroup: {
    gap: 9,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  optionalText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  inputContainer: {
    minHeight: 54,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputErrorBorder: {
    borderColor: "#FF5B70",
  },
  errorText: {
    color: "#FF5B70",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    marginLeft: 3,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    paddingVertical: 14,
  },
  ageDisplay: {
    flex: 1,
    justifyContent: "center",
  },
  ageText: {
    color: COLORS.white,
    fontSize: 14,
  },
  placeholderText: {
    color: COLORS.muted,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginLeft: 2,
  },
  bioContainer: {
    minHeight: 105,
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  bioInput: {
    width: "100%",
    minHeight: 80,
    color: COLORS.white,
    fontSize: 14,
    padding: 0,
  },
  characterCount: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "right",
    marginTop: -3,
  },
  interestsSection: {
    gap: 13,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  interestsErrorBorder: {
    borderWidth: 1,
    borderColor: "#FF5B70",
    borderRadius: 14,
    padding: 8,
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedInterestChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  interestText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  selectedInterestText: {
    color: COLORS.white,
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  continueButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  dateModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countryModal: {
    width: "100%",
    maxWidth: 480,
    height: "80%",
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  calendarNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardLight,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledArrow: {
    opacity: 0.35,
  },
  monthTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
  },
  yearInput: {
    width: 70,
    height: 38,
    color: COLORS.white,
    backgroundColor: COLORS.cardLight,
    borderRadius: 9,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 5,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: "14.2857%",
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDayButton: {
    backgroundColor: COLORS.primary,
  },
  disabledDayButton: {
    opacity: 0.25,
  },
  dayText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  selectedDayText: {
    color: COLORS.white,
    fontWeight: "800",
  },
  disabledDayText: {
    color: COLORS.muted,
  },
  calendarHint: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 15,
    marginBottom: 12,
  },
  cancelDateButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.cardLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelDateText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  searchContainer: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
  },
  countryItem: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  countryText: {
    color: COLORS.text,
    fontSize: 14,
  },
  emptyText: {
    color: COLORS.muted,
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
});
