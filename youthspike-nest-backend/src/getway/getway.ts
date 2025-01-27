import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Cluster } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';
import { RoomService } from 'src/room/room.service';
import { JoinRoomInput } from './gateway.input';
import { NetService } from 'src/net/net.service';
import { PlayerRankingService } from 'src/player-ranking/player-ranking.service';
import { UserRole } from 'src/user/user.schema';

@WebSocketGateway({ cors: true, namespace: 'websocket' })
export class MyGatWay implements OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, any>(); // Replace 'any' with a type for better typing
  private clientList = new Map<string, any>(); // Replace 'any' with a type for better typing
  private pubClient: Cluster;
  private subClient: Cluster;

  constructor(
    private readonly roomService: RoomService,
    private readonly netService: NetService,
    private readonly playerRankingService: PlayerRankingService,
  ) {}

  async onModuleInit() {
    try {
      // Initialize Redis Cluster
      this.pubClient = new Cluster([
        { host: 'localhost', port: 7000 },
        { host: 'localhost', port: 7001 },
        { host: 'localhost', port: 7002 },
      ]);
      this.subClient = this.pubClient.duplicate();

      // Wait for clients to connect
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      // Set Redis Adapter
      this.server.adapter(createAdapter(this.pubClient, this.subClient));

      // Handle new client connection
      this.server.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);
        this.handleConnection(socket);
      });
    } catch (error) {
      console.error('Error initializing Redis Pub/Sub:', error);
    }
  }

  async onModuleDestroy() {
    // Disconnect Redis clients on application shutdown
    if (this.pubClient) await this.pubClient.quit();
    if (this.subClient) await this.subClient.quit();
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    if (!this.clientList.has(client.id)) {
      this.clientList.set(client.id, { _id: null, matches: [], userRole: UserRole.public });
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    this.clientList.delete(client.id);

    // Clean up room data
    for (const [roomId, room] of this.roomsLocal) {
      if (room.teamAClient === client.id) room.teamAClient = null;
      if (room.teamBClient === client.id) room.teamBClient = null;
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, payload: JoinRoomInput) {
    try {
      // Your business logic for joining a room
      console.log(`Client ${client.id} joined room ${payload.match}`);
      client.join(payload.match);
    } catch (error) {
      console.error('Error in joinRoom:', error);
    }
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, roomId: string) {
    try {
      console.log(`Client ${client.id} left room ${roomId}`);
      client.leave(roomId);
    } catch (error) {
      console.error('Error in leaveRoom:', error);
    }
  }

  async broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }
}
