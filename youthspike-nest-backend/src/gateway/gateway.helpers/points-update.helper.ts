import { Injectable } from '@nestjs/common';
import { RoundUpdatedResponse, MatchRoundNet, NetScore } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from './score-keeper.helper';
import { GatewayRedisService } from '../gateway.redis';

@Injectable()
export class PointsUpdateHelper {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly redis: GatewayRedisService,
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
    /*
        this.gatewayRedisService.publishToRoom(
          submitLineup.room,
          'submit-lineup-response-all',
          roomDataWithNets,
          client.id,
        ),

    */
  }

  async publishError(socketId: string, message: string) {
    await this.redis.publishToSocket(socketId, 'error-from-server', message);
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
