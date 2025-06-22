import { Injectable } from '@nestjs/common';
import { GatewayService } from '../gateway.service';
import { EActionProcess } from 'src/round/round.schema';

@Injectable()
export class ValidationHelper {
  constructor(private readonly gatewayService: GatewayService) {}

  async validateCaptainCheckIn(userId: string) {
    const { playerService, teamService, matchService, roundService } = this.gatewayService.getServices();
    const captainPlayerExist = await playerService.findOne({
      $or: [{ captainuser: userId }, { cocaptainuser: userId }],
    });

    if (captainPlayerExist && captainPlayerExist.teams.length > 0) {
      const teams = await teamService.find({ _id: { $in: captainPlayerExist.teams.map((t) => t._id) } });
      if (teams.length > 0) {
        const teamIds = teams.map((t) => t._id.toString());
        const matches = await matchService.find({
          $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
        });

        const teamOfTheCaptain = teamIds[0];
        if (matches.length > 0) {
          for (const match of matches) {
            const roundList = await roundService.find({ match: match._id });
            if (roundList.length > 0) {
              const firstRound = roundList[0];
              if (
                (teamOfTheCaptain === match.teamA.toString() &&
                  firstRound.teamAProcess !== EActionProcess.INITIATE &&
                  !match.completed) ||
                (teamOfTheCaptain === match.teamB.toString() &&
                  firstRound.teamBProcess !== EActionProcess.INITIATE &&
                  !match.completed)
              ) {
                throw new Error(
                  `A match is already running (${match._id}), until you complete that match you can not start a new match!`,
                );
              }
            }
          }
        }
      }
    }
  }
}