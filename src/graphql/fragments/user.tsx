import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFields on User {
    id
    fullName
    username
    email
    age
    bio
    location
    profileImage
    isVerified
    interests
    isOnline
    lastSeen

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

    followersCount
    followingCount
    likesCount
    postsCount

    compatibility {
      score
      sharedInterests
    }

    createdAt
    updatedAt
  }
`;
