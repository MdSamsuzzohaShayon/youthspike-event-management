import { Logger, OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from 'src/room/room.service';
import { CheckInInput, JoinRoomInput, SubmitLineupInput, NetAssign, UpdatePointsInput, RoundUpdatedResponse, RoundChangeInput } from './gateway.input';
import { Field, ObjectType } from '@nestjs/graphql';
import { RoundService } from 'src/round/round.service';
import { EActionProcess } from 'src/round/round.schema';
import { NetService } from 'src/net/net.service';

@ObjectType()
class RoomRoundProcess {
  @Field({ nullable: false })
  _id: string;

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

  @Field(()=> [RoomRoundProcess],{ nullable: false, defaultValue: [] })
  rounds: RoomRoundProcess[];

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
      this.roundService.query({ match: joinData.match })
    ]);
    if (!roomExist || !roundExist || !roundsOfTheMatch || roundsOfTheMatch.length === 0) return;


    client.join(roomExist._id.toString());


    // Set room data initially
    let roomData = {
      _id: roomExist._id.toString(),
      match: roomExist.match.toString(),
      teamA: roomExist.teamA.toString(),
      teamAClient: null,
      teamB: roomExist.teamB.toString(),
      teamBClient: null,
      rounds: []
    };


    // Setting process for all rounds
    const roundsProcess: RoomRoundProcess[] = [];
    let i = 0;
    while (i < roundsOfTheMatch.length) {
      const roundProcessObj: RoomRoundProcess = {
        _id: roundsOfTheMatch[i]._id.toString(),
        teamAProcess: roundsOfTheMatch[i].teamAProcess,
        teamBProcess: roundsOfTheMatch[i].teamBProcess,
      };
      roundsProcess.push(roundProcessObj);
      i += 1;
    }
    roomData.rounds = roundsProcess;


    // Set team and client Id for my team
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
      // roomData = { ...prevRoom };
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


    // Response
    client.emit('join-room-response', roomData);
  }


  @SubscribeMessage('check-in-from-client')
  async onCheckIn(client, checkIn: CheckInInput) {
    /**
     * Find room from database by match
     * Find room from local map
     * Update process
     */

    // Validate and organize room data
    const prevRoom = this.roomsLocal.get(checkIn.room);
    if (!prevRoom || !prevRoom.teamAClient || !prevRoom.teamBClient) return;
    const roomData = { ...prevRoom };
    let roundList = [...roomData.rounds];
    const roundI = roundList.findIndex((r)=> r._id === checkIn.round)
    if(roundI === -1) return;

    // update round to checkin
    const currRoundObj = {...roundList[roundI]}
    if (prevRoom.teamAClient === client.id) {
      currRoundObj.teamAProcess = EActionProcess.CHECKIN;
    } else {
      currRoundObj.teamBProcess = EActionProcess.CHECKIN;
    }
    await this.roundService.updateOne({ _id: checkIn.round }, { teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess });
    roundList = [...roundList.filter((r)=> r._id !== checkIn.round), currRoundObj];
    roomData.rounds = roundList;
    this.roomsLocal.set(checkIn.room, roomData)

    client.to(prevRoom._id).emit('check-in-response', roomData);
  }

  @SubscribeMessage('submit-lineup-from-client')
  async onSubmitLineup(client, submitLineup: SubmitLineupInput) {
    /**
     * Find round from the database and update round
     * Find room from local map
     * Update process in the round to lock it if both team submit their players
     */

    // Validate and organize room data
    const prevRoom = this.roomsLocal.get(submitLineup.room);
    if (!prevRoom) return;
    let roomData = { ...prevRoom };
    let roundList = [...roomData.rounds];
    const roundI = roundList.findIndex((r)=> r._id === submitLineup.round)
    if(roundI === -1) return;

    // update round to checkin
    const currRoundObj = {...roundList[roundI]};
    if (prevRoom.teamAClient === client.id) {
      currRoundObj.teamAProcess = EActionProcess.LINEUP;
    } else {
      currRoundObj.teamBProcess = EActionProcess.LINEUP;
    }

    // Update nets and round by assigning player to nets
    const updatePromises = [];
    updatePromises.push(this.roundService.update({ teamAProcess: currRoundObj.teamAProcess, teamBProcess: currRoundObj.teamBProcess }, submitLineup.round));
    for (const n of submitLineup.nets) {
      updatePromises.push(this.netService.update({
        teamAPlayerA: n.teamAPlayerA,
        teamAPlayerB: n.teamAPlayerB,
        teamBPlayerA: n.teamBPlayerA,
        teamBPlayerB: n.teamBPlayerB,
      }, n._id));
    }

    await Promise.all(updatePromises);

    // Update room locally
    roundList = [...roundList.filter((r)=> r._id !== submitLineup.round), currRoundObj];
    roomData.rounds = roundList;
    this.roomsLocal.set(submitLineup.room, roomData);

    const roomDataWithNets: RoomLocalWithNets = { ...roomData, nets: submitLineup.nets }
    client.to(prevRoom._id).emit('submit-lineup-response', roomDataWithNets);
  }

  @SubscribeMessage('update-points-from-client')
  async onPointsUpdate(client, updatePointsInput: UpdatePointsInput) {

    const prevRoom = this.roomsLocal.get(updatePointsInput.room);
    if (!prevRoom) return;

    // Update net score from database
    const updatePromises = [];
    for (const n of updatePointsInput.nets) {
      const pointsObj: any = {};
      if (n.teamAScore || n.teamAScore === 0) pointsObj.teamAScore = n.teamAScore;
      if (n.teamBScore || n.teamBScore === 0) pointsObj.teamBScore = n.teamBScore;
      updatePromises.push(this.netService.update(pointsObj, n._id));
    }
    await Promise.all(updatePromises);


    // Calculate and update score for all nets of a round
    const findNets = await this.netService.query({ round: updatePointsInput.round });
    let teamAScore = 0;
    let teamBScore = 0;
    let i = 0;
    while (i < findNets.length) {
      if (findNets[i].teamAScore) teamAScore += findNets[i].teamAScore;
      if (findNets[i].teamBScore) teamBScore += findNets[i].teamBScore;
      i += 1;
    }

    await this.roundService.update({ teamAScore, teamBScore }, updatePointsInput.round);

    const pointsResponse: RoundUpdatedResponse = {
      nets: updatePointsInput.nets,
      room: updatePointsInput.room,
      round: { _id: updatePointsInput.round, teamAScore, teamBScore }
    }
    client.to(prevRoom._id).emit('update-points-response', pointsResponse);
  }

  @SubscribeMessage("round-change-from-client")
  async onRoundChange(client, roundChangeInput: RoundChangeInput) {
    /**
     * Change process for a team
     * Make submit process for the team who changes the  round
     * Invite other team to be in the same round as current team is in
     * Check current round is not locked, if it is locked let it be
     */
    const [currRoundExist, nextRoundExist] = await Promise.all([
      this.roundService.findById(roundChangeInput.round),
      this.roundService.findById(roundChangeInput.nextRound)
    ]);

    if (!currRoundExist || !nextRoundExist) return;
    const prevRoom = this.roomsLocal.get(roundChangeInput.room);
    if (!prevRoom) return;

    // Set room data initially
    let roomData = structuredClone(prevRoom);;



    const roundUpdateObj = {
      teamAProcess: nextRoundExist.teamAProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : nextRoundExist.teamAProcess,
      teamBProcess: nextRoundExist.teamBProcess === EActionProcess.INITIATE ? EActionProcess.CHECKIN : nextRoundExist.teamBProcess
    };

    let roomRounds = [...prevRoom.rounds];
    const localRoundIndex = roomRounds.findIndex((r)=> r._id === roundChangeInput.nextRound);
    if(localRoundIndex !== -1){
      roomRounds[localRoundIndex] = {...roomRounds[localRoundIndex], ...roundUpdateObj};
      roomData.rounds = roomRounds;
    }
    await this.roundService.updateOne({ _id: roundChangeInput.nextRound }, roundUpdateObj);
    this.roomsLocal.set(prevRoom._id, roomData);

    // set oponent specific round and current round
    client.to(prevRoom._id).emit("round-change-response", roomData);
  }

  // @SubscribeMessage("round-change-accept-from-client")
  // async onAcceptRoundChange(client, acceptRoom: RoomLocal) {
  //   /**
  //    * Change process for a team
  //    * Make submit process for the team who changes the  round
  //    * Invite other team to be in the same round as current team is in
  //    * Check current round is not locked, if it is locked let it be
  //    */
  //   const targetRound = await this.roundService.findById(acceptRoom.round);
  //   if (!targetRound) return;
  //   const prevRoom = this.roomsLocal.get(acceptRoom._id);
  //   if (!prevRoom || !prevRoom.teamAClient || !prevRoom.teamBClient) return;
  //   let roomData = {
  //     ...prevRoom,
  //     teamAProcess: EActionProcess.CHECKIN,
  //     teamBProcess: EActionProcess.CHECKIN,
  //     round: acceptRoom.round,
  //     teamARound: acceptRoom.round,
  //     teamBRound: acceptRoom.round,
  //   };
  //   if (targetRound.teamAProcess === EActionProcess.INITIATE && targetRound.teamAProcess === EActionProcess.INITIATE) {
  //     roomData.teamAProcess = EActionProcess.CHECKIN;
  //     roomData.teamBProcess = EActionProcess.CHECKIN;
  //   } else {
  //     roomData.teamAProcess = targetRound.teamAProcess;
  //     roomData.teamBProcess = targetRound.teamBProcess;
  //   }
  //   this.roomsLocal.set(prevRoom._id, roomData);
  //   await this.roundService.updateOne({ _id: acceptRoom.round }, { teamAProcess: roomData.teamAProcess, teamBProcess: roomData.teamBProcess });
  //   client.to(prevRoom._id).emit("round-change-accept-response", roomData);
  // }


  @SubscribeMessage("room-detail-client")
  async onRoomCheck(client, { roomId }: { roomId: string }) {
    const prevRoom = this.roomsLocal.get(roomId);
    client.emit("room-detail-response", prevRoom);
  }
}
