import { Injectable } from '@nestjs/common';
import {
  EServerReceiverAction,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { PointsUpdateHelper } from './points-update.helper';
import { ScoreKeeperHelper } from './score-keeper.helper';

@Injectable()
export class RevertPlayHelper {
  constructor(private readonly scoreKeeper: ScoreKeeperHelper) {}

  async revertPlayerScore(
    singlePlay: ServerReceiverSinglePlay,
    pointsUpdateHelper: PointsUpdateHelper,
  ): Promise<string[]> {
    let stats = null,
      playerIds = [];
    switch (singlePlay.action) {
      case EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH:
        playerIds = [singlePlay.server, singlePlay.receiver, singlePlay.servingPartner, singlePlay.receivingPartner];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const aceThirdStats = pointsUpdateHelper.statsAceNoThird();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], aceThirdStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.servingPartner as string], aceThirdStats.servingPartner);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], aceThirdStats.receiver);
        this.scoreKeeper.decrement(stats[singlePlay.receivingPartner as string], aceThirdStats.receivingPartner);
        break;

      case EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION:
        playerIds = [singlePlay.server, singlePlay.receiver, singlePlay.servingPartner, singlePlay.receivingPartner];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const defensiveStats = pointsUpdateHelper.statsDefensiveConversion();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], defensiveStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.servingPartner as string], defensiveStats.servingPartner);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], defensiveStats.receiver);
        this.scoreKeeper.decrement(stats[singlePlay.receivingPartner as string], defensiveStats.receivingPartner);
        break;

      case EServerReceiverAction.SERVER_ACE_NO_TOUCH:
        playerIds = [singlePlay.server, singlePlay.receiver];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const aceStats = pointsUpdateHelper.statsAceNoTouch();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], aceStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], aceStats.receiver);
        break;

      case EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR:
        playerIds = [singlePlay.server, singlePlay.receiver, singlePlay.receivingPartner];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const hittingErrStats = pointsUpdateHelper.statsReceivingHittingError();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], hittingErrStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], hittingErrStats.receiver);
        this.scoreKeeper.decrement(stats[singlePlay.receivingPartner as string], hittingErrStats.receivingPartner);
        break;

      case EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY:
        playerIds = [singlePlay.server, singlePlay.receiver, singlePlay.servingPartner, singlePlay.receivingPartner];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const putAwayStats = pointsUpdateHelper.statsOneTwoThreePutAway();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], putAwayStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.servingPartner as string], putAwayStats.servingPartner);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], putAwayStats.receiver);
        this.scoreKeeper.decrement(stats[singlePlay.receivingPartner as string], putAwayStats.receivingPartner);
        break;

      case EServerReceiverAction.RECEIVER_RALLEY_CONVERSION:
        playerIds = [singlePlay.server, singlePlay.receiver, singlePlay.servingPartner, singlePlay.receivingPartner];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const rallyStats = pointsUpdateHelper.statsRallyConversion();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], rallyStats.server);
        this.scoreKeeper.decrement(stats[singlePlay.servingPartner as string], rallyStats.servingPartner);
        this.scoreKeeper.decrement(stats[singlePlay.receiver as string], rallyStats.receiver);
        this.scoreKeeper.decrement(stats[singlePlay.receivingPartner as string], rallyStats.receivingPartner);
        break;

      case EServerReceiverAction.RECEIVER_SERVICE_FAULT:
        playerIds = [singlePlay.server];
        stats = await this.scoreKeeper.getPlayerStats(
          String(singlePlay.net),
          String(singlePlay.match) as string,
          playerIds as [],
        );
        const faultStats = pointsUpdateHelper.statsRallyConversion();
        this.scoreKeeper.decrement(stats[singlePlay.server as string], faultStats.server);
        break;

      default:
        break;
    }

    if (stats) {
      await this.scoreKeeper.savePlayerStats(stats);
    }

    return playerIds;
  }
}
