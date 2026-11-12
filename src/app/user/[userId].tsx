import { gql, useMutation, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ----------------------------------------------------
// THEME
// ----------------------------------------------------

const PRIMARY = "#FF4F9A";
const BACKGROUND = "#121212";
const CARD = "#191022";
const CARD_LIGHT = "#23152F";
const MUTED = "#A99AAF";
const BORDER = "#30203B";

const PAGE_SIZE = 30;
const COMMENT_LIMIT = 50;

// ----------------------------------------------------
// GRAPHQL
// ----------------------------------------------------

const ME_QUERY = gql`
  query Me {
    me {
      id
      fullName
      username
      profileImage
    }
  }
`;

const GET_SELECTED_USER = gql`
  query GetSelectedUser($userId: ID!) {
    user(id: $userId) {
      id
      fullName
      username
      age
      bio
      location
      profileImage
      interests
      isVerified
      isOnline
      lastSeen
      followersCount
      followingCount
      likesCount
      postsCount
    }
  }
`;

const IS_FOLLOWING_QUERY = gql`
  query IsFollowing($userId: ID!) {
    isFollowing(userId: $userId)
  }
`;

const FOLLOW_USER = gql`
  mutation FollowUser($userId: ID!) {
    followUser(userId: $userId) {
      id
    }
  }
`;

const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ID!) {
    unfollowUser(userId: $userId) {
      id
    }
  }
`;

const BLOCK_USER = gql`
  mutation BlockUser($userId: ID!) {
    blockUser(userId: $userId)
  }
`;

const GET_SELECTED_USER_POSTS = gql`
  query GetSelectedUserPosts($userId: ID!, $limit: Int!, $offset: Int!) {
    userPosts(userId: $userId, limit: $limit, offset: $offset) {
      id
      caption
      media {
        url
        type
      }
      likesCount
      commentsCount
      createdAt
    }
  }
`;

const POST_COMMENTS_QUERY = gql`
  query PostComments($postId: ID!, $limit: Int, $offset: Int) {
    postComments(postId: $postId, limit: $limit, offset: $offset) {
      id
      text
      createdAt
      updatedAt
      author {
        id
        fullName
        username
        profileImage
      }
    }
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $text: String!) {
    createComment(postId: $postId, text: $text) {
      id
      text
      createdAt
      updatedAt
      author {
        id
        fullName
        username
        profileImage
      }
    }
  }
`;

const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $text: String!) {
    updateComment(id: $id, text: $text) {
      id
      text
      createdAt
      updatedAt
      author {
        id
        fullName
        username
        profileImage
      }
    }
  }
`;

const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

// ----------------------------------------------------
// TYPES
// ----------------------------------------------------

type SelectedUser = {
  id: string;
  fullName?: string;
  username?: string;
  age?: number;
  bio?: string;
  location?: string;
  profileImage?: string;
  interests?: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
  postsCount?: number;
};

type UserPost = {
  id: string;
  caption?: string;
  media?: {
    url: string;
    type?: string;
  }[];
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
};

type Comment = {
  id: string;
  text: string;
  createdAt?: string;
  updatedAt?: string;
  author?: {
    id: string;
    fullName?: string;
    username?: string;
    profileImage?: string;
  };
};

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

const formatDate = (date?: string) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date?: string) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const minutes = Math.floor(
    Math.max(0, Date.now() - parsed.getTime()) / 60000,
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return formatDate(date);
};

// ----------------------------------------------------
// SCREEN
// ----------------------------------------------------

