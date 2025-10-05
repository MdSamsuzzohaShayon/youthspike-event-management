import { Injectable } from '@nestjs/common';
import { RoundUpdatedResponse, MatchRoundNet, NetScore } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from './score-keeper.helper';
import { ETieBreakingStrategy } from 'src/event/event.schema';

@Injectable()
export class PointsUpdateHelper {
  constructor(private readonly gatewayService: GatewayService, private readonly scoreKeeperHelper: ScoreKeeperHelper) {}

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
    const { roundService, matchService, netService } = this.gatewayService.getServices();
    const roundExist = await roundService.findById(roundId);

    const roundList = await roundService.find({ match: matchId });
    const matchExist = await matchService.findOne({ _id: matchId });
    let matchCompleted = false;
    if (matchExist.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND) {
      if (matchExist.extendedOvertime) {
        if (roundExist.num === roundListLength) {
          // Check teamA score and teamB score
          // if both do no match then match will be completed
          let teamARoundScore = 0,
            teamBRoundScore = 0;
          let bothScores = true;
          for (const r of roundList) {
            const roundNets = await netService.find({ round: r._id });
            for (const n of roundNets) {
              if (!n.teamAScore || !n.teamBScore) {
                bothScores = false;
                break;
              } else if (n.teamAScore > n.teamBScore) {
                teamARoundScore += n.points;
              } else if (n.teamAScore < n.teamBScore) {
                teamBRoundScore += n.points;
              }
            }
          }
          if (bothScores && teamARoundScore !== teamBRoundScore) {
            matchCompleted = true;
            await matchService.updateOne({ _id: matchId }, { $set: { completed: matchCompleted } });
          }
        }
      }
    } else {
      if (completed && roundExist.num === roundListLength) {
        await matchService.updateOne({ _id: matchId }, { completed });
        matchCompleted = true;
      }
    }

    if (matchCompleted) {
      // Update cache to database
      // Update player stats
      // Update single play stats
      // Update server receiver
      // const redisKeys = netsOfPlayer.map((net) => playerKey(player._id, net._id));
      // const redisResults = await Promise.all(redisKeys.map((key) => this.redisService.get(key)));
      // const netsOfMatch = await netService.find({match: matchId});
      // const players = new Set();
      // for (const element of netsOfMatch) {
      // }
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

  statsAceNoTouch() {
    const server = {
      serveOpportunity: 1,
      serveCompletionCount: 1,
      serveAce: 1,
      servingAceNoTouch: 1,
      break: 1,
    };

    const receiver = {
      receiverOpportunity: 1,
      noTouchAcedCount: 1,
      broken: -1,
    };

    return { server, receiver };
  }

  statsServiceFault() {
    return {
      server: {
        serveOpportunity: 1,
      },
    };
  }

  statsDefensiveConversion() {
    return {
      server: {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1,
        break: 0.5,
      },
      servingPartner: {
        defensiveOpportunity: 1,
        defensiveConversion: 1,
        break: 0.5,
      },
      receiver: {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        defensiveOpportunity: 1,
        broken: -0.5,
      },
      receivingPartner: {
        settingOpportunity: 1,
        defensiveOpportunity: 1,
        broken: -0.5,
      },
    };
  }

  statsAceNoThird() {
    return {
      server: {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        break: 0.5,
      },
      servingPartner: {
        broken: -0.5,
      },
      receiver: {
        receiverOpportunity: 1,
        receivedCount: 1,
        broken: -0.5,
      },
      receivingPartner: {
        broken: -0.5,
      },
    };
  }

  statsReceivingHittingError() {
    return {
      server: {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        break: 0.5,
      },
      receiver: {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        broken: -0.5,
      },
      receivingPartner: {
        settingOpportunity: 1,
        broken: -0.5,
      },
    };
  }

  statsOneTwoThreePutAway() {
    return {
      server: {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 1,
      },
      servingPartner: {
        defensiveOpportunity: 1,
      },
      receiver: {
        receiverOpportunity: 1,
        receivedCount: 1,
        cleanHits: 1,
        hittingOpportunity: 1,
      },
      receivingPartner: {
        settingOpportunity: 1,
        cleanSets: 1,
      },
    };
  }

  statsRallyConversion() {
    return {
      server: {
        serveOpportunity: 1,
        serveCompletionCount: 1,
        defensiveOpportunity: 2,
        defensiveConversion: 1,
      },
      servingPartner: {
        defensiveOpportunity: 2,
        defensiveConversion: 1,
      },
      receiver: {
        receiverOpportunity: 1,
        receivedCount: 1,
        hittingOpportunity: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1,
      },
      receivingPartner: {
        settingOpportunity: 1,
        defensiveOpportunity: 1,
        defensiveConversion: 1,
      },
    };
  }
}
