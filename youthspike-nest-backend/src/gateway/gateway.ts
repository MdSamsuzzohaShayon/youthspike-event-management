import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GatewayService } from './gateway.service';
import { GatewayRedisService } from './gateway.redis';
import {
  RoomLocal,
  GeneralClient,
  JoinRoomInput,
  CheckInInput,
  SubmitLineupInput,
  UpdatePointsInput,
  TieBreakerInput,
  SetPlayersInput,
  ServiceFaultInput,
  AceNoThirdTouchInput,
  ReceivingHittingErrorInput,
  OneTwoThreePutAwayInput,
  RallyConversionInput,
  DefensiveConversionInput,
  UpdateCachePointsInput,
  ResetScoreInput,
  ServerDoNotKnowInput,
  ReceiverDoNotKnowInput,
  RevertPlayInput,
  JoinPlayerRoomInput,
} from './gateway.types';
import { UserRole } from 'src/user/user.schema';
import { RoomHelper } from './gateway.helpers/room.helper';
import { ClientHelper } from './gateway.helpers/client.helper';
import { ValidationHelper } from './gateway.helpers/validation.helper';
import { JoinRoomHandler } from './gateway.handlers/join-room.handler';
import { CheckInHandler } from './gateway.handlers/check-in.handler';
import { SubmitLineupHandler } from './gateway.handlers/submit-lineup.handler';
import { UpdatePointsHandler } from './gateway.handlers/update-points.handler';
import { TieBreakerHandler } from './gateway.handlers/tie-breraker.handler';
import { ExtendOvertimeHandler } from './gateway.handlers/extend-overtime.handler';
import { SetPlayersHandler } from './gateway.handlers/set-players.handler';
import { ServiceFaultHandler } from './gateway.handlers/service-fault';
import { AceNoTouchHandler } from './gateway.handlers/ace-no-touch';
import { AceNoThirdTouchHandler } from './gateway.handlers/ace-no-third-touch';
import { ReceivingHittingErrorHandler } from './gateway.handlers/receiving-hitting-error';
import { OneTwoThreePutAwayHandler } from './gateway.handlers/one-two-three-put-away';
import { RallyConversionHandler } from './gateway.handlers/rally-conversion';
import { DefensiveConversionHandler } from './gateway.handlers/defensive-conversion';
import { ScoreKeeperHelper } from './gateway.helpers/score-keeper.helper';
import { UpdateCachePointsHandler } from './gateway.handlers/update-cache-points';
import { ResetScoreHandler } from './gateway.handlers/reset-score';
import { ServerDoNotKnowHandler } from './gateway.handlers/server-do-not-know';
import { ReceiverDoNotKnowHandler } from './gateway.handlers/receiver-do-not-know';
import { PointsUpdateHelper } from './gateway.helpers/points-update.helper';
import { RevertPlayHandler } from './gateway.handlers/revert-play';
import { JoinPlayerRoomHandler } from './gateway.handlers/join-player-room.handler';
import { LeavePlayerRoomHandler } from './gateway.handlers/leave-player-room.handler';
import { RevertPlayHelper } from './gateway.helpers/revert-play.helper';

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
  private joinPlayerRoomHandler: JoinPlayerRoomHandler;
  private LeavePlayerRoomHandler: LeavePlayerRoomHandler;
  private checkInHandler: CheckInHandler;
  private submitLineupHandler: SubmitLineupHandler;
  private updatePointsHandler: UpdatePointsHandler;
  private tieBreakerHandler: TieBreakerHandler;
  private extendOvertimeHandler: ExtendOvertimeHandler;
  private setPlayersHandler: SetPlayersHandler;
  private serviceFault: ServiceFaultHandler;
  private aceNoTouch: AceNoTouchHandler;
  private aceNoThirdTouch: AceNoThirdTouchHandler;
  private receivingHittingError: ReceivingHittingErrorHandler;
  private oneTwoThreePutAway: OneTwoThreePutAwayHandler;
  private rallyConversion: RallyConversionHandler;
  private defensiveConversion: DefensiveConversionHandler;
  private serverDoNotKnow: ServerDoNotKnowHandler;
  private receiverDoNotKnow: ReceiverDoNotKnowHandler;
  private updateCachePoints: UpdateCachePointsHandler;
  private resetScore: ResetScoreHandler;
  private revertPlay: RevertPlayHandler;

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
    private readonly roomHelper: RoomHelper,
    private readonly clientHelper: ClientHelper,
    private readonly validationHelper: ValidationHelper,
    private readonly scoreKeeperHelper: ScoreKeeperHelper,
    private readonly pointsUpdateHelper: PointsUpdateHelper,
    private readonly revertPlayHelper: RevertPlayHelper,
  ) {
    this.joinRoomHandler = new JoinRoomHandler(gatewayService, gatewayRedisService, roomHelper, clientHelper);
    this.joinPlayerRoomHandler = new JoinPlayerRoomHandler();
    this.LeavePlayerRoomHandler = new LeavePlayerRoomHandler();
    // Initialize handlers for a prticular match
    this.checkInHandler = new CheckInHandler(gatewayService, gatewayRedisService, validationHelper);
    this.submitLineupHandler = new SubmitLineupHandler(gatewayService, gatewayRedisService, roomHelper);
    this.updatePointsHandler = new UpdatePointsHandler(gatewayRedisService, pointsUpdateHelper);
    this.tieBreakerHandler = new TieBreakerHandler(gatewayService, gatewayRedisService);
    this.extendOvertimeHandler = new ExtendOvertimeHandler(gatewayService, gatewayRedisService);

    // Score keeper handlers
    // Server
    this.aceNoTouch = new AceNoTouchHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.aceNoThirdTouch = new AceNoThirdTouchHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.receivingHittingError = new ReceivingHittingErrorHandler(
      scoreKeeperHelper
      , pointsUpdateHelper
    );
    this.defensiveConversion = new DefensiveConversionHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.serverDoNotKnow = new ServerDoNotKnowHandler(scoreKeeperHelper);

    // Receiver
    this.serviceFault = new ServiceFaultHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.oneTwoThreePutAway = new OneTwoThreePutAwayHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.rallyConversion = new RallyConversionHandler(scoreKeeperHelper, pointsUpdateHelper);
    this.receiverDoNotKnow = new ReceiverDoNotKnowHandler(scoreKeeperHelper);

    // Update database
    this.updateCachePoints = new UpdateCachePointsHandler(gatewayService, validationHelper, scoreKeeperHelper);
    this.resetScore = new ResetScoreHandler(gatewayService, validationHelper, scoreKeeperHelper);
    this.revertPlay = new RevertPlayHandler(gatewayService, scoreKeeperHelper, validationHelper, revertPlayHelper, pointsUpdateHelper);

    /**
     * Handlers for Score keeper
     */
    // Unused
    // this.serverReceiverHandler = new ServerReceiverHandler(gatewayService, gatewayRedisService);

    this.setPlayersHandler = new SetPlayersHandler(gatewayService, gatewayRedisService, validationHelper);
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

    // setTimeout(() => {
    //   if (!this.clientList.get(client.id)?._id) {
    //     this.logger.warn(`Client ${client.id} didn't authenticate, disconnecting`);
    //     client.disconnect(true);
    //   }
    // }, 30000);
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
  async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() joinData: JoinRoomInput) {
    return this.joinRoomHandler.handle(client, joinData, this.roomsLocal, this.clientList);
  }

  @SubscribeMessage('join-player-room-from-client')
  async handleJoinPlayerRoom(@ConnectedSocket() client: Socket, @MessageBody() joinData: JoinPlayerRoomInput) {
    return this.joinPlayerRoomHandler.handle(client, joinData);
  }

  @SubscribeMessage('leave-player-room-from-client')
  async handleLeavePlayerRoom(@ConnectedSocket() client: Socket, @MessageBody() joinData: JoinPlayerRoomInput) {
    return this.LeavePlayerRoomHandler.handle(client, joinData);
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(@ConnectedSocket() client: Socket, @MessageBody() checkIn: CheckInInput) {
    return this.checkInHandler.handle(client, checkIn, this.roomsLocal);
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(@ConnectedSocket() client: Socket, @MessageBody() submitLineup: SubmitLineupInput) {
    return this.submitLineupHandler.handle(client, submitLineup, this.roomsLocal);
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(@ConnectedSocket() client: Socket, @MessageBody() updatePointsInput: UpdatePointsInput) {
    return this.updatePointsHandler.handle(client, updatePointsInput, this.roomsLocal);
  }

  @SubscribeMessage('update-tie-breaker-from-client')
  async onTieBreakerUpdate(@ConnectedSocket() client: Socket, @MessageBody() tieBreakerInput: TieBreakerInput) {
    return this.tieBreakerHandler.handle(client, tieBreakerInput, this.roomsLocal);
  }

  @SubscribeMessage('extend-overtime-from-client')
  async onExtendOvertime(@ConnectedSocket() client: Socket, @MessageBody() tieBreakerInput: TieBreakerInput) {
    return this.extendOvertimeHandler.handle(client, tieBreakerInput, this.roomsLocal);
  }

  // Score keeper events handle
  // ======================================================================================================

  @SubscribeMessage('service-fault-from-client')
  async onServiceFault(@ConnectedSocket() client: Socket, @MessageBody() serviceFaultInput: ServiceFaultInput) {
    return this.serviceFault.handle(client, serviceFaultInput, this.server);
  }

  @SubscribeMessage('ace-no-touch-from-client')
  async onAceNoTouch(@ConnectedSocket() client: Socket, @MessageBody() aceNoTouchInput: ServiceFaultInput) {
    return this.aceNoTouch.handle(client, aceNoTouchInput, this.server);
  }

  @SubscribeMessage('server-defensive-conversion-from-client')
  async onDefensiveConversion(
    @ConnectedSocket() client: Socket,
    @MessageBody() defensiveConversionInput: DefensiveConversionInput,
  ) {
    return this.defensiveConversion.handle(client, defensiveConversionInput, this.server);
  }

  @SubscribeMessage('ace-no-third-touch-from-client')
  async onAceNoThirdTouch(
    @ConnectedSocket() client: Socket,
    @MessageBody() aceNoThirdTouchInput: AceNoThirdTouchInput,
  ) {
    return this.aceNoThirdTouch.handle(client, aceNoThirdTouchInput, this.server);
  }

  // Spiking error
  @SubscribeMessage('receiving-hitting-error-from-client')
  async onReceivingHittingError(
    @ConnectedSocket() client: Socket,
    @MessageBody() receivingHittingErrorInput: ReceivingHittingErrorInput,
  ) {
    return this.receivingHittingError.handle(client, receivingHittingErrorInput, this.server);
  }

  // Receiving point
  @SubscribeMessage('one-two-three-put-away-from-client')
  async onOneTwoThreePutAway(
    @ConnectedSocket() client: Socket,
    @MessageBody() oneTwoThreePutAwayInput: OneTwoThreePutAwayInput,
  ) {
    return this.oneTwoThreePutAway.handle(client, oneTwoThreePutAwayInput, this.server);
  }

  @SubscribeMessage('receiver-defensive-conversion-from-client')
  async onRallyConversion(
    @ConnectedSocket() client: Socket,
    @MessageBody() rallyConversionInput: RallyConversionInput,
  ) {
    return this.rallyConversion.handle(client, rallyConversionInput, this.server);
  }

  @SubscribeMessage('server-do-not-know-from-client')
  async onServerDoNotKnow(
    @ConnectedSocket() client: Socket,
    @MessageBody() serverDoNotKnowInput: ServerDoNotKnowInput,
  ) {
    return this.serverDoNotKnow.handle(client, serverDoNotKnowInput, this.roomsLocal);
  }

  @SubscribeMessage('receiver-do-not-know-from-client')
  async onReceiverDoNotKnow(
    @ConnectedSocket() client: Socket,
    @MessageBody() receiverDoNotKnowInput: ReceiverDoNotKnowInput,
  ) {
    return this.receiverDoNotKnow.handle(client, receiverDoNotKnowInput, this.roomsLocal);
  }

  // MongoDB Database operations
  @SubscribeMessage('set-players-from-client')
  async onSetPlayers(@ConnectedSocket() client: Socket, @MessageBody() setPlayerInput: SetPlayersInput) {
    return this.setPlayersHandler.handle(client, setPlayerInput, this.roomsLocal);
  }

  @SubscribeMessage('update-cache-points-from-client')
  async onUpdateCachePoints(
    @ConnectedSocket() client: Socket,
    @MessageBody() updateCachePointsInput: UpdateCachePointsInput,
  ) {
    return this.updateCachePoints.handle(client, updateCachePointsInput, this.roomsLocal);
  }

  @SubscribeMessage('reset-score-from-client')
  async onResetScore(@ConnectedSocket() client: Socket, @MessageBody() resetScoreInput: ResetScoreInput) {
    return this.resetScore.handle(client, resetScoreInput, this.roomsLocal);
  }

  @SubscribeMessage('revert-play-from-client')
  async onRevertPlay(@ConnectedSocket() client: Socket, @MessageBody() revertPlayInput: RevertPlayInput) {
    return this.revertPlay.handle(client, revertPlayInput);
  }
}
