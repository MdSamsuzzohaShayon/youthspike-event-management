import { gql } from '@apollo/client';

const teamResponse = `
    _id
    active
    name
    logo
    division
    sendCredentials
    num
    event{
      _id
    }
    players {
      _id
      firstName
      lastName
      email
      phone
      profile
      status
      teams {
        _id
        name
      }
      captainofteams {
        _id
        name
      }
      cocaptainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
        email
      }
    }
    captain {
      _id
      firstName
      lastName
      profile
      captainofteams {
        _id
        name
      }
      captainuser {
        _id
        firstName
        lastName
        email
      }
    }
`;

/**
 * Query
 * =========================================================================================================================================
 */
const GET_A_TEAM = gql`
  query GetTeam($teamId: String!) {
    getTeam(teamId: $teamId) {
      code
      success
      message
      data {
      ${teamResponse}
      }
    }
  }
`;

// eslint-disable-next-line import/prefer-default-export
export { GET_A_TEAM };
