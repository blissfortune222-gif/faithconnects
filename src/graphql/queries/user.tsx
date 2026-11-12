import { gql } from "@apollo/client";

import { USER_FRAGMENT } from "../fragments/user";

export const ME_QUERY = gql`
  query Me {
    me {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;

export const USERS_QUERY = gql`
  query Users($limit: Int!, $offset: Int!) {
    users(limit: $limit, offset: $offset) {
      ...UserFields
    }
  }

  ${USER_FRAGMENT}
`;
