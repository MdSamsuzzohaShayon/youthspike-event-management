import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import {
  CheckInInput,
  JoinRoomInput,
  SubmitLineupInput,
  NetAssign,
  UpdatePointsInput,
  RoundUpdatedResponse,
  TieBreakerInput,
  ETeam,
  CreateEventInput,
  NetPointsAssign,
  ExtendOvertimeInput,
} from './gateway.input';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess, Round } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';
import { ETieBreaker, Net } from 'src/net/net.schema';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { EPlayerStatus } from 'src/player/player.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { UserRole } from 'src/user/user.schema';
import { EventService } from 'src/event/event.service';
import { ERosterLock, ETieBreakingStrategy } from 'src/event/event.schema';
import { PlayerService } from 'src/player/player.service';
import { Match } from 'src/match/match.schema';

interface IMatchRoundDetails {
  roundList: Round[];
  round: Round;
  match: Match;
}

interface INetScore {
  teamAScore: number;
  teamBScore: number;
  points: number;
}

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

// No Admin or co captain
@ObjectType()
class GeneralClient {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  userRole: UserRole;

  @Field((_type) => [String], { nullable: true })
  matches: string[]; // which specific match he has entered
}

@ObjectType()
class RoomLocalWithNets {
  @Field((_type) => [NetAssign], { nullable: false })
  nets: NetAssign[];

  @Field((_type) => [String], { nullable: false })
  subbedPlayers: string[];

  @Field((_type) => Int, { nullable: false })
  subbedRound: string;
}

@ObjectType()
class MatchRoundCommon {
  @Field((_type) => String, { nullable: false })
  _id: string;
  @Field((_type) => String, { nullable: false })
  match: string;
}

@ObjectType()
class MatchRound extends MatchRoundCommon {
  @Field((_type) => EActionProcess, { nullable: false })
  teamAProcess: EActionProcess;
  @Field((_type) => EActionProcess, { nullable: false })
  teamBProcess: EActionProcess;
}

@ObjectType()
class MatchRoundNet extends MatchRoundCommon {
  @Field(() => [NetPointsAssign], { nullable: false })
  nets: NetPointsAssign[];

