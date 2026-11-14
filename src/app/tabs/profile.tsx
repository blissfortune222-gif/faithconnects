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

const PRIMARY = "#FF4F9A";
const PURPLE = "#8B5CF6";
const GOLD = "#FFD369";
const BACKGROUND = "#212121";
const CARD = "#212121";
// const  000 = "#21153A";
const TEXT = "#FFFFFF";
const MUTED = "#AFA7BF";
const BORDER = "#302347";
const SUCCESS = "#35D07F";
const DANGER = "#FF5C75";
const COMMENT_LIMIT = 50;

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

const ME_QUERY = gql`
  ${USER_FIELDS}
  query Me {
    me {
      ...UserFields
    }
  }
`;

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

const POST_COMMENTS_QUERY = gql`
  query PostComments($postId: ID!, $limit: Int, $offset: Int!) {
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

const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

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

const UPDATE_PROFILE_MUTATION = gql`
  ${USER_FIELDS}
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }
`;

const UPDATE_PRIVACY_MUTATION = gql`
  ${USER_FIELDS}
  mutation UpdatePrivacy($input: UpdatePrivacyInput!) {
    updatePrivacy(input: $input) {
      ...UserFields
    }
  }
`;

const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

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

const SAVE_POST_MUTATION = gql`
  mutation SavePost($postId: ID!) {
    savePost(postId: $postId) {
      id
      likesCount
      isLiked
      isSaved
    }
  }
`;

const UNSAVE_POST_MUTATION = gql`
  mutation UnsavePost($postId: ID!) {
    unsavePost(postId: $postId) {
      id
      likesCount
      isLiked
      isSaved
    }
  }
