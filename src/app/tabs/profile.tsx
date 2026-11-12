import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { removeToken } from "../../lib/apollo/auth";

/* =========================================================
   COLORS
========================================================= */

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";
const GOLD = "#FFD369";

const BACKGROUND = "#0F0623";
const CARD = "#19102F";
const CARD_2 = "#21153A";
const TEXT = "#FFFFFF";
const MUTED = "#AFA7BF";
const BORDER = "#302347";
const SUCCESS = "#35D07F";
const DANGER = "#FF5C75";

/* =========================================================
   GRAPHQL
========================================================= */

const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    fullName
    username
    email
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

    privacy {
      profileVisibility
      showOnlineStatus
      allowMessagesFrom
      showAge
    }

    appearance {
      theme
      accentColor
    }

    createdAt
    updatedAt
  }
`;

/* ---------------- ME ---------------- */

const ME_QUERY = gql`
  ${USER_FIELDS}

  query Me {
    me {
      ...UserFields
    }
  }
`;

/* ---------------- POSTS ---------------- */

const USER_POSTS_QUERY = gql`
  query UserPosts($userId: ID!, $limit: Int, $offset: Int) {
    userPosts(userId: $userId, limit: $limit, offset: $offset) {
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
        isVerified
      }
    }
  }
`;

/* ---------------- COMMENTS ---------------- */

const POST_COMMENTS_QUERY = gql`
  query PostComments($postId: ID!, $limit: Int, $offset: Int) {
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
        isVerified
      }
    }
  }
`;

/* ---------------- CREATE COMMENT ---------------- */

const CREATE_COMMENT_MUTATION = gql`
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
        isVerified
      }
    }
  }
`;

/* ---------------- DELETE COMMENT ---------------- */

const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

/* ---------------- CREATE POST ---------------- */

const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
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
        isVerified
      }
    }
  }
`;

/* ---------------- UPDATE PROFILE ---------------- */

const UPDATE_PROFILE_MUTATION = gql`
  ${USER_FIELDS}

  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
`;

/* ---------------- PRIVACY ---------------- */

const UPDATE_PRIVACY_MUTATION = gql`
  ${USER_FIELDS}

  mutation UpdatePrivacy($input: UpdatePrivacyInput!) {
    updatePrivacy(input: $input) {
      ...UserFields
    }
  }
`;

/* ---------------- DELETE POST ---------------- */

const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

/* ---------------- LIKE ---------------- */

const LIKE_POST_MUTATION = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likesCount
      isLiked
      isSaved
    }
  }
`;

/* ---------------- UNLIKE ---------------- */

const UNLIKE_POST_MUTATION = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likesCount
      isLiked
      isSaved
    }
  }
`;

/* ---------------- SAVE ---------------- */

const SAVE_POST_MUTATION = gql`
  mutation SavePost($postId: ID!) {
    savePost(postId: $postId)
  }
`;

/* ---------------- UNSAVE ---------------- */

const UNSAVE_POST_MUTATION = gql`
  mutation UnsavePost($postId: ID!) {
    unsavePost(postId: $postId)
  }
`;

/* =========================================================
   TYPES
========================================================= */

interface Privacy {
  profileVisibility?: string | null;
  showOnlineStatus?: boolean | null;
  allowMessagesFrom?: string | null;
  showAge?: boolean | null;
}

interface Appearance {
  theme?: string | null;
  accentColor?: string | null;
}

interface User {
  id: string;
  fullName: string;

  username?: string | null;
  email?: string | null;

  age?: number | null;
  bio?: string | null;
  location?: string | null;
  profileImage?: string | null;

  interests?: string[] | null;

  isVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string | null;

  followersCount?: number;
  followingCount?: number;
  likesCount?: number;
  postsCount?: number;

  privacy?: Privacy | null;
  appearance?: Appearance | null;

  createdAt?: string;
  updatedAt?: string;
}

interface Media {
  url: string;
  type?: string | null;
}

interface Post {
  id: string;
  authorId: string;

  caption?: string | null;

  media?: Media[] | null;

  likesCount?: number;
  commentsCount?: number;

  isLiked?: boolean;
  isSaved?: boolean;

  createdAt?: string;
  updatedAt?: string;

  author?: {
    id: string;
    fullName: string;
    username?: string | null;
    profileImage?: string | null;
    isVerified?: boolean;
  } | null;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  text: string;

  createdAt?: string;
  updatedAt?: string;

  author?: {
    id: string;
    fullName: string;
    username?: string | null;
    profileImage?: string | null;
    isVerified?: boolean;
  } | null;
}

/* =========================================================
   HELPERS
========================================================= */

const formatNumber = (value?: number | null) => {
  if (!value) return "0";

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return String(value);
};

const formatCommentTime = (date?: string) => {
  if (!date) return "";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return new Date(date).toLocaleDateString();
};

const isVideoMedia = (media?: Media | null) => {
  if (!media) return false;

  return (
    media.type?.toLowerCase() === "video" ||
    /\.(mp4|mov|webm|m4v)$/i.test(media.url)
  );
};

const isImageMedia = (media?: Media | null) => {
  if (!media) return false;

  return (
    media.type?.toLowerCase() === "image" ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(media.url)
  );
};

const isValidMedia = (url?: string | null) => {
  if (!url) return false;

  return /^https?:\/\/.+/i.test(url.trim());
};

/* =========================================================
   VIDEO
========================================================= */

const PostVideo = ({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (player) => {
    player.loop = true;
  });

  return (
    <View style={styles.mediaContainer}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="cover"
      />
    </View>
  );
};

/* =========================================================
   POST MEDIA
========================================================= */

