import { ME_QUERY } from "@/graphql/queries/user";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";
const PAGE_SIZE = 20;

type Media = { url: string; type: string };

type Author = {
  id: string;
  fullName: string;
  username?: string | null;
  profileImage?: string | null;
};

type Post = {
  id: string;
  authorId: string;
  caption?: string | null;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
};

type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
};

type PostsResponse = { posts: Post[] };
type CommentsResponse = { postComments: Comment[] };

type MeResponse = {
  me: {
    id: string;
    fullName: string;
    username: string | null;
    email: string;
    age: number | null;
    bio: string | null;
    profileImage: string | null;
    location: string | null;
    isVerified: boolean;
    isOnline: boolean;
    lastSeen: string | null;
    followersCount: number;
    followingCount: number;
    likesCount: number;
    postsCount: number;
    interests: string[];
    appearance: { theme: string; accentColor: string };
    privacy: {
      profileVisibility: string;
      showOnlineStatus: boolean;
      allowMessagesFrom: string;
      showAge: boolean;
    };
    createdAt: string;
    updatedAt: string;
  } | null;
};

type BlockedUsersResponse = {
  me: {
    id: string;
    blockedUsers: { id: string }[];
  } | null;
};

type FeedProps = { currentUserId?: string | null };

const GET_POSTS = gql`
  query GetPosts($limit: Int, $offset: Int) {
    posts(limit: $limit, offset: $offset) {
      id
      authorId
      caption
      media {
        url
        type
      }
      likesCount
      commentsCount
      isLiked
      isSaved
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

const GET_POST_COMMENTS = gql`
  query GetPostComments($postId: ID!, $limit: Int, $offset: Int) {
    postComments(postId: $postId, limit: $limit, offset: $offset) {
      id
      postId
      authorId
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

const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLiked
    }
  }
`;

const SAVE_POST = gql`
  mutation SavePost($postId: ID!) {
    savePost(postId: $postId)
  }
`;

const UNSAVE_POST = gql`
  mutation UnsavePost($postId: ID!) {
    unsavePost(postId: $postId)
  }
