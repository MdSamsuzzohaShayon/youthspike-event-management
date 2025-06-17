const GET_PLAYER_AND_TEAMS_RAW = `
query GetPlayerAndTeams($playerId: String!, $eventId: String!) {
  getPlayerAndTeams(playerId: $playerId, eventId: $eventId) {
    code
    success
    message
    data {
      player {
        _id
        firstName
        teams
        lastName
        username
        email
        status
        profile
        phone
        division
      }
      teams {
        _id
        name
        logo
        division
        active
        rankLock
        players
        group
        captain
        cocaptain
      }
    }
  }
}
`;

const playerResponse = `
  _id
  firstName
  lastName
  username
  profile
  email
  status
  phone
  division
  teams {
    _id
    name
  }
`;

const GET_A_PLAYER_RAW = `
query GetPlayer($playerId: String!) {
  getPlayer(playerId: $playerId) {
    code
    message
    success
    data {
      ${playerResponse}
    }
  }
}
`;

export { GET_PLAYER_AND_TEAMS_RAW, GET_A_PLAYER_RAW };
