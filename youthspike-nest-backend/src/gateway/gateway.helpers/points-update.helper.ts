import { Injectable } from '@nestjs/common';
import { UpdatePointsInput, RoundUpdatedResponse, MatchRoundNet, NetScore } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from './score-keeper.helper';

@Injectable()
export class PointsUpdateHelper {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}


  async calculateRoundScores(roundId: string) {
    const { netService } = this.gatewayService.getServices();
    const findNets = await netService.find({ round: roundId });
    
    let teamAScore: number | null = null;
    let teamBScore: number | null = null;
    
    for (const net of findNets) {
      if (net.teamAScore !== null && net.teamBScore !== null) {
        teamAScore = (teamAScore || 0) + net.teamAScore;
        teamBScore = (teamBScore || 0) + net.teamBScore;
      } else {
        return { teamAScore: null, teamBScore: null };
      }
    }
    
    return { teamAScore, teamBScore };
  }

  async buildPointsResponse(
    nets: NetScore[],
    roundId: string,
    room: string,
    matchId: string,
    teamAScore: number | null,
    teamBScore: number | null,
    completed: boolean,
    roundListLength: number,
  ): Promise<RoundUpdatedResponse> {
    const { roundService, matchService } = this.gatewayService.getServices();
    const roundExist = await roundService.findById(roundId);
    
    let matchCompleted = false;
    if (completed && roundExist.num === roundListLength) {
      await matchService.updateOne({ _id: matchId }, { completed });
      matchCompleted = true;
    }

    return {
      nets: nets,
      room,
      round: { _id: roundId, teamAScore, teamBScore, completed },
      matchCompleted,
      teamAProcess: roundExist.teamAProcess,
      teamBProcess: roundExist.teamBProcess,
    };
  }

  async publishUpdates(
    room: string,
    matchId: string,
    pointsResponse: RoundUpdatedResponse,
    nets: NetScore[],
    roundId: string,
  ) {
    const presizedRoundData: MatchRoundNet = {
      nets,
      _id: roundId,
      match: matchId,
      matchCompleted: pointsResponse.matchCompleted,
    };

    await Promise.all([
      this.scoreKeeperHelper.publishRoom(room, 'update-points-response-all', pointsResponse),
      this.scoreKeeperHelper.publishRoom(room, 'net-update-all-pages', presizedRoundData),
    ]);
  }
}