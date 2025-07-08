import { EActionProcess } from 'src/round/round.schema';
import { RoomLocal, RoomRoundProcess, ETeam, SubmitLineupInput } from '../gateway.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RoomHelper {
  createInitialRoomData(roomExist: any, roundsOfTheMatch: any[]): RoomLocal {
    return {
      _id: roomExist._id.toString(),
      match: roomExist.match.toString(),
      teamA: roomExist.teamA.toString(),
      teamAClient: null,
      teamB: roomExist.teamB.toString(),
      teamBClient: null,
      rounds: roundsOfTheMatch.map((round) => ({
        _id: round._id.toString(),
        num: round.num,
        teamAProcess: round.teamAProcess,
        teamBProcess: round.teamBProcess,
      })),
    };
  }

  updateTeamAssignment(
    roomData: RoomLocal,
    joiningTeam: string,
    teamAId: string,
    teamBId: string,
    clientId: string,
  ): RoomLocal {
    const updatedRoom = { ...roomData };
    if (joiningTeam === teamAId) updatedRoom.teamAClient = clientId;
    else if (joiningTeam === teamBId) updatedRoom.teamBClient = clientId;
    return updatedRoom;
  }

  arePlayersFilled(team: ETeam, submitLineup: SubmitLineupInput): boolean {
    return submitLineup.nets.every((net) =>
      team === ETeam.teamA ? net.teamAPlayerA && net.teamAPlayerB : net.teamBPlayerA && net.teamBPlayerB,
    );
  }

  processLineup(
    team: ETeam,
    submitLineup: SubmitLineupInput,
    currRoundObj: RoomRoundProcess,
    currTeamId: string | null,
  ): string | null {
    if (!this.arePlayersFilled(team, submitLineup)) return null;

    if (team === ETeam.teamA) {
      currRoundObj.teamAProcess = EActionProcess.LINEUP;
      currTeamId = submitLineup.teamAId;
    } else {
      currRoundObj.teamBProcess = EActionProcess.LINEUP;
      currTeamId = submitLineup.teamBId;
    }

    return currTeamId;
  }
}