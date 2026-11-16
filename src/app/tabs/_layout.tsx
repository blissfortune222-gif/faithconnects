import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

const PRIMARY = "#FF4F9A";
const MUTED = "#77718A";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,

        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,

        tabBarIconStyle: {
          marginTop: 4,
        },

        tabBarItemStyle: {
          height: 58,
          justifyContent: "center",
          alignItems: "center",
        },

        tabBarStyle: {
          backgroundColor: "#000000fa",
          borderTopColor: "#251638",
          borderTopWidth: 1,
          height: 72,
          paddingTop: 5,
          paddingBottom: 9,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}>
      <Tabs.Screen
        name="Main/mainPage"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={25}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={25}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          headerShown: false,
          tabBarStyle: { display: "none" },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeIndicator} />}
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={25}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 52,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  activeIndicator: {
    position: "absolute",
    top: -5,
    width: 22,
    height: 3,
    borderRadius: 10,
    backgroundColor: PRIMARY,
  },
});
