import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { JoinRoomInput } from './gateway.input';

// @WebSocketGateway({
//     cors: {
//         origin: '*'
//     }
// })

@WebSocketGateway({ cors: true, namespace: "websocket" })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, string>(); // Map to store room information

  constructor(private readonly roomService: RoomService) { }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log('socket connected');
    });
  }

  handleConnection(client: Socket, ...args: any[]) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);

    // Remove the user from all rooms
    this.roomsLocal.forEach((users, room) => {
      // this.roomsLocal.set(room, users.filter(userId => userId !== client.id));
    });
  }

  // @SubscribeMessage('createRoom')
  // handleCreateRoom(@MessageBody() room: string): void {
  //   this.roomsLocal.set(room, []); // Create a new room with an empty user list
  //   this.server.emit('roomList', Array.from(this.roomsLocal.keys())); // Send the updated room list to all clients
  // }

  @SubscribeMessage('join')
  async onRoomJoin(client: Socket, joinData: JoinRoomInput) {
    /**
     * Find room id from database by team ID
     * If room not found return
     * Update room socket ID if necessary
     */
    // , $or: [{ teamA: joinData.team }, { teamB: joinData.team },] 
    const roomExist = await this.roomService.findOne({ match: joinData.match});
    if (!roomExist) return;

    client.join(roomExist._id.toString());
    let roomData = {
      match: roomExist.match,
      teamA: null,
      teamB: null,
    };

    if (joinData.team === roomExist.teamA.toString()) {
      roomData = { ...roomData, teamA: roomExist.teamA.toString() };
    } else if (joinData.team === roomExist.teamB.toString()) {
      roomData = { ...roomData, teamB: roomExist.teamB.toString() };
    }

    if (!this.roomsLocal.has(roomExist._id.toString())) {
      this.roomsLocal.set(roomExist._id.toString(), JSON.stringify(roomData))
    } else {
      const prevRoom = JSON.parse(this.roomsLocal.get(roomExist._id.toString()));
      roomData = { ...prevRoom };
      if(!roomData.teamA && joinData.team === roomExist.teamA.toString()){
        roomData.teamA = roomExist.teamA. toString();
      }else if(!roomData.teamB && joinData.team === roomExist.teamB.toString()){
        roomData.teamB = roomExist.teamB. toString();
      }
      this.roomsLocal.set(roomExist._id.toString(), JSON.stringify(roomData))
    }

    console.log(this.roomsLocal);
    
    client.emit('message', "Joined to the room successfully");
  }


  @SubscribeMessage('updateMatch')
  onNewMessage(@MessageBody() body: any) {
    this.server.emit('onMatchUpdate', {
      msg: 'new message',
      content: body,
    });
  }
}



// const userId = this.rooms.get(client.id);
// const messages = room.messages.slice(limit * -1);

// await this.userService.updateUserRoom(userId, room);
// Store room Id, teamA or teamB
// client.to(roomExist._id).emit('message', 'Joined room');
// const roomExistLocal = this.roomsLocal.get(client.id);
// this.roomsLocal.set(client.id);
