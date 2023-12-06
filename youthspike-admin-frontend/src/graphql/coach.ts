import { gql } from '@apollo/client';

/**
 * Query
 * ===========================================================================================================================
 */
const GET_COACHES_IN_DETAIL = gql`
  query GetCoaches {
    getCoaches {
      code
      success
      message
      data {
        _id
        firstName
        lastName
        role
        login {
          email
          password
        }
        active
        player {
          shirtNumber
          rank
          teamId
          leagueId

          league {
            _id
            name
          }

          team {
            _id
            name
          }
        }
        coach {
          team {
            name
            _id
            league {
              _id
              name
            }
          }
        }
      }
    }
  }
`;

const COACH_DROPDOWN = gql`
  query GetCoaches {
    getCoaches {
      code
      success
      message
      data {
        _id
        firstName
        lastName
      }
    }
  }
`;

/**
 * Mutation
 * ===========================================================================================================================
 */

const ADD_UPDATE_COACH = gql`
  mutation SignupCoach(
    $firstName: String!
    $lastName: String!
    $email: String!
    $password: String!
    $shirtNumber: Int
    $rank: Int
    $leagueId: String
    $teamId: String
    $role: String
    $id: String
  ) {
    signupCoach(
      firstName: $firstName
      lastName: $lastName
      email: $email
      password: $password
      shirtNumber: $shirtNumber
      rank: $rank
      leagueId: $leagueId
      teamId: $teamId
      role: $role
      id: $id
    ) {
      code
      data {
        _id
      }
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword($id: String!, $oldPassword: String!, $newPassword: String) {
    changePassword(id: $id, oldPassword: $oldPassword, newPassword: $newPassword) {
      code
      success
      message
      data {
        updated
      }
    }
  }
`;

export { GET_COACHES_IN_DETAIL, COACH_DROPDOWN, CHANGE_PASSWORD, ADD_UPDATE_COACH };
