import { IDocument } from './document';
import { ILeague } from './league';
import { IRound } from './round';
import { ITeam } from './team';

// export interface IMatch extends IDocument {
//   teamAId: string;
//   teamBId: string;
//   leagueId: string;
//   date: Date;
//   location: string;
//   numberOfNets: number;
//   numberOfRounds: number;
//   netRange: number;
//   pairLimit: number;
//   teamA?: ITeam;
//   teamB?: ITeam;
//   rounds: IRound[];
//   league?: ILeague;
//   winner?: ITeam;
//   teamAScore?: number;
//   teamBScore?: number;
//   active: boolean;
// }

// {
//   "rounds": [
//     {
//       "__typename": "Round",
//       "_id": "653a6c9bc9f29c001febc213",
//       "locked": false,
//       "num": 1,
//       "nets": [
//         {
//           "__typename": "Net",
//           "_id": "653a7005540047eb09dc4cd8",
//           "roundId": "653a6c9bc9f29c001febc213",
//           "teamAPlayerAId": null,
//           "teamAPlayerBId": "653a6bf6c9f29c001febc1bd",
//           "teamBPlayerAId": null,
//           "teamBPlayerBId": null,
//           "points": 1,
//           "teamAScore": 0,
//           "teamBScore": 0,
//           "locked": false,
//           "pairRange": 7,
//           "lockedB": false,
//           "num": 1,
//           "teamAPlayerA": null,
//           "teamAPlayerB": {
//             "__typename": "User",
//             "_id": "653a6bf6c9f29c001febc1bd",
//             "firstName": " Ferran",
//             "lastName": "Torres",
//             "player": {
//               "__typename": "Player",
//               "shirtNumber": 7,
//               "rank": 7,
//               "leagueId": "6539206458340386c0a25dfa",
//               "teamId": "653a3355c9f29c001febbdbf"
//             },
//             "login": null
//           },
//           "teamBPlayerA": null,
//           "teamBPlayerB": null
//         },
//         {
//           "__typename": "Net",
//           "_id": "653a7005540047eb09dc4cdb",
//           "roundId": "653a6c9bc9f29c001febc213",
//           "teamAPlayerAId": "653a6b81c9f29c001febc14d",
//           "teamAPlayerBId": null,
//           "teamBPlayerAId": null,
//           "teamBPlayerBId": null,
//           "points": 1,
//           "teamAScore": 0,
//           "teamBScore": 0,
//           "locked": false,
//           "pairRange": 3,
//           "lockedB": false,
//           "num": 2,
//           "teamAPlayerA": {
//             "__typename": "User",
//             "_id": "653a6b81c9f29c001febc14d",
//             "firstName": "Alejandro",
//             "lastName": "Balde",
//             "player": {
//               "__typename": "Player",
//               "shirtNumber": 3,
//               "rank": 3,
//               "leagueId": "6539206458340386c0a25dfa",
//               "teamId": "653a3355c9f29c001febbdbf"
//             },
//             "login": null
//           },
//           "teamAPlayerB": null,
//           "teamBPlayerA": null,
//           "teamBPlayerB": null
//         }
//       ],
//       "sub": {
//         "__typename": "Sub",
//         "_id": "653a6c9cc9f29c001febc215",
//         "roundId": "653a6c9bc9f29c001febc213",
//         "players": [
//           "653a6bb6c9f29c001febc181"
//         ],
//         "playerObjects": [
//           {
//             "__typename": "User",
//             "_id": "653a6bb6c9f29c001febc181",
//             "firstName": "Ronald",
//             "lastName": "Araújo",
//             "player": {
//               "__typename": "Player",
//               "shirtNumber": 4,
//               "rank": 4,
//               "leagueId": "6539206458340386c0a25dfa",
//               "teamId": "653a3355c9f29c001febbdbf"
//             },
//             "login": null
//           }
//         ]
//       }
//     }
//   ],
//   "winner": {
//     "__typename": "Team",
//     "_id": "653a3355c9f29c001febbdbf",
//     "name": "FC Barcelona",
//     "active": true,
//     "coachId": "653927d25f80589015bd3df3",
//     "leagueId": "6539206458340386c0a25dfa"
//   },
//   "teamAScore": null,
//   "teamBScore": null,
// }

export interface IMatch extends IDocument {
  teamAId: string;
  teamBId: string;
  leagueId: string;
  date: Date;
  location: string;
  numberOfNets: number;
  numberOfRounds: number;
  netRange: number;
  pairLimit: number;
  active: boolean;
  roundIdList: string[];
}