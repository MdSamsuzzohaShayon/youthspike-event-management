import { gql } from '@apollo/client';

const GET_MATCH_DETAIL = gql`
  query GetMatch($matchId: String!) {
    getMatch(id: $matchId) {
      code
      success
      message
      data {
        _id
        teamAId
        teamBId
        leagueId
        date
        location
        numberOfNets
        numberOfRounds
        rounds {
          _id
          locked
          num
          nets {
            _id
            roundId
            teamAPlayerAId
            teamAPlayerBId
            teamBPlayerAId
            teamBPlayerBId
            points
            teamAScore
            teamBScore
            locked
            pairRange
            lockedB
          }
        }
        netRange
        pairLimit
        teamA {
          _id
          name
          active
          coachId
          coach {
            _id
            firstName
            lastName
            role
            player {
              shirtNumber
              rank
              leagueId
              teamId
              team {
                _id
                name
                active
                coachId
                leagueId
              }
            }
            login {
              email
              password
            }
          }
          leagueId
          players {
            _id
            firstName
            lastName
            role
            active
            player {
              shirtNumber
              rank
              leagueId
              teamId
              team {
                _id
                name
                active
                coachId
                leagueId
              }
            }
          }
        }
        teamB {
          _id
          name
          active
          coachId
          leagueId
          players {
            _id
            firstName
            lastName
            role
            active
            player {
              shirtNumber
              rank
              leagueId
              teamId
              team {
                _id
                name
                active
                coachId
                leagueId
              }
            }
          }
          coach {
            _id
            firstName
            lastName
            role
            player {
              shirtNumber
              rank
              leagueId
              teamId
              team {
                _id
                name
                active
                coachId
                leagueId
              }
            }
            login {
              email
              password
            }
          }
        }
        league {
          _id
          name
          startDate
          endDate
          active
          playerLimit
        }
        winner {
          _id
          name
          active
          coachId
          leagueId
        }
        rounds {
          _id
          num
          locked
          nets {
            roundId
            num
            teamAPlayerAId
            teamAPlayerBId
            teamBPlayerAId
            teamBPlayerBId
            points
            teamAScore
            teamBScore
            locked
            lockedB
            teamAPlayerA {
              _id
              firstName
              lastName
              player {
                shirtNumber
                rank
                leagueId
                teamId
              }
              login {
                email
              }
            }
            teamAPlayerB {
              _id
              firstName
              lastName
              player {
                shirtNumber
                rank
                leagueId
                teamId
              }
              login {
                email
              }
            }
            teamBPlayerA {
              _id
              firstName
              lastName
              player {
                shirtNumber
                rank
                leagueId
                teamId
              }
              login {
                email
              }
            }
            teamBPlayerB {
              _id
              firstName
              lastName
              player {
                shirtNumber
                rank
                leagueId
                teamId
              }
              login {
                email
              }
            }
          }
          sub {
            _id
            roundId
            players
            playerObjects {
              _id
              firstName
              lastName
              player {
                shirtNumber
                rank
                leagueId
                teamId
              }
              login {
                email
              }
            }
          }
        }
        teamAScore
        teamBScore
        active
      }
    }
  }
`;



export {GET_MATCH_DETAIL};