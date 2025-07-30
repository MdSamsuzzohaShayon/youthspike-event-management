import { Injectable } from '@nestjs/common';
import { UpdatePointsInput, RoundUpdatedResponse, MatchRoundNet } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from './score-keeper.helper';

@Injectable()
export class PointsUpdateHelper {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
  ) {}

  async updateNetScores(nets: { _id: string; teamAScore?: number; teamBScore?: number }[]) {
    const { netService } = this.gatewayService.getServices();
    const updatePromises = nets.map(n => {
      const pointsObj: any = {};
      if (n.teamAScore !== undefined) pointsObj.teamAScore = n.teamAScore;
      if (n.teamBScore !== undefined) pointsObj.teamBScore = n.teamBScore;
      return netService.updateOne({ _id: n._id }, pointsObj);
    });
    return Promise.all(updatePromises);
  }

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
    input: UpdatePointsInput,
    room: string,
    matchId: string,
    teamAScore: number | null,
    teamBScore: number | null,
    completed: boolean,
    roundListLength: number,
  ): Promise<RoundUpdatedResponse> {
    const { roundService, matchService } = this.gatewayService.getServices();
    const roundExist = await roundService.findById(input.round);
    
    let matchCompleted = false;
    if (completed && roundExist.num === roundListLength) {
      await matchService.updateOne({ _id: matchId }, { completed });
      matchCompleted = true;
    }

    return {
      nets: input.nets,
      room,
      round: { _id: input.round, teamAScore, teamBScore, completed },
      matchCompleted,
      teamAProcess: roundExist.teamAProcess,
      teamBProcess: roundExist.teamBProcess,
    };
  }

  async publishUpdates(
    room: string,
    matchId: string,
    pointsResponse: RoundUpdatedResponse,
    nets: { _id: string }[],
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