import { gql, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BACKGROUND = "#000000fa";
const PRIMARY = "#FF4F9A";
const TEXT = "#FFFFFF";
const MUTED = "#858585";
const BORDER = "#292929";
const GREEN = "#31D69A";

const ME_QUERY = gql`
  query Me {
    me {
      id
    }
  }
`;

const CONVERSATIONS_QUERY = gql`
  query Conversations {
    conversations {
      id
      lastMessage
      lastMessageAt
      createdAt
      updatedAt
      participants {
        id
        fullName
        username
        profileImage
        isOnline
      }
    }
  }
`;

type Participant = {
  id: string;
  fullName: string;
  username?: string | null;
  profileImage?: string | null;
  isOnline: boolean;
};

type Conversation = {
  id: string;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
};

type ConversationItem = Conversation & {
  otherUser: Participant;
};

function formatMessageTime(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

export default function MessagesScreen() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Online">("All");

  // Get the authenticated user.
  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const currentUserId = meData?.me?.id;

  // Read cached conversations immediately and fetch updated data.
  const { data, loading, error, refetch, networkStatus } = useQuery(
    CONVERSATIONS_QUERY,
    {
      skip: !currentUserId,
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );

  // Refresh conversations whenever this screen comes into focus.
  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return;

      refetch().catch((refreshError) => {
        console.error("Conversations refresh error:", refreshError);
      });
    }, [currentUserId, refetch]),
  );

  const conversations: Conversation[] = data?.conversations || [];

  // Only display conversations containing actual messages.
  const formattedConversations = useMemo<ConversationItem[]>(() => {
    if (!currentUserId) return [];

    return conversations
      .filter(
        (conversation) =>
          typeof conversation.lastMessage === "string" &&
          conversation.lastMessage.trim().length > 0,
      )
      .map((conversation) => {
        const otherUser = conversation.participants?.find(
          (participant) => participant.id !== currentUserId,
        );

        if (!otherUser) return null;

        return {
          ...conversation,
          otherUser,
        };
      })
      .filter(
        (conversation): conversation is ConversationItem =>
          conversation !== null,
      )
      .sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || a.updatedAt).getTime();

        const dateB = new Date(b.lastMessageAt || b.updatedAt).getTime();

        return dateB - dateA;
      });
  }, [conversations, currentUserId]);

  const onlineCount = formattedConversations.filter(
    (conversation) => conversation.otherUser.isOnline,
  ).length;

  const filteredConversations = useMemo(() => {
    let result = [...formattedConversations];

    if (activeTab === "Online") {
      result = result.filter((conversation) => conversation.otherUser.isOnline);
    }

    if (search.trim()) {
      const value = search.toLowerCase().trim();

      result = result.filter((conversation) => {
        const user = conversation.otherUser;

        return (
          user.fullName?.toLowerCase().includes(value) ||
          user.username?.toLowerCase().includes(value) ||
          conversation.lastMessage?.toLowerCase().includes(value)
        );
      });
    }

    return result;
  }, [formattedConversations, activeTab, search]);

  const openConversation = (conversation: ConversationItem) => {
    const user = conversation.otherUser;

    router.push({
      pathname: "/Messages/[conversationId]",
      params: {
        conversationId: conversation.id,
        userId: user.id,
        userName: user.fullName || user.username || "User",
        userImage: user.profileImage || "",
        online: String(user.isOnline),
      },
    });
  };

  const renderConversation = ({ item }: { item: ConversationItem }) => {
    const user = item.otherUser;

    const displayName = user.fullName || user.username || "User";

    const message = item.lastMessage || "";

    const messageTime = formatMessageTime(item.lastMessageAt || item.updatedAt);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.conversationRow,
          pressed && styles.pressedRow,
        ]}
        onPress={() => openConversation(item)}>
        <View style={styles.avatarContainer}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={25} color="#777777" />
            </View>
          )}

          {user.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.topLine}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>

            <Text style={styles.timeText}>{messageTime}</Text>
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {message}
          </Text>
        </View>
      </Pressable>
    );
  };

  const isInitialLoading =
    meLoading || (Boolean(currentUserId) && loading && !data);

  const screenError = meError || error;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>

            <Text style={styles.headerSubtitle}>
              Stay connected with your people
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.headerIcon,
              pressed && styles.pressedButton,
            ]}
            onPress={() => {
              refetch().catch((refreshError) =>
                console.error("Refresh error:", refreshError),
              );
            }}>
            <Ionicons name="refresh-outline" size={20} color={TEXT} />
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={MUTED} />

          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#777777"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={19} color={MUTED} />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <Pressable
            onPress={() => setActiveTab("All")}
            style={[
              styles.filterButton,
              activeTab === "All" && styles.activeFilterButton,
            ]}>
            <Text
              style={[
                styles.filterText,
                activeTab === "All" && styles.activeFilterText,
              ]}>
              All
            </Text>

            <View
              style={[
                styles.filterCount,
                activeTab === "All" && styles.activeFilterCount,
              ]}>
              <Text
                style={[
                  styles.filterCountText,
                  activeTab === "All" && styles.activeFilterCountText,
                ]}>
                {formattedConversations.length}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("Online")}
            style={[
              styles.filterButton,
              activeTab === "Online" && styles.activeFilterButton,
            ]}>
            <View style={styles.onlineTabDot} />

            <Text
              style={[
                styles.filterText,
                activeTab === "Online" && styles.activeFilterText,
              ]}>
              Online
            </Text>

            <View
              style={[
                styles.filterCount,
                activeTab === "Online" && styles.activeFilterCount,
              ]}>
              <Text
                style={[
                  styles.filterCountText,
                  activeTab === "Online" && styles.activeFilterCountText,
                ]}>
                {onlineCount}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Conversations */}
        {isInitialLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />

            <Text style={styles.loadingText}>
              Loading your conversations...
            </Text>
          </View>
        ) : screenError ? (
          <View style={styles.centerContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={34} color={PRIMARY} />
            </View>

            <Text style={styles.emptyTitle}>Couldn't load conversations</Text>

            <Text style={styles.emptySubtitle}>{screenError.message}</Text>

            <Pressable
              style={styles.retryButton}
              onPress={() => {
                refetch().catch((refreshError) =>
                  console.error("Retry error:", refreshError),
                );
              }}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              filteredConversations.length === 0 && styles.emptyListContent,
            ]}
            refreshing={networkStatus === 4}
            onRefresh={() => refetch()}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name={
                      search ? "search-outline" : "chatbubble-ellipses-outline"
                    }
                    size={34}
                    color={PRIMARY}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  {search
                    ? "No conversations found"
                    : activeTab === "Online"
                      ? "Nobody online yet"
                      : "No conversations yet"}
                </Text>

                <Text style={styles.emptySubtitle}>
                  {search
                    ? "Try another name or search term."
                    : activeTab === "Online"
                      ? "When someone you've chatted with is online, they'll appear here."
                      : "You haven't started any conversations yet. Discover people and start connecting."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 23,
  },

  headerTitle: {
    color: TEXT,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 6,
  },

  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "transparent",
  },

  pressedButton: {
    opacity: 0.65,
  },

  searchContainer: {
    height: 52,
    borderRadius: 15,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 23,
  },

  searchInput: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    marginLeft: 11,
    paddingVertical: 0,
  },

  filterContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 13,
  },

  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "transparent",
  },

  activeFilterButton: {
    backgroundColor: "#2A1823",
    borderColor: "#71304D",
  },

  filterText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
  },

  activeFilterText: {
    color: TEXT,
  },

  filterCount: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#292929",
  },

  activeFilterCount: {
    backgroundColor: PRIMARY,
  },

  filterCountText: {
    color: "#AAAAAA",
    fontSize: 10,
    fontWeight: "800",
  },

  activeFilterCountText: {
    color: "#FFFFFF",
  },

  onlineTabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: GREEN,
  },

  listContent: {
    paddingTop: 4,
    paddingBottom: 35,
  },

  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  pressedRow: {
    opacity: 0.65,
  },

  avatarContainer: {
    width: 58,
    height: 58,
    marginRight: 14,
    position: "relative",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#242424",
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineIndicator: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: BACKGROUND,
    right: 0,
    bottom: 1,
  },

  conversationContent: {
    flex: 1,
    justifyContent: "center",
    minWidth: 0,
  },

  topLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  userName: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    fontWeight: "700",
    marginRight: 10,
  },

  timeText: {
    color: MUTED,
    fontSize: 11,
  },

  lastMessage: {
    color: "#929292",
    fontSize: 13,
    lineHeight: 19,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  loadingText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 15,
  },

  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 40,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: "#241923",
    borderWidth: 1,
    borderColor: "#382431",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 14,
  },

  emptySubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
  },

  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 23,
    paddingVertical: 12,
    borderRadius: 13,
    marginTop: 20,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