`;

type Privacy = {
  profileVisibility?: string;
  showOnlineStatus?: boolean;
  allowMessagesFrom?: string;
  showAge?: boolean;
};

type User = {
  id: string;
  fullName: string;
  username: string;
  email?: string;
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
  privacy?: Privacy;
};

type Media = {
  url: string;
  type: string;
};

type Post = {
  id: string;
  authorId: string;
  caption?: string;
  media?: Media[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  author?: User;
};

type Comment = {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
  author?: User;
};

const formatNumber = (value?: number) => {
  const number = value || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
};

const formatTime = (date?: string) => {
  if (!date) return "";

  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
};

const isVideo = (type?: string) => type?.toLowerCase().includes("video");

function PostVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  return (
    <VideoView
      player={player}
      style={styles.postMedia}
      nativeControls
      contentFit="contain"
    />
  );
}

function PostMedia({ media }: { media?: Media[] }) {
  if (!media?.length) return null;

  return (
    <View style={styles.mediaContainer}>
      {media.map((item, index) =>
        isVideo(item.type) ? (
          <PostVideo key={`${item.url}-${index}`} uri={item.url} />
        ) : (
          <Image
            key={`${item.url}-${index}`}
            source={{ uri: item.url }}
            style={styles.postMedia}
            resizeMode="cover"
          />
        ),
      )}
    </View>
  );
}

export default function Profile() {
  const client = useApolloClient();

  const {
    data: meData,
    loading,
    error,
    refetch: refetchMe,
  } = useQuery(ME_QUERY, {
    fetchPolicy: "network-only",
  });

  const user: User | undefined = meData?.me;

  const {
    data: postsData,
    loading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = useQuery(USER_POSTS_QUERY, {
    variables: {
      userId: user?.id,
      limit: 50,
      offset: 0,
    },
    skip: !user?.id,
    fetchPolicy: "network-only",
  });

  const posts: Post[] = postsData?.userPosts || [];

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [fullscreenPostVisible, setFullscreenPostVisible] = useState(false);

  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError,
    refetch: refetchComments,
  } = useQuery(POST_COMMENTS_QUERY, {
    variables: {
      postId: selectedPost?.id || "",
      limit: COMMENT_LIMIT,
      offset: 0,
    },
    skip: !selectedPost?.id || !fullscreenPostVisible,
    fetchPolicy: "network-only",
  });

  const comments: Comment[] = commentsData?.postComments || [];

  const [createPost, { loading: creatingPost }] =
    useMutation(CREATE_POST_MUTATION);
  const [updateProfile, { loading: updatingProfile }] = useMutation(
    UPDATE_PROFILE_MUTATION,
  );
  const [updatePrivacy, { loading: updatingPrivacy }] = useMutation(
    UPDATE_PRIVACY_MUTATION,
  );
  const [deletePost] = useMutation(DELETE_POST_MUTATION);
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

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [newPostVisible, setNewPostVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [signOutConfirmVisible, setSignOutConfirmVisible] = useState(false);
  const [deleteCommentConfirmVisible, setDeleteCommentConfirmVisible] =
    useState(false);

  const [commentText, setCommentText] = useState("");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [expandedComments, setExpandedComments] = useState<string[]>([]);

  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");

  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editProfileImage, setEditProfileImage] = useState("");
  const [editInterests, setEditInterests] = useState("");

  const [profileVisibility, setProfileVisibility] = useState("public");
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessagesFrom, setAllowMessagesFrom] = useState("everyone");
  const [showAge, setShowAge] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const refreshProfile = async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchMe(), refetchPosts()]);
    } finally {
      setRefreshing(false);
    }
  };

  // POST VIEWER

  const openPostViewer = (post: Post) => {
    setSelectedPost(post);
    setExpandedComments([]);
    setCommentText("");
    setFullscreenPostVisible(true);
  };

  const closePostViewer = () => {
    if (creatingComment || deletingComment) return;

    setFullscreenPostVisible(false);
    setSelectedPost(null);
    setExpandedComments([]);
    setCommentText("");
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments((previous) =>
      previous.includes(commentId)
        ? previous.filter((id) => id !== commentId)
        : [...previous, commentId],
    );
  };

  // COMMENTS

  const handleCreateComment = async () => {
    if (!commentText.trim() || !selectedPost) return;

    try {
      await createComment({
        variables: {
          postId: selectedPost.id,
          text: commentText.trim(),
        },
      });

      setCommentText("");

      await Promise.allSettled([
        refetchComments({
          postId: selectedPost.id,
          limit: COMMENT_LIMIT,
          offset: 0,
        }),
        refetchPosts(),
      ]);
    } catch (err: any) {
      Alert.alert(
        "Comment failed",
        err.message || "Unable to post your comment.",
      );
    }
  };

  const askDeleteComment = (comment: Comment) => {
    if (comment.authorId !== user?.id) {
      Alert.alert("Not allowed", "You can only delete your own comments.");
      return;
    }

    setSelectedComment(comment);
    setDeleteCommentConfirmVisible(true);
  };

  const handleDeleteComment = async () => {
    if (!selectedComment || !selectedPost) return;

    try {
      await deleteComment({
        variables: { id: selectedComment.id },
      });

      setDeleteCommentConfirmVisible(false);
      setSelectedComment(null);

      await Promise.allSettled([
        refetchComments({
          postId: selectedPost.id,
          limit: COMMENT_LIMIT,
          offset: 0,
        }),
        refetchPosts(),
      ]);
    } catch (err: any) {
      Alert.alert(
        "Delete failed",
        err.message || "Unable to delete this comment.",
      );
    }
  };

  // PROFILE EDITING

  const openEditProfile = () => {
    if (!user) return;

    setEditFullName(user.fullName || "");
    setEditUsername(user.username || "");
    setEditAge(user.age ? String(user.age) : "");
    setEditBio(user.bio || "");
    setEditLocation(user.location || "");
    setEditProfileImage(user.profileImage || "");
    setEditInterests(user.interests?.join(", ") || "");

    setSettingsVisible(false);
    setEditProfileVisible(true);
  };

  const handleUpdateProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert("Required", "Please enter your full name.");
      return;
    }

    const age = editAge.trim() ? Number(editAge) : undefined;

    if (age !== undefined && (!Number.isFinite(age) || age < 13)) {
      Alert.alert("Invalid age", "You must be at least 13 years old.");
      return;
    }

    try {
      await updateProfile({
        variables: {
          input: {
            fullName: editFullName.trim(),
            username: editUsername.trim(),
            age,
            bio: editBio.trim(),
            location: editLocation.trim(),
            profileImage: editProfileImage.trim(),
            interests: editInterests
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          },
        },
      });

      setEditProfileVisible(false);
      await refetchMe();
      await refetchPosts();
    } catch (err: any) {
      Alert.alert(
        "Update failed",
        err.message || "Unable to update your profile.",
      );
    }
  };

  // PRIVACY SETTINGS

  const openPrivacy = () => {
    setProfileVisibility(user?.privacy?.profileVisibility || "public");
    setShowOnlineStatus(user?.privacy?.showOnlineStatus ?? true);
    setAllowMessagesFrom(user?.privacy?.allowMessagesFrom || "everyone");
    setShowAge(user?.privacy?.showAge ?? true);

    setSettingsVisible(false);
    setPrivacyVisible(true);
  };

  const handleUpdatePrivacy = async () => {
    try {
      await updatePrivacy({
        variables: {
          input: {
            profileVisibility,
            showOnlineStatus,
            allowMessagesFrom,
            showAge,
          },
        },
      });

      setPrivacyVisible(false);
      await refetchMe();

      Alert.alert("Saved", "Your privacy settings have been updated.");
    } catch (err: any) {
      Alert.alert(
        "Update failed",
        err.message || "Unable to update privacy settings.",
      );
    }
  };

  // CREATE POST

  const openNewPost = () => {
    setCaption("");
    setMediaUrl("");
    setMediaType("image");
    setNewPostVisible(true);
  };

  const handleCreatePost = async () => {
    if (!caption.trim() && !mediaUrl.trim()) {
      Alert.alert("Empty post", "Add some text or a media URL.");
      return;
    }

    if (mediaUrl.trim() && !/^https?:\/\/\S+/i.test(mediaUrl.trim())) {
      Alert.alert("Invalid URL", "Please enter a valid media URL.");
      return;
    }

    try {
      await createPost({
        variables: {
          input: {
            caption: caption.trim(),
            media: mediaUrl.trim()
              ? [{ url: mediaUrl.trim(), type: mediaType }]
              : [],
          },
        },
      });

      setNewPostVisible(false);
      await Promise.allSettled([refetchPosts(), refetchMe()]);
    } catch (err: any) {
      Alert.alert("Post failed", err.message || "Unable to publish your post.");
    }
  };

  // LIKE / SAVE / DELETE POST

  const handleLike = async (post: Post) => {
    try {
      if (post.isLiked) {
        await unlikePost({ variables: { postId: post.id } });
      } else {
        await likePost({ variables: { postId: post.id } });
      }

      await refetchPosts();

      if (selectedPost?.id === post.id) {
        setSelectedPost((current) =>
          current
            ? {
                ...current,
                isLiked: !current.isLiked,
                likesCount: Math.max(
                  0,
                  current.likesCount + (current.isLiked ? -1 : 1),
                ),
              }
            : null,
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to update like.");
    }
  };

  const handleSave = async (post: Post) => {
    try {
      if (post.isSaved) {
        await unsavePost({ variables: { postId: post.id } });
      } else {
        await savePost({ variables: { postId: post.id } });
      }

      await refetchPosts();

      if (selectedPost?.id === post.id) {
        setSelectedPost((current) =>
          current ? { ...current, isSaved: !current.isSaved } : null,
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Unable to save this post.");
    }
  };

  const askDeletePost = (post: Post) => {
    setSelectedPost(post);
    setDeleteConfirmVisible(true);
  };

  const handleDeletePost = async () => {
    if (!selectedPost) return;

    try {
      await deletePost({
        variables: { id: selectedPost.id },
      });

      setDeleteConfirmVisible(false);
      setFullscreenPostVisible(false);
      setSelectedPost(null);

      await Promise.allSettled([refetchPosts(), refetchMe()]);
    } catch (err: any) {
      Alert.alert(
        "Delete failed",
        err.message || "Unable to delete this post.",
      );
    }
  };

  // SIGN OUT

  const handleSignOut = async () => {
    try {
      await removeToken();
      await client.clearStore();
      setSignOutConfirmVisible(false);
      router.replace("/screens/Auth/login");
    } catch (err) {
      console.log("Sign out error:", err);
      Alert.alert("Error", "Unable to sign out.");
    }
  };

  // REUSABLE AVATAR

  const Avatar = ({ uri, size = 44 }: { uri?: string; size?: number }) => (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Ionicons name="person" size={size * 0.48} color={MUTED} />
      )}
    </View>
  );

  const Verified = () => (
    <Ionicons
      name="checkmark-circle"
      size={15}
      color={PRIMARY}
      style={{ marginLeft: 5 }}
    />
  );

  // COMMENT ITEM

  const renderComment = ({ item }: { item: Comment }) => {
    const isExpanded = expandedComments.includes(item.id);
    const isLong = item.text.length > 150;

    return (
      <View style={styles.commentRow}>
        <Avatar uri={item.author?.profileImage} size={39} />

        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <View style={styles.commentAuthorRow}>
              <Text style={styles.commentName}>
                {item.author?.fullName || "User"}
              </Text>

              {item.author?.isVerified && <Verified />}

              {item.authorId === user?.id && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>

            <Text
              style={styles.commentText}
              numberOfLines={isExpanded ? undefined : 4}>
              {item.text}
            </Text>

            {isLong && (
              <TouchableOpacity
                onPress={() => toggleCommentExpansion(item.id)}
                style={styles.seeMoreButton}>
                <Text style={styles.seeMoreText}>
                  {isExpanded ? "See less" : "See more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.commentFooter}>
            <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>

            {item.authorId === user?.id && (
              <TouchableOpacity onPress={() => askDeleteComment(item)}>
                <Text style={styles.commentDeleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // PROFILE HEADER

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>My Profile</Text>
          <Text style={styles.topBarSubtitle}>Your personal space</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={21} color={TEXT} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileIdentity}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={user?.profileImage} size={108} />

            {user?.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>
                {user?.fullName || "Your Name"}
              </Text>
              {user?.isVerified && <Verified />}
            </View>

            <Text style={styles.profileUsername}>
              @{user?.username || "username"}
            </Text>

            {user?.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={MUTED} />
                <Text style={styles.locationText}>{user.location}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {user?.bio ? (
          <Text style={styles.profileBio}>{user.bio}</Text>
        ) : (
          <Text style={styles.profileBioPlaceholder}>
            Add a short bio to tell people about yourself.
          </Text>
        )}

        {/* ADD POST IS NOW THE MAIN PROFILE ACTION */}
        <View style={styles.profileActions}>
          <TouchableOpacity style={styles.addPostButton} onPress={openNewPost}>
            <Ionicons name="add-circle-outline" size={19} color="#FFFFFF" />
            <Text style={styles.addPostButtonText}>Add Post</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          {[
            { label: "Posts", value: user?.postsCount },
            { label: "Followers", value: user?.followersCount },
            { label: "Following", value: user?.followingCount },
            { label: "Likes", value: user?.likesCount },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(stat.value)}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* COMPACT ABOUT SECTION */}
      <View style={styles.aboutCard}>
        <View style={styles.aboutHeader}>
          <Text style={styles.sectionTitle}>About</Text>
          {/* <Text style={styles.aboutSmallText}>A little about you</Text> */}
        </View>

        <View style={styles.aboutInfoRow}>
          {user?.location ? (
            <View style={styles.aboutInfoItem}>
              <Ionicons name="location-outline" size={15} color={PRIMARY} />
              <Text style={styles.aboutInfoText}>{user.location}</Text>
            </View>
          ) : null}

          {user?.age && user?.privacy?.showAge !== false ? (
            <View style={styles.aboutInfoItem}>
              <Ionicons name="calendar-outline" size={15} color={PURPLE} />
              <Text style={styles.aboutInfoText}>{user.age} years</Text>
            </View>
          ) : null}

          <View style={styles.aboutInfoItem}>
            <Ionicons name="lock-open-outline" size={15} color={GOLD} />
            <Text style={styles.aboutInfoText}>
              {user?.privacy?.profileVisibility || "Public"}
            </Text>
          </View>
        </View>

        {user?.interests?.length ? (
          <View style={styles.interestList}>
            {user.interests.map((interest, index) => (
              <View key={`${interest}-${index}`} style={styles.interestChip}>
                <Text style={styles.interestChipText}>{interest}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyInterests}>
            Your interests will appear here.
          </Text>
        )}
      </View>

      <View style={styles.postsHeading}>
        <View>
          <Text style={styles.sectionTitle}>Your posts</Text>
          <Text style={styles.sectionSubtitle}>
            Moments and updates you've shared
          </Text>
        </View>
      </View>

      {postsError && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Unable to load your posts.</Text>
          <TouchableOpacity onPress={() => refetchPosts()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // POST CARD

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Avatar uri={user?.profileImage} size={44} />

        <View style={styles.postAuthorInfo}>
          <View style={styles.postNameRow}>
            <Text style={styles.postAuthorName}>{user?.fullName || "You"}</Text>
            {user?.isVerified && <Verified />}
          </View>

          <Text style={styles.postDate}>{formatTime(item.createdAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.postMoreButton}
          onPress={() => askDeletePost(item)}>
          <Ionicons name="ellipsis-horizontal" size={21} color={MUTED} />
        </TouchableOpacity>
      </View>

      {item.caption ? (
        <Text style={styles.postCaption}>{item.caption}</Text>
      ) : null}

      {item.media?.length ? (
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => openPostViewer(item)}>
          <PostMedia media={item.media} />
        </TouchableOpacity>
      ) : null}

      <View style={styles.postStats}>
        <View style={styles.postStatsLeft}>
          <View style={styles.likeBubble}>
            <Ionicons name="heart" size={11} color="#FFFFFF" />
          </View>
          <Text style={styles.postStatsText}>
            {formatNumber(item.likesCount)} likes
          </Text>
        </View>

        <TouchableOpacity onPress={() => openPostViewer(item)}>
          <Text style={styles.postStatsText}>
            {formatNumber(item.commentsCount)} comments
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.postActionDivider} />

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.postAction}
          onPress={() => handleLike(item)}>
          <Ionicons
            name={item.isLiked ? "heart" : "heart-outline"}
            size={21}
            color={item.isLiked ? PRIMARY : MUTED}
          />
          <Text
            style={[styles.postActionText, item.isLiked && { color: PRIMARY }]}>
            Like
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postAction}
          onPress={() => openPostViewer(item)}>
          <Ionicons name="chatbubble-outline" size={20} color={MUTED} />
          <Text style={styles.postActionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.postAction}
          onPress={() => handleSave(item)}>
          <Ionicons
            name={item.isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={item.isSaved ? PRIMARY : MUTED}
          />
          <Text
            style={[styles.postActionText, item.isSaved && { color: PRIMARY }]}>
            {item.isSaved ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyPosts = () => (
    <View style={styles.emptyPosts}>
      {postsLoading ? (
        <ActivityIndicator color={PRIMARY} size="large" />
      ) : (
        <>
          <View style={styles.emptyPostIcon}>
            <Ionicons name="images-outline" size={32} color={PRIMARY} />
          </View>

          <Text style={styles.emptyPostTitle}>Your story starts here</Text>

          <Text style={styles.emptyPostsText}>
            Share a moment, thought or experience with your community.
          </Text>

          <TouchableOpacity
            style={styles.emptyCreateButton}
            onPress={openNewPost}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyCreateText}>Create your first post</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </SafeAreaView>
    );
  }

  if (error && !user) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="alert-circle-outline" size={42} color={DANGER} />
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorText}>{error.message}</Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => refetchMe()}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyPosts}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshProfile}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
            progressBackgroundColor={CARD}
          />
        }
      />

      {/* FULL POST VIEWER AND COMMENTS */}
      <Modal
        visible={fullscreenPostVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closePostViewer}>
        <SafeAreaView style={styles.viewerSafeArea}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity
              onPress={closePostViewer}
              style={styles.viewerBackButton}>
              <Ionicons name="arrow-back" size={23} color={TEXT} />
            </TouchableOpacity>

            <Text style={styles.viewerHeaderTitle}>Post</Text>

            <TouchableOpacity
              onPress={() => selectedPost && askDeletePost(selectedPost)}
              style={styles.viewerBackButton}>
              <Ionicons name="ellipsis-horizontal" size={22} color={TEXT} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.viewerKeyboard}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}>
            <ScrollView
              style={styles.viewerScroll}
              contentContainerStyle={styles.viewerContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {selectedPost && (
                <>
                  <View style={styles.viewerAuthor}>
                    <Avatar uri={user?.profileImage} size={43} />

                    <View style={styles.postAuthorInfo}>
                      <View style={styles.postNameRow}>
                        <Text style={styles.postAuthorName}>
                          {user?.fullName || "You"}
                        </Text>
                        {user?.isVerified && <Verified />}
                      </View>

                      <Text style={styles.postDate}>
                        @{user?.username || "username"} ·{" "}
                        {formatTime(selectedPost.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {selectedPost.caption ? (
                    <Text style={styles.viewerCaption}>
                      {selectedPost.caption}
                    </Text>
                  ) : null}

                  <PostMedia media={selectedPost.media} />

                  <View style={styles.viewerEngagement}>
                    <View style={styles.postStatsLeft}>
                      <View style={styles.likeBubble}>
                        <Ionicons name="heart" size={11} color="#FFFFFF" />
                      </View>
                      <Text style={styles.postStatsText}>
                        {formatNumber(selectedPost.likesCount)} likes
                      </Text>
                    </View>

                    <Text style={styles.postStatsText}>
                      {formatNumber(selectedPost.commentsCount)} comments
                    </Text>
                  </View>

                  <View style={styles.postActionDivider} />

                  <View style={styles.postActions}>
                    <TouchableOpacity
                      style={styles.postAction}
                      onPress={() => handleLike(selectedPost)}>
                      <Ionicons
                        name={selectedPost.isLiked ? "heart" : "heart-outline"}
                        size={21}
                        color={selectedPost.isLiked ? PRIMARY : MUTED}
                      />
                      <Text style={styles.postActionText}>Like</Text>
                    </TouchableOpacity>

                    <View style={styles.postAction}>
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color={PRIMARY}
                      />
                      <Text style={[styles.postActionText, { color: PRIMARY }]}>
                        Comment
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.postAction}
                      onPress={() => handleSave(selectedPost)}>
                      <Ionicons
                        name={
                          selectedPost.isSaved ? "bookmark" : "bookmark-outline"
                        }
                        size={20}
                        color={selectedPost.isSaved ? PRIMARY : MUTED}
                      />
                      <Text style={styles.postActionText}>
                        {selectedPost.isSaved ? "Saved" : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.viewerCommentsHeading}>
                    <Text style={styles.viewerCommentsTitle}>Comments</Text>
                    <Text style={styles.viewerCommentsCount}>
                      {comments.length}
                    </Text>
                  </View>

                  {commentsLoading ? (
                    <View style={styles.commentsLoading}>
                      <ActivityIndicator color={PRIMARY} />
                      <Text style={styles.commentLoadingText}>
                        Loading comments...
                      </Text>
                    </View>
                  ) : commentsError ? (
                    <View style={styles.commentsLoading}>
                      <Text style={styles.errorText}>
                        Unable to load comments.
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          refetchComments({
                            postId: selectedPost.id,
                            limit: COMMENT_LIMIT,
                            offset: 0,
                          })
                        }>
                        <Text style={styles.retryText}>Try again</Text>
                      </TouchableOpacity>
                    </View>
                  ) : comments.length === 0 ? (
                    <View style={styles.noComments}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={34}
                        color={MUTED}
                      />
                      <Text style={styles.noCommentsTitle}>
                        No comments yet
                      </Text>
                      <Text style={styles.noCommentsText}>
                        Be the first to start the conversation.
                      </Text>
                    </View>
                  ) : (
                    comments.map((comment) => (
                      <View key={comment.id}>
                        {renderComment({ item: comment })}
                      </View>
                    ))
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.viewerCommentInputRow}>
              <Avatar uri={user?.profileImage} size={35} />

              <TextInput
                style={styles.viewerCommentInput}
                placeholder="Write a comment..."
                placeholderTextColor={MUTED}
                value={commentText}
                onChangeText={setCommentText}
                multiline
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
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={17} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* SETTINGS */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSettingsVisible(false)}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>Settings</Text>
            <Text style={styles.modalSubtitle}>
              Manage your profile and account
            </Text>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={openEditProfile}>
              <View style={styles.optionIcon}>
                <Ionicons name="person-outline" size={20} color={PRIMARY} />
              </View>

              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Edit profile</Text>
                <Text style={styles.optionSubtitle}>
                  Update your personal information
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={openPrivacy}>
              <View style={styles.optionIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={PURPLE}
                />
              </View>

              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Privacy settings</Text>
                <Text style={styles.optionSubtitle}>
                  Control your profile visibility
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsOption}
              onPress={() => {
                setSettingsVisible(false);
                setSignOutConfirmVisible(true);
              }}>
              <View style={[styles.optionIcon, styles.dangerIcon]}>
                <Ionicons name="log-out-outline" size={20} color={DANGER} />
              </View>

              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: DANGER }]}>
                  Sign out
                </Text>
                <Text style={styles.optionSubtitle}>
                  Sign out of your account
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={MUTED} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancel}
              onPress={() => setSettingsVisible(false)}>
              <Text style={styles.sheetCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRIVACY SETTINGS */}
      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPrivacyVisible(false)}
          />

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.bottomSheet}
            keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHandle} />

            <Text style={styles.modalTitle}>Privacy settings</Text>
            <Text style={styles.modalSubtitle}>
              Choose how people interact with you.
            </Text>

            <Text style={styles.formLabel}>Profile visibility</Text>

            <View style={styles.choiceRow}>
              {["public", "private"].map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.choiceButton,
                    profileVisibility === value && styles.choiceButtonActive,
                  ]}
                  onPress={() => setProfileVisibility(value)}>
                  <Text
                    style={[
                      styles.choiceText,
                      profileVisibility === value && styles.choiceTextActive,
                    ]}>
                    {value === "public" ? "Public" : "Private"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.optionTitle}>Show online status</Text>
                <Text style={styles.optionSubtitle}>
                  Let people see when you're online or offline.
                </Text>
              </View>

              <Switch
                value={showOnlineStatus}
                onValueChange={setShowOnlineStatus}
                trackColor={{ false: BORDER, true: PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.optionTitle}>Show my age</Text>
                <Text style={styles.optionSubtitle}>
                  Display your age on your profile.
                </Text>
              </View>

              <Switch
                value={showAge}
                onValueChange={setShowAge}
                trackColor={{ false: BORDER, true: PRIMARY }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={styles.formLabel}>Who can message you?</Text>

            <View style={styles.choiceColumn}>
              {[
                { value: "everyone", label: "Everyone" },
                { value: "followers", label: "Followers only" },
                { value: "nobody", label: "Nobody" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.privacyChoice,
                    allowMessagesFrom === option.value &&
                      styles.privacyChoiceActive,
                  ]}
                  onPress={() => setAllowMessagesFrom(option.value)}>
                  <Text style={styles.privacyChoiceText}>{option.label}</Text>

                  {allowMessagesFrom === option.value && (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={PRIMARY}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUpdatePrivacy}
              disabled={updatingPrivacy}>
              {updatingPrivacy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Save privacy settings
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* CREATE POST */}
      <Modal
        visible={newPostVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNewPostVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setNewPostVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetKeyboard}>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.bottomSheet}
              keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />

              <Text style={styles.modalTitle}>Create a post</Text>
              <Text style={styles.modalSubtitle}>
                Share something with your community.
              </Text>

              <View style={styles.createPostIdentity}>
                <Avatar uri={user?.profileImage} size={43} />

                <View>
                  <Text style={styles.optionTitle}>{user?.fullName}</Text>
                  <Text style={styles.optionSubtitle}>
                    Sharing with your community
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.captionInput}
                placeholder="What's on your mind?"
                placeholderTextColor={MUTED}
                value={caption}
                onChangeText={setCaption}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.formLabel}>Media URL (optional)</Text>

              <TextInput
                style={styles.input}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor={MUTED}
                value={mediaUrl}
                onChangeText={setMediaUrl}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.formLabel}>Media type</Text>

              <View style={styles.choiceRow}>
                {["image", "video"].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.choiceButton,
                      mediaType === type && styles.choiceButtonActive,
                    ]}
                    onPress={() => setMediaType(type)}>
                    <Text
                      style={[
                        styles.choiceText,
                        mediaType === type && styles.choiceTextActive,
                      ]}>
                      {type === "image" ? "Image" : "Video"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreatePost}
                disabled={creatingPost}>
                {creatingPost ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Publish post</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={() => setNewPostVisible(false)}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* EDIT PROFILE - ACCESSIBLE FROM SETTINGS */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditProfileVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEditProfileVisible(false)}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetKeyboard}>
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.bottomSheet}
              keyboardShouldPersistTaps="handled">
              <View style={styles.sheetHandle} />

              <Text style={styles.modalTitle}>Edit profile</Text>
              <Text style={styles.modalSubtitle}>
                Keep your information up to date.
              </Text>

              {[
                {
                  label: "Full name",
                  value: editFullName,
                  setter: setEditFullName,
                  placeholder: "Your full name",
                },
                {
                  label: "Username",
                  value: editUsername,
                  setter: setEditUsername,
                  placeholder: "Username",
                },
                {
                  label: "Age",
                  value: editAge,
                  setter: setEditAge,
                  placeholder: "Your age",
                },
                {
                  label: "Location",
                  value: editLocation,
                  setter: setEditLocation,
                  placeholder: "Where are you based?",
                },
                {
                  label: "Profile image URL",
                  value: editProfileImage,
                  setter: setEditProfileImage,
                  placeholder: "Image URL",
                },
              ].map((field) => (
                <View key={field.label}>
                  <Text style={styles.formLabel}>{field.label}</Text>

                  <TextInput
                    style={styles.input}
                    placeholder={field.placeholder}
                    placeholderTextColor={MUTED}
                    value={field.value}
                    onChangeText={field.setter}
                    autoCapitalize={
                      field.label === "Username" ||
                      field.label === "Profile image URL"
                        ? "none"
                        : "sentences"
                    }
                    keyboardType={
                      field.label === "Age" ? "number-pad" : "default"
                    }
                  />
                </View>
              ))}

              <Text style={styles.formLabel}>Bio</Text>

              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell people about yourself..."
                placeholderTextColor={MUTED}
                value={editBio}
                onChangeText={setEditBio}
                multiline
              />

              <Text style={styles.formLabel}>
                Interests (separate with commas)
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Music, travel, sports..."
                placeholderTextColor={MUTED}
                value={editInterests}
                onChangeText={setEditInterests}
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleUpdateProfile}
                disabled={updatingProfile}>
                {updatingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save changes</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetCancel}
                onPress={() => setEditProfileVisible(false)}>
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* DELETE POST */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="trash-outline" size={27} color={DANGER} />
            </View>

            <Text style={styles.confirmTitle}>Delete this post?</Text>
            <Text style={styles.confirmDescription}>
              This post will be permanently removed from your profile.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteConfirmVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeletePost}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE COMMENT */}
      <Modal
        visible={deleteCommentConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteCommentConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="trash-outline" size={27} color={DANGER} />
            </View>

            <Text style={styles.confirmTitle}>Delete comment?</Text>
            <Text style={styles.confirmDescription}>
              Are you sure you want to remove this comment?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteCommentConfirmVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteComment}
                disabled={deletingComment}>
                {deletingComment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SIGN OUT */}
      <Modal
        visible={signOutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutConfirmVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="log-out-outline" size={27} color={DANGER} />
            </View>

            <Text style={styles.confirmTitle}>Sign out?</Text>
            <Text style={styles.confirmDescription}>
              You'll need to sign in again to access your account.
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setSignOutConfirmVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleSignOut}>
                <Text style={styles.deleteButtonText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// STYLES

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000fa",
  },
  listContent: {
    paddingBottom: 35,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#000000fa",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
  loadingText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 13,
  },
  errorTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },
  errorText: {
    color: MUTED,
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  topBar: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: {
    color: TEXT,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  topBarSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 3,
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  profileCard: {
    marginHorizontal: 15,
    backgroundColor: CARD,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#212121",
  },
  cover: {
    height: 70,
    backgroundColor: "#212121",
    overflow: "hidden",
    justifyContent: "center",
    paddingHorizontal: 20,
    alignItems: "flex-end",
  },
  coverOrbOne: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#7134A0",
    opacity: 0.35,
    right: -55,
    top: -110,
  },
  coverOrbTwo: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: PRIMARY,
    opacity: 0.15,
    right: 75,
    bottom: -100,
  },
  coverLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#212121",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  coverLabelText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  profileIdentity: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    marginTop: 19,
  },
  avatarWrapper: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 5,
    borderColor: CARD,
    backgroundColor: "#212121",
    position: "relative",
  },
  avatar: {
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  onlineIndicator: {
    position: "absolute",
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: SUCCESS,
    borderWidth: 3,
    borderColor: CARD,
    right: 5,
    bottom: 5,
  },
  identityText: {
    flex: 1,
    paddingBottom: 7,
    paddingLeft: 12,
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  profileName: {
    color: TEXT,
    fontSize: 19,
    fontWeight: "900",
    flexShrink: 1,
  },
  profileUsername: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    color: MUTED,
    fontSize: 11,
    flexShrink: 1,
  },
  profileBio: {
    color: "#D8D1E4",
    fontSize: 13,
    lineHeight: 19,
    marginHorizontal: 19,
    marginTop: 13,
  },
  profileBioPlaceholder: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginHorizontal: 19,
    marginTop: 13,
  },
  profileActions: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginTop: 15,
  },
  addPostButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  addPostButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 17,
    marginHorizontal: 17,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "900",
  },
  statLabel: {
    color: MUTED,
    fontSize: 10,
    marginTop: 5,
    fontWeight: "600",
  },

  // COMPACT ABOUT
  aboutCard: {
    marginHorizontal: 15,
    marginTop: 12,
    backgroundColor: CARD,
    borderRadius: 17,
    borderWidth: 1,
    // borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aboutHeader: {
    // flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  aboutSmallText: {
    color: MUTED,
    fontSize: 10,
  },
  aboutInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 13,
    marginTop: 12,
  },
  aboutInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  aboutInfoText: {
    color: "#D8D1E4",
    fontSize: 11,
    fontWeight: "600",
  },
  interestList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 11,
  },
  interestChip: {
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestChipText: {
    color: "#E4D9F5",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyInterests: {
    color: MUTED,
    fontSize: 10,
    marginTop: 10,
  },

  postsHeading: {
    marginHorizontal: 18,
    marginTop: 22,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionSubtitle: {
    color: MUTED,
    fontSize: 11,
    marginTop: 4,
  },
  postsAddButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addPostText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  errorCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 13,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  retryText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  emptyPosts: {
    marginHorizontal: 15,
    paddingHorizontal: 25,
    paddingVertical: 35,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  emptyPostIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyPostTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },
  emptyPostsText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
  },
  emptyCreateButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 18,
  },
  emptyCreateText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // POSTS
  postCard: {
    // marginHorizontal: 15,
    marginBottom: 8,
    backgroundColor: "#212121",
    borderRadius: 1,
    borderWidth: 1,
    // borderColor: BORDER,
    paddingTop: 5,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  postAuthorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  postNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postAuthorName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },
  postDate: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  postMoreButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  postCaption: {
    color: "#EAE4F2",
    fontSize: 13,
    lineHeight: 21,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 13,
  },
  mediaContainer: {
    width: "100%",
    gap: 5,
  },
  postMedia: {
    width: "100%",
    height: 310,
    backgroundColor: "#212121",
  },
  postStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  postStatsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  likeBubble: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  postStatsText: {
    color: MUTED,
    fontSize: 11,
  },
  postActionDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 14,
  },
  postActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 11,
    paddingBottom: 9,
  },
  postAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 5,
  },
  postActionText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
  },

  // POST VIEWER
  viewerSafeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  viewerHeader: {
    height: 55,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  viewerBackButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerHeaderTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },
  viewerKeyboard: {
    flex: 1,
  },
  viewerScroll: {
    flex: 1,
  },
  viewerContent: {
    paddingBottom: 20,
  },
  viewerAuthor: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  viewerCaption: {
    color: "#EAE4F2",
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingBottom: 15,
  },
  viewerEngagement: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  viewerCommentsHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 17,
    paddingTop: 19,
    paddingBottom: 15,
  },
  viewerCommentsTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "900",
  },
  viewerCommentsCount: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: "800",
  },
  commentsLoading: {
    paddingVertical: 35,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  commentLoadingText: {
    color: MUTED,
    fontSize: 11,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 15,
    marginBottom: 15,
    gap: 9,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: CARD,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: BORDER,
  },
  commentAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  commentName: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "900",
  },
  youBadge: {
    backgroundColor: "rgba(255,79,154,0.14)",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginLeft: 7,
  },
  youBadgeText: {
    color: PRIMARY,
    fontSize: 8,
    fontWeight: "900",
  },
  commentText: {
    color: "#E4DDEB",
    fontSize: 12,
    lineHeight: 19,
  },
  seeMoreButton: {
    alignSelf: "flex-start",
    paddingTop: 7,
  },
  seeMoreText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: "800",
  },
  commentFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingLeft: 8,
    paddingTop: 6,
  },
  commentTime: {
    color: MUTED,
    fontSize: 10,
  },
  commentDeleteText: {
    color: DANGER,
    fontSize: 10,
    fontWeight: "800",
  },
  noComments: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  noCommentsTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 12,
  },
  noCommentsText: {
    color: MUTED,
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  viewerCommentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: CARD,
  },
  viewerCommentInput: {
    flex: 1,
    maxHeight: 90,
    minHeight: 43,
    borderRadius: 14,
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: TEXT,
    fontSize: 12,
  },
  sendCommentButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCommentDisabled: {
    opacity: 0.45,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.68)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  bottomSheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 35,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sheetKeyboard: {
    justifyContent: "flex-end",
    maxHeight: "92%",
  },
  sheetScroll: {
    maxHeight: "92%",
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#5B4C70",
    alignSelf: "center",
    marginBottom: 19,
  },
  modalTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 5,
    marginBottom: 20,
  },
  settingsOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dangerIcon: {
    backgroundColor: "rgba(255,92,117,0.10)",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "800",
  },
  optionSubtitle: {
    color: MUTED,
    fontSize: 10,
    marginTop: 4,
  },
  sheetCancel: {
    marginTop: 17,
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#212121",
  },
  sheetCancelText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "800",
  },
  formLabel: {
    color: "#E8E0F2",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 9,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#212121",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 13,
  },
  bioInput: {
    height: 95,
    textAlignVertical: "top",
  },
  captionInput: {
    backgroundColor: "#212121",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    color: TEXT,
    minHeight: 115,
    padding: 14,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  createPostIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 17,
  },
  choiceRow: {
    flexDirection: "row",
    gap: 10,
  },
  choiceButton: {
    flex: 1,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#212121",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
  },
  choiceButtonActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  choiceText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  choiceTextActive: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  switchTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  choiceColumn: {
    gap: 8,
  },
  privacyChoice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: "#212121",
    borderWidth: 1,
    borderColor: BORDER,
  },
  privacyChoiceActive: {
    borderColor: PRIMARY,
  },
  privacyChoiceText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 23,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  // CONFIRMATION MODALS
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: CARD,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 23,
    alignItems: "center",
  },
  confirmIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "rgba(255,92,117,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  confirmTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "900",
  },
  confirmDescription: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 9,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 23,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#212121",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: "800",
  },
  deleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: DANGER,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
});
