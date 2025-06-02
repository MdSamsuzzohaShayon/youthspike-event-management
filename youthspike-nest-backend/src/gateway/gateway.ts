import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import {
  JoinRoomInput,
  CheckInInput,
  SubmitLineupInput,
  UpdatePointsInput,
  TieBreakerInput,
  CreateEventInput,
  ETeam,
  RoundUpdatedResponse,
} from './gateway.input';
import { RoomService } from 'src/room/room.service';
import { RoundService } from 'src/round/round.service';
import { NetService } from 'src/net/net.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { GeneralClient, MatchRoundNet, RoomLocal, RoomRoundProcess } from './gateway.response';
import { EventService } from 'src/event/event.service';
import { TeamService } from 'src/team/team.service';
import { MatchService } from 'src/match/match.service';
import { PlayerService } from 'src/player/player.service';
import { UserRole } from 'src/user/user.schema';
import { EActionProcess } from 'src/round/round.schema';
import { ERosterLock } from 'src/event/event.schema';
import { EPlayerStatus } from 'src/player/player.schema';

const ROOM_PREFIX = 'room:';
const CLIENT_TTL = 60 * 60 * 2; // 2 hours TTL for client data

@WebSocketGateway({
  cors: true,
  namespace: 'websocket',
  transports: ['websocket'],
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(Gateway.name);

  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Local in-memory room state
  private clientList = new Map<string, GeneralClient>(); // Local client tracking

  constructor(
    private readonly redisService: RedisService,
    private readonly roomService: RoomService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly playerRankingService: PlayerRankingService,
    private readonly eventService: EventService,
    private readonly teamService: TeamService,
    private readonly matchService: MatchService,
    private readonly playerService: PlayerService,
  ) {
    this.initializeRedisSubscriptions();
  }

  private initializeRedisSubscriptions() {
    const subClient = this.redisService.getSubClient();

    subClient.on('message', (channel: string, message: string) => {
      try {
        const { event, data, senderId } = JSON.parse(message);

        if (channel.startsWith(ROOM_PREFIX)) {
          const roomId = channel.replace(ROOM_PREFIX, '');
          // Broadcast to all clients in the room except the sender
          this.server.to(roomId).except(senderId).emit(event, data);
          this.logger.debug(`Redis broadcast to ${roomId}: ${event}`);
        }
      } catch (error) {
        this.logger.error(`Error processing Redis message: ${error.message}`);
      }
    });

    subClient.on('error', (error) => {
      this.logger.error(`Redis SubClient error: ${error.message}`);
    });
  }

  private async publishToRoom(roomId: string, event: string, data: any, senderId?: string) {
    const channel = `${ROOM_PREFIX}${roomId}`;
    const message = JSON.stringify({
      event,
      data,
      senderId,
    });

    const pubClient = await this.redisService.getPubClient();
    pubClient.publish(channel, message);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // With client ID, there will be a client
    this.clientList.set(client.id, {
      _id: null,
      matches: [],
      userRole: UserRole.public,
      connectedAt: new Date(),
    });

    // Set timeout to clean up if client doesn't authenticate
    setTimeout(() => {
      if (!this.clientList.get(client.id)?._id) {
        this.logger.warn(`Client ${client.id} didn't authenticate, disconnecting`);
        client.disconnect(true);
      }
    }, 30000);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Update other client (Check which client is been disconnected from the which room)
    const clientData = this.clientList.get(client.id);
    if (clientData) {
      for (const matchId of clientData.matches) {
        await this.cleanUpClientFromRooms(client.id, matchId);
      }
    }

    // If a client is disconnected, delete that client
    this.clientList.delete(client.id);
  }

  private async cleanUpClientFromRooms(clientId: string, matchId: string) {
    const roomData = this.roomsLocal.get(matchId);

    if (roomData) {
      const updatedRoom = { ...roomData };

      if (roomData.teamAClient === clientId) {
        updatedRoom.teamAClient = null;
      }
      if (roomData.teamBClient === clientId) {
        updatedRoom.teamBClient = null;
      }

      this.roomsLocal.set(matchId, updatedRoom);
      await this.publishToRoom(matchId, 'room-update', updatedRoom);
    }
  }

  @SubscribeMessage('join-room-from-client')
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() joinData: JoinRoomInput) {
    try {
      if (!joinData.match) {
        throw new Error('Match ID is required');
      }

      // Get room, round, match detail from database
      const [roomExist, roundExist, roundsOfTheMatch] = await Promise.all([
        this.roomService.findOne({ match: joinData.match }),
        this.roundService.findById(joinData.round),
        this.roundService.find({ match: joinData.match }),
      ]);

      if (!roomExist || !roundExist || !roundsOfTheMatch?.length) {
        throw new Error('Room or round not found');
      }

      // Getting room ID and joining the room (Room was created when a match had been created)
      const roomId = roomExist._id.toString();
      if (joinData.userId) {
        await client.join(roomId);
      }

      let roomData = this.roomsLocal.get(roomId) || this.createInitialRoomData(roomExist, roundsOfTheMatch);

      if (joinData.team) {
        roomData = this.updateTeamAssignment(
          roomData,
          joinData.team,
          roomExist.teamA.toString(),
          roomExist.teamB.toString(),
          client.id,
        );
      }

      this.updateClientData(client.id, {
        userId: joinData.userId,
        matchId: joinData.match,
        userRole: joinData.userRole,
      });

      // Update room
      this.roomsLocal.set(roomId, roomData);

      // Publish message to all users in a specific room except myself
      await this.publishToRoom(roomId, 'join-room-response-all', roomData, client.id);
      await this.subscribeToRoom(roomId);

      return { success: true, roomId };
    } catch (error) {
      this.logger.error(`Join room error: ${error.message}`);
      client.emit('error-from-server', error.message);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(@ConnectedSocket() client: Socket, @MessageBody() checkIn: CheckInInput) {
    try {
      const prevRoom = this.roomsLocal.get(checkIn.room);
      if (!prevRoom) {
        throw new Error('Room not found, Incorrect room ID!');
      }

      const roomData = { ...prevRoom };
      const roundList = [...roomData.rounds];
      const roundI = roundList.findIndex((r) => r._id === checkIn.round);

      if (roundI === -1) {
        throw new Error('Round not found with that round ID!');
      }

      if (checkIn.userRole === UserRole.captain || checkIn.userRole === UserRole.co_captain) {
        await this.validateCaptainCheckIn(checkIn.userId);
      }

      const currRoundObj = { ...roundList[roundI] };
      if (checkIn.teamE === ETeam.teamA) {
        currRoundObj.teamAProcess = EActionProcess.CHECKIN;
      } else {
        currRoundObj.teamBProcess = EActionProcess.CHECKIN;
      }

      const updateRoundData = {
        teamAProcess: currRoundObj.teamAProcess,
        teamBProcess: currRoundObj.teamBProcess,
      };

      await this.roundService.updateOne({ _id: checkIn.round }, updateRoundData);

      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      this.roomsLocal.set(checkIn.room, roomData);

      const presizedRoundData = {
        ...updateRoundData,
        _id: checkIn.round,
        match: prevRoom.match,
      };

      await Promise.all([
        this.publishToRoom(checkIn.room, 'check-in-response-to-all', roomData, client.id),
        this.publishToRoom(checkIn.room, 'round-update-all-pages', presizedRoundData, client.id),
      ]);
    } catch (error) {
      this.logger.error(error);
      client.emit('error-from-server', error?.message || 'Internal error occurred');
    }
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(@ConnectedSocket() client: Socket, @MessageBody() submitLineup: SubmitLineupInput) {
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
        throw new Error('Round not found with that round ID!');
      }

      const [roundExist, eventExist] = await Promise.all([
        this.roundService.findById(submitLineup.round),
        this.eventService.findById(submitLineup.eventId),
      ]);

      if (!roundExist || !eventExist) {
        throw new Error('Round or event not found in the Database!');
      }

      // Update round process
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
        throw new Error('Fill all the nets, and submit again!');
      }

      // Handle ranking lock for first round if needed
      if (roundExist.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          this.playerRankingService.updateOne(
            { match: submitLineup.match, team: currTeamId },
            { $set: { rankLock: true } },
          ),
        );
      }

      // Prepare round update data
      const updateRoundData = {
        teamAProcess: currRoundObj.teamAProcess,
        teamBProcess: currRoundObj.teamBProcess,
      };
      updatePromises.push(this.roundService.updateOne({ _id: submitLineup.round }, updateRoundData));

      // Process net updates and track selected players
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

      // Identify subbed players
      const subbedPlayers = submitLineup.subbedPlayers.filter((playerId) => !selectedPlayers.has(playerId));

      // Update room state
      roundList[roundI] = currRoundObj;
      roomData.rounds = roundList;
      this.roomsLocal.set(submitLineup.room, roomData);

      // Prepare response data
      const roomDataWithNets = {
        ...roomData,
        nets: submitLineup.nets,
        subbedRound: submitLineup.round,
        subbedPlayers,
      };

      // Handle subbed players
      if (subbedPlayers.length > 0) {
        updatePromises.push(
          this.roundService.updateOne(
            { _id: currRoundObj._id, status: EPlayerStatus.ACTIVE },
            { $addToSet: { subs: { $each: subbedPlayers } } },
          ),
        );
      }

      // Lock team ranks if first round
      if (currRoundObj.num === 1 && eventExist.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT) {
        updatePromises.push(
          this.teamService.updateMany(
            { _id: { $in: [submitLineup.teamAId, submitLineup.teamBId] } },
            { $set: { rankLock: true } },
          ),
        );
      }

      // Execute all database updates
      await Promise.all(updatePromises);

      // Prepare round update data for broadcasting
      const presizedRoundData = {
        ...updateRoundData,
        _id: submitLineup.round,
        match: prevRoom.match,
      };

      // Broadcast updates via Redis
      await Promise.all([
        this.publishToRoom(submitLineup.room, 'submit-lineup-response-all', roomDataWithNets, client.id),
        this.publishToRoom(submitLineup.room, 'round-update-all-pages', presizedRoundData, client.id),
      ]);
    } catch (error) {
      this.logger.error(`Submit lineup error: ${error.message}`);
      client.emit('error-from-server', error?.message || 'Internal error occurred');
    }
  }
  

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(client, updatePointsInput: UpdatePointsInput) {
    try {
      const prevRoom = this.roomsLocal.get(updatePointsInput.room);
      if (!prevRoom) return;

      const [roundList, roundExist] = await Promise.all([
        this.roundService.find({ match: prevRoom.match }),
        this.roundService.findById(updatePointsInput.round),
      ]);

      if (!roundList || !roundExist) {
        throw new Error(
          `Round List or Round Exist not found! Round List: ${JSON.stringify(roundList)}, Round Exist: ${JSON.stringify(
            roundExist,
          )}`,
        );
      }

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
      const findNets = await this.netService.find({ round: updatePointsInput.round });
      // Update score in round
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
      await this.roundService.updateOne({ _id: updatePointsInput.round }, { teamAScore, teamBScore, completed });

      const pointsResponse: RoundUpdatedResponse = {
        nets: updatePointsInput.nets,
        room: updatePointsInput.room,
        round: { _id: updatePointsInput.round, teamAScore, teamBScore, completed },
        matchCompleted: false,
        teamAProcess: roundExist.teamAProcess,
        teamBProcess: roundExist.teamBProcess,
      };

      // ===== Complete the match if score is updated in all nets  =====
      if (completed && roundExist.num === roundList.length) {
        // Check all rounds
        await this.matchService.updateOne({ _id: prevRoom.match }, { completed });
        pointsResponse.matchCompleted = true;
      }

      client.to(prevRoom._id).emit('update-points-response', pointsResponse);
      const presizedRoundData: MatchRoundNet = {
        nets: updatePointsInput.nets,
        _id: updatePointsInput.round,
        match: prevRoom.match,
        matchCompleted: pointsResponse.matchCompleted,
      };

      // await Promise.all([
      //   this.emitToAllClients('update-points-response-all', client, prevRoom.match, pointsResponse),
      //   this.emitToAllClients('net-update-all-pages', client, prevRoom.match, presizedRoundData, true, true),
      // ]);

      await Promise.all([
        this.publishToRoom(updatePointsInput.room, 'submit-lineup-response-all', pointsResponse, client.id),
        this.publishToRoom(updatePointsInput.room, 'round-update-all-pages', presizedRoundData, client.id),
      ]);
    } catch (error) {
      console.log(error);
      client.emit('error-from-server', error?.message || 'Internal error occured');
    }
  }

  private async validateCaptainCheckIn(userId: string) {
    const captainPlayerExist = await this.playerService.findOne({
      $or: [{ captainuser: userId }, { cocaptainuser: userId }],
    });

    if (captainPlayerExist && captainPlayerExist.teams.length > 0) {
      const teams = await this.teamService.find({ _id: { $in: captainPlayerExist.teams.map((t) => t._id) } });
      if (teams.length > 0) {
        const teamIds = teams.map((t) => t._id.toString());
        const matches = await this.matchService.find({
          $or: [{ teamA: { $in: teamIds } }, { teamB: { $in: teamIds } }],
        });

        const teamOfTheCaptain = teamIds[0];
        if (matches.length > 0) {
          for (const match of matches) {
            const roundList = await this.roundService.find({ match: match._id });
            if (roundList.length > 0) {
              const firstRound = roundList[0];
              if (
                (teamOfTheCaptain === match.teamA.toString() &&
                  firstRound.teamAProcess !== EActionProcess.INITIATE &&
                  !match.completed) ||
                (teamOfTheCaptain === match.teamB.toString() &&
                  firstRound.teamBProcess !== EActionProcess.INITIATE &&
                  !match.completed)
              ) {
                throw new Error(
                  `A match is already running (${match._id}), until you complete that match you can not start a new match!`,
                );
              }
            }
          }
        }
      }
    }
  }

  // ... (other methods like onSubmitLineup, onPointsUpdate, etc. should follow the same pattern)

  private createInitialRoomData(roomExist: any, roundsOfTheMatch: any[]): RoomLocal {
    return {
      _id: roomExist._id.toString(),
      match: roomExist.match.toString(),
      teamA: roomExist.teamA.toString(),
      teamAClient: null,
      teamB: roomExist.teamB.toString(),
      teamBClient: null,
      rounds: roundsOfTheMatch.map((round) => ({
        _id: round._id.toString(),
        num: round.num,
        teamAProcess: round.teamAProcess,
        teamBProcess: round.teamBProcess,
      })),
    };
  }

  private updateTeamAssignment(
    roomData: RoomLocal,
    joiningTeam: string,
    teamAId: string,
    teamBId: string,
    clientId: string,
  ): RoomLocal {
    const updatedRoom = { ...roomData };

    if (joiningTeam === teamAId) {
      updatedRoom.teamAClient = clientId;
    } else if (joiningTeam === teamBId) {
      updatedRoom.teamBClient = clientId;
    }

    return updatedRoom;
  }

  private updateClientData(
    clientId: string,
    data: {
      userId?: string;
      matchId?: string;
      userRole?: UserRole;
    },
  ) {
    const existing = this.clientList.get(clientId) || {
      _id: null,
      matches: [],
      userRole: UserRole.public,
    };

    const updated: GeneralClient = {
      _id: data.userId ?? existing._id,
      matches: data.matchId ? [...new Set([...existing.matches, data.matchId])] : existing.matches,
      userRole: data.userRole ?? existing.userRole,
      lastActive: new Date(),
    };

    this.clientList.set(clientId, updated);
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

  private async subscribeToRoom(roomId: string) {
    try {
      const subClient = this.redisService.getSubClient();
      await subClient.subscribe(`${ROOM_PREFIX}${roomId}`);
      this.logger.log(`Subscribed to Redis channel for room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe to room ${roomId}: ${error.message}`);
    }
  }
}
