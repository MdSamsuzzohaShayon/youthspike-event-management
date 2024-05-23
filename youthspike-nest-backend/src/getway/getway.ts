import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import {
  CheckInInput,
  JoinRoomInput,
  SubmitLineupInput,
  NetAssign,
  UpdatePointsInput,
  RoundUpdatedResponse,
  RoundChangeInput,
  TieBreakerInput,
  NetTieBreaker,
  ETeam,
} from './gateway.input';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';
import { ETieBreaker } from 'src/net/net.schema';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { EPlayerStatus } from 'src/player/player.schema';

@ObjectType()
class RoomRoundProcess {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  num: number;

  @Field({ nullable: false })
  teamAProcess: null | EActionProcess;

  @Field({ nullable: false })
  teamBProcess: null | EActionProcess;
}

@ObjectType()
class RoomLocal {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: true })
  teamA: null | string;

  @Field({ nullable: true })
  teamAClient: null | string;

  @Field({ nullable: true })
  teamB: null | string;

  @Field({ nullable: true })
  teamBClient: null | string;

  @Field(() => [RoomRoundProcess], { nullable: false, defaultValue: [] })
  rounds: RoomRoundProcess[];
}

@ObjectType()
class RoomLocalWithNets {
  @Field((type) => [NetAssign], { nullable: false })
  nets: NetAssign[];

  @Field((type) => [String], { nullable: false })
  subbedPlayers: string[];

  @Field((type) => Int, { nullable: false })
  subbedRound: string;
}

