import { gql } from "@apollo/client";

import { USER_FRAGMENT } from "../fragments/user";

export const SIGNUP_MUTATION = gql`
  mutation Signup($fullName: String!, $email: String!, $password: String!) {
    signup(fullName: $fullName, email: $email, password: $password) {
      token
      user {
        ...UserFields
      }
    }
  }

  ${USER_FRAGMENT}
`;

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ...UserFields
      }
    }
  }

  ${USER_FRAGMENT}
`;
