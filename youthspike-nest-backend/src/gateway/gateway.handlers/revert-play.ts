import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ETeam, RevertPlayInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { singlePlayKey } from 'src/util/helper';
import {
  EServerReceiverAction,
  ServerReceiverSinglePlay,
} from 'src/server-receiver-on-net/server-receiver-on-net.schema';
import { ValidationHelper } from '../gateway.helpers/validation.helper';
import { PointsUpdateHelper } from '../gateway.helpers/points-update.helper';
import { RevertPlayHelper } from '../gateway.helpers/revert-play.helper';

export class RevertPlayHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly validationHelper: ValidationHelper,
    private readonly revertPlayHelper: RevertPlayHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper,
  ) {}

  async handle(@ConnectedSocket() client: Socket, @MessageBody() body: RevertPlayInput, server: Server) {
    try {
      const { serverReceiverOnNetService, matchService, netService, playerService, jwtService } =
        this.gatewayService.getServices();

      const [net, match] = await Promise.all([
        this.scoreKeeperHelper.loadNetAction(body.net, body.room),
        matchService.findById(body.match),
      ]);
      const currPlay = await this.scoreKeeperHelper.loadSinglePlayAction(body.net, body.room, body.play);
      if (!currPlay) {
        throw new Error('Can not found that specific play.');
      }

      this.validationHelper.authCheck(body.accessCode, jwtService, match.accessCode);
      const playKeys = new Set<string>();

      // Delete selectedPlay and all plays of the net after selected play
      const numOfItems = net.mutate - body.play;
      const deletePromises = [];
      const redisResults = [];
      const playerIds = new Set();

      for (let i = 0; i < numOfItems; i += 1) {
        const playToDelete = body.play + i;

        try {
          let singlePlayExist = await this.scoreKeeperHelper.loadSinglePlayAction(body.net, body.room, playToDelete);
          if (!singlePlayExist) continue;
          const pIds = await this.revertPlayHelper.revertPlayerScore(singlePlayExist, this.pointsUpdateHelper);
          pIds.forEach((p) => playerIds.add(p));
        } catch (playErr) {
          console.log(playErr);
        }
        // If there is _id in that play delete that
        const key = singlePlayKey(body.net, body.room, playToDelete);
        const sp = await this.scoreKeeperHelper.getSinglePlays(key);
        redisResults.push(sp);
        deletePromises.push(this.scoreKeeperHelper.deleteSinglePlayAction(body.net, body.room, playToDelete));
        playKeys.add(key);
      }

      deletePromises.push(
        serverReceiverOnNetService.deleteManySinglePlay({ $and: [{ net: body.net }, { play: { $gte: body.play } }] }),
      );

      const savedIds = new Set();
      redisResults.forEach((rr: ServerReceiverSinglePlay) => {
        // Process each individual play
        if (net?._id && rr?._id) {
          savedIds.add(rr._id);
        }
      });

      if (net?._id) {
        deletePromises.push(
          netService.updateOne({ _id: body.net }, { $pull: { serverReceiverSinglePlay: { $in: [...savedIds] } } }),
        );
        playerIds.add(net.server);
        playerIds.add(net.servingPartner);
        playerIds.add(net.receiver);
        playerIds.add(net.receivingPartner);
        deletePromises.push(
          playerService.updateMany(
            { serverReceiverOnNet: { $in: [net.server, net.servingPartner, net.receiver, net.receivingPartner] } },
            { $pull: { serverReceiverSinglePlay: { $in: [...savedIds] } } },
          ),
        );
        deletePromises.push(
          matchService.updateOne({ _id: body.match }, { $pull: { serverReceiverSinglePlay: { $in: [...savedIds] } } }),
        );
      }
      // Update points of each team
      await Promise.all(deletePromises);

      const netExist = await netService.findOne({ _id: body.net });
      if (!netExist) {
        throw new Error('Can not net for this play.');
      }

      const servingTeamE =
        netExist.teamAPlayerA === currPlay.server || netExist.teamAPlayerB === currPlay.server
          ? ETeam.teamA
          : netExist.teamBPlayerA === currPlay.server || netExist.teamBPlayerB === currPlay.server
          ? ETeam.teamB
          : null;

      if (!servingTeamE) {
        throw new Error('Can not detatch serving team.');
      }

      const receivingTeamE =
        netExist.teamAPlayerA === currPlay.receiver || netExist.teamAPlayerB === currPlay.receiver
          ? ETeam.teamA
          : netExist.teamBPlayerA === currPlay.receiver || netExist.teamBPlayerB === currPlay.receiver
          ? ETeam.teamB
          : null;

      if (!receivingTeamE) {
        throw new Error('Can not detatch receiving team.');
      }

      const serverActions = new Set<EServerReceiverAction>([
        EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
        EServerReceiverAction.SERVER_ACE_NO_TOUCH,
        EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
        EServerReceiverAction.SERVER_DO_NOT_KNOW,
        EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
      ]);

      const receiverActions = new Set<EServerReceiverAction>([
        EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
        EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
        EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
        EServerReceiverAction.RECEIVER_SERVICE_FAULT,
      ]);

      let teamAScore = currPlay.teamAScore,
        teamBScore = currPlay.teamBScore;
      if (serverActions.has(currPlay.action)) {
        if (servingTeamE === ETeam.teamA) {
          teamAScore -= 1;
        } else if (servingTeamE === ETeam.teamB) {
          teamBScore -= 1;
        }
      } else if (receiverActions.has(currPlay.action)) {
        if (receivingTeamE === ETeam.teamA) {
          teamAScore -= 1;
        } else if (receivingTeamE === ETeam.teamB) {
          teamBScore -= 1;
        }
      }

      // current Server Receiver
      const srObj: any = {
        ...currPlay,
        mutate: currPlay.play,
        play: currPlay.play,
        room: body.room,
        round: net.round,
        teamAScore,
        teamBScore
      };
      delete srObj.action;

      const playerRooms = [];
      for (const p of playerIds) {
        if (p) playerRooms.push(p);
      }

      // Notify room
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, srObj),
        this.scoreKeeperHelper.publishRoom(body.room, 'revert-play-from-server', srObj),
        server.to(playerRooms).emit('revert-player-notify', { players: playerRooms }),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
