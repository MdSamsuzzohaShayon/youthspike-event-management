import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ETeam, RevertPlayInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { ScoreKeeperHelper } from '../gateway.helpers/score-keeper.helper';
import { singlePlayKey } from 'src/util/helper';
import {
  EServerReceiverAction,
  ServerReceiverOnNet,
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
    private readonly pointsUpdateHelper: PointsUpdateHelper
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: RevertPlayInput,
  ) {
    try {
      const { serverReceiverOnNetService, matchService, netService, playerService, jwtService } =
        this.gatewayService.getServices();

      const [net, match] = await Promise.all([
        this.scoreKeeperHelper.loadNetAction(body.net, body.room),
        matchService.findById(body.match),
      ]);

      this.validationHelper.authCheck(body.accessCode, jwtService, match.accessCode);
      const playKeys = new Set<string>();

      // Delete all plays of the net after selected play
      const numOfItems = net.mutate - body.play;
      const deletePromises = [];
      for (let i = 0; i < numOfItems; i += 1) {
        const playToDelete = body.play + i + 1;

        try {
          let singlePlayExist = await this.scoreKeeperHelper.loadSinglePlayAction(body.net, body.room, playToDelete);
          if(!singlePlayExist){
            singlePlayExist =await serverReceiverOnNetService.findOneSinglePlay({net: body.net, room: body.room, play: playToDelete});

          }
          const success = await this.revertPlayHelper.revertPlayerScore(singlePlayExist, this.pointsUpdateHelper);
        } catch (playErr) {
          console.log(playErr);
          
        }
        // If there is _id in that play delete that
        const key = singlePlayKey(body.net, body.room, playToDelete);
        deletePromises.push(this.scoreKeeperHelper.deleteSinglePlayAction(body.net, body.room, playToDelete));
        playKeys.add(key);
      }
      deletePromises.push(
        serverReceiverOnNetService.deleteManySinglePlay({ $and: [{ net: body.net }, { play: { $gt: body.play } }] }),
      );

      const redisResults = await Promise.all([...playKeys].map((key) => this.scoreKeeperHelper.getSinglePlays(key)));

      const savedIds = new Set();
      redisResults.flat().forEach((rr: ServerReceiverSinglePlay) => {
        // Process each individual play
        if (net?._id && rr?._id) {
          savedIds.add(rr._id);
        }
      });

      if (net?._id) {
        deletePromises.push(
          netService.updateOne({ _id: body.net }, { $pull: { serverReceiverSinglePlay: { $in: [...savedIds] } } }),
        );
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

      const currPlay = await this.scoreKeeperHelper.loadSinglePlayAction(body.net, body.room, body.play);
      if (!currPlay) {
        throw new Error('Can not found that specific play.');
      }

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
        throw new Error('Can not detech serving team.');
      }

      const receivingTeamE =
        netExist.teamAPlayerA === currPlay.receiver || netExist.teamAPlayerB === currPlay.receiver
          ? ETeam.teamA
          : netExist.teamBPlayerA === currPlay.receiver || netExist.teamBPlayerB === currPlay.receiver
          ? ETeam.teamB
          : null;

      if (!receivingTeamE) {
        throw new Error('Can not detech receiving team.');
      }

      let teamAScore = currPlay.teamAScore,
        teamBScore = currPlay.teamBScore;

      const serverActions = new Set<EServerReceiverAction>([
        EServerReceiverAction.SERVER_ACE_NO_TOUCH,
        EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH,
        EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR,
        EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION,
        EServerReceiverAction.SERVER_DO_NOT_KNOW,
      ]);
      if (serverActions.has(currPlay.action)) {
        if (servingTeamE === ETeam.teamA) {
          teamAScore -= 1;
        } else if (servingTeamE === ETeam.teamB) {
          teamBScore -= 1;
        }
      }

      const receiverActions = new Set<EServerReceiverAction>([
        EServerReceiverAction.RECEIVER_SERVICE_FAULT,
        EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY,
        EServerReceiverAction.RECEIVER_RALLEY_CONVERSION,
        EServerReceiverAction.RECEIVER_DO_NOT_KNOW,
      ]);
      if (receiverActions.has(currPlay.action)) {
        if (receivingTeamE === ETeam.teamA) {
          teamAScore -= 1;
        } else if (receivingTeamE === ETeam.teamB) {
          teamBScore -= 1;
        }
      }

      const srObj: ServerReceiverOnNet = {
        ...currPlay,
        mutate: currPlay.play,
        play: currPlay.play,
        room: body.room,
        round: net.round,
        teamAScore,
        teamBScore,
      };

      // Notify room
      await Promise.all([
        this.scoreKeeperHelper.saveNetAction(body.net, body.room, srObj),
        this.scoreKeeperHelper.deleteSinglePlayAction(body.net, body.room, currPlay.play), // Delete current play, it will be created again automitically
        serverReceiverOnNetService.deleteOneSinglePlay({ net: body.net, play: currPlay.play }),
        this.scoreKeeperHelper.publishRoom(body.room, 'revert-play-from-server', srObj),
      ]);
    } catch (err: any) {
      await this.scoreKeeperHelper.publishError(client.id, err?.message ?? 'Internal error');
    }
  }
}
