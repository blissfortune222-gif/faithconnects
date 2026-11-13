import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type HomeHeaderProps = {
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
};

export default function HomeHeader({
  onNotificationPress,
  onSearchPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.header}>
      {/* BRAND LOGO AND NAME */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="heart" size={39} color="#FF4F9A" />
          <Ionicons
            name="heart-outline"
            size={23}
            color="#A855F7"
            style={styles.innerHeart}
          />
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>
            Faith<Text style={styles.brandAccent}>Connects</Text>
          </Text>
        </View>
      </View>

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        {/* SEARCH BUTTON */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onSearchPress}
          activeOpacity={0.7}
          accessibilityLabel="Search">
          <Ionicons name="search" size={23} color="#FFFFFF" />
        </TouchableOpacity>

        {/* NOTIFICATION BUTTON */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />

          {/* NOTIFICATION INDICATOR */}
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },

  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    marginRight: 3,
  },

  innerHeart: {
    position: "absolute",
    top: 10,
    left: 10,
  },

  brandText: {
    flex: 1,
    minWidth: 0,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  brandAccent: {
    color: PRIMARY,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },

  actionButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#1B1030",
    borderWidth: 1,
    borderColor: "#49305F",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: PRIMARY,
    borderWidth: 1,
    borderColor: "#1B1030",
  },
});