`;

const CREATE_COMMENT = gql`
  mutation CreateComment($postId: ID!, $text: String!) {
    createComment(postId: $postId, text: $text) {
      id
      postId
      authorId
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

const UPDATE_COMMENT = gql`
  mutation UpdateComment($id: ID!, $text: String!) {
    updateComment(id: $id, text: $text) {
      id
      postId
      authorId
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

const BLOCK_USER_MUTATION = gql`
  mutation BlockUser($userId: ID!) {
    blockUser(userId: $userId)
  }
`;

const GET_BLOCKED_USERS = gql`
  query GetBlockedUsers {
    me {
      id
      blockedUsers {
        id
      }
    }
  }
`;

const normalizeId = (value: unknown): string =>
  value == null ? "" : String(value).trim().toLowerCase();

const uniquePosts = (items: Post[]): Post[] => {
  const seen = new Set<string>();

  return (items ?? []).filter((post) => {
    if (!post?.id) return false;

    const id = normalizeId(post.id);
    if (seen.has(id)) return false;

    seen.add(id);
    return true;
  });
};

const formatTime = (dateString: string) => {
  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - created) / 1000));
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  return new Date(dateString).toLocaleDateString();
};

export default function Feed({ currentUserId }: FeedProps) {
  const navigation = useNavigation();

  const lastScrollY = useRef(0);
  const tabsHidden = useRef(false);

  const showTabs = () => {
    if (tabsHidden.current) {
      tabsHidden.current = false;
      navigation.setOptions({
        tabBarStyle: {
          backgroundColor: "#000000fa",
          borderTopColor: "#252525",
          borderTopWidth: 1,
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
      });
    }
  };

  const hideTabs = () => {
    if (!tabsHidden.current) {
      tabsHidden.current = true;
      navigation.setOptions({
        tabBarStyle: { display: "none" },
      });
    }
  };

  const { data, loading, error, refetch, fetchMore, networkStatus } =
    useQuery<PostsResponse>(GET_POSTS, {
      variables: { limit: PAGE_SIZE, offset: 0 },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    });

  const { data: meData } = useQuery<MeResponse>(ME_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const { data: blockedUsersData, refetch: refetchBlockedUsers } =
    useQuery<BlockedUsersResponse>(GET_BLOCKED_USERS, {
      fetchPolicy: "cache-and-network",
    });

  const authenticatedUserId = normalizeId(meData?.me?.id ?? currentUserId);

  const [blockUserMutation] = useMutation(BLOCK_USER_MUTATION);
  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);
  const [savePost] = useMutation(SAVE_POST);
  const [unsavePost] = useMutation(UNSAVE_POST);
  const [createComment] = useMutation(CREATE_COMMENT);
  const [deleteComment] = useMutation(DELETE_COMMENT);
  const [updateComment] = useMutation(UPDATE_COMMENT);

  const [removedPostIds, setRemovedPostIds] = useState<Set<string>>(new Set());
  const [blockedAuthorIds, setBlockedAuthorIds] = useState<Set<string>>(
    new Set(),
  );
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [postMenuPost, setPostMenuPost] = useState<Post | null>(null);

  const [expandedCaptionIds, setExpandedCaptionIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCommentIds, setExpandedCommentIds] = useState<Set<string>>(
    new Set(),
  );

  const [fullscreenImage, setFullscreenImage] = useState<{
    uri: string;
    postId: string;
  } | null>(null);

  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(
    null,
  );
  const [deleteConfirmComment, setDeleteConfirmComment] =
    useState<Comment | null>(null);
  const [commentActionTarget, setCommentActionTarget] =
    useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [savingCommentEdit, setSavingCommentEdit] = useState(false);
  const [hiddenCommentIds, setHiddenCommentIds] = useState<Set<string>>(
    new Set(),
  );

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const refreshingRef = useRef(false);

  const updateHasMore = useCallback((value: boolean) => {
    hasMoreRef.current = value;
    setHasMore(value);
  }, []);

  useEffect(() => {
    const blocked = blockedUsersData?.me?.blockedUsers;
    if (!blocked) return;

    setBlockedAuthorIds(
      new Set(blocked.map((user) => normalizeId(user.id)).filter(Boolean)),
    );
  }, [blockedUsersData]);

  const rawPosts = data?.posts ?? [];
  const deduplicatedPosts = uniquePosts(rawPosts);

  const posts = deduplicatedPosts.filter((post) => {
    const postId = normalizeId(post.id);
    const authorId = normalizeId(post.authorId || post.author?.id);

    return (
      !!authorId &&
      !removedPostIds.has(postId) &&
      !blockedAuthorIds.has(authorId)
    );
  });

  const {
    data: commentsData,
    loading: commentsQueryLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery<CommentsResponse>(GET_POST_COMMENTS, {
    variables: {
      postId: selectedPost?.id ?? "",
      limit: 50,
      offset: 0,
    },
    skip: !selectedPost,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const comments = (commentsData?.postComments ?? []).filter(
    (comment) => !hiddenCommentIds.has(normalizeId(comment.id)),
  );

  const hidePost = (post: Post) => {
    setRemovedPostIds((current) => new Set(current).add(normalizeId(post.id)));
    setPostMenuPost(null);
  };

  const executeBlockUser = async (userId: string) => {
    const targetId = normalizeId(userId);

    if (!targetId || targetId === authenticatedUserId) {
      Alert.alert("Cannot block user", "You cannot block yourself.");
      return;
    }

    if (blockingUserId) return;

    setBlockingUserId(targetId);

    // Hide the user's posts immediately.
    setBlockedAuthorIds((previous) => {
      const next = new Set(previous);
      next.add(targetId);
      return next;
    });

    let blockSaved = false;

    try {
      const result = await blockUserMutation({
        variables: { userId: userId.trim() },
      });

      if (result.data?.blockUser !== true) {
        throw new Error("The server did not confirm the block.");
      }

      blockSaved = true;
      setPostMenuPost(null);

      // The backend now filters this user's posts from the feed.
      try {
        await refetch({ limit: PAGE_SIZE, offset: 0 });
      } catch {
        // The block is already saved. A refresh failure must not undo it.
      }

      try {
        await refetchBlockedUsers();
      } catch {
        // Keep the locally updated blocked-user list.
      }

      Alert.alert(
        "User blocked",
        "Their posts will no longer appear in your feed.",
      );
    } catch (err: unknown) {
      if (!blockSaved) {
        // Restore local visibility only if the block mutation failed.
        setBlockedAuthorIds((previous) => {
          const next = new Set(previous);
          next.delete(targetId);
          return next;
        });

        Alert.alert(
          "Block failed",
          err instanceof Error
            ? err.message
            : "Could not block this user. Please try again.",
        );
      }
    } finally {
      setBlockingUserId(null);
    }
  };

  const requestBlockUser = (post: Post) => {
    setPostMenuPost(null);

    const targetUserId = String(post.authorId || post.author?.id || "").trim();

    if (!targetUserId || normalizeId(targetUserId) === authenticatedUserId) {
      Alert.alert("Not allowed", "You cannot block your own account.");
      return;
    }

    Alert.alert(
      "Block this user?",
      `You will no longer see posts from ${
        post.author?.fullName || post.author?.username || "this user"
      }.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block user",
          style: "destructive",
          onPress: () => void executeBlockUser(targetUserId),
        },
      ],
    );
  };

  const openUserProfile = (userId?: string | null) => {
    if (!userId) return;

    setCommentsVisible(false);
    setSelectedPost(null);
    setCommentText("");
    setDeleteConfirmComment(null);
    setCommentActionTarget(null);
    setEditingComment(null);

    if (normalizeId(userId) === authenticatedUserId) {
      router.push("/tabs/profile" as any);
      return;
    }

    router.push({
      pathname: "/user/[userId]",
      params: {
        userId: String(userId),
      },
    });
  };

  const toggleCaption = (postId: string) => {
    setExpandedCaptionIds((current) => {
      const next = new Set(current);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const toggleComment = (commentId: string) => {
    setExpandedCommentIds((current) => {
      const next = new Set(current);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);

    try {
      const result = await refetch({ limit: PAGE_SIZE, offset: 0 });
      updateHasMore((result.data?.posts?.length ?? 0) > 0);
    } catch {
      Alert.alert(
        "Refresh failed",
        "Unable to refresh your feed. Please try again.",
      );
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [refetch, updateHasMore]);

  const handleLoadMore = useCallback(async () => {
    const currentPosts = data?.posts ?? [];

    if (
      !hasMoreRef.current ||
      loadingMoreRef.current ||
      refreshingRef.current ||
      loading ||
      networkStatus === 4 ||
      currentPosts.length === 0
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const offset = currentPosts.length;
    let hasMoreFromBackend = false;

    try {
      await fetchMore({
        variables: { limit: PAGE_SIZE, offset },
        updateQuery: (previous, { fetchMoreResult }) => {
          const previousPosts = previous?.posts ?? [];
          const incomingPosts = fetchMoreResult?.posts ?? [];

          hasMoreFromBackend = incomingPosts.length > 0;

          if (incomingPosts.length === 0) return previous;

          return {
            ...previous,
            posts: uniquePosts([...previousPosts, ...incomingPosts]),
          };
        },
      });

      updateHasMore(hasMoreFromBackend);
    } catch {
      Alert.alert("Unable to load posts", "Please try again.");
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [data?.posts, fetchMore, loading, networkStatus, updateHasMore]);

  const openComments = (post: Post) => {
    setSelectedPost(post);
    setCommentText("");
    setDeleteConfirmComment(null);
    setCommentsVisible(true);
  };

  const closeComments = () => {
    if (deletingCommentId || commentLoading) return;

    setCommentsVisible(false);
    setSelectedPost(null);
    setCommentText("");
    setDeleteConfirmComment(null);
  };

  const handleLike = async (post: Post) => {
    try {
      if (post.isLiked) {
        await unlikePost({
          variables: { postId: post.id },
          optimisticResponse: {
            unlikePost: {
              __typename: "Post",
              id: post.id,
              likesCount: Math.max(0, post.likesCount - 1),
              isLiked: false,
            },
          },
        });
      } else {
        await likePost({
          variables: { postId: post.id },
          optimisticResponse: {
            likePost: {
              __typename: "Post",
              id: post.id,
              likesCount: post.likesCount + 1,
              isLiked: true,
            },
          },
        });
      }
    } catch {
      Alert.alert(
        "Like failed",
        "Unable to update your like. Please try again.",
      );
      try {
        await refetch({ limit: PAGE_SIZE, offset: 0 });
      } catch {
        // Keep the current feed if the refresh also fails.
      }
    }
  };

  const handleSave = async (post: Post) => {
    try {
      if (post.isSaved) {
        await unsavePost({ variables: { postId: post.id } });
      } else {
        await savePost({ variables: { postId: post.id } });
      }

      await refetch({ limit: PAGE_SIZE, offset: 0 });
    } catch {
      Alert.alert(
        "Save failed",
        "Unable to update the saved post. Please try again.",
      );
    }
  };

  const handleCreateComment = async () => {
    if (!selectedPost || commentLoading) return;

    const cleanText = commentText.trim();
    if (!cleanText) return;

    if (cleanText.length > 1000) {
      Alert.alert(
        "Comment too long",
        "Your comment cannot exceed 1000 characters.",
      );
      return;
    }

    try {
      setCommentLoading(true);

      const result = await createComment({
        variables: { postId: selectedPost.id, text: cleanText },
      });

      if (!result.data?.createComment) {
        throw new Error("The server did not return the new comment.");
      }

      setCommentText("");

      await Promise.all([
        refetchComments(),
        refetch({ limit: PAGE_SIZE, offset: 0 }),
      ]);
    } catch (err: unknown) {
      Alert.alert(
        "Comment failed",
        err instanceof Error ? err.message : "Unable to create comment.",
      );
    } finally {
      setCommentLoading(false);
    }
  };

  const isCommentOwner = (comment: Comment) =>
    !!authenticatedUserId &&
    normalizeId(comment.authorId) === authenticatedUserId;

  const handleCommentPress = (comment: Comment) => {
    if (!isCommentOwner(comment) || deletingCommentId) return;
    setCommentActionTarget(comment);
  };

  const handleCommentLongPress = (comment: Comment) => {
    if (!isCommentOwner(comment) || deletingCommentId) return;
    setDeleteConfirmComment(comment);
  };

  const hideOwnComment = (comment: Comment) => {
    if (!isCommentOwner(comment)) return;

    setHiddenCommentIds((current) =>
      new Set(current).add(normalizeId(comment.id)),
    );
    setCommentActionTarget(null);
  };

  const beginEditComment = (comment: Comment) => {
    if (!isCommentOwner(comment)) return;

    setCommentActionTarget(null);
    setEditingComment(comment);
    setEditCommentText(comment.text);
  };

  const saveEditedComment = async () => {
    if (!editingComment || savingCommentEdit) return;

    const cleanText = editCommentText.trim();

    if (!cleanText) {
      Alert.alert("Comment required", "Your comment cannot be empty.");
      return;
    }

    if (cleanText.length > 1000) {
      Alert.alert(
        "Comment too long",
        "Your comment cannot exceed 1000 characters.",
      );
      return;
    }

    if (!isCommentOwner(editingComment)) {
      Alert.alert("Not allowed", "You can only edit your own comments.");
      return;
    }

    try {
      setSavingCommentEdit(true);

      const result = await updateComment({
        variables: { id: editingComment.id, text: cleanText },
      });

      if (!result.data?.updateComment) {
        throw new Error("The server did not return the updated comment.");
      }

      setEditingComment(null);
      setEditCommentText("");
      await refetchComments();
    } catch (err: unknown) {
      Alert.alert(
        "Edit failed",
        err instanceof Error
          ? err.message
          : "Unable to update your comment. Check your backend updateComment resolver.",
      );
    } finally {
      setSavingCommentEdit(false);
    }
  };

  const executeDeleteComment = async (comment: Comment) => {
    if (!isCommentOwner(comment)) {
      Alert.alert("Not allowed", "You can only delete your own comments.");
      return;
    }

    try {
      setDeletingCommentId(comment.id);

      const result = await deleteComment({
        variables: { id: comment.id },
      });

      if (!result.data?.deleteComment) {
        throw new Error("The server did not confirm the deletion.");
      }

      setDeleteConfirmComment(null);

      await Promise.all([
        refetchComments(),
        refetch({ limit: PAGE_SIZE, offset: 0 }),
      ]);
    } catch (err: unknown) {
      Alert.alert(
        "Delete failed",
        err instanceof Error ? err.message : "Unable to delete comment.",
      );
    } finally {
      setDeletingCommentId(null);
    }
  };

  const confirmDeleteComment = async () => {
    if (!deleteConfirmComment || deletingCommentId) return;
    await executeDeleteComment(deleteConfirmComment);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const authorName = item.author?.fullName || item.author?.username || "User";
    const username = item.author?.username;
    const avatar = item.author?.profileImage || "https://i.pravatar.cc/150";
    const mediaItems = Array.isArray(item.media) ? item.media : [];
    const caption = item.caption?.trim() ?? "";
    const captionExpanded = expandedCaptionIds.has(String(item.id));
    const captionCanExpand = caption.length > 140;
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.userRow}>
            <TouchableOpacity
              onPress={() => openUserProfile(item.author?.id || item.authorId)}
              activeOpacity={0.75}>
              <Image source={{ uri: avatar }} style={styles.avatar} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => openUserProfile(item.author?.id || item.authorId)}
              activeOpacity={0.75}>
              <Text style={styles.name} numberOfLines={1}>
                {authorName}
              </Text>
              {/* {!!username && (
                <Text style={styles.postUsername} numberOfLines={1}>
                  @{username}
                </Text>
              )} */}
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.postMenuButton}
            onPress={() => setPostMenuPost(item)}
            accessibilityRole="button"
            accessibilityLabel="Post options">
            <Ionicons name="ellipsis-horizontal" size={21} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {!!caption && (
          <View style={styles.captionContainer}>
            <Text
              style={styles.caption}
              numberOfLines={captionExpanded ? undefined : 3}>
              {caption}
            </Text>

            {captionCanExpand && (
              <TouchableOpacity onPress={() => toggleCaption(String(item.id))}>
                <Text style={styles.captionToggle}>
                  {captionExpanded ? "Show less" : "Show more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {mediaItems.map((media, index) =>
          media.type?.toLowerCase() === "image" ? (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              activeOpacity={0.92}
              onPress={() =>
                setFullscreenImage({
                  uri: media.url,
                  postId: String(item.id),
                })
              }>
              <Image
                source={{ uri: media.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : null,
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => handleLike(item)}
            activeOpacity={0.7}>
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={25}
              color={item.isLiked ? PRIMARY : "#FFFFFF"}
            />
            <Text style={styles.actionText}>{item.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.action}
            onPress={() => openComments(item)}
            activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={23} color="#FFFFFF" />
            <Text style={styles.actionText}>{item.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.action} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={23} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.actionSpacer} />

          <TouchableOpacity
            onPress={() => handleSave(item)}
            activeOpacity={0.7}>
            <Ionicons
              name={item.isSaved ? "bookmark" : "bookmark-outline"}
              size={23}
              color={item.isSaved ? PURPLE : "#FFFFFF"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !data?.posts) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={PRIMARY} />
        {/* <Text style={styles.loadingText}>Loading posts...</Text> */}
      </View>
    );
  }

  if (error && !data?.posts) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={45} color="#777" />
        <Text style={styles.errorTitle}>Couldn't load posts</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleFeedScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
  };
  // function handleFeedScroll(
  //   event: NativeSyntheticEvent<NativeScrollEvent>,
  // ): void {
  //   throw new Error("Function not implemented.");
  // }

  return (
    <>
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPost}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onScroll={handleFeedScroll}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={55} color="#555" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first person to share something with the community.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={PRIMARY} />
            </View>
          ) : !hasMore && posts.length > 0 ? (
            <View style={styles.endOfFeed}>
              <Text style={styles.endOfFeedText}>You're all caught up</Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent
        onRequestClose={closeComments}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.commentsHeader}>
              <View style={styles.commentsHeaderLeft}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <Text style={styles.commentsSubtitle}>
                  {comments.length}{" "}
                  {comments.length === 1 ? "comment" : "comments"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeComments}
                style={styles.closeButton}>
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {commentsQueryLoading && !commentsData ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            ) : commentsError ? (
              <View style={styles.commentsLoading}>
                <Ionicons name="cloud-offline-outline" size={40} color="#777" />
                <Text style={styles.errorText}>{commentsError.message}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => void refetchComments()}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <View style={styles.emptyCommentIcon}>
                  <Ionicons name="chatbubble-outline" size={28} color="#777" />
                </View>
                <Text style={styles.noCommentsTitle}>No comments yet</Text>
                <Text style={styles.noCommentsText}>
                  Start the conversation.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.commentsList}
                contentContainerStyle={styles.commentsListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                {comments.map((comment) => {
                  const name =
                    comment.author?.fullName ||
                    comment.author?.username ||
                    "User";
                  const username = comment.author?.username;
                  const commentAvatar =
                    comment.author?.profileImage || "https://i.pravatar.cc/150";
                  const own = isCommentOwner(comment);
                  const deleting = deletingCommentId === comment.id;
                  const expanded = expandedCommentIds.has(String(comment.id));

                  return (
                    <View key={comment.id} style={styles.commentRow}>
                      <TouchableOpacity
                        onPress={() =>
                          openUserProfile(
                            comment.author?.id || comment.authorId,
                          )
                        }>
                        <Image
                          source={{ uri: commentAvatar }}
                          style={styles.commentAvatar}
                        />
                      </TouchableOpacity>

                      <Pressable
                        onPress={() => handleCommentPress(comment)}
                        onLongPress={() => handleCommentLongPress(comment)}
                        delayLongPress={400}
                        disabled={deleting}
                        style={({ pressed }) => [
                          styles.commentContent,
                          pressed && own && styles.commentPressed,
                        ]}>
                        <View style={styles.commentHeaderRow}>
                          <TouchableOpacity
                            style={styles.commentAuthorBlock}
                            onPress={() =>
                              openUserProfile(
                                comment.author?.id || comment.authorId,
                              )
                            }>
                            <View style={styles.authorNameRow}>
                              <Text
                                style={styles.commentAuthor}
                                numberOfLines={1}>
                                {name}
                              </Text>
                              {own && (
                                <View style={styles.youBadge}>
                                  <Text style={styles.youBadgeText}>You</Text>
                                </View>
                              )}
                            </View>
                            {/* {!!username && (
                              <Text
                                style={styles.commentUsername}
                                numberOfLines={1}>
                                @{username}
                              </Text>
                            )} */}
                          </TouchableOpacity>

                          <Text style={styles.commentTime}>
                            {formatTime(comment.createdAt)}
                          </Text>
                        </View>

                        <Text
                          style={styles.commentText}
                          numberOfLines={expanded ? undefined : 4}>
                          {comment.text}
                        </Text>

                        {comment.text.length > 180 && (
                          <TouchableOpacity
                            onPress={() => toggleComment(String(comment.id))}>
                            <Text style={styles.commentToggle}>
                              {expanded ? "Show less" : "Show more"}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {deleting && (
                          <View style={styles.deletingComment}>
                            <ActivityIndicator size="small" color={PRIMARY} />
                            <Text style={styles.deletingCommentText}>
                              Deleting...
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.commentInputContainer}>
              <View style={styles.commentInputWrapper}>
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="#666666"
                  multiline
                  maxLength={1000}
                  style={styles.commentInput}
                  editable={!commentLoading}
                />
                {commentText.length > 0 && (
                  <Text style={styles.characterCount}>
                    {commentText.length}/1000
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={() => void handleCreateComment()}
                disabled={commentLoading || !commentText.trim()}
                style={[
                  styles.sendCommentButton,
                  (!commentText.trim() || commentLoading) &&
                    styles.sendCommentButtonDisabled,
                ]}>
                {commentLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!postMenuPost}
        transparent
        animationType="fade"
        onRequestClose={() => setPostMenuPost(null)}>
        <Pressable
          style={styles.postMenuOverlay}
          onPress={() => setPostMenuPost(null)}>
          <Pressable style={styles.postMenuSheet} onPress={() => {}}>
            <View style={styles.postMenuHandle} />
            <Text style={styles.postMenuTitle}>Post options</Text>

            <TouchableOpacity
              style={styles.postMenuOption}
              onPress={() => postMenuPost && hidePost(postMenuPost)}>
              <Ionicons name="eye-off-outline" size={21} color="#FFFFFF" />
              <View style={styles.postMenuOptionTextWrap}>
                <Text style={styles.postMenuOptionTitle}>Hide post</Text>
                <Text style={styles.postMenuOptionSubtitle}>
                  You won't see this post in your feed.
                </Text>
              </View>
            </TouchableOpacity>

            {postMenuPost &&
              normalizeId(postMenuPost.authorId || postMenuPost.author?.id) !==
                authenticatedUserId && (
                <TouchableOpacity
                  style={styles.postMenuOption}
                  disabled={!!blockingUserId}
                  onPress={() => requestBlockUser(postMenuPost)}>
                  {blockingUserId ===
                  normalizeId(
                    postMenuPost.authorId || postMenuPost.author?.id,
                  ) ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                  ) : (
                    <Ionicons name="ban-outline" size={21} color={PRIMARY} />
                  )}
                  <View style={styles.postMenuOptionTextWrap}>
                    <Text
                      style={[
                        styles.postMenuOptionTitle,
                        styles.blockUserOptionTitle,
                      ]}>
                      Block user
                    </Text>
                    <Text style={styles.postMenuOptionSubtitle}>
                      Stop seeing posts from this account.
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

            <TouchableOpacity
              style={styles.postMenuCancel}
              onPress={() => setPostMenuPost(null)}>
              <Text style={styles.postMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!fullscreenImage}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}>
        <View style={styles.fullscreenOverlay}>
          <View style={styles.fullscreenTopBar}>
            <TouchableOpacity
              style={styles.fullscreenIconButton}
              onPress={() => setFullscreenImage(null)}
              accessibilityRole="button"
              accessibilityLabel="Close image">
              <Ionicons name="close" size={25} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {fullscreenImage && (
            <Pressable style={styles.fullscreenImageArea}>
              <Image
                source={{ uri: fullscreenImage.uri }}
                style={styles.fullscreenImage}
                resizeMode="contain"
              />
            </Pressable>
          )}
        </View>
      </Modal>

      <Modal
        visible={!!commentActionTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setCommentActionTarget(null)}>
        <Pressable
          style={styles.postMenuOverlay}
          onPress={() => setCommentActionTarget(null)}>
          <Pressable style={styles.postMenuSheet} onPress={() => {}}>
            <View style={styles.postMenuHandle} />
            <Text style={styles.postMenuTitle}>Your comment</Text>

            <TouchableOpacity
              style={styles.postMenuOption}
              onPress={() =>
                commentActionTarget && beginEditComment(commentActionTarget)
              }>
              <Ionicons name="create-outline" size={21} color="#FFFFFF" />
              <View style={styles.postMenuOptionTextWrap}>
                <Text style={styles.postMenuOptionTitle}>Edit comment</Text>
                <Text style={styles.postMenuOptionSubtitle}>
                  Change what you wrote.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postMenuOption}
              onPress={() =>
                commentActionTarget && hideOwnComment(commentActionTarget)
              }>
              <Ionicons name="eye-off-outline" size={21} color="#FFFFFF" />
              <View style={styles.postMenuOptionTextWrap}>
                <Text style={styles.postMenuOptionTitle}>Hide comment</Text>
                <Text style={styles.postMenuOptionSubtitle}>
                  Hide it from this view on your device.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postMenuOption}
              onPress={() => {
                if (commentActionTarget) {
                  setDeleteConfirmComment(commentActionTarget);
                }
                setCommentActionTarget(null);
              }}>
              <Ionicons name="trash-outline" size={21} color={PRIMARY} />
              <View style={styles.postMenuOptionTextWrap}>
                <Text
                  style={[
                    styles.postMenuOptionTitle,
                    styles.blockUserOptionTitle,
                  ]}>
                  Delete comment
                </Text>
                <Text style={styles.postMenuOptionSubtitle}>
                  Remove it for everyone.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postMenuCancel}
              onPress={() => setCommentActionTarget(null)}>
              <Text style={styles.postMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!editingComment}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!savingCommentEdit) {
            setEditingComment(null);
            setEditCommentText("");
          }
        }}>
        <KeyboardAvoidingView
          style={styles.deleteModalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.editCommentModal}>
            <Text style={styles.deleteModalTitle}>Edit comment</Text>
            <TextInput
              value={editCommentText}
              onChangeText={setEditCommentText}
              multiline
              maxLength={1000}
              autoFocus
              placeholder="Update your comment..."
              placeholderTextColor="#777777"
              editable={!savingCommentEdit}
              style={styles.editCommentInput}
            />
            <Text style={styles.editCharacterCount}>
              {editCommentText.length}/1000
            </Text>
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                disabled={savingCommentEdit}
                onPress={() => {
                  setEditingComment(null);
                  setEditCommentText("");
                }}>
                <Text style={styles.cancelDeleteText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                disabled={savingCommentEdit || !editCommentText.trim()}
                onPress={() => void saveEditedComment()}>
                {savingCommentEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Save changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!deleteConfirmComment}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingCommentId) setDeleteConfirmComment(null);
        }}>
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIconContainer}>
              <Ionicons name="trash-outline" size={26} color={PRIMARY} />
            </View>

            <Text style={styles.deleteModalTitle}>Delete comment?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </Text>

            {!!deleteConfirmComment && (
              <View style={styles.commentPreview}>
                <View style={styles.previewHeader}>
                  <View style={styles.previewDot} />
                  <Text style={styles.previewLabel}>Your comment</Text>
                </View>
                <Text style={styles.commentPreviewText} numberOfLines={4}>
                  "{deleteConfirmComment.text}"
                </Text>
              </View>
            )}

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelDeleteButton}
                onPress={() => setDeleteConfirmComment(null)}
                disabled={!!deletingCommentId}>
                <Text style={styles.cancelDeleteText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={() => void confirmDeleteComment()}
                disabled={!!deletingCommentId}>
                {deletingCommentId === deleteConfirmComment?.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color="#FFFFFF"
                      style={styles.confirmDeleteIcon}
                    />
                    <Text style={styles.confirmDeleteText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingTop: 2, paddingBottom: 40 },
  card: {
    marginTop: 7,
    backgroundColor: "#212121",
    borderRadius: 2,
    overflow: "hidden",
    // marginHorizontal: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  userRow: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#292929",
  },
  userInfo: { marginLeft: 10, flex: 1, minWidth: 0 },
  name: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    flexShrink: 1,
    minWidth: 0,
  },
  postUsername: {
    color: "#9690A6",
    fontSize: 11,
    marginTop: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  postMenuButton: {
    flexShrink: 0,
    paddingLeft: 4,
    paddingVertical: 5,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  postMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },
  postMenuSheet: {
    backgroundColor: "#19102F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    borderTopWidth: 1,
    borderColor: "#30204A",
  },
  postMenuHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#55466B",
    alignSelf: "center",
    marginBottom: 16,
  },
  postMenuTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  postMenuOption: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#2A1D3E",
  },
  postMenuOptionTextWrap: { flex: 1 },
  postMenuOptionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  blockUserOptionTitle: { color: PRIMARY },
  postMenuOptionSubtitle: { color: "#A69AB9", fontSize: 12, marginTop: 4 },
  postMenuCancel: {
    marginTop: 14,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2A1D3E",
    alignItems: "center",
    justifyContent: "center",
  },
  postMenuCancelText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  time: { color: "#888888", fontSize: 12, marginTop: 2 },
  postImage: { width: "100%", height: 430, backgroundColor: "#222222" },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  action: { flexDirection: "row", alignItems: "center", marginRight: 18 },
  actionText: { color: "#FFFFFF", marginLeft: 5, fontWeight: "600" },
  actionSpacer: { flex: 1 },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    minWidth: 0,
  },
  caption: { color: "#FFFFFF", lineHeight: 22, fontSize: 14, flexShrink: 1 },
  captionToggle: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  center: {
    paddingVertical: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  loadingText: { color: "#888888", marginTop: 12, fontSize: 14 },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  errorText: {
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: PRIMARY,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 15,
  },
  emptyText: {
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 21,
  },
  footerLoader: { paddingVertical: 20 },
  endOfFeed: { alignItems: "center", paddingVertical: 20 },
  endOfFeedText: { color: "#777777", fontSize: 12 },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  commentsSheet: {
    height: "84%",
    backgroundColor: "#101010",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3A3A3A",
    alignSelf: "center",
    marginTop: 9,
    marginBottom: 3,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
  },
  commentsHeaderLeft: { flex: 1 },
  commentsTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  commentsSubtitle: { color: "#666666", fontSize: 12, marginTop: 4 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C1C",
    alignItems: "center",
    justifyContent: "center",
  },
  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  commentsList: { flex: 1 },
  commentsListContent: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 24,
  },
  noComments: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  emptyCommentIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#191919",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  noCommentsTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  noCommentsText: { color: "#666666", fontSize: 13, marginTop: 6 },
  commentRow: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1C",
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#202020",
  },
  commentContent: { flex: 1, marginLeft: 11, minWidth: 0, borderRadius: 8 },
  commentPressed: { opacity: 0.72, backgroundColor: "rgba(255,79,154,0.06)" },
  commentHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: 28,
  },
  commentAuthorBlock: { flex: 1, minWidth: 0 },
  authorNameRow: { flexDirection: "row", alignItems: "center" },
  commentAuthor: {
    color: "#F5F5F5",
    fontSize: 14,
    fontWeight: "700",
    maxWidth: "75%",
  },
  commentUsername: { color: "#666666", fontSize: 11, marginTop: 2 },
  youBadge: {
    marginLeft: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255,79,154,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,79,154,0.18)",
  },
  youBadgeText: { color: PRIMARY, fontSize: 9, fontWeight: "800" },
  commentTime: {
    // marginBottom: 10,
    color: "#5F5F5F",
    fontSize: 11,
    marginLeft: 8,
  },
  commentText: {
    color: "#CFCFCF",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    paddingRight: 8,
  },
  commentToggle: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 5,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
  },
  fullscreenTopBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 24,
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  fullscreenIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(35,35,35,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreenImageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: { width: "100%", height: "100%" },
  deletingComment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
  },
  deletingCommentText: { color: PRIMARY, fontSize: 11 },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: "#202020",
    backgroundColor: "#141414",
  },
  commentInputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: "#1E1E1E",
    borderRadius: 22,
    marginRight: 9,
    position: "relative",
    justifyContent: "center",
  },
  commentInput: {
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 16,
    paddingVertical: 11,
    paddingRight: 45,
    color: "#FFFFFF",
    fontSize: 14,
  },
  characterCount: {
    position: "absolute",
    right: 14,
    bottom: 7,
    color: "#555555",
    fontSize: 9,
  },
  sendCommentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCommentButtonDisabled: { opacity: 0.35 },
  editCommentModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#181818",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#292929",
  },
  editCommentInput: {
    minHeight: 110,
    maxHeight: 220,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#242424",
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  editCharacterCount: {
    color: "#777777",
    fontSize: 11,
    textAlign: "right",
    marginTop: 7,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  deleteModal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#181818",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: "#292929",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 15,
  },
  deleteIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,79,154,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,79,154,0.20)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 17,
  },
  deleteModalTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  deleteModalText: {
    color: "#8C8C8C",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 5,
  },
  commentPreview: {
    marginTop: 18,
    backgroundColor: "#202020",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2B2B2B",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PRIMARY,
    marginRight: 6,
  },
  previewLabel: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  commentPreviewText: {
    color: "#C8C8C8",
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  deleteModalActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#252525",
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  confirmDeleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteIcon: { marginRight: 7 },
  confirmDeleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
