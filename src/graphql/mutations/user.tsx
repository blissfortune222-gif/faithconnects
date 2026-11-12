import { gql } from "@apollo/client";

import { USER_FRAGMENT } from "../fragments/user";

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const UPDATE_INTERESTS_MUTATION = gql`
  mutation UpdateInterests($interests: [String!]!) {
    updateInterests(interests: $interests) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const UPDATE_PRIVACY_MUTATION = gql`
  mutation UpdatePrivacy($input: UpdatePrivacyInput!) {
    updatePrivacy(input: $input) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const UPDATE_APPEARANCE_MUTATION = gql`
  mutation UpdateAppearance($input: UpdateAppearanceInput!) {
    updateAppearance(input: $input) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const SET_ONLINE_STATUS_MUTATION = gql`
  mutation SetOnlineStatus($isOnline: Boolean!) {
    setOnlineStatus(isOnline: $isOnline) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;
