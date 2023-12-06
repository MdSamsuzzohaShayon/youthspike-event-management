import { gql } from "@apollo/client";

const LOGIN_USER = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      code
      success
      message
      data {
        token
        user {
          _id
          firstName
          lastName
          role
          login {
            email
          }
        }
      }
    }
  }
`;

export { LOGIN_USER };
