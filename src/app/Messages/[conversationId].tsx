import { gql, useMutation, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#FF4F9A";
const BACKGROUND = "#0F0623";
const CARD = "#19102F";
const MUTED = "#A99AAF";

// --------------------------------------------------
// GRAPHQL
// --------------------------------------------------

const ME_QUERY = gql`
  query Me {
    me {
      id
    }
  }
`;

const MESSAGES_QUERY = gql`
  query Messages($conversationId: ID!, $limit: Int, $offset: Int) {
    messages(conversationId: $conversationId, limit: $limit, offset: $offset) {
      id
      conversationId
      senderId
      receiverId
      text
      isRead
      createdAt
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($conversationId: ID!, $text: String!) {
    sendMessage(conversationId: $conversationId, text: $text) {
      id
      conversationId
      senderId
      receiverId
      text
      isRead
      createdAt
    }
  }
`;

const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationAsRead($conversationId: ID!) {
    markConversationAsRead(conversationId: $conversationId)
  }
`;

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  isRead: boolean;
  createdAt: string;
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const formatTime = (date?: string) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (date?: string) => {
  if (!date) return "Today";

  const parsed = new Date(date);

  if (isNaN(parsed.getTime())) return "Today";

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (parsed.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (parsed.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return parsed.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// --------------------------------------------------
// SCREEN
// --------------------------------------------------

export default function ConversationScreen() {
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    userId?: string | string[];
    userName?: string | string[];
    userImage?: string | string[];
    online?: string | string[];
  }>();

  const conversationId = getParam(params.conversationId) || "";
  const userId = getParam(params.userId) || "";
  const userName = getParam(params.userName) || "FaithConnects User";
  const userImage = getParam(params.userImage) || "";
  const online = getParam(params.online) === "true";

  const [messageText, setMessageText] = useState("");
  const [showAttachment, setShowAttachment] = useState(false);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const markingReadRef = useRef(false);

  // --------------------------------------------------
  // CURRENT USER
  // --------------------------------------------------

  const {
    data: meData,
    loading: meLoading,
    error: meError,
  } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const currentUserId = meData?.me?.id;

  // --------------------------------------------------
  // LOAD REAL MESSAGES
  // --------------------------------------------------

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    refetch: refetchMessages,
  } = useQuery(MESSAGES_QUERY, {
    variables: {
      conversationId,
      limit: 50,
      offset: 0,
    },
    skip: !conversationId || conversationId === "new",
    fetchPolicy: "cache-and-network",
    pollInterval: conversationId && conversationId !== "new" ? 5000 : 0,
    notifyOnNetworkStatusChange: true,
  });

  // Backend returns newest messages first.
  // Reverse them for the original non-inverted FlatList design.

  const messages: ChatMessage[] = useMemo(() => {
    const backendMessages: ChatMessage[] = messagesData?.messages || [];

    return [...backendMessages].reverse();
  }, [messagesData?.messages]);

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

  const handleSend = async () => {
    const text = messageText.trim();

    if (!text || sending) return;

    if (!conversationId || conversationId === "new") {
      Alert.alert(
        "Conversation unavailable",
        "A valid conversation ID was not received.",
      );
      return;
    }

    if (!currentUserId) {
      Alert.alert("Please wait", "Your account information is still loading.");
      return;
    }

    console.log("========== SEND MESSAGE ==========");
    console.log("Conversation ID:", conversationId);
    console.log("User ID:", userId);
    console.log("Current User ID:", currentUserId);
    console.log("Message:", text);
    console.log("==================================");

    setMessageText("");

    try {
      await sendMessage({
        variables: {
          conversationId,
          text,
        },
      });

      await refetchMessages();

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    } catch (error: any) {
      console.log("SEND MESSAGE ERROR:", error);

      setMessageText(text);

      Alert.alert(
        "Message not sent",
        error?.message || "Something went wrong. Please try again.",
      );
    }
  };

  // --------------------------------------------------
  // MARK CONVERSATION AS READ
  // --------------------------------------------------

  const [markConversationAsRead] = useMutation(MARK_CONVERSATION_READ);

  const hasUnreadMessages = useMemo(() => {
    if (!currentUserId) return false;

    return messages.some(
      (message) =>
        String(message.receiverId) === String(currentUserId) && !message.isRead,
    );
  }, [messages, currentUserId]);

  const markMessagesRead = useCallback(async () => {
    if (
      !conversationId ||
      conversationId === "new" ||
      !currentUserId ||
      !hasUnreadMessages ||
      markingReadRef.current
    ) {
      return;
    }

    markingReadRef.current = true;

    try {
      await markConversationAsRead({
        variables: {
          conversationId,
        },
      });

      await refetchMessages();
    } catch (error) {
      console.log("MARK MESSAGES READ ERROR:", error);
    } finally {
      markingReadRef.current = false;
    }
  }, [
    conversationId,
    currentUserId,
    hasUnreadMessages,
    markConversationAsRead,
    refetchMessages,
  ]);

  useEffect(() => {
    markMessagesRead();
  }, [markMessagesRead]);

  // --------------------------------------------------
  // MESSAGE DISPLAY
  // --------------------------------------------------

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const mine = String(item.senderId) === String(currentUserId);

    const previousMessage = messages[index - 1];

    const showDate =
      index === 0 ||
      !previousMessage ||
      new Date(previousMessage.createdAt).toDateString() !==
        new Date(item.createdAt).toDateString();

    return (
      <View>
        {showDate && (
          <View style={styles.dateWrapper}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageRow,
            mine ? styles.myMessageRow : styles.theirMessageRow,
          ]}>
          {!mine &&
            (userImage ? (
              <Image source={{ uri: userImage }} style={styles.messageAvatar} />
            ) : (
              <View style={styles.messageAvatarPlaceholder}>
                <Ionicons name="person" size={13} color={PRIMARY} />
              </View>
            ))}

          <View
            style={[
              styles.messageBubble,
              mine ? styles.myBubble : styles.theirBubble,
            ]}>
            <Text style={styles.messageText}>{item.text}</Text>

            <View style={styles.messageFooter}>
              <Text style={[styles.messageTime, mine && styles.myMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>

              {mine && (
                <Ionicons
                  name={item.isRead ? "checkmark-done" : "checkmark"}
                  size={15}
                  color={item.isRead ? "#78D7FF" : "#EBC5E2"}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // --------------------------------------------------
  // LOADING AND ERROR STATES
  // --------------------------------------------------

  if (meLoading && !meData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading your account...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (meError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={PRIMARY} />
          <Text style={styles.errorText}>Unable to load your account.</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversationId || conversationId === "new") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={PRIMARY} />
          <Text style={styles.errorText}>
            No valid conversation ID was received.
          </Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN CHAT SCREEN
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0}>
        {/* CHAT HEADER */}

        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={27} color="#fff" />
          </Pressable>

          <Pressable
            style={styles.profileButton}
            onPress={() => {
              if (userId) {
                router.push({
                  pathname: "/user/[userId]",
                  params: { userId },
                });
              }
            }}>
            {userImage ? (
              <Image source={{ uri: userImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={23} color={PRIMARY} />
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {userName}
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: online ? "#2ED573" : "#777",
                    },
                  ]}
                />

                <Text style={styles.statusText}>
                  {online ? "Active now" : "Offline"}
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable style={styles.headerAction}>
            <Ionicons name="call-outline" size={22} color="#fff" />
          </Pressable>

          <Pressable style={styles.headerAction}>
            <Ionicons name="videocam-outline" size={24} color="#fff" />
          </Pressable>

          <Pressable style={styles.headerAction}>
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* CHAT BODY */}

        {messagesLoading && !messagesData ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messagesError && !messagesData ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={40} color={PRIMARY} />
            <Text style={styles.errorText}>
              {messagesError.message || "Unable to load messages."}
            </Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => refetchMessages()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({
                animated: true,
              })
            }
            ListHeaderComponent={
              <View style={styles.profileIntro}>
                {userImage ? (
                  <Image
                    source={{ uri: userImage }}
                    style={styles.largeAvatar}
                  />
                ) : (
                  <View style={styles.largeAvatarPlaceholder}>
                    <Ionicons name="person" size={38} color={PRIMARY} />
                  </View>
                )}

                <Text style={styles.profileName}>{userName}</Text>

                <Text style={styles.profileUsername}>
                  Connected on FaithConnects
                </Text>

                <Text style={styles.profileHint}>
                  This is the beginning of your conversation.
                </Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={40}
                  color={PRIMARY}
                />

                <Text style={styles.emptyTitle}>Say hello 👋</Text>

                <Text style={styles.emptySubtitle}>
                  Send your first message to {userName}.
                </Text>
              </View>
            }
          />
        )}

        {/* ATTACHMENT OPTIONS */}

        {showAttachment && (
          <View style={styles.attachmentPanel}>
            {[
              {
                icon: "image-outline",
                label: "Photo",
                color: "#FF4F9A",
              },
              {
                icon: "camera-outline",
                label: "Camera",
                color: "#8B5CF6",
              },
              {
                icon: "document-outline",
                label: "File",
                color: "#3DA9FC",
              },
            ].map((item) => (
              <Pressable
                key={item.label}
                style={styles.attachmentItem}
                onPress={() => setShowAttachment(false)}>
                <View
                  style={[
                    styles.attachmentIcon,
                    { backgroundColor: item.color },
                  ]}>
                  <Ionicons name={item.icon as any} size={21} color="#fff" />
                </View>

                <Text style={styles.attachmentLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* MESSAGE COMPOSER */}

        <View style={styles.composer}>
          <Pressable
            style={styles.composerAction}
            onPress={() => setShowAttachment(!showAttachment)}>
            <Ionicons
              name={showAttachment ? "close" : "add-circle"}
              size={28}
              color={PRIMARY}
            />
          </Pressable>

          <View style={styles.inputWrapper}>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Write a message..."
              placeholderTextColor="#81768F"
              style={styles.input}
              multiline
              maxLength={5000}
            />

            <Pressable style={styles.emojiButton}>
              <Ionicons name="happy-outline" size={23} color={MUTED} />
            </Pressable>
          </View>

          {messageText.trim() ? (
            <Pressable
              style={[styles.sendButton, sending && { opacity: 0.6 }]}
              onPress={handleSend}
              disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={19} color="#fff" />
              )}
            </Pressable>
          ) : (
            <Pressable style={styles.voiceButton}>
              <Ionicons name="mic-outline" size={23} color={PRIMARY} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: "#000000fa",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  loadingText: {
    color: MUTED,
    fontSize: 12,
    marginTop: 11,
  },

  errorText: {
    color: "#fff",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 13,
    marginTop: 18,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "800",
  },

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#291B3A",
  },

  backButton: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 5,
  },

  profileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
  },

  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
  },

  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  headerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    color: MUTED,
    fontSize: 11,
  },

  headerAction: {
    width: 34,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  // PROFILE INTRO

  profileIntro: {
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 15,
  },

  largeAvatar: {
    width: 76,
    height: 76,
    borderRadius: 27,
    marginBottom: 12,
  },

  largeAvatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 27,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  profileName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  profileUsername: {
    color: PRIMARY,
    fontSize: 12,
    marginTop: 5,
    fontWeight: "600",
  },

  profileHint: {
    color: MUTED,
    fontSize: 11,
    marginTop: 7,
  },

  // MESSAGES

  messagesContainer: {
    paddingHorizontal: 14,
    paddingBottom: 18,
    flexGrow: 1,
  },

  dateWrapper: {
    alignSelf: "center",
    backgroundColor: "#251A35",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginVertical: 15,
  },

  dateText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },

  myMessageRow: {
    justifyContent: "flex-end",
  },

  theirMessageRow: {
    justifyContent: "flex-start",
  },

  messageAvatar: {
    width: 27,
    height: 27,
    borderRadius: 10,
    marginRight: 7,
  },

  messageAvatarPlaceholder: {
    width: 27,
    height: 27,
    borderRadius: 10,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 8,
    borderRadius: 17,
  },

  myBubble: {
    backgroundColor: "#853B82",
    borderBottomRightRadius: 5,
  },

  theirBubble: {
    backgroundColor: "#251B36",
    borderBottomLeftRadius: 5,
  },

  messageText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 20,
  },

  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 5,
  },

  messageTime: {
    color: "#A99AAF",
    fontSize: 9,
  },

  myMessageTime: {
    color: "#EBC5E2",
  },

  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 12,
  },

  emptySubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
  },

  // ATTACHMENTS

  attachmentPanel: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 25,
    borderTopWidth: 1,
    borderTopColor: "#291B3A",
  },

  attachmentItem: {
    alignItems: "center",
    gap: 7,
  },

  attachmentIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  attachmentLabel: {
    color: MUTED,
    fontSize: 10,
  },

  // COMPOSER

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: "#3a1b38",
    backgroundColor: "#000000fa",
  },

  composerAction: {
    width: 37,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  inputWrapper: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    backgroundColor: CARD,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginHorizontal: 5,
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    paddingVertical: 12,
    maxHeight: 95,
  },

  emojiButton: {
    paddingLeft: 6,
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  voiceButton: {
    width: 42,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
  },
});
