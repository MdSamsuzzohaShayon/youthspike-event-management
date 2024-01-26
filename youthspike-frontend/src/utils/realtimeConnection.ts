import { Socket } from "socket.io-client";
import { getCookie } from "./cookie";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRoundNets, setNets, updateMultiNetsPlayers } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import { setTeamProcess } from "@/redux/slices/matchesSlice";
import { IRoundExpRel, ITeam, IUserContext } from "@/types";
import { EActionProcess } from "@/types/elements";

const makeRealtimeConnection =(
  socket: Socket, 
  dispatch: React.Dispatch<React.ReducerAction<any>>,
  userInfo: IUserContext | null,
  userToken: string | null ,
  teamA: ITeam,
  teamB: ITeam,
  currentRound: IRoundExpRel,
  )=>{
     /**
     * Socket real time connection
     * After joining to the room action button will be visiable
     */
     
    if (!socket || !userInfo || !userToken) return;
    const parsedUser = JSON.parse(userInfo);
    if (!parsedUser.captainplayer || !teamA || !teamA.captain || !teamB || !teamB.captain || !currentRound) return;

    let userTeamId = null, myTeamProcess = EActionProcess.INITIATE, opTeamProcess: EActionProcess.INITIATE;
    if (parsedUser.captainplayer === teamA.captain._id) {
      userTeamId = teamA._id;
    } else if (parsedUser.captainplayer === teamB.captain._id) {
      userTeamId = teamB._id;
    } else {
      return;
    }

    // @ts-ignore
    socket.emit('join-room-from-client', { match: params.matchId, team: userTeamId, round: currentRound._id });

    // Listen to events
    // @ts-ignore
    socket.on('join-room-response', (data: IRoom) => {
      const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
      const extranctedData = { ...data };
      if (isTeamACaptain) {
        // @ts-ignore 
        myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
      }
      
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(extranctedData));
    });
    // @ts-ignore
    socket.on('check-in-response', (data: IRoom) => {
      if (user?.info?.captainplayer === teamA?.captain?._id) {
        // @ts-ignore 
        myTeamProcess = data.teamAProcess; opTeamProcess = data.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = data.teamBProcess; opTeamProcess = data.teamAProcess;
      }
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(data));
    });

    // @ts-ignore
    socket.on('submit-lineup-response', (data: IRoomNets) => {
      if (user?.info?.captainplayer === teamA?.captain?._id) {
        // @ts-ignore 
        myTeamProcess = data.teamAProcess; opTeamProcess = data.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = data.teamBProcess; opTeamProcess = data.teamAProcess;
      }
      // Set current nets of the rounds 
      dispatch(updateMultiNetsPlayers(data.nets));
      // @ts-ignore
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(data));
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
        if (findRound._id === currentRound._id) {
          dispatch(setCurrentRound(updatedRound));
        }
      }
    });


    // @ts-ignore
    socket.on('round-change-response', (data: IRoom) => {
      const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
      const extranctedData = { ...data };
      if (isTeamACaptain) {
        // @ts-ignore 
        myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
      }
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(extranctedData));
    });

    // @ts-ignore 
    socket.on("round-change-accept-response", (data: IRoom) => {
      // Check submitted all users or not

      const isTeamACaptain = user?.info?.captainplayer === teamA?.captain?._id;
      const extranctedData = { ...data };
      if (isTeamACaptain) {
        // @ts-ignore 
        myTeamProcess = extranctedData.teamAProcess; opTeamProcess = extranctedData.teamBProcess;
      } else {
        // @ts-ignore
        myTeamProcess = extranctedData.teamBProcess; opTeamProcess = extranctedData.teamAProcess;
      }

      // dispatch(setSubmittedLineup(submitted));
      dispatch(setTeamProcess({ myTeamProcess, opTeamProcess }));
      dispatch(setCurrentRoom(data));
    });

}

export default makeRealtimeConnection;