const PostMedia = ({
  media,
  onPress,
}: {
  media: Media;
  onPress: () => void;
}) => {
  if (!isValidMedia(media.url)) {
    return null;
  }

  if (isVideoMedia(media)) {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.mediaContainer}>
        <PostVideo url={media.url} />
      </TouchableOpacity>
    );
  }

  if (isImageMedia(media)) {
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        style={styles.mediaContainer}>
        <Image
          source={{ uri: media.url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return null;
};

/* =========================================================
   PROFILE
========================================================= */

export default function Profile() {
  const apolloClient = useApolloClient();

  /* =======================================================
     QUERIES
  ======================================================= */

  const {
    data: meData,
    loading: meLoading,
    error: meError,
    refetch: refetchMe,
  } = useQuery<{ me: User }>(ME_QUERY, {
    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const user = meData?.me;

  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery<{ userPosts: Post[] }>(USER_POSTS_QUERY, {
    variables: {
      userId: user?.id,
      limit: 50,
      offset: 0,
    },

    skip: !user?.id,

    fetchPolicy: "network-only",
    nextFetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const posts = postsData?.userPosts ?? [];

  /* =======================================================
     COMMENTS QUERY
  ======================================================= */

  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery<{ postComments: Comment[] }>(POST_COMMENTS_QUERY, {
    variables: {
      postId: "",
      limit: 50,
      offset: 0,
    },

    skip: true,

    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  const comments = commentsData?.postComments ?? [];

  /* =======================================================
     MUTATIONS
  ======================================================= */

  const [createPost, { loading: creatingPost }] =
    useMutation(CREATE_POST_MUTATION);

  const [updateProfile, { loading: updatingProfile }] = useMutation(
    UPDATE_PROFILE_MUTATION,
  );

  const [updatePrivacy, { loading: updatingPrivacy }] = useMutation(
    UPDATE_PRIVACY_MUTATION,
  );

  const [deletePost, { loading: deletingPost }] =
    useMutation(DELETE_POST_MUTATION);

  const [likePost] = useMutation(LIKE_POST_MUTATION);

  const [unlikePost] = useMutation(UNLIKE_POST_MUTATION);

  const [savePost] = useMutation(SAVE_POST_MUTATION);

  const [unsavePost] = useMutation(UNSAVE_POST_MUTATION);

  const [createComment, { loading: creatingComment }] = useMutation(
    CREATE_COMMENT_MUTATION,
  );

  const [deleteComment, { loading: deletingComment }] = useMutation(
    DELETE_COMMENT_MUTATION,
  );

  /* =======================================================
     MODALS
  ======================================================= */

  const [settingsVisible, setSettingsVisible] = useState(false);

  const [privacyVisible, setPrivacyVisible] = useState(false);

  const [newPostVisible, setNewPostVisible] = useState(false);

  const [editProfileVisible, setEditProfileVisible] = useState(false);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const [fullscreenPostVisible, setFullscreenPostVisible] = useState(false);

  const [signOutConfirmVisible, setSignOutConfirmVisible] = useState(false);

  const [commentsVisible, setCommentsVisible] = useState(false);

  const [deleteCommentConfirmVisible, setDeleteCommentConfirmVisible] =
    useState(false);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

  /* =======================================================
     COMMENT STATE
  ======================================================= */

  const [commentText, setCommentText] = useState("");

  /* =======================================================
     POST FORM
  ======================================================= */

  const [caption, setCaption] = useState("");

  const [mediaUrl, setMediaUrl] = useState("");

  const [mediaType, setMediaType] = useState<"image" | "video">("image");

  /* =======================================================
     EDIT PROFILE
  ======================================================= */

  const [editFullName, setEditFullName] = useState("");

  const [editUsername, setEditUsername] = useState("");

  const [editAge, setEditAge] = useState("");

  const [editBio, setEditBio] = useState("");

  const [editLocation, setEditLocation] = useState("");

  const [editProfileImage, setEditProfileImage] = useState("");

  const [editInterests, setEditInterests] = useState("");

  /* =======================================================
     PRIVACY
  ======================================================= */

  const [privacyProfileVisibility, setPrivacyProfileVisibility] =
    useState("public");

  const [privacyShowOnlineStatus, setPrivacyShowOnlineStatus] = useState(true);

  const [privacyAllowMessagesFrom, setPrivacyAllowMessagesFrom] =
    useState("everyone");

  const [privacyShowAge, setPrivacyShowAge] = useState(true);

  /* =======================================================
     REFRESH
  ======================================================= */

  const [refreshing, setRefreshing] = useState(false);

  const refreshProfile = async () => {
    try {
      setRefreshing(true);

      console.log("Refreshing profile and posts...");

      if (!user?.id) {
        await refetchMe();
        return;
      }

      const results = await Promise.allSettled([
        refetchMe(),

        refetchPosts({
          userId: user.id,
          limit: 50,
          offset: 0,
        }),
      ]);

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.log(
            index === 0 ? "Profile refresh failed:" : "Posts refresh failed:",
            result.reason,
          );
        }
      });

      console.log("Profile refresh completed.");
    } catch (error) {
      console.log("Profile refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     OPEN COMMENTS
  ======================================================= */

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    setCommentText("");
    setCommentsVisible(true);

    try {
      await refetchComments({
        postId: post.id,
        limit: 50,
        offset: 0,
      });
    } catch (error) {
      console.log("Load comments error:", error);
    }
  };

  /* =======================================================
     CLOSE COMMENTS
  ======================================================= */

  const closeComments = () => {
    if (creatingComment || deletingComment) return;

    setCommentsVisible(false);
    setSelectedComment(null);
    setCommentText("");
  };

  /* =======================================================
     CREATE COMMENT
  ======================================================= */

  const handleCreateComment = async () => {
    if (!selectedPost) return;

    const text = commentText.trim();

    if (!text) {
      return;
    }

    if (!user?.id) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    try {
      await createComment({
        variables: {
          postId: selectedPost.id,
          text,
        },
      });

      setCommentText("");

      await Promise.all([
        refetchComments({
          postId: selectedPost.id,
          limit: 50,
          offset: 0,
        }),

        refetchPosts({
          userId: user.id,
          limit: 50,
          offset: 0,
        }),
      ]);

      console.log("Comment created successfully.");
    } catch (error: any) {
      console.log("Create comment error:", error);

      Alert.alert(
        "Comment failed",
        error?.message || "Could not add your comment.",
      );
    }
  };

  /* =======================================================
     OPEN DELETE COMMENT
  ======================================================= */

  const openDeleteCommentConfirm = (comment: Comment) => {
    if (!user?.id) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    const isOwner = String(comment.authorId) === String(user.id);

    console.log("========== DELETE COMMENT ==========");
    console.log("COMMENT ID:", comment.id);
    console.log("COMMENT AUTHOR ID:", comment.authorId);
    console.log("CURRENT USER ID:", user.id);
    console.log("IS OWNER:", isOwner);
    console.log("====================================");

    if (!isOwner) {
      Alert.alert("Not allowed", "You can only delete your own comments.");

      return;
    }

    setSelectedComment(comment);
    setDeleteCommentConfirmVisible(true);
  };

  /* =======================================================
     DELETE COMMENT
  ======================================================= */

  const handleDeleteComment = async () => {
    if (!selectedComment || !user?.id) return;

    const isOwner = String(selectedComment.authorId) === String(user.id);

    if (!isOwner) {
      setDeleteCommentConfirmVisible(false);

      Alert.alert("Not allowed", "You can only delete your own comments.");

      return;
    }

    try {
      console.log("Deleting comment:", selectedComment.id);

      await deleteComment({
        variables: {
          id: selectedComment.id,
        },
      });

      setDeleteCommentConfirmVisible(false);
      setSelectedComment(null);

      if (selectedPost) {
        await Promise.all([
          refetchComments({
            postId: selectedPost.id,
            limit: 50,
            offset: 0,
          }),

          refetchPosts({
            userId: user.id,
            limit: 50,
            offset: 0,
          }),
        ]);
      }

      console.log("Comment deleted successfully.");
    } catch (error: any) {
      console.log("Delete comment error:", error);

      Alert.alert(
        "Delete failed",
        error?.message || "Could not delete this comment.",
      );
    }
  };

  /* =======================================================
     OPEN EDIT PROFILE
  ======================================================= */

  const openEditProfile = () => {
    if (!user) return;

    setEditFullName(user.fullName || "");
    setEditUsername(user.username || "");

    setEditAge(
      user.age !== null && user.age !== undefined ? String(user.age) : "",
    );

    setEditBio(user.bio || "");
    setEditLocation(user.location || "");
    setEditProfileImage(user.profileImage || "");
    setEditInterests(user.interests?.join(", ") || "");

    setEditProfileVisible(true);
  };

  /* =======================================================
     UPDATE PROFILE
  ======================================================= */

  const handleUpdateProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Missing name", "Please enter your full name.");
      return;
    }

    const age = Number(editAge);

    if (editAge && (Number.isNaN(age) || age < 13)) {
      Alert.alert("Invalid age", "Age must be 13 or older.");
      return;
    }

    try {
      const interests = editInterests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await updateProfile({
        variables: {
          input: {
            fullName: editFullName.trim(),
            username: editUsername.trim() || null,
            age: editAge ? age : null,
            bio: editBio.trim() || null,
            location: editLocation.trim() || null,
            profileImage: editProfileImage.trim() || null,
            interests,
          },
        },
      });

      setEditProfileVisible(false);

      await refetchMe();

      Alert.alert(
        "Profile Updated",
        "Your profile has been updated successfully.",
      );
    } catch (error: any) {
      console.log("Update profile error:", error);

      Alert.alert(
        "Update failed",
        error?.message || "Could not update your profile.",
      );
    }
  };

  /* =======================================================
     OPEN PRIVACY
  ======================================================= */

  const openPrivacy = () => {
    const privacy = user?.privacy;

    setPrivacyProfileVisibility(privacy?.profileVisibility || "public");

    setPrivacyShowOnlineStatus(privacy?.showOnlineStatus ?? true);

    setPrivacyAllowMessagesFrom(privacy?.allowMessagesFrom || "everyone");

    setPrivacyShowAge(privacy?.showAge ?? true);

    setSettingsVisible(false);
    setPrivacyVisible(true);
  };

  /* =======================================================
     UPDATE PRIVACY
  ======================================================= */

  const handleUpdatePrivacy = async () => {
    try {
      await updatePrivacy({
        variables: {
          input: {
            profileVisibility: privacyProfileVisibility,
            showOnlineStatus: privacyShowOnlineStatus,
            allowMessagesFrom: privacyAllowMessagesFrom,
            showAge: privacyShowAge,
          },
        },
      });

      setPrivacyVisible(false);

      await refetchMe();

      Alert.alert("Privacy Updated", "Your privacy settings have been saved.");
    } catch (error: any) {
      console.log("Update privacy error:", error);

      Alert.alert(
        "Privacy update failed",
        error?.message || "Could not update your privacy settings.",
      );
    }
  };

  /* =======================================================
     CREATE POST
  ======================================================= */

  const openNewPost = () => {
    setCaption("");
    setMediaUrl("");
    setMediaType("image");

    setNewPostVisible(true);
  };

  const closeNewPost = () => {
    if (creatingPost) return;

    setNewPostVisible(false);

    setCaption("");
    setMediaUrl("");
    setMediaType("image");
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && !mediaUrl.trim()) {
      Alert.alert("Empty post", "Add a caption or media before publishing.");

      return;
    }

    if (mediaUrl.trim() && !isValidMedia(mediaUrl)) {
      Alert.alert(
        "Invalid media URL",
        "Please enter a valid image or video URL.",
      );

      return;
    }

    if (!user?.id) return;

    try {
      const media =
        mediaUrl.trim() && isValidMedia(mediaUrl)
          ? [
              {
                url: mediaUrl.trim(),
                type: mediaType,
              },
            ]
          : [];

      await createPost({
        variables: {
          input: {
            caption: caption.trim() || null,
            media,
          },
        },
      });

      closeNewPost();

      await Promise.all([
        refetchPosts({
          userId: user.id,
          limit: 50,
          offset: 0,
        }),

        refetchMe(),
      ]);

      Alert.alert("Published", "Your post has been published.");
    } catch (error: any) {
      console.log("Create post error:", error);

      Alert.alert(
        "Post failed",
        error?.message || "Could not publish your post.",
      );
    }
  };

  /* =======================================================
     LIKE / UNLIKE
  ======================================================= */

  const handleLikeToggle = async (post: Post) => {
    if (!user?.id) return;

    try {
      if (post.isLiked) {
        await unlikePost({
          variables: {
            postId: post.id,
          },
        });
      } else {
        await likePost({
          variables: {
            postId: post.id,
          },
        });
      }

      await refetchPosts({
        userId: user.id,
        limit: 50,
        offset: 0,
      });
    } catch (error) {
      console.log("Like toggle error:", error);
    }
  };

  /* =======================================================
     SAVE / UNSAVE
  ======================================================= */

  const handleSaveToggle = async (post: Post) => {
    if (!user?.id) return;

    try {
      if (post.isSaved) {
        await unsavePost({
          variables: {
            postId: post.id,
          },
        });
      } else {
        await savePost({
          variables: {
            postId: post.id,
          },
        });
      }

      await refetchPosts({
        userId: user.id,
        limit: 50,
        offset: 0,
      });
    } catch (error: any) {
      console.log("Save toggle error:", error);

      Alert.alert(
        "Save failed",
        error?.message || "Could not update saved status.",
      );
    }
  };

  /* =======================================================
     DELETE POST
  ======================================================= */

  const openDeleteConfirm = (post: Post) => {
    setSelectedPost(post);
    setDeleteConfirmVisible(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost || !user?.id) return;

    try {
      await deletePost({
        variables: {
          id: selectedPost.id,
        },
      });

      setDeleteConfirmVisible(false);
      setSelectedPost(null);

      await Promise.all([
        refetchPosts({
          userId: user.id,
          limit: 50,
          offset: 0,
        }),

        refetchMe(),
      ]);

      Alert.alert("Deleted", "Your post has been deleted.");
    } catch (error: any) {
      console.log("Delete post error:", error);

      Alert.alert(
        "Delete failed",
        error?.message || "Could not delete this post.",
      );
    }
  };

  /* =======================================================
     FULLSCREEN
  ======================================================= */

  const openFullscreenPost = (post: Post) => {
    setSelectedPost(post);
    setFullscreenPostVisible(true);
  };

  /* =======================================================
     SIGN OUT
  ======================================================= */

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);

      setSignOutConfirmVisible(false);
      setSettingsVisible(false);
      setPrivacyVisible(false);

      console.log("Signing out...");

      await removeToken();

      await apolloClient.clearStore();

      console.log("Apollo cache cleared.");

      router.replace("/screens/Auth/login");
    } catch (error) {
      console.error("Sign out error:", error);

      try {
        await removeToken();
      } catch (tokenError) {
        console.error("Token removal error:", tokenError);
      }

      router.replace("/screens/Auth/login");
    } finally {
      setSigningOut(false);
    }
  };

  /* =======================================================
     RENDER COMMENT
  ======================================================= */

  const renderComment = ({ item }: { item: Comment }) => {
    const isOwnComment =
      !!user?.id && String(item.authorId) === String(user.id);

    return (
      <View style={styles.commentItem}>
        {/* AVATAR */}

        {item.author?.profileImage ? (
          <Image
            source={{
              uri: item.author.profileImage,
            }}
            style={styles.commentAvatar}
          />
        ) : (
          <View style={styles.commentAvatarPlaceholder}>
            <Ionicons name="person" size={18} color={MUTED} />
          </View>
        )}

        {/* CONTENT */}

        <View style={styles.commentContent}>
          <View style={styles.commentTopRow}>
            <View style={styles.commentAuthorRow}>
              <Text style={styles.commentAuthorName}>
                {item.author?.fullName || "User"}
              </Text>

              {item.author?.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={PRIMARY} />
              )}
            </View>

            {isOwnComment && (
              <TouchableOpacity
                style={styles.commentMoreButton}
                onPress={() => openDeleteCommentConfirm(item)}>
                <Ionicons name="ellipsis-horizontal" size={18} color={MUTED} />
              </TouchableOpacity>
            )}
          </View>

          {item.author?.username && (
            <Text style={styles.commentUsername}>@{item.author.username}</Text>
          )}

          <Text style={styles.commentText}>{item.text}</Text>

          <Text style={styles.commentTime}>
            {formatCommentTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  /* =======================================================
     PROFILE HEADER
  ======================================================= */

  const renderHeader = () => {
    if (!user) return null;

    return (
      <View>
        {/* TOP BAR */}

        <View style={styles.topBar}>
          <View>
            <Text style={styles.screenTitle}>Profile</Text>

            <Text style={styles.screenSubtitle}>Your FaithConnect profile</Text>
          </View>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => setSettingsVisible(true)}>
            <Ionicons name="settings-outline" size={23} color={TEXT} />
          </TouchableOpacity>
        </View>

        {/* PROFILE CARD */}

        <View style={styles.profileCard}>
          <View style={styles.profileImageWrapper}>
            {user.profileImage ? (
              <Image
                source={{
                  uri: user.profileImage,
                }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={48} color={MUTED} />
              </View>
            )}

            {user.isOnline && <View style={styles.onlineDot} />}
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.fullName}>{user.fullName}</Text>

            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={21} color={PRIMARY} />
            )}
          </View>

          {user.username && (
            <Text style={styles.username}>@{user.username}</Text>
          )}

          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color={MUTED} />

              <Text style={styles.locationText}>{user.location}</Text>
            </View>
          )}

          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

          <TouchableOpacity style={styles.editButton} onPress={openEditProfile}>
            <Ionicons name="create-outline" size={18} color="#fff" />

            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatNumber(user.postsCount)}
            </Text>

            <Text style={styles.statLabel}>Posts</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatNumber(user.followersCount)}
            </Text>

            <Text style={styles.statLabel}>Followers</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatNumber(user.followingCount)}
            </Text>

            <Text style={styles.statLabel}>Following</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatNumber(user.likesCount)}
            </Text>

            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>

        {/* INTERESTS */}

        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests</Text>

            <View style={styles.interestsContainer}>
              {user.interests.map((interest, index) => (
                <View key={`${interest}-${index}`} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* POSTS HEADER */}

        <View style={styles.postsHeader}>
          <Text style={styles.sectionTitle}>My Posts</Text>

          <TouchableOpacity style={styles.addPostButton} onPress={openNewPost}>
            <Ionicons name="add" size={18} color="#fff" />

            <Text style={styles.addPostText}>Add Post</Text>
          </TouchableOpacity>
        </View>

        {postsError && (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={20} color={DANGER} />

            <Text style={styles.errorText}>Could not load your posts.</Text>
          </View>
        )}
      </View>
    );
  };

  /* =======================================================
     POST
  ======================================================= */

  const renderPost = ({ item }: { item: Post }) => {
    return (
      <View style={styles.postCard}>
        {/* AUTHOR */}

        <View style={styles.postHeader}>
          <View style={styles.postAuthor}>
            {item.author?.profileImage ? (
              <Image
                source={{
                  uri: item.author.profileImage,
                }}
                style={styles.authorImage}
              />
            ) : (
              <View style={styles.authorPlaceholder}>
                <Ionicons name="person" size={20} color={MUTED} />
              </View>
            )}

            <View style={styles.authorInfo}>
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>
                  {item.author?.fullName || user?.fullName}
                </Text>

                {item.author?.isVerified && (
                  <Ionicons name="checkmark-circle" size={15} color={PRIMARY} />
                )}
              </View>

              {item.author?.username && (
                <Text style={styles.authorUsername}>
                  @{item.author.username}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={() => openDeleteConfirm(item)}
            style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={22} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* CAPTION */}

        {item.caption && <Text style={styles.postCaption}>{item.caption}</Text>}

        {/* MEDIA */}

        {item.media?.map((media, index) => (
          <PostMedia
            key={`${item.id}-${index}`}
            media={media}
            onPress={() => openFullscreenPost(item)}
          />
        ))}

        {/* ACTIONS */}

        <View style={styles.postActions}>
          {/* LIKE */}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleLikeToggle(item)}>
            <Ionicons
              name={item.isLiked ? "heart" : "heart-outline"}
              size={24}
              color={item.isLiked ? PRIMARY : TEXT}
            />

            <Text
              style={[styles.actionCount, item.isLiked && styles.likedText]}>
              {formatNumber(item.likesCount)}
            </Text>
          </TouchableOpacity>

          {/* COMMENTS */}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openComments(item)}>
            <Ionicons name="chatbubble-outline" size={22} color={TEXT} />

            <Text style={styles.actionCount}>
              {formatNumber(item.commentsCount)}
            </Text>
          </TouchableOpacity>

          <View style={styles.actionSpacer} />

          {/* SAVE */}

          <TouchableOpacity
            style={[styles.saveButton, item.isSaved && styles.savedButton]}
            onPress={() => handleSaveToggle(item)}>
            <Ionicons
              name={item.isSaved ? "bookmark" : "bookmark-outline"}
              size={23}
              color={item.isSaved ? GOLD : TEXT}
            />

            <Text style={[styles.saveText, item.isSaved && styles.savedText]}>
              {item.isSaved ? "Saved" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  /* =======================================================
     EMPTY POSTS
  ======================================================= */

  const renderEmptyPosts = () => {
    if (postsLoading) {
      return null;
    }

    return (
      <View style={styles.emptyPosts}>
        <View style={styles.emptyIcon}>
          <Ionicons name="images-outline" size={36} color={PURPLE} />
        </View>

        <Text style={styles.emptyTitle}>No posts yet</Text>

        <Text style={styles.emptyText}>
          Share something about your faith, life, or journey.
        </Text>

        <TouchableOpacity style={styles.emptyButton} onPress={openNewPost}>
          <Ionicons name="add" size={19} color="#fff" />

          <Text style={styles.emptyButtonText}>Create Your First Post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (meLoading && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />

          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (meError && !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons name="cloud-offline-outline" size={42} color={DANGER} />
          </View>

          <Text style={styles.errorTitle}>Unable to load profile</Text>

          <Text style={styles.errorTextCenter}>
            {meError.message || "Something went wrong."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchMe()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* =======================================================
     MAIN
  ======================================================= */

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyPosts()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
      />

      {/* ===================================================
          SETTINGS
      =================================================== */}

      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Settings</Text>

                <Text style={styles.settingsHeaderSubtitle}>
                  Manage your account
                </Text>
              </View>

              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={27} color={TEXT} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.settingsRow} onPress={openPrivacy}>
              <View style={styles.settingsIcon}>
                <Ionicons name="lock-closed-outline" size={21} color={PURPLE} />
              </View>

              <View style={styles.settingsTextContainer}>
                <Text style={styles.settingsTitle}>Privacy</Text>

                <Text style={styles.settingsSubtitle}>
                  Control who can see and contact you
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={MUTED} />
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity
              style={styles.signOutRow}
              onPress={() => setSignOutConfirmVisible(true)}>
              <View style={styles.signOutIcon}>
                <Ionicons name="log-out-outline" size={21} color={DANGER} />
              </View>

              <View style={styles.settingsTextContainer}>
                <Text style={styles.signOutTitle}>Sign Out</Text>

                <Text style={styles.settingsSubtitle}>
                  Sign out of your account
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={MUTED} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          PRIVACY
      =================================================== */}

      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.privacyCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Privacy</Text>

                <Text style={styles.settingsHeaderSubtitle}>
                  Choose how others interact with you
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setPrivacyVisible(false)}
                disabled={updatingPrivacy}>
                <Ionicons name="close" size={27} color={TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.privacySectionTitle}>Profile Visibility</Text>

              <Text style={styles.privacyDescription}>
                Choose who can see your profile.
              </Text>

              <View style={styles.privacyOptions}>
                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    privacyProfileVisibility === "public" &&
                      styles.privacyOptionActive,
                  ]}
                  onPress={() => setPrivacyProfileVisibility("public")}>
                  <View style={styles.privacyOptionIcon}>
                    <Ionicons
                      name="globe-outline"
                      size={20}
                      color={
                        privacyProfileVisibility === "public" ? PRIMARY : MUTED
                      }
                    />
                  </View>

                  <View style={styles.privacyOptionText}>
                    <Text style={styles.privacyOptionTitle}>Public</Text>

                    <Text style={styles.privacyOptionSubtitle}>
                      Anyone can view your profile
                    </Text>
                  </View>

                  {privacyProfileVisibility === "public" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={PRIMARY}
                    />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.privacyOption,
                    privacyProfileVisibility === "private" &&
                      styles.privacyOptionActive,
                  ]}
                  onPress={() => setPrivacyProfileVisibility("private")}>
                  <View style={styles.privacyOptionIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        privacyProfileVisibility === "private" ? PRIMARY : MUTED
                      }
                    />
                  </View>

                  <View style={styles.privacyOptionText}>
                    <Text style={styles.privacyOptionTitle}>Private</Text>

                    <Text style={styles.privacyOptionSubtitle}>
                      Only approved people can view your profile
                    </Text>
                  </View>

                  {privacyProfileVisibility === "private" && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={PRIMARY}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.privacySwitchRow}>
                <View style={styles.privacyOptionIcon}>
                  <Ionicons name="radio-outline" size={21} color={PURPLE} />
                </View>

                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyOptionTitle}>
                    Show Online Status
                  </Text>

                  <Text style={styles.privacyOptionSubtitle}>
                    Let people know when you're online
                  </Text>
                </View>

                <Switch
                  value={privacyShowOnlineStatus}
                  onValueChange={setPrivacyShowOnlineStatus}
                  trackColor={{
                    false: BORDER,
                    true: PRIMARY,
                  }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.privacySwitchRow}>
                <View style={styles.privacyOptionIcon}>
                  <Ionicons name="calendar-outline" size={21} color={PURPLE} />
                </View>

                <View style={styles.privacyOptionText}>
                  <Text style={styles.privacyOptionTitle}>Show Age</Text>

                  <Text style={styles.privacyOptionSubtitle}>
                    Display your age on your profile
                  </Text>
                </View>

                <Switch
                  value={privacyShowAge}
                  onValueChange={setPrivacyShowAge}
                  trackColor={{
                    false: BORDER,
                    true: PRIMARY,
                  }}
                  thumbColor="#fff"
                />
              </View>

              <Text style={[styles.privacySectionTitle, { marginTop: 22 }]}>
                Messages
              </Text>

              <Text style={styles.privacyDescription}>
                Choose who can send you messages.
              </Text>

              <View style={styles.privacyOptions}>
                {[
                  {
                    value: "everyone",
                    title: "Everyone",
                    subtitle: "Anyone can message you",
                    icon: "people-outline" as const,
                  },
                  {
                    value: "followers",
                    title: "Followers",
                    subtitle: "Only people who follow you",
                    icon: "person-add-outline" as const,
                  },
                  {
                    value: "nobody",
                    title: "Nobody",
                    subtitle: "Don't allow new messages",
                    icon: "ban-outline" as const,
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.privacyOption,
                      privacyAllowMessagesFrom === option.value &&
                        styles.privacyOptionActive,
                    ]}
                    onPress={() => setPrivacyAllowMessagesFrom(option.value)}>
                    <View style={styles.privacyOptionIcon}>
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={
                          privacyAllowMessagesFrom === option.value
                            ? PRIMARY
                            : MUTED
                        }
                      />
                    </View>

                    <View style={styles.privacyOptionText}>
                      <Text style={styles.privacyOptionTitle}>
                        {option.title}
                      </Text>

                      <Text style={styles.privacyOptionSubtitle}>
                        {option.subtitle}
                      </Text>
                    </View>

                    {privacyAllowMessagesFrom === option.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={PRIMARY}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  updatingPrivacy && styles.disabledButton,
                ]}
                onPress={handleUpdatePrivacy}
                disabled={updatingPrivacy}>
                {updatingPrivacy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />

                    <Text style={styles.primaryButtonText}>
                      Save Privacy Settings
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          CREATE POST
      =================================================== */}

      <Modal
        visible={newPostVisible}
        transparent
        animationType="slide"
        onRequestClose={closeNewPost}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Post</Text>

              <TouchableOpacity onPress={closeNewPost} disabled={creatingPost}>
                <Ionicons name="close" size={26} color={TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Caption</Text>

              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Share something..."
                placeholderTextColor={MUTED}
                multiline
                style={[styles.input, styles.textArea]}
              />

              <Text style={styles.inputLabel}>Media URL</Text>

              <TextInput
                value={mediaUrl}
                onChangeText={setMediaUrl}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Media Type</Text>

              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    mediaType === "image" && styles.typeButtonActive,
                  ]}
                  onPress={() => setMediaType("image")}>
                  <Ionicons
                    name="image-outline"
                    size={19}
                    color={mediaType === "image" ? "#fff" : MUTED}
                  />

                  <Text
                    style={[
                      styles.typeText,
                      mediaType === "image" && styles.typeTextActive,
                    ]}>
                    Image
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    mediaType === "video" && styles.typeButtonActive,
                  ]}
                  onPress={() => setMediaType("video")}>
                  <Ionicons
                    name="videocam-outline"
                    size={19}
                    color={mediaType === "video" ? "#fff" : MUTED}
                  />

                  <Text
                    style={[
                      styles.typeText,
                      mediaType === "video" && styles.typeTextActive,
                    ]}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={PURPLE}
                />

                <Text style={styles.infoText}>
                  You can publish a text-only post or attach an image/video URL.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  creatingPost && styles.disabledButton,
                ]}
                onPress={handleCreatePost}
                disabled={creatingPost}>
                {creatingPost ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane-outline"
                      size={19}
                      color="#fff"
                    />

                    <Text style={styles.primaryButtonText}>Publish</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================
          EDIT PROFILE
      =================================================== */}

      <Modal
        visible={editProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <TouchableOpacity
                onPress={() => setEditProfileVisible(false)}
                disabled={updatingProfile}>
                <Ionicons name="close" size={26} color={TEXT} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>Full Name</Text>

              <TextInput
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Your full name"
                placeholderTextColor={MUTED}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Username</Text>

              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="username"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Age</Text>

              <TextInput
                value={editAge}
                onChangeText={setEditAge}
                placeholder="Age"
                placeholderTextColor={MUTED}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Location</Text>

              <TextInput
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="Your location"
                placeholderTextColor={MUTED}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Profile Image URL</Text>

              <TextInput
                value={editProfileImage}
                onChangeText={setEditProfileImage}
                placeholder="https://..."
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Bio</Text>

              <TextInput
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Tell people about yourself..."
                placeholderTextColor={MUTED}
                multiline
                style={[styles.input, styles.textArea]}
              />

              <Text style={styles.inputLabel}>Interests</Text>

              <TextInput
                value={editInterests}
                onChangeText={setEditInterests}
                placeholder="Prayer, Music, Bible, Travel"
                placeholderTextColor={MUTED}
                style={styles.input}
              />

              <Text style={styles.helperText}>
                Separate interests with commas.
              </Text>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  updatingProfile && styles.disabledButton,
                ]}
                onPress={handleUpdateProfile}
                disabled={updatingProfile}>
                {updatingProfile ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#fff" />

                    <Text style={styles.primaryButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================
          DELETE POST
      =================================================== */}

      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingPost && setDeleteConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="trash-outline" size={30} color={DANGER} />
            </View>

            <Text style={styles.confirmTitle}>Delete Post?</Text>

            <Text style={styles.confirmText}>
              This action cannot be undone.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}
                disabled={deletingPost}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deletingPost && styles.disabledButton,
                ]}
                onPress={handleDeletePost}
                disabled={deletingPost}>
                {deletingPost ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          COMMENTS
      =================================================== */}

      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={closeComments}>
        <KeyboardAvoidingView
          style={styles.commentsOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.commentsCard}>
            {/* HEADER */}

            <View style={styles.commentsHeader}>
              <View>
                <Text style={styles.commentsTitle}>Comments</Text>

                <Text style={styles.commentsSubtitle}>
                  Join the conversation
                </Text>
              </View>

              <TouchableOpacity
                style={styles.commentsCloseButton}
                onPress={closeComments}
                disabled={creatingComment || deletingComment}>
                <Ionicons name="close" size={23} color={TEXT} />
              </TouchableOpacity>
            </View>

            {/* COMMENTS */}

            {commentsLoading ? (
              <View style={styles.commentsLoading}>
                <ActivityIndicator size="large" color={PRIMARY} />

                <Text style={styles.commentsLoadingText}>
                  Loading comments...
                </Text>
              </View>
            ) : commentsError ? (
              <View style={styles.commentsError}>
                <View style={styles.commentsErrorIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={28}
                    color={DANGER}
                  />
                </View>

                <Text style={styles.commentsErrorTitle}>
                  Could not load comments
                </Text>

                <Text style={styles.commentsErrorText}>
                  {commentsError.message || "Something went wrong."}
                </Text>

                {selectedPost && (
                  <TouchableOpacity
                    style={styles.commentsRetryButton}
                    onPress={() =>
                      refetchComments({
                        postId: selectedPost.id,
                        limit: 50,
                        offset: 0,
                      })
                    }>
                    <Text style={styles.commentsRetryText}>Try Again</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.noComments}>
                <View style={styles.noCommentsIcon}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={32}
                    color={PURPLE}
                  />
                </View>

                <Text style={styles.noCommentsTitle}>No comments yet</Text>

                <Text style={styles.noCommentsText}>
                  Be the first person to share your thoughts.
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                renderItem={renderComment}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.commentsList}
              />
            )}

            {/* INPUT */}

            <View style={styles.commentInputArea}>
              <View style={styles.commentInputWrapper}>
                {user?.profileImage ? (
                  <Image
                    source={{
                      uri: user.profileImage,
                    }}
                    style={styles.commentInputAvatar}
                  />
                ) : (
                  <View style={styles.commentInputAvatarPlaceholder}>
                    <Ionicons name="person" size={16} color={MUTED} />
                  </View>
                )}

                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment..."
                  placeholderTextColor={MUTED}
                  multiline
                  maxLength={500}
                  style={styles.commentInput}
                  editable={!creatingComment && !deletingComment}
                />

                <TouchableOpacity
                  style={[
                    styles.sendCommentButton,
                    (!commentText.trim() || creatingComment) &&
                      styles.sendCommentDisabled,
                  ]}
                  onPress={handleCreateComment}
                  disabled={!commentText.trim() || creatingComment}>
                  {creatingComment ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===================================================
          DELETE COMMENT CONFIRMATION
      =================================================== */}

      <Modal
        visible={deleteCommentConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deletingComment) {
            setDeleteCommentConfirmVisible(false);
          }
        }}>
        <View style={styles.confirmOverlay}>
          <View style={styles.commentDeleteCard}>
            <View style={styles.commentDeleteIcon}>
              <Ionicons name="trash-outline" size={29} color={DANGER} />
            </View>

            <Text style={styles.commentDeleteTitle}>Delete comment?</Text>

            <Text style={styles.commentDeleteText}>
              Are you sure you want to permanently delete this comment?
              {"\n"}
              This action cannot be undone.
            </Text>

            {selectedComment && (
              <View style={styles.commentPreview}>
                <Text style={styles.commentPreviewText} numberOfLines={2}>
                  "{selectedComment.text}"
                </Text>
              </View>
            )}

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteCommentConfirmVisible(false)}
                disabled={deletingComment}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  deletingComment && styles.disabledButton,
                ]}
                onPress={handleDeleteComment}
                disabled={deletingComment}>
                {deletingComment ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#fff" />

                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ===================================================
          FULLSCREEN POST
      =================================================== */}

      <Modal
        visible={fullscreenPostVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenPostVisible(false)}>
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenClose}
            onPress={() => setFullscreenPostVisible(false)}>
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>

          {selectedPost?.media?.map((media, index) => {
            if (isVideoMedia(media)) {
              return (
                <PostVideo
                  key={`${selectedPost.id}-${index}`}
                  url={media.url}
                />
              );
            }

            if (isImageMedia(media)) {
              return (
                <Image
                  key={`${selectedPost.id}-${index}`}
                  source={{
                    uri: media.url,
                  }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              );
            }

            return null;
          })}
        </View>
      </Modal>

      {/* ===================================================
          SIGN OUT CONFIRMATION
      =================================================== */}

      <Modal
        visible={signOutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !signingOut && setSignOutConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="log-out-outline" size={30} color={DANGER} />
            </View>

            <Text style={styles.confirmTitle}>Sign Out?</Text>

            <Text style={styles.confirmText}>
              Are you sure you want to sign out of your account?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSignOutConfirmVisible(false)}
                disabled={signingOut}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteButton,
                  signingOut && styles.disabledButton,
                ]}
                onPress={handleSignOut}
                disabled={signingOut}>
                {signingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.deleteButtonText}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: BACKGROUND,
  },

  loadingText: {
    color: MUTED,
    marginTop: 14,
    fontSize: 15,
  },

  /* =======================================================
     TOP
  ======================================================= */

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 18,
  },

  screenTitle: {
    color: TEXT,
    fontSize: 28,
    fontWeight: "800",
  },

  screenSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 3,
  },

  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  /* =======================================================
     PROFILE
  ======================================================= */

  profileCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  profileImageWrapper: {
    position: "relative",
    marginBottom: 12,
  },

  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: PRIMARY,
  },

  profilePlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: CARD_2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BORDER,
  },

  onlineDot: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SUCCESS,
    right: 3,
    bottom: 4,
    borderWidth: 3,
    borderColor: CARD,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  fullName: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "800",
  },

  username: {
    color: PRIMARY,
    fontSize: 14,
    marginTop: 3,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },

  locationText: {
    color: MUTED,
    fontSize: 13,
  },

  bio: {
    color: "#D8D1E3",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
  },

  editButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: PURPLE,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 22,
  },

  editButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* =======================================================
     STATS
  ======================================================= */

  statsCard: {
    marginTop: 12,
    backgroundColor: CARD,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
  },

  statLabel: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: BORDER,
  },

  /* =======================================================
     SECTION
  ======================================================= */

  section: {
    marginTop: 22,
  },

  sectionTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
  },

  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },

  interestChip: {
    backgroundColor: CARD_2,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  interestText: {
    color: "#DDD6E8",
    fontSize: 12,
    fontWeight: "600",
  },

  /* =======================================================
     POSTS
  ======================================================= */

  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 12,
  },

  addPostButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: PRIMARY,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  addPostText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  postCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    overflow: "hidden",
  },

  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },

  postAuthor: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  authorImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  authorPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_2,
    alignItems: "center",
    justifyContent: "center",
  },

  authorInfo: {
    marginLeft: 10,
  },

  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  authorName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
  },

  authorUsername: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },

  moreButton: {
    padding: 4,
  },

  postCaption: {
    color: "#E4DDED",
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: 15,
    paddingBottom: 14,
  },

  /* =======================================================
     MEDIA
  ======================================================= */

  mediaContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#080411",
  },

  postImage: {
    width: "100%",
    height: "100%",
  },

  video: {
    width: "100%",
    height: "100%",
  },

  /* =======================================================
     ACTIONS
  ======================================================= */

  postActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 12,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
    gap: 5,
  },

  actionCount: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },

  likedText: {
    color: PRIMARY,
  },

  actionSpacer: {
    flex: 1,
  },

  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
  },

  savedButton: {
    backgroundColor: "rgba(255,211,105,0.10)",
  },

  saveText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
  },

  savedText: {
    color: GOLD,
  },

  /* =======================================================
     EMPTY
  ======================================================= */

  emptyPosts: {
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 25,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  emptyTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
  },

  emptyButton: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: PRIMARY,
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 20,
  },

  emptyButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  /* =======================================================
     ERROR
  ======================================================= */

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,92,117,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  errorText: {
    color: DANGER,
    fontSize: 13,
    flex: 1,
  },

  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  errorTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
  },

  errorTextCenter: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
  },

  retryButton: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 11,
  },

  retryText: {
    color: "#fff",
    fontWeight: "700",
  },

  /* =======================================================
     MODALS
  ======================================================= */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "flex-end",
  },

  modalCard: {
    maxHeight: "92%",
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: BORDER,
  },

  privacyCard: {
    maxHeight: "94%",
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderTopWidth: 1,
    borderColor: BORDER,
  },

  settingsCard: {
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderColor: BORDER,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "800",
  },

  settingsHeaderSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },

  /* =======================================================
     INPUTS
  ======================================================= */

  inputLabel: {
    color: "#D8D0E2",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    color: TEXT,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },

  textArea: {
    minHeight: 105,
    textAlignVertical: "top",
  },

  helperText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 5,
  },

  /* =======================================================
     TYPE
  ======================================================= */

  typeRow: {
    flexDirection: "row",
    gap: 10,
  },

  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 12,
  },

  typeButtonActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },

  typeText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "700",
  },

  typeTextActive: {
    color: "#fff",
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(139,92,246,0.10)",
    borderRadius: 13,
    padding: 13,
    marginTop: 15,
  },

  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },

  /* =======================================================
     PRIMARY BUTTON
  ======================================================= */

  primaryButton: {
    minHeight: 48,
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    marginBottom: 10,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.55,
  },

  /* =======================================================
     SETTINGS
  ======================================================= */

  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(139,92,246,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  settingsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  settingsTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "700",
  },

  settingsSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },

  settingsDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },

  signOutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  signOutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,92,117,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  signOutTitle: {
    color: DANGER,
    fontSize: 14,
    fontWeight: "800",
  },

  /* =======================================================
     PRIVACY
  ======================================================= */

  privacySectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 4,
  },

  privacyDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 10,
  },

  privacyOptions: {
    gap: 8,
  },

  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 13,
  },

  privacyOptionActive: {
    borderColor: PRIMARY,
    backgroundColor: "rgba(255,79,154,0.07)",
  },

  privacyOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD_2,
    alignItems: "center",
    justifyContent: "center",
  },

  privacyOptionText: {
    flex: 1,
    marginLeft: 11,
  },

  privacyOptionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "700",
  },

  privacyOptionSubtitle: {
    color: MUTED,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  privacySwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 13,
    marginTop: 9,
  },

  /* =======================================================
     CONFIRM
  ======================================================= */

  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  confirmCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  confirmIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,92,117,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  confirmTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 15,
  },

  confirmText: {
    color: MUTED,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  confirmActions: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: CARD_2,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: TEXT,
    fontWeight: "700",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: DANGER,
    borderRadius: 14,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },

  deleteButtonText: {
    color: "#fff",
    fontWeight: "800",
  },

  /* =======================================================
     COMMENTS
  ======================================================= */

  commentsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.70)",
    justifyContent: "flex-end",
  },

  commentsCard: {
    height: "82%",
    backgroundColor: BACKGROUND,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },

  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  commentsTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "800",
  },

  commentsSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
  },

  commentsCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  commentsList: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    paddingBottom: 20,
  },

  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
  },

  commentAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_2,
  },

  commentAvatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CARD_2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  commentContent: {
    flex: 1,
    marginLeft: 11,
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },

  commentTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  commentAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },

  commentAuthorName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },

  commentMoreButton: {
    padding: 3,
    marginLeft: 8,
  },

  commentUsername: {
    color: PRIMARY,
    fontSize: 10,
    marginTop: 2,
  },

  commentText: {
    color: "#E4DDED",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },

  commentTime: {
    color: MUTED,
    fontSize: 10,
    marginTop: 7,
  },

  commentsLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  commentsLoadingText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 12,
  },

  commentsError: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  commentsErrorIcon: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "rgba(255,92,117,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  commentsErrorTitle: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },

  commentsErrorText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
  },

  commentsRetryButton: {
    backgroundColor: PRIMARY,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },

  commentsRetryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  noComments: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
  },

  noCommentsIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  noCommentsTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 15,
  },

  noCommentsText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 6,
  },

  commentInputArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },

  commentInputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    paddingLeft: 7,
    paddingRight: 7,
    paddingVertical: 6,
  },

  commentInputAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 7,
  },

  commentInputAvatarPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: CARD_2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  commentInput: {
    flex: 1,
    color: TEXT,
    fontSize: 13,
    maxHeight: 90,
    paddingHorizontal: 6,
    paddingVertical: 8,
    textAlignVertical: "top",
  },

  sendCommentButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },

  sendCommentDisabled: {
    opacity: 0.45,
  },

  /* =======================================================
     COMMENT DELETE
  ======================================================= */

  commentDeleteCard: {
    width: "100%",
    maxWidth: 410,
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },

  commentDeleteIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,92,117,0.10)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,92,117,0.16)",
  },

  commentDeleteTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 15,
  },

  commentDeleteText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
  },

  commentPreview: {
    width: "100%",
    backgroundColor: CARD_2,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 13,
    paddingVertical: 11,
    marginTop: 16,
  },

  commentPreviewText: {
    color: "#D8D0E2",
    fontSize: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },

  /* =======================================================
     FULLSCREEN
  ======================================================= */

  fullscreenContainer: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  fullscreenImage: {
    width: "100%",
    height: "80%",
  },
});
