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
  CreateEventInput,
} from './gateway.input';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';
import { ETieBreaker, Net } from 'src/net/net.schema';
import { TeamService } from 'src/team/team.service';
import { PlayerService } from 'src/player/player.service';
import { MatchService } from 'src/match/match.service';
import { EPlayerStatus } from 'src/player/player.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';

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
    private readonly playerRankingService: PlayerRankingService,
  ) {}

  // Additional functions
  async handleTieBreakerNets(netList: Net[]) {
    const lockedNets = netList.filter((ni) => ni.netType === ETieBreaker.TIE_BREAKER_NET);
    if (lockedNets.length <= 1) return;

    const [lowestCombinedPairScoreNetId, tiedNetIds] = await this.findLowestCombinedPairScoreNet(lockedNets);

    if (lowestCombinedPairScoreNetId) {
      await this.lockNet(lowestCombinedPairScoreNetId);
    } else if (tiedNetIds.size > 0) {
      const randomNetId = this.getRandomNetId(tiedNetIds);
      await this.lockNet(randomNetId);
    }
  }

  async findLowestCombinedPairScoreNet(lockedNets: Net[]) {
    let lowestCombinedPairScore = 0;
    let lowestCombinedPairScoreNetId = null;
    const tiedNetIds = new Set();

    for (const net of lockedNets) {
      const combinedScore = await this.getCombinedPairScore(net);
      if (lowestCombinedPairScore === 0 || combinedScore < lowestCombinedPairScore) {
        lowestCombinedPairScore = combinedScore;
        lowestCombinedPairScoreNetId = net._id;
        tiedNetIds.clear();
      } else if (combinedScore === lowestCombinedPairScore) {
        tiedNetIds.add(lowestCombinedPairScoreNetId);
        tiedNetIds.add(net._id);
        lowestCombinedPairScoreNetId = null;
      }
    }

    return [lowestCombinedPairScoreNetId, tiedNetIds];
  }

  async getCombinedPairScore(net: Net) {
    const [tApAr, tApBr, tBpAr, tBpBr] = await Promise.all([
      this.playerRankingService.findOneItem({ player: net.teamAPlayerA }),
      this.playerRankingService.findOneItem({ player: net.teamAPlayerB }),
      this.playerRankingService.findOneItem({ player: net.teamBPlayerA }),
      this.playerRankingService.findOneItem({ player: net.teamBPlayerB }),
    ]);
    return tApAr.rank + tApBr.rank + tBpAr.rank + tBpBr.rank;
  }

  async lockNet(netId: string) {
    await this.netService.updateOne({ _id: netId }, { points: 1, netType: ETieBreaker.FINAL_ROUND_NET_LOCKED });
  }

  getRandomNetId(tiedNetIds: Set<string>) {
    const tiedNetIdList = Array.from(tiedNetIds);
    const randomIndex = Math.floor(Math.random() * tiedNetIdList.length);
    return tiedNetIdList[randomIndex];
  }


  // Event for real time connection
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
      let currTeamId = null;

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
        currTeamId = submitLineup.teamAId;
      } else if (prevRoom.teamBClient === client.id) {
        currRoundObj.teamBProcess = EActionProcess.LINEUP;
        currTeamId = submitLineup.teamBId;
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
          currTeamId = submitLineup.teamAId;
        } else if (submitLineup.teamE === ETeam.teamB) {
          let filled = true;
          for (let nI = 0; nI < submitLineup.nets.length; nI += 1) {
            if (!submitLineup.nets[nI].teamBPlayerA || !submitLineup.nets[nI].teamBPlayerB) filled = false;
          }
          if (!filled) return;
          currRoundObj.teamBProcess = EActionProcess.LINEUP;
          currTeamId = submitLineup.teamBId;
        } else {
          return;
        }
      }

      // Change ranking lock strategy
      updatePromises.push(
        this.playerRankingService.updateOne(
          { match: submitLineup.match, team: currTeamId },
          { $set: { rankLock: true } },
        ),
      );

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
    const lockedNetIds = netInputs.nets
      .filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED)
      .map((n) => n._id);
    netInputs.nets.forEach((n) => updatePromises.push(this.netService.update({ netType: n.netType }, n._id)));

    // Handle multiple locked nets
    if (lockedNetIds.length > 1) {
      await this.netService.updateMany(
        { _id: { $nin: lockedNetIds }, round: netInputs.round },
        { points: 2, netType: ETieBreaker.TIE_BREAKER_NET },
      );

      const netList = await this.netService.find({ round: netInputs.round });
      if (netList.length > 3) {
        await this.handleTieBreakerNets(netList);
      }
    }

    await Promise.all(updatePromises);

    this.roomsLocal.set(netInputs.room, roomData);
    client.to(prevRoom._id).emit('update-net-response', { ...roomData, nets: netInputs.nets });
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

  // ===== Public Events =====
  // Method to handle event creation (example)
  @SubscribeMessage('create-event-from-client')
  async onCreateEvent(client: Socket, eventData: CreateEventInput) {
    // Logic to create a new event in the database...

    // Broadcast the new event to all connected clients
    this.server.emit('event-created-from-server', eventData);
  }
}