export default function SelectedUserPage() {
  const params = useLocalSearchParams<{
    userId: string | string[];
  }>();

  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;

  const { width } = useWindowDimensions();
  const postSize = (width - 34) / 3;

  const [activeTab, setActiveTab] = useState<"posts" | "about">("posts");
  const [followLoading, setFollowLoading] = useState(false);

  const [profileImageVisible, setProfileImageVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<UserPost | null>(null);

  const [commentText, setCommentText] = useState("");
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [activeComment, setActiveComment] = useState<Comment | null>(null);

  const [blockLoading, setBlockLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // --------------------------------------------------
  // QUERIES
  // --------------------------------------------------

  const { data: meData } = useQuery(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: userData,
    loading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery<{ user: SelectedUser | null }>(GET_SELECTED_USER, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const {
    data: followData,
    loading: followStatusLoading,
    refetch: refetchFollowStatus,
  } = useQuery<{ isFollowing: boolean }>(IS_FOLLOWING_QUERY, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery<{ userPosts: UserPost[] }>(GET_SELECTED_USER_POSTS, {
    variables: {
      userId,
      limit: PAGE_SIZE,
      offset: 0,
    },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery<{ postComments: Comment[] }>(POST_COMMENTS_QUERY, {
    variables: {
      postId: selectedPost?.id,
      limit: COMMENT_LIMIT,
      offset: 0,
    },
    skip: !selectedPost?.id,
    fetchPolicy: "network-only",
  });

  // --------------------------------------------------
  // MUTATIONS
  // --------------------------------------------------

  const [followUser] = useMutation(FOLLOW_USER);
  const [unfollowUser] = useMutation(UNFOLLOW_USER);
  const [blockUser] = useMutation(BLOCK_USER);

  const [createComment, { loading: creatingComment }] =
    useMutation(CREATE_COMMENT);

  const [updateComment, { loading: updatingComment }] =
    useMutation(UPDATE_COMMENT);

  const [deleteComment] = useMutation(DELETE_COMMENT);

  // --------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------

  const user = userData?.user;
  const posts = postsData?.userPosts ?? [];
  const comments = commentsData?.postComments ?? [];

  const currentUserId = meData?.me?.id;

  const isOwnProfile = Boolean(
    currentUserId && user?.id && currentUserId === user.id,
  );

  const isFollowing = followData?.isFollowing ?? false;

  // --------------------------------------------------
  // FOLLOW / UNFOLLOW
  // --------------------------------------------------

  const handleFollow = async () => {
    if (!user?.id || followLoading) return;

    try {
      setFollowLoading(true);

      if (isFollowing) {
        await unfollowUser({
          variables: { userId: user.id },
        });
      } else {
        await followUser({
          variables: { userId: user.id },
        });
      }

      await Promise.all([refetchFollowStatus(), refetchUser()]);
    } catch (error: any) {
      console.log("Follow action error:", error);

      Alert.alert(
        "Unable to update follow status",
        error?.message || "Please try again.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  // --------------------------------------------------
  // BLOCK USER
  // --------------------------------------------------

  const handleBlockUser = async () => {
    if (!user?.id || blockLoading) return;

    try {
      setBlockLoading(true);

      const result = await blockUser({
        variables: { userId: user.id },
      });

      if (result.data?.blockUser === true) {
        setBlockModalVisible(false);
        router.back();
      } else {
        Alert.alert("Unable to block user", "Please try again.");
      }
    } catch (error: any) {
      console.log("Block user error:", error);

      Alert.alert(
        "Unable to block user",
        error?.message || "Please try again.",
      );
    } finally {
      setBlockLoading(false);
    }
  };

  // --------------------------------------------------
  // PROFILE ACTIONS
  // --------------------------------------------------

  const handleMessage = () => {
    console.log("Message selected user:", user?.id);
  };

  // Navigate to the profile of the person who wrote a comment.
  const handleCommentUserPress = (commentUserId?: string) => {
    if (!commentUserId) return;

    // Avoid navigating to the profile already being viewed.
    if (commentUserId === userId) return;

    router.push({
      pathname: "/user/[userId]",
      params: {
        userId: commentUserId,
      },
    });
  };

  // --------------------------------------------------
  // POST VIEWER
  // --------------------------------------------------

  const handlePostPress = (post: UserPost) => {
    setCommentText("");
    setEditingComment(null);
    setActiveComment(null);
    setCommentOptionsVisible(false);
    setSelectedPost(post);
  };

  const closePost = () => {
    setSelectedPost(null);
    setCommentText("");
    setEditingComment(null);
    setCommentOptionsVisible(false);
    setActiveComment(null);
  };

  // --------------------------------------------------
  // COMMENT CREATE / UPDATE
  // --------------------------------------------------

  const handleSubmitComment = async () => {
    if (!selectedPost?.id) return;

    const text = commentText.trim();

    if (!text) return;

    if (text.length > 1000) {
      Alert.alert("Comment too long", "Maximum 1000 characters.");
      return;
    }

    try {
      if (editingComment) {
        await updateComment({
          variables: {
            id: editingComment.id,
            text,
          },
        });
      } else {
        await createComment({
          variables: {
            postId: selectedPost.id,
            text,
          },
        });
      }

      setCommentText("");
      setEditingComment(null);

      await Promise.all([refetchComments(), refetchPosts()]);
    } catch (error: any) {
      console.log("Comment submission error:", error);

      Alert.alert("Comment failed", error?.message || "Please try again.");
    }
  };

  // --------------------------------------------------
  // OWN COMMENT ACTIONS
  // --------------------------------------------------

  const handleOwnCommentPress = (comment: Comment) => {
    if (!currentUserId || comment.author?.id !== currentUserId) return;

    console.log("Selected own comment:", comment.id);

    setActiveComment(comment);
    setCommentOptionsVisible(true);
  };

  const closeCommentOptions = () => {
    setCommentOptionsVisible(false);
    setActiveComment(null);
  };

  const handleEditComment = () => {
    if (!activeComment) return;

    const commentToEdit = activeComment;

    setEditingComment(commentToEdit);
    setCommentText(commentToEdit.text);

    closeCommentOptions();
  };

  const handleDeleteComment = () => {
    if (!activeComment || deleteLoading) return;

    // Keep activeComment while showing the confirmation overlay.
    setCommentOptionsVisible(false);
    setDeleteConfirmVisible(true);
  };

  const cancelDeleteComment = () => {
    setDeleteConfirmVisible(false);
    setActiveComment(null);
  };

  const confirmDeleteComment = async () => {
    if (!activeComment || deleteLoading) return;

    const commentToDelete = activeComment;

    try {
      setDeleteLoading(true);

      await deleteComment({
        variables: {
          id: commentToDelete.id,
        },
      });

      if (editingComment?.id === commentToDelete.id) {
        setEditingComment(null);
        setCommentText("");
      }

      setDeleteConfirmVisible(false);
      setActiveComment(null);

      await Promise.all([refetchComments(), refetchPosts()]);
    } catch (error: any) {
      console.log("Delete comment error:", error);

      setDeleteConfirmVisible(false);
      setActiveComment(null);

      Alert.alert(
        "Unable to delete comment",
        error?.message || "Please try again.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // --------------------------------------------------
  // ERROR STATES
  // --------------------------------------------------

  if (!userId) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>User ID is missing.</Text>
      </SafeAreaView>
    );
  }

  if (userLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (userError || !user) {
    return (
      <SafeAreaView style={styles.centered}>
        <Ionicons name="person-circle-outline" size={55} color={MUTED} />

        <Text style={styles.errorText}>
          {userError?.message || "This profile is unavailable."}
        </Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // --------------------------------------------------
  // MAIN PROFILE
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor={BACKGROUND} />

      {/* HEADER */}

      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Profile</Text>

        {!isOwnProfile ? (
          <Pressable
            style={styles.headerButton}
            onPress={() => setBlockModalVisible(true)}
            hitSlop={10}>
            <Ionicons name="ban-outline" size={22} color="#FF6B79" />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* PROFILE HERO */}

        <View style={styles.profileHero}>
          <View style={styles.heroGlow} />

          <Pressable
            style={styles.avatarWrapper}
            onPress={() => {
              if (user.profileImage) {
                setProfileImageVisible(true);
              }
            }}>
            {user.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={45} color={MUTED} />
              </View>
            )}

            {user.isOnline && <View style={styles.onlineIndicator} />}
          </Pressable>

          <View style={styles.nameRow}>
            <Text style={styles.fullName}>
              {user.fullName || user.username || "User"}
            </Text>

            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={19} color="#45A7FF" />
            )}
          </View>

          <Text style={styles.bio}>{user.bio || "No Bio provided."}</Text>

          {user.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={PRIMARY} />
              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          ) : null}

          {/* STATISTICS */}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.postsCount ?? 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followersCount ?? 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.followingCount ?? 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user.likesCount ?? 0}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* ACTIONS */}

          {!isOwnProfile && (
            <View style={styles.actionsContainer}>
              <Pressable
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton,
                ]}
                onPress={handleFollow}
                disabled={followLoading || followStatusLoading}>
                {followLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={isFollowing ? "checkmark" : "person-add-outline"}
                      size={18}
                      color="#FFFFFF"
                    />

                    <Text style={styles.followButtonText}>
                      {isFollowing ? "Following" : "Follow"}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable style={styles.messageButton} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                <Text style={styles.messageButtonText}>Message</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* CONTENT TABS */}

        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}>
            <Ionicons
              name="grid-outline"
              size={18}
              color={activeTab === "posts" ? PRIMARY : MUTED}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.activeTabText,
              ]}>
              Posts
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === "about" && styles.activeTab]}
            onPress={() => setActiveTab("about")}>
            <Ionicons
              name="person-circle-outline"
              size={19}
              color={activeTab === "about" ? PRIMARY : MUTED}
            />

            <Text
              style={[
                styles.tabText,
                activeTab === "about" && styles.activeTabText,
              ]}>
              About
            </Text>
          </Pressable>
        </View>

        {/* POSTS GRID */}

        {activeTab === "posts" && (
          <View style={styles.postsSection}>
            {postsLoading && posts.length === 0 ? (
              <View style={styles.postsLoading}>
                <ActivityIndicator color={PRIMARY} />
                <Text style={styles.loadingText}>Loading posts...</Text>
              </View>
            ) : postsError ? (
              <View style={styles.emptyPosts}>
                <Ionicons name="alert-circle-outline" size={32} color={MUTED} />

                <Text style={styles.emptyPostsText}>Could not load posts.</Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={() => refetchPosts()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : posts.length === 0 ? (
              <View style={styles.emptyPosts}>
                <View style={styles.emptyPostsIcon}>
                  <Ionicons name="images-outline" size={30} color={PRIMARY} />
                </View>

                <Text style={styles.emptyPostsTitle}>Nothing here yet</Text>

                <Text style={styles.emptyPostsText}>
                  Their shared moments will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.postsGrid}>
                {posts.map((post) => {
                  const imageUrl = post.media?.[0]?.url;

                  return (
                    <Pressable
                      key={post.id}
                      style={[
                        styles.postItem,
                        {
                          width: postSize,
                          height: postSize,
                        },
                      ]}
                      onPress={() => handlePostPress(post)}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.postImage}
                        />
                      ) : (
                        <View style={styles.textPost}>
                          <Text
                            style={styles.textPostCaption}
                            numberOfLines={5}>
                            {post.caption || "Post"}
                          </Text>
                        </View>
                      )}

                      {post.media && post.media.length > 1 && (
                        <View style={styles.multipleMediaIcon}>
                          <Ionicons
                            name="copy-outline"
                            size={17}
                            color="#FFFFFF"
                          />
                        </View>
                      )}

                      <View style={styles.postOverlay}>
                        <Ionicons name="heart" size={13} color="#FFFFFF" />

                        <Text style={styles.postOverlayText}>
                          {post.likesCount ?? 0}
                        </Text>

                        <Ionicons name="chatbubble" size={12} color="#FFFFFF" />

                        <Text style={styles.postOverlayText}>
                          {post.commentsCount ?? 0}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ABOUT PAGE */}

        {activeTab === "about" && (
          <View style={styles.aboutSection}>
            <View style={styles.aboutCard}>
              <View style={styles.aboutCardHeader}>
                <View>
                  <Text style={styles.aboutCardTitle}>The essentials</Text>

                  <Text style={styles.aboutCardSubtitle}>
                    A few things about them
                  </Text>
                </View>

                <Ionicons name="person-outline" size={22} color={PRIMARY} />
              </View>

              <View style={styles.aboutDetailGrid}>
                <View style={styles.aboutDetailItem}>
                  <View style={styles.aboutDetailIcon}>
                    <Ionicons name="person-outline" size={17} color={PRIMARY} />
                  </View>

                  <Text style={styles.detailLabel}>FULL NAME</Text>

                  <Text style={styles.detailValue}>
                    {user.fullName || "Not provided"}
                  </Text>
                </View>

                <View style={styles.aboutDetailItem}>
                  <View style={styles.aboutDetailIcon}>
                    <Ionicons name="at-outline" size={17} color={PRIMARY} />
                  </View>

                  <Text style={styles.detailLabel}>USERNAME</Text>

                  <Text style={styles.detailValue}>
                    {user.username ? `@${user.username}` : "Not provided"}
                  </Text>
                </View>

                <View style={styles.aboutDetailItem}>
                  <View style={styles.aboutDetailIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={17}
                      color={PRIMARY}
                    />
                  </View>

                  <Text style={styles.detailLabel}>AGE</Text>

                  <Text style={styles.detailValue}>
                    {user.age ? `${user.age} years` : "Not provided"}
                  </Text>
                </View>

                <View style={styles.aboutDetailItem}>
                  <View style={styles.aboutDetailIcon}>
                    <Ionicons
                      name="location-outline"
                      size={17}
                      color={PRIMARY}
                    />
                  </View>

                  <Text style={styles.detailLabel}>LOCATION</Text>

                  <Text style={styles.detailValue}>
                    {user.location || "Not provided"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* PROFILE IMAGE VIEWER */}

      <Modal
        visible={profileImageVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setProfileImageVisible(false)}>
        <View style={styles.imageModal}>
          <Pressable
            style={styles.imageCloseButton}
            onPress={() => setProfileImageVisible(false)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          {user.profileImage && (
            <Image
              source={{ uri: user.profileImage }}
              style={styles.fullProfileImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* BLOCK CONFIRMATION MODAL */}

      <Modal
        visible={blockModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!blockLoading) {
            setBlockModalVisible(false);
          }
        }}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <View style={styles.blockIconCircle}>
              <Ionicons name="ban" size={29} color="#FF6B79" />
            </View>

            <Text style={styles.confirmTitle}>Block this user?</Text>

            <Text style={styles.confirmDescription}>
              {user.fullName || user.username || "This user"} will no longer be
              able to interact with you. Their posts will also be hidden from
              your feed.
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelModalButton}
                onPress={() => setBlockModalVisible(false)}
                disabled={blockLoading}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.blockConfirmButton}
                onPress={handleBlockUser}
                disabled={blockLoading}>
                {blockLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="ban-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.blockConfirmText}>Block user</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN POST VIEWER */}

      <Modal
        visible={Boolean(selectedPost)}
        transparent={false}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={closePost}>
        <View style={styles.fullPostScreen}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={BACKGROUND}
            translucent={false}
          />

          <SafeAreaView style={styles.postSafeArea} edges={["top", "bottom"]}>
            <View style={styles.postModalHeader}>
              <Pressable style={styles.modalBackButton} onPress={closePost}>
                <Ionicons name="arrow-back" size={23} color="#FFFFFF" />
              </Pressable>

              <Text style={styles.postModalTitle}>Post</Text>

              <View style={styles.modalHeaderSpacer} />
            </View>

            {selectedPost && (
              <>
                <ScrollView
                  style={styles.postScroll}
                  contentContainerStyle={styles.postModalContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled">
                  {/* AUTHOR */}

                  <View style={styles.postAuthorRow}>
                    {user.profileImage ? (
                      <Image
                        source={{ uri: user.profileImage }}
                        style={styles.postAuthorAvatar}
                      />
                    ) : (
                      <View style={styles.postAuthorAvatarPlaceholder}>
                        <Ionicons name="person" size={18} color={MUTED} />
                      </View>
                    )}

                    <View style={styles.postAuthorInfo}>
                      <View style={styles.postAuthorNameRow}>
                        <Text style={styles.postAuthorName}>
                          {user.fullName || user.username}
                        </Text>

                        {user.isVerified && (
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#45A7FF"
                          />
                        )}
                      </View>

                      <Text style={styles.postDate}>
                        {formatDate(selectedPost.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* POST MEDIA */}

                  {selectedPost.media?.map((media, index) => (
                    <Image
                      key={`${media.url}-${index}`}
                      source={{ uri: media.url }}
                      style={styles.postModalImage}
                      resizeMode="contain"
                    />
                  ))}

                  {/* CAPTION */}

                  {selectedPost.caption ? (
                    <View style={styles.postCaptionSection}>
                      <Text style={styles.postModalCaption}>
                        {selectedPost.caption}
                      </Text>
                    </View>
                  ) : null}

                  {/* POST COUNTS */}

                  <View style={styles.postEngagement}>
                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="heart-outline"
                        size={19}
                        color={PRIMARY}
                      />

                      <Text style={styles.engagementText}>
                        {selectedPost.likesCount ?? 0} likes
                      </Text>
                    </View>

                    <View style={styles.engagementItem}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={18}
                        color={PRIMARY}
                      />

                      <Text style={styles.engagementText}>
                        {comments.length} comments
                      </Text>
                    </View>
                  </View>

                  {/* COMMENTS */}

                  <View style={styles.commentsSection}>
                    <View style={styles.commentsSectionHeader}>
                      <Text style={styles.commentsSectionTitle}>Comments</Text>
                    </View>

                    {commentsLoading && comments.length === 0 ? (
                      <View style={styles.commentsLoading}>
                        <ActivityIndicator color={PRIMARY} />

                        <Text style={styles.loadingText}>
                          Loading comments...
                        </Text>
                      </View>
                    ) : commentsError ? (
                      <View style={styles.commentsError}>
                        <Text style={styles.emptyCommentsText}>
                          Couldn't load comments.
                        </Text>

                        <Pressable
                          onPress={() => refetchComments()}
                          style={styles.retryButton}>
                          <Text style={styles.retryText}>Try again</Text>
                        </Pressable>
                      </View>
                    ) : comments.length === 0 ? (
                      <View style={styles.emptyComments}>
                        <Ionicons
                          name="chatbubbles-outline"
                          size={27}
                          color={PRIMARY}
                        />

                        <Text style={styles.emptyCommentsTitle}>
                          Start the conversation
                        </Text>

                        <Text style={styles.emptyCommentsText}>
                          Be the first to leave a comment.
                        </Text>
                      </View>
                    ) : (
                      comments.map((comment) => {
                        const isOwnComment =
                          Boolean(currentUserId) &&
                          comment.author?.id === currentUserId;

                        return (
                          <View key={comment.id} style={styles.commentRow}>
                            {/* COMMENTER AVATAR - NAVIGATES TO PROFILE */}

                            <Pressable
                              onPress={() =>
                                handleCommentUserPress(comment.author?.id)
                              }
                              disabled={!comment.author?.id}
                              style={styles.commentAvatarPressable}>
                              {comment.author?.profileImage ? (
                                <Image
                                  source={{
                                    uri: comment.author.profileImage,
                                  }}
                                  style={styles.commentAvatar}
                                />
                              ) : (
                                <View style={styles.commentAvatarPlaceholder}>
                                  <Ionicons
                                    name="person"
                                    size={16}
                                    color={MUTED}
                                  />
                                </View>
                              )}
                            </Pressable>

                            <View style={styles.commentContent}>
                              <View style={styles.commentBubble}>
                                {/* COMMENTER NAME - NAVIGATES TO PROFILE */}

                                <View style={styles.commentTopRow}>
                                  <Pressable
                                    onPress={() =>
                                      handleCommentUserPress(comment.author?.id)
                                    }
                                    disabled={!comment.author?.id}>
                                    <Text style={styles.commentAuthor}>
                                      {comment.author?.fullName ||
                                        comment.author?.username ||
                                        "User"}
                                    </Text>
                                  </Pressable>

                                  {isOwnComment && (
                                    <View style={styles.youBadge}>
                                      <Text style={styles.youLabel}>YOU</Text>
                                    </View>
                                  )}
                                </View>

                                {/* COMMENT TEXT - OWN COMMENTS OPEN ACTIONS */}

                                <Pressable
                                  onPress={() => {
                                    if (isOwnComment) {
                                      handleOwnCommentPress(comment);
                                    }
                                  }}
                                  disabled={!isOwnComment}
                                  style={({ pressed }) => [
                                    styles.commentTextPressable,
                                    pressed &&
                                      isOwnComment &&
                                      styles.commentBubblePressed,
                                  ]}>
                                  <Text style={styles.commentText}>
                                    {comment.text}
                                  </Text>
                                </Pressable>
                              </View>

                              <View style={styles.commentMeta}>
                                <Text style={styles.commentTime}>
                                  {formatTime(comment.createdAt)}
                                </Text>

                                {/* {isOwnComment && (
                                  <Text style={styles.editHintText}>
                                    Tap your comment to manage
                                  </Text>
                                )} */}
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </ScrollView>

                {/* FIXED COMMENT INPUT */}

                <View style={styles.commentInputArea}>
                  {editingComment && (
                    <View style={styles.editingNotice}>
                      <View style={styles.editingNoticeLeft}>
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={PRIMARY}
                        />

                        <Text style={styles.editingNoticeText}>
                          Editing your comment
                        </Text>
                      </View>

                      <Pressable
                        onPress={() => {
                          setEditingComment(null);
                          setCommentText("");
                        }}>
                        <Ionicons
                          name="close-circle"
                          size={19}
                          color={PRIMARY}
                        />
                      </Pressable>
                    </View>
                  )}

                  <View style={styles.commentInputRow}>
                    {meData?.me?.profileImage ? (
                      <Image
                        source={{ uri: meData.me.profileImage }}
                        style={styles.commentInputAvatar}
                      />
                    ) : (
                      <View style={styles.commentInputAvatarPlaceholder}>
                        <Ionicons name="person" size={16} color={MUTED} />
                      </View>
                    )}

                    <TextInput
                      style={styles.commentInput}
                      placeholder={
                        editingComment
                          ? "Edit your comment..."
                          : "Add a comment..."
                      }
                      placeholderTextColor={MUTED}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={1000}
                      textAlignVertical="center"
                    />

                    <Pressable
                      style={[
                        styles.sendCommentButton,
                        (!commentText.trim() ||
                          creatingComment ||
                          updatingComment) &&
                          styles.sendCommentDisabled,
                      ]}
                      onPress={handleSubmitComment}
                      disabled={
                        !commentText.trim() ||
                        creatingComment ||
                        updatingComment
                      }>
                      {creatingComment || updatingComment ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name={editingComment ? "checkmark" : "send"}
                          size={18}
                          color="#FFFFFF"
                        />
                      )}
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </SafeAreaView>

          {/* COMMENT OPTIONS OVERLAY */}

          {commentOptionsVisible && activeComment && (
            <View style={styles.commentOptionsOverlay} pointerEvents="box-none">
              <Pressable
                style={styles.commentOptionsBackdrop}
                onPress={closeCommentOptions}
              />

              <View style={styles.commentOptionsSheet}>
                <View style={styles.commentOptionsHandle} />

                <View style={styles.commentOptionsHeader}>
                  <View>
                    <Text style={styles.commentOptionsTitle}>Your comment</Text>

                    <Text style={styles.commentOptionsSubtitle}>
                      What would you like to do?
                    </Text>
                  </View>

                  <Pressable
                    style={styles.commentOptionsClose}
                    onPress={closeCommentOptions}
                    hitSlop={10}>
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* DELETE */}

                <Pressable
                  style={styles.commentOption}
                  onPress={handleDeleteComment}
                  disabled={deleteLoading}>
                  <View style={styles.deleteOptionIcon}>
                    <Ionicons name="trash-outline" size={21} color="#FF6B79" />
                  </View>

                  <View style={styles.commentOptionTextContainer}>
                    <Text style={styles.deleteOptionTitle}>Delete comment</Text>

                    <Text style={styles.commentOptionDescription}>
                      Permanently remove this comment
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                </Pressable>

                <Pressable
                  style={styles.commentOptionsCancel}
                  onPress={closeCommentOptions}>
                  <Text style={styles.commentOptionsCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* DELETE CONFIRMATION OVERLAY */}

          {deleteConfirmVisible && activeComment && (
            <View style={styles.commentOptionsOverlay} pointerEvents="box-none">
              <Pressable
                style={styles.commentOptionsBackdrop}
                onPress={cancelDeleteComment}
                disabled={deleteLoading}
              />

              <View style={styles.commentOptionsSheet}>
                <View style={styles.commentOptionsHandle} />

                <View style={styles.deleteConfirmIcon}>
                  <Ionicons name="trash-outline" size={27} color="#FF6B79" />
                </View>

                <Text style={styles.deleteConfirmTitle}>
                  Delete this comment?
                </Text>

                <Text style={styles.deleteConfirmDescription}>
                  This comment will be permanently removed. You cannot undo this
                  action.
                </Text>

                <View style={styles.deleteConfirmActions}>
                  <Pressable
                    style={styles.commentOptionsCancel}
                    onPress={cancelDeleteComment}
                    disabled={deleteLoading}>
                    <Text style={styles.commentOptionsCancelText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={styles.confirmDeleteButton}
                    onPress={confirmDeleteComment}
                    disabled={deleteLoading}>
                    {deleteLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text style={styles.confirmDeleteText}>Delete</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centered: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  loadingText: {
    color: MUTED,
    fontSize: 12,
    marginTop: 9,
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 15,
  },
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // HEADER

  header: {
    height: 57,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  scrollContent: {
    paddingBottom: 45,
  },

  // PROFILE HERO

  profileHero: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 25,
    position: "relative",
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -105,
    width: 280,
    height: 240,
    borderRadius: 150,
    backgroundColor: "rgba(255,79,154,0.07)",
  },
  avatarWrapper: {
    width: 112,
    height: 112,
    borderRadius: 60,
    padding: 4,
    borderWidth: 2,
    borderColor: PRIMARY,
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    backgroundColor: CARD_LIGHT,
  },
  avatarPlaceholder: {
    flex: 1,
    borderRadius: 55,
    backgroundColor: CARD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: 10,
    backgroundColor: "#31C46C",
    borderWidth: 3,
    borderColor: BACKGROUND,
    bottom: 3,
    right: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    maxWidth: "90%",
  },
  fullName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "900",
    flexShrink: 1,
    textAlign: "center",
  },
  bio: {
    color: "#DCCFE2",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    maxWidth: 300,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  locationText: {
    color: MUTED,
    fontSize: 11,
  },
  statsContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingVertical: 17,
    marginTop: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },
  statLabel: {
    color: MUTED,
    fontSize: 10,
    marginTop: 5,
  },
  statDivider: {
    height: 30,
    width: 1,
    backgroundColor: BORDER,
  },
  actionsContainer: {
    flexDirection: "row",
    width: "100%",
    gap: 11,
    marginTop: 19,
  },
  followButton: {
    flex: 1,
    height: 47,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  followingButton: {
    backgroundColor: CARD_LIGHT,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  followButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  messageButton: {
    flex: 1,
    height: 47,
    borderRadius: 13,
    backgroundColor: CARD_LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  messageButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  // TABS

  tabsContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: PRIMARY,
  },
  tabText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },
  activeTabText: {
    color: PRIMARY,
  },

  // POSTS

  postsSection: {
    paddingTop: 22,
  },
  postsLoading: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  postsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    paddingHorizontal: 16,
  },
  postItem: {
    backgroundColor: CARD_LIGHT,
    overflow: "hidden",
    position: "relative",
    borderRadius: 5,
  },
  postImage: {
    width: "100%",
    height: "80%",
    backgroundColor: CARD_LIGHT,
  },
  textPost: {
    flex: 1,
    // backgroundColor: CARD_LIGHT,
    backgroundColor: "#121212",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  textPostCaption: {
    color: "#EADDEB",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  multipleMediaIcon: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  postOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: 8,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  postOverlayText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    marginRight: 5,
  },
  emptyPosts: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  emptyPostsIcon: {
    width: 61,
    height: 61,
    borderRadius: 31,
    backgroundColor: "rgba(255,79,154,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyPostsTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyPostsText: {
    color: MUTED,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: "rgba(255,79,154,0.12)",
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },

  // ABOUT

  aboutSection: {
    padding: 16,
  },
  aboutCard: {
    backgroundColor: CARD,
    borderRadius: 19,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
  },
  aboutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  aboutCardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  aboutCardSubtitle: {
    color: MUTED,
    fontSize: 10,
    marginTop: 5,
  },
  aboutDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  aboutDetailItem: {
    width: "48%",
    minHeight: 112,
    backgroundColor: CARD_LIGHT,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  aboutDetailIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "rgba(255,79,154,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  detailLabel: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "400",
    letterSpacing: 1,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 5,
  },

  // IMAGE MODAL

  imageModal: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  imageCloseButton: {
    position: "absolute",
    top: 55,
    right: 22,
    zIndex: 5,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#242424",
    alignItems: "center",
    justifyContent: "center",
  },
  fullProfileImage: {
    width: "100%",
    height: "75%",
  },

  // BLOCK CONFIRMATION MODAL

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.76)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },
  confirmModal: {
    width: "100%",
    backgroundColor: "#1B1025",
    borderRadius: 23,
    padding: 23,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  blockIconCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "rgba(255,107,121,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },
  confirmTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },
  confirmDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  cancelModalButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: CARD_LIGHT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelModalText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  blockConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#D94B60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  blockConfirmText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // FULL-SCREEN POST VIEWER

  fullPostScreen: {
    flex: 1,
    // backgroundColor: BACKGROUND,
    backgroundColor: "#121212",
    position: "relative",
  },
  postSafeArea: {
    flex: 1,
    // backgroundColor: BACKGROUND,
    backgroundColor: "#121212",
  },
  postModalHeader: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  postModalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  modalHeaderSpacer: {
    width: 40,
  },
  postScroll: {
    flex: 1,
  },
  postModalContent: {
    paddingBottom: 25,
  },
  postAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 11,
  },
  postAuthorAvatar: {
    width: 41,
    height: 41,
    borderRadius: 22,
    backgroundColor: CARD_LIGHT,
  },
  postAuthorAvatarPlaceholder: {
    width: 41,
    height: 41,
    borderRadius: 22,
    backgroundColor: CARD_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  postAuthorInfo: {
    flex: 1,
  },
  postAuthorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  postAuthorName: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  postDate: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  postModalImage: {
    width: "100%",
    height: 370,
    // backgroundColor: "#08050B",
    backgroundColor: "#121212",
  },
  postCaptionSection: {
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  postCaptionAuthor: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  postModalCaption: {
    color: "#E5DAE9",
    fontSize: 12,
    lineHeight: 20,
    flexShrink: 1,
  },
  postEngagement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BORDER,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  engagementText: {
    color: "#E8DDEA",
    fontSize: 11,
    fontWeight: "700",
  },

  // COMMENTS

  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 19,
    paddingBottom: 18,
    backgroundColor: "#121212",
  },
  commentsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 18,
  },
  commentsSectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  commentsSectionCount: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: "800",
  },
  commentsLoading: {
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  commentsError: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyComments: {
    paddingVertical: 25,
    alignItems: "center",
  },
  emptyCommentsTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyCommentsText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 17,
  },
  commentAvatarPressable: {
    borderRadius: 20,
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: CARD_LIGHT,
  },
  commentAvatarPlaceholder: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: CARD_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },
  commentAuthor: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  youBadge: {
    backgroundColor: "rgba(255,79,154,0.13)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  youLabel: {
    color: PRIMARY,
    fontSize: 8,
    fontWeight: "900",
  },
  commentTextPressable: {
    borderRadius: 5,
  },
  commentText: {
    color: "#E4D9E8",
    fontSize: 12,
    lineHeight: 19,
  },
  commentBubblePressed: {
    backgroundColor: "#2B1837",
    opacity: 0.85,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
    paddingTop: 7,
    flexWrap: "wrap",
    gap: 5,
  },
  commentTime: {
    color: MUTED,
    fontSize: 10,
  },
  editHintText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: "700",
  },

  // COMMENT INPUT

  commentInputArea: {
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#180E22",
  },
  editingNotice: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,79,154,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    marginBottom: 9,
  },
  editingNoticeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  editingNoticeText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: "700",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  commentInputAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CARD_LIGHT,
  },
  commentInputAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CARD_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 95,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 12,
  },
  sendCommentButton: {
    width: 40,
    height: 40,
    borderRadius: 21,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCommentDisabled: {
    opacity: 0.4,
  },

  // COMMENT OPTIONS OVERLAY

  commentOptionsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    justifyContent: "flex-end",
  },
  commentOptionsBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.68)",
  },
  commentOptionsSheet: {
    width: "100%",
    backgroundColor: "#1B1025",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: BORDER,
    zIndex: 10000,
    elevation: 10000,
  },
  commentOptionsHandle: {
    width: 39,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#66556F",
    alignSelf: "center",
    marginBottom: 20,
  },
  commentOptionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  commentOptionsTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },
  commentOptionsSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  commentOptionsClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CARD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  commentOption: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap: 12,
  },
  editOptionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "rgba(255,79,154,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteOptionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "rgba(255,107,121,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  commentOptionTextContainer: {
    flex: 1,
  },
  commentOptionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  deleteOptionTitle: {
    color: "#FF7785",
    fontSize: 13,
    fontWeight: "800",
  },
  commentOptionDescription: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  commentOptionsCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: CARD_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
  },
  commentOptionsCancelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // DELETE CONFIRMATION

  deleteConfirmIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,107,121,0.12)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 17,
  },
  deleteConfirmTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  deleteConfirmDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  deleteConfirmActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmDeleteButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#D94B60",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 17,
  },
  confirmDeleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});
