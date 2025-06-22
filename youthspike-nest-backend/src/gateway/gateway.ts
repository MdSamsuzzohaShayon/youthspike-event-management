import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GatewayService } from './gateway.service';
import { GatewayRedisService } from './gateway.redis';
import { ROOM_PREFIX, CLIENT_TTL, RoomLocal, GeneralClient, JoinRoomInput, CheckInInput, SubmitLineupInput, UpdatePointsInput, SetServerReceiverInput } from './gateway.types';
import { UserRole } from 'src/user/user.schema';
import { RoomHelper } from './gateway.helpers/room.helper';
import { ClientHelper } from './gateway.helpers/client.helper';
import { ValidationHelper } from './gateway.helpers/validation.helper';
import { JoinRoomHandler } from './gateway.handlers/join-room.handler';
import { CheckInHandler } from './gateway.handlers/check-in.handler';
import { SubmitLineupHandler } from './gateway.handlers/submit-lineup.handler';
import { UpdatePointsHandler } from './gateway.handlers/update-points.handler';
import { ServerReceiverHandler } from './gateway.handlers/server-receiver.handler';

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

  private roomsLocal = new Map<string, RoomLocal>();
  private clientList = new Map<string, GeneralClient>();

  private joinRoomHandler: JoinRoomHandler;
  private checkInHandler: CheckInHandler;
  private submitLineupHandler: SubmitLineupHandler;
  private updatePointsHandler: UpdatePointsHandler;
  private serverReceiverHandler: ServerReceiverHandler;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly roomHelper: RoomHelper,
    private readonly clientHelper: ClientHelper,
    private readonly validationHelper: ValidationHelper,
  ) {
    // Initialize handlers
    this.joinRoomHandler = new JoinRoomHandler(
      gatewayService,
      gatewayRedisService,
      roomHelper,
      clientHelper
    );
    
    this.checkInHandler = new CheckInHandler(
      gatewayService,
      gatewayRedisService,
      validationHelper
    );
    
    this.submitLineupHandler = new SubmitLineupHandler(
      gatewayService,
      gatewayRedisService,
      roomHelper
    );
    
    this.updatePointsHandler = new UpdatePointsHandler(
      gatewayService,
      gatewayRedisService
    );
    
    this.serverReceiverHandler = new ServerReceiverHandler(
      gatewayService,
      gatewayRedisService
    );
  }

  afterInit() {
    // Set the server instance after initialization
    this.gatewayRedisService.setServer(this.server);
    this.logger.log('WebSocket gateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.clientList.set(client.id, {
      _id: null,
      matches: [],
      userRole: UserRole.public,
      connectedAt: new Date(),
    });

    setTimeout(() => {
      if (!this.clientList.get(client.id)?._id) {
        this.logger.warn(`Client ${client.id} didn't authenticate, disconnecting`);
        client.disconnect(true);
      }
    }, 30000);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const clientData = this.clientList.get(client.id);
    if (clientData) {
      for (const matchId of clientData.matches) {
        await this.cleanUpClientFromRooms(client.id, matchId);
      }
    }
    this.clientList.delete(client.id);
  }

  private async cleanUpClientFromRooms(clientId: string, matchId: string) {
    const roomData = this.roomsLocal.get(matchId);
    if (roomData) {
      const updatedRoom = { ...roomData };
      if (roomData.teamAClient === clientId) updatedRoom.teamAClient = null;
      if (roomData.teamBClient === clientId) updatedRoom.teamBClient = null;
      this.roomsLocal.set(matchId, updatedRoom);
      await this.gatewayRedisService.publishToRoom(matchId, 'room-update', updatedRoom);
    }
  }

  @SubscribeMessage('join-room-from-client')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinData: JoinRoomInput,
  ) {
    return this.joinRoomHandler.handle(client, joinData, this.roomsLocal, this.clientList);
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(
    @ConnectedSocket() client: Socket,
    @MessageBody() checkIn: CheckInInput,
  ) {
    return this.checkInHandler.handle(client, checkIn, this.roomsLocal);
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(
    @ConnectedSocket() client: Socket,
    @MessageBody() submitLineup: SubmitLineupInput,
  ) {
    return this.submitLineupHandler.handle(client, submitLineup, this.roomsLocal);
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() updatePointsInput: UpdatePointsInput,
  ) {
    return this.updatePointsHandler.handle(client, updatePointsInput, this.roomsLocal);
  }

  @SubscribeMessage('set-server-receiver-from-client')
  async onSetServerReceiver(
    @ConnectedSocket() client: Socket,
    @MessageBody() serverReceiverInput: SetServerReceiverInput,
  ) {
    return this.serverReceiverHandler.handle(client, serverReceiverInput, this.roomsLocal);
  }
}