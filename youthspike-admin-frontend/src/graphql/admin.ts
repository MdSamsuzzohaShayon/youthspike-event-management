import { gql } from "@apollo/client";

const LOGIN_USER_RAW = `
  mutation Login($email: String!, $password: String!, $passcode: String) {
    login(email: $email, password: $password, passcode: $passcode) {
      code
      success
      message
      data {
        token
        info {
          _id
          firstName
          lastName
          role
          team
          teamLogo
          email
          passcode
          event
          captainplayer
          cocaptainplayer
          player
        }
      }
    }
  }
`;

const LOGIN_USER = gql`${LOGIN_USER_RAW}`;

export { LOGIN_USER, LOGIN_USER_RAW };
