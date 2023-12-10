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
          email
          captainplayer {
            _id
            event {
              _id
              name
            }
          }
        }
      }
    }
  }
`;

export { LOGIN_USER };
