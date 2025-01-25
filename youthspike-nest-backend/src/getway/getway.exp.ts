
import { OnModuleInit } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cluster } from 'ioredis'; // Redis Cluster client
import { createAdapter } from '@socket.io/redis-adapter'; // Redis adapter for Socket.IO
import { RoomService } from 'src/room/room.service';
import {
  JoinRoomInput,
} from './gateway.input';
import { Field, Int, ObjectType } from '@nestjs/graphql';

import { RoundService } from 'src/round/round.service';
import { EActionProcess, Round } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';
import { ETieBreaker, Net } from 'src/net/net.schema';
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

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Map to store room information
  private clientList = new Map<string, GeneralClient>(); // List all the players that joined our system

  // Initialize Redis Cluster
  private pubClient = new Cluster([
    { host: 'localhost', port: 7000 },
    { host: 'localhost', port: 7001 },
    { host: 'localhost', port: 7002 },
  ]);
  private subClient = this.pubClient.duplicate();

  constructor(
    private readonly roomService: RoomService,
    private readonly roundService: RoundService,
    private readonly netService: NetService,
    private readonly playerRankingService: PlayerRankingService,
  ) { }

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

  // This method will configure Redis as the adapter for Socket.IO
  onModuleInit() {
    this.server.adapter(createAdapter(this.pubClient, this.subClient));

    // Handle new client connection
    this.server.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
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

}

