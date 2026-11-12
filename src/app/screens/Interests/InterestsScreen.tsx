//////

import { gql, useMutation } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* =========================================================
   GRAPHQL MUTATION
   ========================================================= */

const UPDATE_INTERESTS_MUTATION = gql`
  mutation UpdateInterests($interests: [String!]!) {
    updateInterests(interests: $interests) {
      id
      fullName
      email
      interests
    }
  }
`;

/* =========================================================
   TYPES
   ========================================================= */

type Interest = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type UpdateInterestsData = {
  updateInterests: {
    id: string;
    fullName: string;
    email: string;
    interests: string[];
  };
};

type UpdateInterestsVariables = {
  interests: string[];
};

/* =========================================================
   INTEREST SCREEN
   ========================================================= */

export default function InterestScreen() {
  const interests: Interest[] = [
    {
      name: "Music",
      icon: "musical-notes",
    },
    {
      name: "Sports",
      icon: "football",
    },
    {
      name: "Gaming",
      icon: "game-controller",
    },
    {
      name: "Travel",
      icon: "airplane",
    },
    {
      name: "Food",
      icon: "restaurant",
    },
    {
      name: "Movies",
      icon: "film",
    },
    {
      name: "Fashion",
      icon: "shirt",
    },
    {
      name: "Technology",
      icon: "laptop",
    },
    {
      name: "Photography",
      icon: "camera",
    },
    {
      name: "Fitness",
      icon: "barbell",
    },
    {
      name: "Art",
      icon: "color-palette",
    },
    {
      name: "Business",
      icon: "briefcase",
    },
  ];

  const [selected, setSelected] = useState<string[]>([]);

  /* =========================================================
     APOLLO UPDATE INTERESTS
     ========================================================= */

  const [updateInterests, { loading }] = useMutation<
    UpdateInterestsData,
    UpdateInterestsVariables
  >(UPDATE_INTERESTS_MUTATION);

  /* =========================================================
     TOGGLE INTEREST
     ========================================================= */

  const toggleInterest = (item: string) => {
    if (loading) return;

    setSelected((current) => {
      if (current.includes(item)) {
        return current.filter((interest) => interest !== item);
      }

      return [...current, item];
    });
  };

  /* =========================================================
     CONTINUE
     ========================================================= */

  const continueNext = async () => {
    if (selected.length === 0) {
      Alert.alert(
        "Select an interest",
        "Please select at least one interest to continue.",
      );
      return;
    }

    try {
      console.log("Selected Interests:", selected);

      console.log("Updating interests...");

      const result = await updateInterests({
        variables: {
          interests: selected,
        },
      });

      console.log("UPDATE INTERESTS RESULT:", JSON.stringify(result.data));

      const updatedUser = result.data?.updateInterests;

      if (!updatedUser) {
        throw new Error("The server did not return the updated user.");
      }

      console.log("INTERESTS UPDATED SUCCESSFULLY");

      console.log("User:", updatedUser.fullName);

      console.log("Saved interests:", updatedUser.interests);

      /* =====================================================
         GO TO MAIN PAGE ONLY AFTER SUCCESS
         ===================================================== */

      router.replace("/tabs/Main/mainPage");
    } catch (error: any) {
      console.error("UPDATE INTERESTS ERROR:", error);

      let errorMessage = "Unable to save your interests.";

      if (error?.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors
          .map((graphqlError: any) => graphqlError.message)
          .join("\n");
      } else if (error?.networkError) {
        errorMessage =
          "Unable to connect to the server. Please check your internet connection.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Update Failed", errorMessage);
    }
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} disabled={loading}>
            <Ionicons name="arrow-back" size={28} color={PURPLE} />
          </TouchableOpacity>
        </View>

        {/* TITLE */}
        <Text style={styles.title}>Choose your interests</Text>

        {/* SUBTITLE */}
        <Text style={styles.subtitle}>
          Select topics you love so we can personalize your experience.
        </Text>

        {/* INTEREST GRID */}
        <View style={styles.grid}>
          {interests.map((item) => {
            const isSelected = selected.includes(item.name);

            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => toggleInterest(item.name)}
                disabled={loading}
                activeOpacity={0.8}
                style={[styles.card, isSelected && styles.selectedCard]}>
                {/* ICON */}
                <View
                  style={[
                    styles.iconBox,
                    isSelected && styles.selectedIconBox,
                  ]}>
                  <Ionicons
                    name={item.icon}
                    size={26}
                    color={isSelected ? "#fff" : PURPLE}
                  />
                </View>

                {/* TEXT */}
                <Text
                  style={[styles.cardText, isSelected && styles.selectedText]}>
                  {item.name}
                </Text>

                {/* CHECKMARK */}
                {isSelected && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark" size={15} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SPACE FOR BUTTON */}
        <View
          style={{
            height: 100,
          }}
        />
      </ScrollView>

      {/* =====================================================
          FIXED CONTINUE BUTTON
          ===================================================== */}

      <TouchableOpacity
        disabled={selected.length === 0 || loading}
        onPress={continueNext}
        activeOpacity={0.8}
        style={[
          styles.button,
          (selected.length === 0 || loading) && styles.disabledButton,
        ]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#fff" />

            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    marginTop: 15,
  },

  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: "800",
    color: "#222",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: "#777",
    lineHeight: 22,
  },

  grid: {
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },

  card: {
    width: "47%",
    height: 105,
    backgroundColor: "#F8F8F8",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  selectedCard: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#EFE9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedIconBox: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  cardText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
  },

  selectedText: {
    color: "#fff",
  },

  check: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 22,
    height: 22,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    position: "absolute",
    bottom: 30,
    left: 24,
    right: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.45,
  },

  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  loadingText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
});
