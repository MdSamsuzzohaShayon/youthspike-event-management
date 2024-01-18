import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { CheckInInput, JoinRoomInput, SubmitLineupInput, NetAssign, NetPointsInput} from './gateway.input';
import { Field, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';

// @WebSocketGateway({
//     cors: {
//         origin: '*'
//     }
// })

@ObjectType()
class RoomLocal {
  @Field({ nullable: false })
  _id: string;

  @Field({ nullable: false })
  match: string;

  @Field({ nullable: false })
  round: string;

  @Field({ nullable: true })
  teamA: null | string;

  @Field({ nullable: true })
  teamAClient: null | string;

  @Field({ nullable: true })
  teamAProcess: null | EActionProcess;

  @Field({ nullable: true })
  teamB: null | string;

  @Field({ nullable: true })
  teamBClient: null | string;

  @Field({ nullable: true })
  teamBProcess: null | EActionProcess;

}


@ObjectType()
class RoomLocalWithNets {
  @Field(type => [NetAssign], { nullable: false })
  nets: NetAssign[]

}

@WebSocketGateway({ cors: true, namespace: "websocket" })
export class MyGatWay implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  private roomsLocal = new Map<string, RoomLocal>(); // Map to store room information

  constructor(private readonly roomService: RoomService, private readonly roundService: RoundService, private readonly netService: NetService) { }

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
      const roomData = { ...rv };
      if (roomData.teamAClient === client.id) {
        roomData.teamA = null;
        roomData.teamAClient = null;
        this.roomsLocal.set(rk, roomData);
        client.emit('leave-room-from-server', roomData);
      }
      if (roomData.teamBClient === client.id) {
        roomData.teamB = null;
        roomData.teamBClient = null;
        this.roomsLocal.set(rk, roomData);
        client.emit('leave-room-from-server', roomData);
      }
    }
  }

  // @SubscribeMessage('createRoom')
  // handleCreateRoom(@MessageBody() room: string): void {
  //   this.roomsLocal.set(room, []); // Create a new room with an empty user list
  //   this.server.emit('roomList', Array.from(this.roomsLocal.keys())); // Send the updated room list to all clients
  // }

  @SubscribeMessage('join-room-from-client')
  async onRoomJoin(client: Socket, joinData: JoinRoomInput) {
    /**
     * Find room id from database by team ID
     * If room not found return
     * Update room socket ID if necessary
     */
    const roomExist = await this.roomService.findOne({ match: joinData.match, $or: [{ teamA: joinData.team }, { teamB: joinData.team },] });
    const roundExist = await this.roundService.findById(joinData.round);
    
    if (!roomExist || !roundExist) return;

    client.join(roomExist._id.toString());
    // // Check all nets
    const findNets = await this.netService.query({round: roundExist._id});

    let teamASubmitted = false; 
    let teamBSubmitted = false;
    for (let i = 0; i < findNets.length; i++) {
      if(findNets[i].teamAPlayerA) teamASubmitted = true;
      if(findNets[i].teamBPlayerA) teamBSubmitted = true;
    }

    let teamAProcess = roundExist.teamAProcess;
    let teamBProcess = roundExist.teamBProcess;

    if(teamASubmitted){
      teamAProcess = EActionProcess.LINEUP;
    }

    if(teamBSubmitted){
      teamBProcess = EActionProcess.LINEUP;
    }


    let roomData = {
      _id: roomExist._id.toString(),
      match: roomExist.match.toString(),
      round: joinData.round,
      teamA: roomExist.teamA.toString(),
      teamAClient: null,
      teamAProcess: teamAProcess,
      teamB: roomExist.teamB.toString(),
      teamBClient: null,
      teamBProcess: teamBProcess,
    };

    // Set room data initially
    if (joinData.team === roomExist.teamA.toString()) {
      roomData = { ...roomData, teamA: roomExist.teamA.toString(), teamAClient: client.id };
    } else if (joinData.team === roomExist.teamB.toString()) {
      roomData = { ...roomData, teamB: roomExist.teamB.toString(), teamBClient: client.id };
    }


    if (!this.roomsLocal.has(roomExist._id.toString())) {
      // Create new room
      this.roomsLocal.set(roomExist._id.toString(), roomData)
    } else {
      // Update existing room
      const prevRoom = this.roomsLocal.get(roomExist._id.toString());
      roomData = { ...prevRoom };
      if (joinData.team === roomExist.teamA.toString()) {
        roomData.teamA = roomExist.teamA.toString();
        roomData.teamAClient = client.id;
        roomData.teamBClient = prevRoom.teamBClient;
      } else if (joinData.team === roomExist.teamB.toString()) {
        roomData.teamB = roomExist.teamB.toString();
        roomData.teamBClient = client.id;
        roomData.teamAClient = prevRoom.teamAClient;
      }
      this.roomsLocal.set(roomExist._id.toString(), roomData)
    }

    client.emit('join-room-response', roomData);
    // client.to(roomExist._id.toString()).emit('join-room-response', roomData);
  }

  @SubscribeMessage('check-in-from-client')
  async onCheckIn(client, checkIn: CheckInInput) {
    /**
     * Find room from database by match
     * Find room from local map
     * Update process
     */
    const prevRoom = this.roomsLocal.get(checkIn.room);
    if (!prevRoom || !prevRoom.teamAClient || !prevRoom.teamBClient) return;
    let roomData = { ...prevRoom };

    if (prevRoom.teamAClient === client.id) {
      roomData.teamAProcess = EActionProcess.CHECKIN;
    } else {
      roomData.teamBProcess = EActionProcess.CHECKIN;
    }
    this.roomsLocal.set(checkIn.room, roomData)

    // client.emit('check-in-response', roomData); // Send message to everyone 
    client.to(prevRoom._id).emit('check-in-response', roomData);
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(client, submitLineup: SubmitLineupInput) {
    /**
     * Find round from the database and update round
     * Find room from local map
     * Update process in the round to lock it if both team submit their players
     */
    const prevRoom = this.roomsLocal.get(submitLineup.room);
    if (!prevRoom) return;
    let roomData = { ...prevRoom };
    if (prevRoom.teamAClient === client.id) {
      roomData.teamAProcess = EActionProcess.LINEUP;
    } else {
      roomData.teamBProcess = EActionProcess.LINEUP;
    }

    const updatePromises = [];
    if (roomData.teamAProcess === EActionProcess.LINEUP && roomData.teamBProcess === EActionProcess.LINEUP) {
      updatePromises.push(this.roundService.update({ teamAProcess: EActionProcess.LOCKED, teamBProcess: EActionProcess.LOCKED }, submitLineup.round));
      roomData.teamAProcess = EActionProcess.LOCKED;
      roomData.teamBProcess = EActionProcess.LOCKED;
    }else{
      updatePromises.push(this.roundService.update({ teamAProcess:roomData.teamAProcess, teamBProcess: roomData.teamBProcess }, submitLineup.round));
    }
    
    
    for (const n of submitLineup.nets) {
      updatePromises.push(this.netService.update({
        teamAPlayerA: n.teamAPlayerA,
        teamAPlayerB: n.teamAPlayerB,
        teamBPlayerA: n.teamBPlayerA,
        teamBPlayerB: n.teamBPlayerB,
      }, n._id));
    }
    await Promise.all(updatePromises);
    
    const roomDataWithNets: RoomLocalWithNets = {...roomData, nets: submitLineup.nets}
    
    // roomData.nets = submitLineup.nets;
    this.roomsLocal.set(submitLineup.room, roomData);
    if(roomData.teamAProcess === EActionProcess.LOCKED && roomData.teamBProcess === EActionProcess.LOCKED){
      client.emit('submit-lineup-response', roomDataWithNets);
      client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
    }else {
      client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
    }
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(client, netsPoints: NetPointsInput[]) {
    const updatePromises = [];
    for (const n of netsPoints) {
      updatePromises.push(this.netService.update({
        teamAScore: n.teamAScore,
        teamBScore: n.teamBScore,
      }, n._id));
    }
    await Promise.all(updatePromises);
    client.emit('update-points-response', netsPoints);
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
