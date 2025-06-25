import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ETeam, ExtendOvertimeInput, RoomLocal, TieBreakerInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ETieBreaker } from 'src/net/net.schema';
import { ETieBreakingStrategy } from 'src/event/event.schema';
import { EActionProcess } from 'src/round/round.schema';

export class ExtendOvertimeHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() extendOvertimeInput: ExtendOvertimeInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    const prevRoom = roomsLocal.get(extendOvertimeInput.room);
    try {
      const { matchService, roundService, netService } = this.gatewayService.getServices();

      const [roundList, roundExist, matchExist] = await Promise.all([
        roundService.find({ match: prevRoom.match }),
        roundService.findById(extendOvertimeInput.round),
        matchService.findById(prevRoom.match),
      ]);

      // Check match is overtime round or not
      if (matchExist.tieBreaking !== ETieBreakingStrategy.OVERTIME_ROUND) {
        throw new Error('This match does not allow overtime round');
      }
      if (matchExist.extendedOvertime) {
        throw new Error('A round and a net has been created already and made it extended');
      }
      const netList = await netService.find({ match: prevRoom.match });

      // Check match score is tied for both team
      let teamATotalScore = 0,
        teamBTotalScore = 0;
      for (const net of netList) {
        if (net.teamAScore > net.teamBScore) {
          teamATotalScore += net.points;
        } else if (net.teamBScore > net.teamAScore) {
          teamBTotalScore += net.points;
        }
      }
      if (teamATotalScore !== teamBTotalScore) {
        throw new Error('Score is not tied for this match, so you do not need to add overtime.');
      }
      // Create a new round with one single net
      const roundObj = {
        num: roundList.length + 1,
        match: prevRoom.match,
        nets: [], // Need to create 1 net
        players: [],
        subs: [],
        teamAScore: null,
        teamBScore: null,
        teamAProcess: EActionProcess.CHECKIN,
        teamBProcess: EActionProcess.CHECKIN,
        completed: false,
        firstPlacing: ETeam.teamA,
      };
      const newRound = await roundService.create(roundObj);
      const netObj = {
        num: 1,
        match: prevRoom.match,
        round: newRound._id,
        points: 1,
        netType: ETieBreaker.FINAL_ROUND_NET_LOCKED,
        teamAScore: null,
        teamBScore: null,
        pairRange: 0,
      };
      const newNet = await netService.create(netObj);
      // Update match field (extended overtime)
      await Promise.all([
        roundService.updateOne({ _id: newRound._id }, { $set: { nets: [newNet._id] } }),
        matchService.updateOne(
          { _id: prevRoom.match },
          { $set: { extendedOvertime: true }, $addToSet: { rounds: newRound._id } },
        ),
      ]);

      // If both team have agreed, then update the match
      // Send match, round list and all nets
      const actionData = {
        roundList: [...roundList, { ...{ ...roundObj, _id: newRound._id }, nets: [newNet._id] }],
        nets: [...netList, { ...{ ...netObj, _id: newNet._id } }],
        extendedOvertime: true,
      };

      await this.gatewayRedisService.publishToRoom(
        extendOvertimeInput.room,
        'extend-overtime-response-all',
        actionData,
      );
    } catch (error) {
      await this.gatewayRedisService.publishToSocket(
        client.id,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}

/*
@SubscribeMessage('extend-overtime-from-client')
  async onExtendOvertime(client, extendOvertimeInput: ExtendOvertimeInput) {
    try {
      const prevRoom = this.findPrevRoom(extendOvertimeInput.room);
      const { roundList, round, match } = await this.fetchMatchAndRoundDetails(
        prevRoom.match,
        extendOvertimeInput.round,
      );
      // Check match is overtime round or not
      if (match.tieBreaking !== ETieBreakingStrategy.OVERTIME_ROUND) {
        throw new Error('This match does not allow overtime round');
      }
      if (match.extendedOvertime) {
        throw new Error('A round and a net has been created already and made it extended');
      }
      const netList = await this.netService.find({ match: prevRoom.match });

      // Check match score is tied for both team
      let teamATotalScore = 0,
        teamBTotalScore = 0;
      for (const net of netList) {
        if (net.teamAScore > net.teamBScore) {
          teamATotalScore += net.points;
        } else if (net.teamBScore > net.teamAScore) {
          teamBTotalScore += net.points;
        }
      }
      if (teamATotalScore !== teamBTotalScore) {
        throw new Error('Score is not tied for this match, so you do not need to add overtime.');
      }
      // Create a new round with one single net
      const roundObj = {
        num: roundList.length + 1,
        match: prevRoom.match,
        nets: [], // Need to create 1 net
        players: [],
        subs: [],
        teamAScore: null,
        teamBScore: null,
        teamAProcess: EActionProcess.CHECKIN,
        teamBProcess: EActionProcess.CHECKIN,
        completed: false,
        firstPlacing: ETeam.teamA,
      };
      const newRound = await this.roundService.create(roundObj);
      const netObj = {
        num: 1,
        match: prevRoom.match,
        round: newRound._id,
        points: 1,
        netType: ETieBreaker.FINAL_ROUND_NET_LOCKED,
        teamAScore: null,
        teamBScore: null,
        pairRange: 0,
      };
      const newNet = await this.netService.create(netObj);
      // Update match field (extended overtime)
      await Promise.all([
        this.roundService.updateOne({ _id: newRound._id }, { $set: { nets: [newNet._id] } }),
        this.matchService.updateOne({ _id: prevRoom.match }, { $set: { extendedOvertime: true } }),
      ]);

      // If both team have agreed, then update the match
      // Send match, round list and all nets
      await this.emitToAllClients(
        'extend-overtime-response-all',
        client,
        prevRoom.match,
        {
          roundList: [...roundList, { ...{ ...roundObj, _id: newRound._id }, nets: [newNet._id] }],
          nets: [...netList, { ...{ ...netObj, _id: newNet._id } }],
          extendedOvertime: true,
        },
        false,
      );
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

*/
