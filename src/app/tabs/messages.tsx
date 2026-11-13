import { gql, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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

const BACKGROUND = "#121212";
const PRIMARY = "#FF4F9A";
const TEXT = "#FFFFFF";
const MUTED = "#8B8B8B";
const BORDER = "#262626";
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

function formatMessageTime(dateString?: string | null) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
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

  const { data: meData, loading: meLoading } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const { data, loading, error, refetch, networkStatus } = useQuery(
    CONVERSATIONS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );

  const currentUserId = meData?.me?.id;

  const conversations: Conversation[] = data?.conversations || [];

  const formattedConversations = useMemo(() => {
    return conversations
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
      .filter(Boolean)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.lastMessageAt || a.updatedAt).getTime();

        const dateB = new Date(b.lastMessageAt || b.updatedAt).getTime();

        return dateB - dateA;
      });
  }, [conversations, currentUserId]);

  const filteredConversations = useMemo(() => {
    let result = formattedConversations as any[];

    if (activeTab === "Online") {
      result = result.filter((conversation) => conversation.otherUser.isOnline);
    }

    if (search.trim()) {
      const value = search.toLowerCase();

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

  const openConversation = (conversation: any) => {
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

  const renderConversation = ({ item }: { item: any }) => {
    const user = item.otherUser;

    const displayName = user.fullName || user.username || "User";

    const message = item.lastMessage || "No messages yet. Say hello!";

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

          <View style={styles.bottomLine}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {message}
            </Text>

            <Ionicons name="chevron-forward" size={17} color="#555555" />
          </View>
        </View>
      </Pressable>
    );
  };

  const isInitialLoading = (loading || meLoading) && !data;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Messages</Text>

            <Text style={styles.headerSubtitle}>Your conversations</Text>
          </View>

          <Pressable style={styles.headerIcon} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={21} color={TEXT} />
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

        {/* Conversation filters */}
        <View style={styles.filterContainer}>
          {(["All", "Online"] as const).map((tab) => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.filterButton,
                  selected && styles.activeFilterButton,
                ]}>
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.activeFilterText,
                  ]}>
                  {tab}
                </Text>
              </Pressable>
            );
          })}

          <View style={styles.conversationCount}>
            <Text style={styles.countText}>{filteredConversations.length}</Text>
          </View>
        </View>

        {/* Conversation list */}
        {isInitialLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading conversations...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="chatbubbles-outline" size={42} color={MUTED} />

            <Text style={styles.emptyTitle}>Couldn't load conversations</Text>

            <Text style={styles.emptySubtitle}>{error.message}</Text>

            <Pressable style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item: any) => item.id}
            renderItem={renderConversation}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              filteredConversations.length === 0 && styles.emptyListContent,
            ]}
            refreshing={networkStatus === 4}
            onRefresh={refetch}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
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
                    ? "Try searching with another name."
                    : "Your conversations will appear here when you start chatting."}
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
    paddingTop: 14,
    paddingBottom: 23,
  },

  headerTitle: {
    color: TEXT,
    fontSize: 29,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  headerSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  searchContainer: {
    height: 51,
    borderRadius: 15,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 21,
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
    marginBottom: 13,
    gap: 10,
  },

  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },

  activeFilterButton: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  filterText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
  },

  activeFilterText: {
    color: "#FFFFFF",
  },

  conversationCount: {
    marginLeft: "auto",
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingTop: 5,
    paddingBottom: 30,
  },

  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },

  pressedRow: {
    opacity: 0.65,
  },

  avatarContainer: {
    width: 56,
    height: 56,
    marginRight: 14,
    position: "relative",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#252525",
  },

  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineIndicator: {
    position: "absolute",
    width: 13,
    height: 13,
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

  bottomLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  lastMessage: {
    flex: 1,
    color: "#929292",
    fontSize: 13,
    marginRight: 10,
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
    marginTop: 14,
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
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 15,
  },

  emptySubtitle: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 20,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