@ObjectType()
class RoomLocalWithNetTypes {
  @Field((type) => [NetAssign], { nullable: false })
  nets: NetTieBreaker[];
}

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Map to store room information

  constructor(
    private readonly roomService: RoomService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly teamService: TeamService,
    private readonly matchService: MatchService,
    private readonly playerService: PlayerService,
  ) { }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('socket connected');
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    // Remove the team from all rooms
    for (const [rk, rv] of this.roomsLocal) {
      const roomData = structuredClone(rv);
      if (roomData.teamAClient === client.id) {
        roomData.teamA = null;
        roomData.teamAClient = null;
        this.roomsLocal.set(rk, roomData);
      }
      if (roomData.teamBClient === client.id) {
        roomData.teamB = null;
        roomData.teamBClient = null;
        this.roomsLocal.set(rk, roomData);
      }
    }
  }

  @SubscribeMessage('join-room-from-client')
  async onRoomJoin(client: Socket, joinData: JoinRoomInput) {
    /**
     * Find room id from database by team ID
     * If room not found return
     * Update room socket ID if necessary
     */
    const [roomExist, roundExist, roundsOfTheMatch] = await Promise.all([
      this.roomService.findOne({ match: joinData.match }),
      this.roundService.findById(joinData.round),
      this.roundService.query({ match: joinData.match }),
    ]);
    if (!roomExist || !roundExist || !roundsOfTheMatch || roundsOfTheMatch.length === 0) return;

    client.join(roomExist._id.toString());

    // Set room data initially
    let roomData = {
      _id: roomExist._id.toString(),
      match: roomExist.match.toString(),
      teamA: roomExist.teamA.toString(),
      teamAClient: null,
      teamB: roomExist.teamB.toString(),
      teamBClient: null,
      rounds: [],
    };

    // Setting process for all rounds
    const roundsProcess: RoomRoundProcess[] = [];
    let i = 0;
    while (i < roundsOfTheMatch.length) {
      const roundProcessObj: RoomRoundProcess = {
        _id: roundsOfTheMatch[i]._id.toString(),
        num: roundsOfTheMatch[i].num,
        teamAProcess: roundsOfTheMatch[i].teamAProcess,
        teamBProcess: roundsOfTheMatch[i].teamBProcess,
      };
      roundsProcess.push(roundProcessObj);
      i += 1;
    }
    roomData.rounds = roundsProcess;

    // Set team and client Id for my team
    if (joinData.team === roomExist.teamA.toString()) {
      roomData = { ...roomData, teamA: roomExist.teamA.toString(), teamAClient: client.id };
    } else if (joinData.team === roomExist.teamB.toString()) {
      roomData = { ...roomData, teamB: roomExist.teamB.toString(), teamBClient: client.id };
    }

    if (!this.roomsLocal.has(roomExist._id.toString())) {
      // Create new room
      this.roomsLocal.set(roomExist._id.toString(), roomData);
    } else {
      // Update existing room
      const prevRoom = this.roomsLocal.get(roomExist._id.toString());
      // roomData = { ...prevRoom };
      if (joinData.team === roomExist.teamA.toString()) {
        roomData.teamA = roomExist.teamA.toString();
        roomData.teamAClient = client.id;
        roomData.teamBClient = prevRoom.teamBClient;
      } else if (joinData.team === roomExist.teamB.toString()) {
        roomData.teamB = roomExist.teamB.toString();
        roomData.teamBClient = client.id;
        roomData.teamAClient = prevRoom.teamAClient;
      }
      this.roomsLocal.set(roomExist._id.toString(), roomData);
    }

    // Response
    client.emit('join-room-response', roomData);
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(client, checkIn: CheckInInput) {
    /**
     * Find room from database by match
     * Find room from local map
     * Update process
     */

    // Validate and organize room data
    const prevRoom = this.roomsLocal.get(checkIn.room);
    if (!prevRoom) return;
    const roomData = { ...prevRoom };
    const roundList = [...roomData.rounds];
    const roundI = roundList.findIndex((r) => r._id === checkIn.round);
    if (roundI === -1) return;

    // update round to checkin
    const currRoundObj = { ...roundList[roundI] };
    if (prevRoom.teamAClient === client.id) {
      currRoundObj.teamAProcess = EActionProcess.CHECKIN;
    } else if (prevRoom.teamBClient === client.id) {
      currRoundObj.teamBProcess = EActionProcess.CHECKIN;
    } else {
      return;
    }
    await this.roundService.updateOne(
      { _id: checkIn.round },
      { teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess },
    );
    roundList[roundI] = currRoundObj;
    roomData.rounds = roundList;
    this.roomsLocal.set(checkIn.room, roomData);

    client.to(prevRoom._id).emit('check-in-response', roomData);
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(client, submitLineup: SubmitLineupInput) {
    /**
     * Find round from the database and update round
     * Find room from local map
     * Update process in the round to lock it if both team submit their players
     */
    try {
      const updatePromises = [];

      // Validate and organize room data
      const prevRoom = this.roomsLocal.get(submitLineup.room);
      if (!prevRoom) return;
      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === submitLineup.round);
      if (roundI === -1) return;

      // update round to checkin
      const roundExist = await this.roundService.findById(submitLineup.round);
      if (!roundExist) return;

      const currRoundObj = {
        ...roundList[roundI],
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      if (prevRoom.teamAClient === client.id) {
        currRoundObj.teamAProcess = EActionProcess.LINEUP;
      } else if (prevRoom.teamBClient === client.id) {
        currRoundObj.teamBProcess = EActionProcess.LINEUP;
      } else {
        /**
         * Check the team is it team A or team B -> check it properly
         * Check They filled the net or not
         */
        if (submitLineup.teamE === ETeam.teamA) {
          let filled = true;
          for (let nI = 0; nI < submitLineup.nets.length; nI += 1) {
            if (!submitLineup.nets[nI].teamAPlayerA || !submitLineup.nets[nI].teamAPlayerB) filled = false;
          }
          if (!filled) return;
          currRoundObj.teamAProcess = EActionProcess.LINEUP;
        } else if (submitLineup.teamE === ETeam.teamB) {
          let filled = true;
          for (let nI = 0; nI < submitLineup.nets.length; nI += 1) {
            if (!submitLineup.nets[nI].teamBPlayerA || !submitLineup.nets[nI].teamBPlayerB) filled = false;
          }
          if (!filled) return;
          currRoundObj.teamBProcess = EActionProcess.LINEUP;
        } else {
          return;
        }
      }

      // Update nets and round by assigning player to nets
      updatePromises.push(
        this.roundService.update(
          { teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess },
          submitLineup.round,
        ),
      );
      for (const n of submitLineup.nets) {
        updatePromises.push(
          this.netService.update(
            {
              teamAPlayerA: n.teamAPlayerA,
              teamAPlayerB: n.teamAPlayerB,
              teamBPlayerA: n.teamBPlayerA,
              teamBPlayerB: n.teamBPlayerB,
            },
            n._id,
          ),
        );
      }

      // Update room locally
      roundList[roundI] = currRoundObj;
      // const sortedRoundList = roundList.sort((a, b) => a.num - b.num);
      roomData.rounds = roundList;
      this.roomsLocal.set(submitLineup.room, roomData);

      const roomDataWithNets: RoomLocalWithNets = {
        ...roomData,
        nets: submitLineup.nets,
        subbedRound: submitLineup.round,
        subbedPlayers: submitLineup.subbedPlayers,
      };

      // make players subbed for all next rounds
      if (submitLineup.subbedPlayers.length > 0) {
        updatePromises.push(
          this.roundService.updateOne(
            { _id: currRoundObj._id, status: EPlayerStatus.ACTIVE },
            { $set: { subs: submitLineup.subbedPlayers } },
          ),
        );
      }

      if (currRoundObj.num === 1) {
        updatePromises.push(
          this.teamService.updateMany(
            { _id: { $in: [submitLineup.teamAId, submitLineup.teamBId] } },
            { $set: { rankLock: true } },
          ),
        );
      }

      // update rank lock in the team
      await Promise.all(updatePromises);

      client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
    } catch (error) {
      console.log(error);
    }
  }

  @SubscribeMessage('update-net-from-client')
  async onNetUpdate(client, netInputs: TieBreakerInput) {
    const prevRoom = this.roomsLocal.get(netInputs.room);
    if (!prevRoom) return;
    const roomData = { ...prevRoom };

    const roundExist = await this.roundService.findById(netInputs.round);
    if (!roundExist) return;

    // Update nets and round by assigning player to nets
    const updatePromises = [];
    const lockedNetIds = [];
    for (const n of netInputs.nets) {
      if (n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) lockedNetIds.push(n._id);
      updatePromises.push(
        this.netService.update(
          {
            netType: n.netType,
          },
          n._id,
        ),
      );
    }

    if (lockedNetIds.length > 1) {
      // TIE_BREAKER_NET, worth 2 points
      this.netService.updateMany(
        {
          _id: { $nin: lockedNetIds },
          $and: [
            { round: netInputs.round },
            { round: { $exists: true } }, // Ensure that the round field exists
          ],
        },
        {
          $set: { points: 2, netType: ETieBreaker.TIE_BREAKER_NET },
        },
      );
    }

    await Promise.all(updatePromises);

    this.roomsLocal.set(netInputs.room, roomData);
    const roomDataWithNets: RoomLocalWithNetTypes = { ...roomData, nets: netInputs.nets };
    client.to(prevRoom._id).emit('update-net-response', roomDataWithNets);
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(client, updatePointsInput: UpdatePointsInput) {
    const prevRoom = this.roomsLocal.get(updatePointsInput.room);
    if (!prevRoom) return;

    const [roundList, roundExist] = await Promise.all([
      this.roundService.find({ match: prevRoom.match }),
      this.roundService.findById(updatePointsInput.round),
    ]);

    if (!roundList || !roundExist) return;

    // Update net score from database
    const updatePromises = [];
    for (const n of updatePointsInput.nets) {
      const pointsObj: any = {};
      if (n.teamAScore || n.teamAScore === 0) pointsObj.teamAScore = n.teamAScore;
      if (n.teamBScore || n.teamBScore === 0) pointsObj.teamBScore = n.teamBScore;
      updatePromises.push(this.netService.update(pointsObj, n._id));
    }
    await Promise.all(updatePromises);

    // Calculate and update score for all nets of a round
    const findNets = await this.netService.query({ round: updatePointsInput.round });
    let teamAScore = null;
    let teamBScore = null;
    let i = 0;
    while (i < findNets.length) {
      if (findNets[i].teamAScore && findNets[i].teamBScore) {
        teamAScore ? (teamAScore += findNets[i].teamAScore) : (teamAScore = findNets[i].teamAScore);
        teamBScore ? (teamBScore += findNets[i].teamBScore) : (teamBScore = findNets[i].teamBScore);
      } else {
        teamAScore = null;
        teamBScore = null;
      }
      i += 1;
    }

    let completed = false;
    if (teamAScore && teamAScore > 0 && teamBScore && teamBScore > 0) completed = true;
    await this.roundService.update({ teamAScore, teamBScore, completed }, updatePointsInput.round);

    const pointsResponse: RoundUpdatedResponse = {
      nets: updatePointsInput.nets,
      room: updatePointsInput.room,
      round: { _id: updatePointsInput.round, teamAScore, teamBScore, completed },
      matchCompleted: false,
    };

    // ===== Complete the match if score is updated in all nets  =====
    if (roundExist.num === roundList.length && completed) {
      await this.matchService.updateOne({ _id: prevRoom.match }, { completed });
      pointsResponse.matchCompleted = true;
    }

    client.to(prevRoom._id).emit('update-points-response', pointsResponse);
  }

  @SubscribeMessage('completed-match-from-client')
  async onMatchComplete(client, { matchId }: { matchId: string }) {
    const matchExist = await this.matchService.findById(matchId);
    if (matchExist) {
      await this.matchService.updateOne({ _id: matchId }, { $set: { completed: true } });
      client.emit('completed-match-response', { matchId });
    }
  }

  @SubscribeMessage('room-detail-client')
  async onRoomCheck(client, { roomId }: { roomId: string }) {
    const prevRoom = this.roomsLocal.get(roomId);
    client.emit('room-detail-response', prevRoom);
  }
}
