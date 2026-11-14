import { apolloClient } from "@/lib/apollo/apoloclient";
import { ApolloProvider } from "@apollo/client/react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="tabs" />
        <Stack.Screen name="screens/Auth/login" />
        <Stack.Screen name="screens/Auth/signUp" />
        <Stack.Screen name="screens/Auth/recoverPassword" />
        <Stack.Screen name="screens/Interests/InterestsScreen" />
        <Stack.Screen name="screens/Onboarding/OnboardingScreen" />
        <Stack.Screen name="screens/Splash/SplashScreen" />
      </Stack>
    </ApolloProvider>
  );
}
