import { useFocusEffect, useNavigation } from "expo-router";
import { useCallback, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

const TAB_BAR_STYLE = {
  backgroundColor: "#121212",
  borderTopColor: "#252525",
  borderTopWidth: 1,
  height: 76,
  paddingTop: 8,
  paddingBottom: 8,
  elevation: 0,
  shadowOpacity: 0,
};

export function useHideTabBarOnScroll() {
  const navigation = useNavigation<any>();

  const lastScrollY = useRef(0);
  const hidden = useRef(false);

  const showTabs = useCallback(() => {
    if (hidden.current) {
      hidden.current = false;
      navigation.setOptions({ tabBarStyle: TAB_BAR_STYLE });
    }
  }, [navigation]);

  const hideTabs = useCallback(() => {
    if (!hidden.current) {
      hidden.current = true;
      navigation.setOptions({
        tabBarStyle: { display: "none" },
      });
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      lastScrollY.current = 0;
      showTabs();

      return () => {
        showTabs();
      };
    }, [showTabs]),
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const difference = currentY - lastScrollY.current;

      if (currentY <= 10) {
        showTabs();
      } else if (difference > 5) {
        hideTabs();
      } else if (difference < -5) {
        showTabs();
      }

      lastScrollY.current = currentY;
    },
    [showTabs, hideTabs],
  );

  return {
    handleScroll,
  };
}
