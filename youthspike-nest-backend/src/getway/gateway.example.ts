import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SubmitLineupInput, NetAssign, ETeam } from './gateway.input';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';
import { TeamService } from 'src/team/team.service';
import { EPlayerStatus } from 'src/player/player.schema';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { UserRole } from 'src/user/user.schema';

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
  @Field((type) => [NetAssign], { nullable: false })
  nets: NetAssign[];

  @Field((type) => [String], { nullable: false })
  subbedPlayers: string[];

  @Field((type) => Int, { nullable: false })
  subbedRound: string;
}

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Map to store room information
  private clientList = new Map<string, GeneralClient>(); // List all the players that joined our system

  constructor(
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly teamService: TeamService,
    private readonly playerRankingService: PlayerRankingService,
  ) {}

  async emitToAllClients(
    emitEvent: string,
    client: Socket,
    matchId: string,
    actionData: Record<string, any>,
  ): Promise<string[]> {
    const clientIds: string[] = [];

    for (const [clientIdKey, val] of this.clientList) {
      // Ensure val.matches is an object and check for the existence of matchId
      if (val.matches && val.matches.length > 0) {
        if (val.matches.includes(matchId)) {
          if (clientIdKey !== client.id) {
            this.server.to(clientIdKey).emit(emitEvent, actionData); // Notify specific clients
            clientIds.push(clientIdKey);
          }
        }
      }
    }

    // this.server.emit('check-in-response-to-all', actionData);

    // Check if there are no clients to notify
    if (clientIds.length === 0) {
      throw new Error('No client to send message to!'); // Use Error for better error handling
    }

    return clientIds; // Return the client IDs
  }

  // Event for real time connection
  onModuleInit() {
    this.server.on('connection', (socket) => {
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

    this.clientList.delete(client.id);
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

      // Select team and teamId
      const isAdminOrDirector = submitLineup.userRole === UserRole.admin || submitLineup.userRole === UserRole.director;
      const isTeamA = submitLineup.teamE === ETeam.teamA;
      const isTeamB = submitLineup.teamE === ETeam.teamB;

      // Helper function to check if all players are filled
      const arePlayersFilled = (team: ETeam) => {
        return submitLineup.nets.every((net) =>
          team === ETeam.teamA ? net.teamAPlayerA && net.teamAPlayerB : net.teamBPlayerA && net.teamBPlayerB,
        );
      };

      // Function to process team lineup
      const processLineup = (team: ETeam) => {
        if (!arePlayersFilled(team)) return;

        if (team === ETeam.teamA) {
          currRoundObj.teamAProcess = EActionProcess.LINEUP;
          currTeamId = submitLineup.teamAId;
        } else {
          currRoundObj.teamBProcess = EActionProcess.LINEUP;
          currTeamId = submitLineup.teamBId;
        }
      };

      if (isAdminOrDirector) {
        if (isTeamA) {
          processLineup(ETeam.teamA);
        } else if (isTeamB) {
          processLineup(ETeam.teamB);
        }
      } else if (prevRoom.teamAClient === client.id) {
        currRoundObj.teamAProcess = EActionProcess.LINEUP;
        currTeamId = submitLineup.teamAId;
      } else if (prevRoom.teamBClient === client.id) {
        currRoundObj.teamBProcess = EActionProcess.LINEUP;
        currTeamId = submitLineup.teamBId;
      } else {
        if (isTeamA) {
          processLineup(ETeam.teamA);
        } else if (isTeamB) {
          processLineup(ETeam.teamB);
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
      // Temp disable
      // await Promise.all(updatePromises);

      client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
      // Send this data to all the clients
      await this.emitToAllClients('submit-lineup-response-all', client, roomData.match, roomData);
    } catch (error) {
      console.log(error);
    }
  }
}
