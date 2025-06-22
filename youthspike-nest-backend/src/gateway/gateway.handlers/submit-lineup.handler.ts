import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ETeam, RoomLocal, SubmitLineupInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { RoomHelper } from '../gateway.helpers/room.helper';
import { EActionProcess } from 'src/round/round.schema';
import { ERosterLock, ETieBreakingStrategy } from 'src/event/event.schema';
import { EPlayerStatus } from 'src/player/player.schema';

export class SubmitLineupHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly roomHelper: RoomHelper,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() submitLineup: SubmitLineupInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    try {
      const updatePromises = [];
      let currTeamId = null;

      const prevRoom = roomsLocal.get(submitLineup.room);
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      
      const roomData = { ...prevRoom };
      let roundList = [...roomData.rounds];
      
      const { roundService, eventService, playerRankingService, netService, teamService, matchService } =
      this.gatewayService.getServices();
      const matchExist = await matchService.findById(submitLineup.match);
      if (!matchExist) throw new Error('Match not found, Incorrect match ID!');
      if(matchExist.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND){
        const newRoundList = await roundService.find({match: submitLineup.match});
        roundList = newRoundList.map((r)=>({_id: r._id.toString(), num: r.num, teamAProcess: r.teamAProcess, teamBProcess: r.teamBProcess}));
      }
      
      
      const roundI = roundList.findIndex((r) => r._id === submitLineup.round);
      if (roundI === -1){
        // Check overtime round or not
        throw new Error('Round not found with that round ID!');}


      const [roundExist, eventExist] = await Promise.all([
        roundService.findById(submitLineup.round),
        eventService.findById(submitLineup.eventId),
      ]);

      if (!roundExist || !eventExist) throw new Error('Round or event not found in the Database!');

      const currRoundObj = {
        ...roundList[roundI],
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      const isTeamA = submitLineup.teamE === ETeam.teamA;
      const isTeamB = submitLineup.teamE === ETeam.teamB;

      if (isTeamA) {
        currRoundObj.teamAProcess = EActionProcess.LINEUP;
        currTeamId = this.roomHelper.processLineup(ETeam.teamA, submitLineup, currRoundObj, currTeamId);
      } else if (isTeamB) {
        currRoundObj.teamBProcess = EActionProcess.LINEUP;
        currTeamId = this.roomHelper.processLineup(ETeam.teamB, submitLineup, currRoundObj, currTeamId);
      }

      if (!currTeamId) throw new Error('Fill all the nets, and submit again!');

      if (roundExist.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          playerRankingService.updateOne(
            { match: submitLineup.match, team: currTeamId },
            { $set: { rankLock: true } },
          ),
        );
      }

      const updateRoundData = {
        teamAProcess: currRoundObj.teamAProcess,
        teamBProcess: currRoundObj.teamBProcess,
      };
      updatePromises.push(roundService.updateOne({ _id: submitLineup.round }, updateRoundData));

      const selectedPlayers = new Set();
      for (const n of submitLineup.nets) {
        updatePromises.push(
          netService.updateOne(
            { _id: n._id },
            {
              teamAPlayerA: n.teamAPlayerA,
              teamAPlayerB: n.teamAPlayerB,
              teamBPlayerA: n.teamBPlayerA,
              teamBPlayerB: n.teamBPlayerB,
            },
          ),
        );

        selectedPlayers.add(n.teamAPlayerA);
        selectedPlayers.add(n.teamAPlayerB);
        selectedPlayers.add(n.teamBPlayerA);
        selectedPlayers.add(n.teamBPlayerB);
      }

      const subbedPlayers = submitLineup.subbedPlayers.filter((playerId) => !selectedPlayers.has(playerId));

      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      roomsLocal.set(submitLineup.room, roomData);

      const roomDataWithNets = {
        ...roomData,
        nets: submitLineup.nets,
        subbedRound: submitLineup.round,
        subbedPlayers,
      };

      if (subbedPlayers.length > 0) {
        updatePromises.push(
          roundService.updateOne(
            { _id: currRoundObj._id, status: EPlayerStatus.ACTIVE },
            { $addToSet: { subs: { $each: subbedPlayers } } },
          ),
        );
      }

      if (currRoundObj.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          teamService.updateMany(
            { _id: { $in: [submitLineup.teamAId, submitLineup.teamBId] } },
            { $set: { rankLock: true } },
          ),
        );
      }

      await Promise.all(updatePromises);

      const presizedRoundData = {
        ...updateRoundData,
        _id: submitLineup.round,
        match: prevRoom.match,
      };

      await Promise.all([
        this.gatewayRedisService.publishToRoom(
          submitLineup.room,
          'submit-lineup-response-all',
          roomDataWithNets,
          client.id,
        ),
        this.gatewayRedisService.publishToRoom(
          submitLineup.room,
          'round-update-all-pages',
          presizedRoundData,
          client.id,
        ),
      ]);
    } catch (error) {
      client.emit('error-from-server', error?.message || 'Internal error occurred');
    }
  }
}