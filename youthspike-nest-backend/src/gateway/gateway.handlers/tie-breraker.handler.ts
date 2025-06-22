import { ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RoomLocal, TieBreakerInput } from '../gateway.types';
import { GatewayService } from '../gateway.service';
import { GatewayRedisService } from '../gateway.redis';
import { ETieBreaker } from 'src/net/net.schema';

export class TieBreakerHandler {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly gatewayRedisService: GatewayRedisService,
  ) {}

  async handle(
    @ConnectedSocket() client: Socket,
    @MessageBody() tieBreakerInput: TieBreakerInput,
    roomsLocal: Map<string, RoomLocal>,
  ) {
    const prevRoom = roomsLocal.get(tieBreakerInput.room);
    try {
      if (!prevRoom) throw new Error('Room not found, Incorrect room ID!');

      const roomData = { ...prevRoom };

      const { roundService, netService } = this.gatewayService.getServices();

      const roundExist = await roundService.findById(tieBreakerInput.round);
      if (!roundExist) {
        throw new Error('Round not found in the Database, with that round ID!');
      }

      // Update nets and round by assigning player to nets
      const updatePromises = [];
      const lockedNetIds = [];
      for (const n of tieBreakerInput.nets) {
        if (n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED) lockedNetIds.push(n._id);
        updatePromises.push(
          netService.updateOne(
            { _id: n._id },
            {
              netType: n.netType,
            },
          ),
        );
      }

      if (lockedNetIds.length > 1) {
        // TIE_BREAKER_NET, worth 2 points
        netService.updateMany(
          {
            _id: { $nin: lockedNetIds },
            $and: [
              { round: tieBreakerInput.round },
              { round: { $exists: true } }, // Ensure that the round field exists
            ],
          },
          {
            $set: { points: 2, netType: ETieBreaker.TIE_BREAKER_NET },
          },
        );
      }

      await Promise.all(updatePromises);

      roomsLocal.set(tieBreakerInput.room, roomData);
      const roomDataWithNets = { ...roomData, nets: tieBreakerInput.nets };

      await this.gatewayRedisService.publishToRoom(tieBreakerInput.room, 'tie-breaker-response-all', roomDataWithNets);
    } catch (error) {
      await this.gatewayRedisService.publishToRoom(
        tieBreakerInput.room,
        'error-from-server',
        error?.message || 'Internal error occured',
      );
    }
  }
}
