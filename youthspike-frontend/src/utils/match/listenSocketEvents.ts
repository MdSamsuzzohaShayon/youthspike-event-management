import { INetRelatives, IRoundExpRel, IRoundRelatives, ITeam, IUser, IUserContext } from "@/types";
import { Socket } from "socket.io-client";
import { getCookie } from "../cookie";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRoundNets, setNets, updateMultiNetsPlayers } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { EActionProcess, IRoom, IRoomNets, IRoomRoundProcess } from "@/types/room";
import { joinTheRoom } from "./emitSocketEvents";


interface IListenSocketProps {
  socket: Socket;
  user: IUserContext;
  teamA?: ITeam | null;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  currentRound: IRoundRelatives | null;
  currRoundNets: INetRelatives[];
  allNets: INetRelatives[];
  roundList: IRoundRelatives[]
}
const listenSocketEvents = ({ socket, user, teamA, dispatch, currentRound, currRoundNets, allNets, roundList }: IListenSocketProps) => {
  /**
   * Socket real time connection
   * After joining to the room action button will be visiable
   */

  // Listen to events
  socket.on('join-room-response', (data: IRoom) => {
    const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
    const extranctedData = { ...data };
    dispatch(setCurrentRoom(extranctedData));
  });
  socket.on('check-in-response', (data: IRoom) => {

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...data.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i++) {
        if (roomRounds[i].teamAProcess && roomRounds[i].teamBProcess) {
          const teamProcessObj = { teamAProcess: roomRounds[i].teamAProcess, teamBProcess: roomRounds[i].teamBProcess };
          const roundObj = roundList.find((r) => r._id === roomRounds[i]._id);
          if (roundObj) {
            // @ts-ignore
            updatedRoundList.push({ ...roundObj, ...teamProcessObj });
            if (roomRounds[i]._id === currentRound?._id) {
              // @ts-ignore
              currRoundObj = { ...roundObj, ...teamProcessObj };
            }
          }
        }
      }

      dispatch(setRoundList(updatedRoundList));
      if (currRoundObj) dispatch(setCurrentRound(currRoundObj));
    }
  });

  socket.on('submit-lineup-response', (data: IRoomNets) => {
    // Set current nets of the rounds 
    dispatch(updateMultiNetsPlayers(data.nets));

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...data.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i++) {
        if (roomRounds[i].teamAProcess && roomRounds[i].teamBProcess) {
          const teamProcessObj = { teamAProcess: roomRounds[i].teamAProcess, teamBProcess: roomRounds[i].teamBProcess };
          const roundObj = roundList.find((r) => r._id === roomRounds[i]._id);
          if (roundObj) {
            // @ts-ignore
            updatedRoundList.push({ ...roundObj, ...teamProcessObj });
            if (roomRounds[i]._id === currentRound?._id) {
              // @ts-ignore
              currRoundObj = { ...roundObj, ...teamProcessObj };
            }
          }
        }
      }

      dispatch(setRoundList(updatedRoundList));
      if (currRoundObj) dispatch(setCurrentRound(currRoundObj));
    }
  });

  // @ts-ignore
  socket.on("update-points-response", (data: IUpdateScoreResponse) => {
    // Set nets
    // set current round nets
    const netsOfRound = [...currRoundNets];
    const newAllNets = [...allNets];

    for (let i = 0; i < data.nets.length; i += 1) {
      const findNetIndex = allNets.findIndex((n) => n._id === data.nets[i]._id);
      const findRoundNetIndex = netsOfRound.findIndex((n) => n._id === data.nets[i]._id);

      if (findNetIndex !== -1) {
        newAllNets[findNetIndex] = { ...newAllNets[findNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore };
      }

      if (findRoundNetIndex !== -1) {
        netsOfRound[findRoundNetIndex] = { ...netsOfRound[findRoundNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore }
      }
    }

    dispatch(setNets(newAllNets));
    dispatch(setCurrentRoundNets(netsOfRound));
    // update round
    const findRound = roundList.find((r) => r._id === data.round._id);
    if (findRound) {
      const updatedRound = { ...findRound, teamAScore: data.round.teamAScore, teamBScore: data.round.teamBScore };
      const newRoundList = [updatedRound, ...roundList.filter(r => r._id !== data.round._id)];
      dispatch(setRoundList(newRoundList));
      if (currentRound && findRound._id === currentRound._id) {
        dispatch(setCurrentRound(updatedRound));
      }
    }
  });


  // // @ts-ignore
  // socket.on('round-change-response', (data: IRoom) => {
  //   const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
  //   const extranctedData = { ...data };
  //   let myTeamProcess = null, opTeamProcess = null;
  //   if (isTeamACaptain) {
  //     myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
  //   } else {
  //     myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
  //   }
  //   dispatch(setCurrentRoom(extranctedData));
  // });

  // // @ts-ignore 
  // socket.on("round-change-accept-response", (data: IRoom) => {
  //   // Check submitted all users or not

  //   const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
  //   const extranctedData = { ...data };
  //   if (isTeamACaptain) {

  //     myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
  //   } else {
  //     // @ts-ignore
  //     myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
  //   }

  //   dispatch(setCurrentRoom(data));
  // });
};

export default listenSocketEvents;