  @Field((_type) => Boolean, { nullable: true })
  matchCompleted: boolean;
}

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Map to store room information
  private clientList = new Map<string, GeneralClient>(); // List all the players that joined our system

  constructor(
    private readonly eventService: EventService,
    private readonly roomService: RoomService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly teamService: TeamService,
    private readonly matchService: MatchService,
    private readonly playerService: PlayerService,
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

  // Submit lineup function start
  // Check if all players are filled for a specific team
  private arePlayersFilled(team: ETeam, submitLineup: SubmitLineupInput): boolean {
    return submitLineup.nets.every((net) =>
      team === ETeam.teamA ? net.teamAPlayerA && net.teamAPlayerB : net.teamBPlayerA && net.teamBPlayerB,
    );
  }

  // Process lineup for a specific team
  private processLineup(
    team: ETeam,
    submitLineup: SubmitLineupInput,
    currRoundObj: RoomRoundProcess,
    currTeamId: string | null,
  ): string | null {
    if (!this.arePlayersFilled(team, submitLineup)) return null;

    if (team === ETeam.teamA) {
      currRoundObj.teamAProcess = EActionProcess.LINEUP;
      currTeamId = submitLineup.teamAId;
    } else {
      currRoundObj.teamBProcess = EActionProcess.LINEUP;
      currTeamId = submitLineup.teamBId;
    }

    return currTeamId;
  }
  // Submit lineup function ends

  private findPrevRoom(roomId: string) {
    const prevRoom = this.roomsLocal.get(roomId);
    if (!prevRoom) {
      throw new Error('Room not found, Incorrect room ID!');
    }
    return prevRoom;
  }

  private async fetchMatchAndRoundDetails(matchId: string, roundId: string): Promise<IMatchRoundDetails> {
    const [roundList, roundExist, matchExist] = await Promise.all([
      this.roundService.find({ match: matchId }),
      this.roundService.findById(roundId),
      this.matchService.findById(matchId),
    ]);

    if (!roundList || !roundExist || !matchExist) {
      throw new Error(
        `Required data not found! Details: Round List: ${JSON.stringify(roundList)}, Round Exist: ${JSON.stringify(
          roundExist,
        )}, Match Exist: ${JSON.stringify(matchExist)}`,
      );
    }
    return { roundList, round: roundExist, match: matchExist };
  }

  async emitToAllClients(
    emitEvent: string,
    client: Socket,
    matchId: string,
    actionData: Record<string, any>,
    excludeSender = true,
    toAll = false,
  ): Promise<string[]> {
    const clientsToSend: string[] = [];
    let clientInside = false;

    for (const [clientIdKey, val] of this.clientList) {
      const isSender = clientIdKey === client.id;
      const isInMatch = val.matches?.includes(matchId);

      if (toAll || (isInMatch && (!excludeSender || !isSender))) {
        this.server.to(clientIdKey).emit(emitEvent, actionData);
        clientsToSend.push(clientIdKey);
      }

      if (isSender) {
        clientInside = true;
      }
    }

    // Add client to match if not already present and not sending to all
    if (!clientInside && !toAll) {
      this.clientList.set(client.id, { _id: null, matches: [matchId], userRole: UserRole.captain });
    }

    if (clientsToSend.length === 0) {
      console.log({ emitEvent, clientsToSend });
      // throw new Error('No client to send message to!');
      console.error('No client to send message to!');
    }

    return clientsToSend;
  }

  // Event for real time connection
  onModuleInit() {
    this.server.on('connection', (_socket) => {
      console.log('socket connected');
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected:', client.id);
    // Connecting client
    const clientExist = this.clientList.get(client.id);
    if (!clientExist) {
      // Create new client
      this.clientList.set(client.id, { _id: null, matches: [], userRole: UserRole.public });
    }
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

    // Delete public client
    console.log('Client disconnected: ', client.id);

    this.clientList.delete(client.id);
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

    if (joinData.userId) client.join(roomExist._id.toString()); // Join in the room

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
    if (joinData.team) {
      if (joinData.team === roomExist.teamA.toString()) {
        roomData = { ...roomData, teamA: roomExist.teamA.toString(), teamAClient: client.id };
      } else if (joinData.team === roomExist.teamB.toString()) {
        roomData = { ...roomData, teamB: roomExist.teamB.toString(), teamBClient: client.id };
      }
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
        roomData.teamAClient = joinData.team ? client.id : null;
        roomData.teamBClient = prevRoom.teamBClient;
      } else if (joinData.team === roomExist.teamB.toString()) {
        roomData.teamB = roomExist.teamB.toString();
        roomData.teamBClient = joinData.team ? client.id : null;
        roomData.teamAClient = prevRoom.teamAClient;
      }
      this.roomsLocal.set(roomExist._id.toString(), roomData);
    }

    // For director, admin, and public they do not need to join the room but they need to update their data
    const clientExist = this.clientList.get(client.id);
    const clientObj = {
      _id: joinData.userId,
      matches: [joinData.match],
      userRole: joinData.userRole,
    };
    if (clientExist) {
      clientObj._id = joinData.userId ?? clientExist._id;
      clientObj.matches = [...new Set([...clientExist.matches, joinData.match])];
      clientObj.userRole = joinData.userRole ?? clientExist.userRole;
    }
    this.clientList.set(client.id, clientObj);
    await this.emitToAllClients('join-room-response-all', client, roomData.match, roomData, false);
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(client, checkIn: CheckInInput) {
    try {
      /**
       * Find room from database by match
       * Find room from local map
       * Update process
       */
      // Validate and organize room data
      const prevRoom = this.roomsLocal.get(checkIn.room);
      if (!prevRoom) {
        throw new Error('Room not found, Incorrect room ID!');
      }
      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === checkIn.round);
      if (roundI === -1) {
        throw new Error('Round not found, with that round ID!');
      }

      // Check already checked in to another match or not
      if (checkIn.userRole === UserRole.captain || checkIn.userRole === UserRole.co_captain) {
        if (checkIn.userId) {
          const captainPlayerExist = await this.playerService.findOne({
            $or: [{ captainuser: checkIn.userId }, { cocaptainuser: checkIn.userId }],
          });
          if (captainPlayerExist && captainPlayerExist.teams.length > 0) {
            const teams = await this.teamService.find({ _id: { $in: captainPlayerExist.teams.map((t) => t._id) } });
            if (teams.length > 0) {
              const teamIds = teams.map((t) => t._id.toString());
              const matches = await this.matchService.find({
                $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
              });
              const teamOfTheCaptain = teamIds[0]; // Currently one player can have only one team
              if (matches.length > 0) {
                // Check Is there is any match running or not
                let matchRunning = null;
                for (const match of matches) {
                  const roundList = await this.roundService.find({ match: match._id });
                  if (roundList.length > 0) {
                    const firstRound = roundList[0];
                    if (
                      teamOfTheCaptain === match.teamA.toString() &&
                      firstRound.teamAProcess !== EActionProcess.INITIATE &&
                      !match.completed
                    ) {
                      matchRunning = match._id;
                      break;
                    } else if (
                      teamOfTheCaptain === match.teamB.toString() &&
                      firstRound.teamBProcess !== EActionProcess.INITIATE &&
                      !match.completed
                    ) {
                      matchRunning = match._id;
                      break;
                    }
                  }
                }
                if (matchRunning) {
                  throw new Error(
                    `A match is already running (${matchRunning}), until you complete that match you can not start a new match!`,
                  );
                }
              }
            }
          }
        }
      }

      // update round to checkin
      const currRoundObj = { ...roundList[roundI] };
      if (checkIn.teamE === ETeam.teamA) {
        currRoundObj.teamAProcess = EActionProcess.CHECKIN;
      } else {
        currRoundObj.teamBProcess = EActionProcess.CHECKIN;
      }

      const updateRoundData = { teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess };
      await this.roundService.updateOne({ _id: checkIn.round }, updateRoundData);
      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      this.roomsLocal.set(checkIn.room, roomData);

      const presizedRoundData: MatchRound = { ...updateRoundData, _id: checkIn.round, match: prevRoom.match };
      // Send message to specific room
      // client.to(prevRoom._id).emit('check-in-response', roomData);
      await Promise.all([
        // Send this data to all the clients
        this.emitToAllClients('check-in-response-to-all', client, roomData.match, roomData),
        this.emitToAllClients('round-update-all-pages', client, roomData.match, presizedRoundData, true, true),
      ]);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
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
      if (!prevRoom) {
        throw new Error('Room not found, Incorrect room ID!');
      }
      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === submitLineup.round);
      if (roundI === -1) {
        throw new Error('Round not found, with that round ID!');
      }

      // update round to checkin
      const [roundExist, eventExist, matchExist] = await Promise.all([
        this.roundService.findById(submitLineup.round),
        this.eventService.findById(submitLineup.eventId),
        this.matchService.findById(prevRoom.match),
      ]);
      if (!roundExist || !eventExist || !matchExist) {
        throw new Error('Round, event, or match not found in the Database, with that round ID!');
      }

      const currRoundObj = {
        ...roundList[roundI],
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      const isTeamA = submitLineup.teamE === ETeam.teamA;
      const isTeamB = submitLineup.teamE === ETeam.teamB;

      if (isTeamA) {
        currRoundObj.teamAProcess = EActionProcess.LINEUP;
        currTeamId = this.processLineup(ETeam.teamA, submitLineup, currRoundObj, currTeamId);
      } else if (isTeamB) {
        currRoundObj.teamBProcess = EActionProcess.LINEUP;
        currTeamId = this.processLineup(ETeam.teamB, submitLineup, currRoundObj, currTeamId);
      }
      if (!currTeamId) {
        throw new Error('Fill all the nets, and submit again!'); // Use Error for better error handling
      }

      // Change ranking lock strategy
      if (roundExist.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          // Locking ranking for this specific match
          this.playerRankingService.updateOne(
            { match: submitLineup.match, team: currTeamId },
            { $set: { rankLock: true } },
          ),
        );
      }

      // Update nets and round by assigning player to nets
      const updateRoundData = { teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess };
      updatePromises.push(this.roundService.updateOne({ _id: submitLineup.round }, updateRoundData));

      const selectedPlayers = new Set();
      for (const n of submitLineup.nets) {
        updatePromises.push(
          this.netService.updateOne(
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

      const subbedPlayers = [];
      for (let i = 0; i < submitLineup.subbedPlayers.length && !matchExist?.extendedOvertime; i++) {
        if (!selectedPlayers.has(submitLineup.subbedPlayers[i])) {
          subbedPlayers.push(submitLineup.subbedPlayers[i]);
        }
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
        subbedPlayers,
      };

      // make players subbed for all next rounds
      if (subbedPlayers.length > 0) {
        updatePromises.push(
          this.roundService.updateOne(
            { _id: currRoundObj._id, status: EPlayerStatus.ACTIVE },
            { $addToSet: { subs: { $each: subbedPlayers } } },
          ),
        );
      }

      if (currRoundObj.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          this.teamService.updateMany(
            { _id: { $in: [submitLineup.teamAId, submitLineup.teamBId] } },
            { $set: { rankLock: true } },
          ),
        );
      }

      // update rank lock in the team
      await Promise.all(updatePromises);

      // client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
      // Send this data to all the clients
      await this.emitToAllClients('submit-lineup-response-all', client, roomData.match, roomDataWithNets);

      const presizedRoundData: MatchRound = { ...updateRoundData, _id: submitLineup.round, match: prevRoom.match };
      // Send message to specific room
      // client.to(prevRoom._id).emit('check-in-response', roomData);
      await Promise.all([
        // Send this data to all the clients
        this.emitToAllClients('submit-lineup-response-all', client, roomData.match, roomDataWithNets),
        this.emitToAllClients('round-update-all-pages', client, roomData.match, presizedRoundData, true, true),
      ]);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

  // For banning nets
  @SubscribeMessage('update-net-from-client')
  async onNetUpdate(client, netInputs: TieBreakerInput) {
    try {
      const prevRoom = this.findPrevRoom(netInputs.room);
      const roomData = { ...prevRoom };

      const roundExist = await this.roundService.findById(netInputs.round);
      if (!roundExist) {
        throw new Error('Round not found in the Database, with that round ID!');
      }

      // Update nets and round by assigning player to nets
      const updatePromises = [];
      const lockedNetIds = [];
      for (const n of netInputs.nets) {
        if (n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) lockedNetIds.push(n._id);
        updatePromises.push(
          this.netService.updateOne(
            { _id: n._id },
            {
              netType: n.netType,
            },
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
      const roomDataWithNets = { ...roomData, nets: netInputs.nets };

      // client.to(prevRoom._id).emit('update-net-response', roomDataWithNets);
      await this.emitToAllClients('update-net-response-all', client, prevRoom.match, roomDataWithNets);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(client, updatePointsInput: UpdatePointsInput) {
    try {
      const prevRoom = this.findPrevRoom(updatePointsInput.room);
      const { roundList, round, match } = await this.fetchMatchAndRoundDetails(prevRoom.match, updatePointsInput.round);

      // Update net score from database
      const updatePromises = [];
      for (const n of updatePointsInput.nets) {
        const pointsObj: any = {};
        if (n.teamAScore || n.teamAScore === 0) pointsObj.teamAScore = n.teamAScore;
        if (n.teamBScore || n.teamBScore === 0) pointsObj.teamBScore = n.teamBScore;
        updatePromises.push(this.netService.updateOne({ _id: n._id }, pointsObj));
      }
      await Promise.all(updatePromises);

      // Calculate and update score for all nets of a round
      const findNets = await this.netService.find({ match: prevRoom.match });
      const findRoundNets = findNets.filter((net) => net.round.toString() === updatePointsInput.round);
      // Update score in round
      let teamAScore = null;
      let teamBScore = null;
      let i = 0;
      while (i < findRoundNets.length) {
        if (findRoundNets[i].teamAScore && findRoundNets[i].teamBScore) {
          teamAScore ? (teamAScore += findRoundNets[i].teamAScore) : (teamAScore = findRoundNets[i].teamAScore);
          teamBScore ? (teamBScore += findRoundNets[i].teamBScore) : (teamBScore = findRoundNets[i].teamBScore);
        } else {
          teamAScore = null;
          teamBScore = null;
        }
        i += 1;
      }

      let completed = false;
      if (
        teamAScore &&
        teamAScore > 0 &&
        teamBScore &&
        teamBScore > 0
        // && match.tieBreaking === ETieBreakingStrategy.TWO_POINTS_NET
      ) {
        completed = true;
      }
      await this.roundService.updateOne({ _id: updatePointsInput.round }, { teamAScore, teamBScore, completed });

      const pointsResponse: RoundUpdatedResponse = {
        nets: updatePointsInput.nets,
        room: updatePointsInput.room,
        round: { _id: updatePointsInput.round, teamAScore, teamBScore, completed },
        matchCompleted: false,
        teamAProcess: round.teamAProcess,
        teamBProcess: round.teamBProcess,
      };

      // ===== Complete the match if score is updated in all nets  =====
      if (completed && round.num === roundList.length && match.tieBreaking === ETieBreakingStrategy.TWO_POINTS_NET) {
        // Check all rounds
        await this.matchService.updateOne({ _id: prevRoom.match }, { completed });
        pointsResponse.matchCompleted = true;
      } else if (completed && match.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND && match.extendedOvertime) {
        await this.matchService.updateOne({ _id: prevRoom.match }, { completed });
        pointsResponse.matchCompleted = true;
      } else if (completed && match.tieBreaking === ETieBreakingStrategy.OVERTIME_ROUND && !match.extendedOvertime) {
        let aScore = 0;
        let bScore = 0;
        let filled = true;
        for (const n of findNets) {
          if (!n.teamAScore || !n.teamBScore) {
            filled = false;
            break;
          } else {
            if (n.teamAScore > n.teamBScore) {
              aScore += n.points;
            } else if (n.teamAScore < n.teamBScore) {
              bScore += n.points;
            }
          }
        }
        if (filled) {
          if (aScore !== bScore) {
            pointsResponse.matchCompleted = true;
            await this.matchService.updateOne({ _id: prevRoom.match }, { completed });
          }
        }
      }

      client.to(prevRoom._id).emit('update-points-response', pointsResponse);
      const presizedRoundData: MatchRoundNet = {
        nets: updatePointsInput.nets,
        _id: updatePointsInput.round,
        match: prevRoom.match,
        matchCompleted: pointsResponse.matchCompleted,
      };

      await Promise.all([
        this.emitToAllClients('update-points-response-all', client, prevRoom.match, pointsResponse),
        this.emitToAllClients('net-update-all-pages', client, prevRoom.match, presizedRoundData, true, true),
      ]);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

  @SubscribeMessage('completed-match-from-client')
  async onMatchComplete(client, { matchId }: { matchId: string }) {
    try {
      const matchExist = await this.matchService.findById(matchId);
      if (matchExist) {
        await this.matchService.updateOne({ _id: matchId }, { $set: { completed: true } });
        // client.emit('completed-match-response', { matchId });
        await this.emitToAllClients('completed-match-response-all', client, matchId, { matchId });
      }
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

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

  @SubscribeMessage('room-detail-client')
  async onRoomCheck(client, { roomId }: { roomId: string }) {
    try {
      const prevRoom = this.roomsLocal.get(roomId);
      client.emit('room-detail-response', prevRoom);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

  // This will be triggered in all pages except single match page
  async updatedMatchStatus(matchId: string, roundList?: MatchRound[]): Promise<MatchRound[]> {
    let cloneRoundList = [...roundList];
    if (!cloneRoundList) {
      const matchExist = await this.matchService.findById(matchId);
      if (matchExist) {
        const roundList = await this.roundService.find({ match: matchExist._id.toString() });
        cloneRoundList = roundList.map((round) => ({
          _id: round._id,
          match: matchId,
          teamAProcess: round.teamAProcess,
          teamBProcess: round.teamBProcess,
        }));
      }
    }
    return cloneRoundList;
  }

  // Method to handle event creation (example)
  @SubscribeMessage('create-event-from-client')
  async onCreateEvent(client: Socket, eventData: CreateEventInput) {
    // Logic to create a new event in the database...

    // Broadcast the new event to all connected clients
    this.server.emit('event-created-from-server', eventData);
  }
}
