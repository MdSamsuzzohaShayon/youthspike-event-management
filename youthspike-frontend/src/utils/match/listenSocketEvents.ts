import { IListenSocketProps, IRoundRelatives, IUpdateScoreResponse } from '@/types';
import { setCurrentRoom } from '@/redux/slices/roomSlice';
import { setCurrNetNum, setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IRoom, IRoomNets, IRoomRoundProcess, ITeiBreakerAction } from '@/types/room';
import { ETieBreaker } from '@/types/net';

const listenSocketEvents = ({ socket, user, teamA, dispatch, currentRound, currRoundNets, allNets, roundList, restartAudio }: IListenSocketProps) => {
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
    restartAudio();

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...data.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i += 1) {
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
    restartAudio();

    // Set current round nets and all nets
    const updatedCRN = [...currRoundNets]; // crn = current round nets
    const updatedAllNets = [...allNets];
    for (let i = 0; i < data.nets.length; i += 1) {
      const teamObj = {
        teamAPlayerA: data.nets[i].teamAPlayerA,
        teamAPlayerB: data.nets[i].teamAPlayerB,
        teamBPlayerA: data.nets[i].teamBPlayerA,
        teamBPlayerB: data.nets[i].teamBPlayerB,
      };

      const findCRNI = updatedCRN.findIndex((n) => n._id === data.nets[i]._id);
      if (findCRNI !== -1) updatedCRN[findCRNI] = { ...updatedCRN[findCRNI], ...teamObj };

      const findANI = updatedAllNets.findIndex((n) => n._id === data.nets[i]._id);
      if (findANI !== -1) updatedAllNets[findANI] = { ...updatedAllNets[findANI], ...teamObj };
    }
    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedAllNets));

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...data.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i += 1) {
        if (roomRounds[i].teamAProcess && roomRounds[i].teamBProcess) {
          const teamProcessObj = { teamAProcess: roomRounds[i].teamAProcess, teamBProcess: roomRounds[i].teamBProcess };
          const roundObj = roundList.find((r) => r._id === roomRounds[i]._id);
          if (roundObj) {
            const properRoundObj = { ...roundObj };
            if (roundList[i].num >= data.subbedRound) {
              properRoundObj.subs = data.subbedPlayers;
            }
            // @ts-ignore
            updatedRoundList.push({ ...properRoundObj, ...teamProcessObj });
            if (roomRounds[i]._id === currentRound?._id) {
              // @ts-ignore
              currRoundObj = { ...currentRound, ...teamProcessObj };
            }
          }
        }
      }

      // Set subbed players
      //       subbedRound: currRoundObj.num, subbedPlayers: submitLineup.subbedPlayers,

      dispatch(setRoundList(updatedRoundList));
      if (currRoundObj) dispatch(setCurrentRound(currRoundObj));
      dispatch(setCurrNetNum(1));
    }
  });

  socket.on('update-points-response', (data: IUpdateScoreResponse) => {
    // ===== set current round nets =====
    const netsOfRound = [...currRoundNets];
    const newAllNets = [...allNets];

    for (let i = 0; i < data.nets.length; i += 1) {
      const findNetIndex = allNets.findIndex((n) => n._id === data.nets[i]._id);
      const findRoundNetIndex = netsOfRound.findIndex((n) => n._id === data.nets[i]._id);

      if (findNetIndex !== -1) {
        newAllNets[findNetIndex] = { ...newAllNets[findNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore };
      }

      if (findRoundNetIndex !== -1) {
        netsOfRound[findRoundNetIndex] = { ...netsOfRound[findRoundNetIndex], teamAScore: data.nets[i].teamAScore, teamBScore: data.nets[i].teamBScore };
      }
    }

    dispatch(setNets(newAllNets));
    dispatch(setCurrentRoundNets(netsOfRound));

    // ===== update round =====
    const findRound = roundList.find((r) => r._id === data.round._id);
    if (findRound) {
      const updatedRound = { ...findRound, teamAScore: data.round.teamAScore, teamBScore: data.round.teamBScore, completed: data.round.completed };
      const newRoundList = [updatedRound, ...roundList.filter((r) => r._id !== data.round._id)];
      dispatch(setRoundList(newRoundList));
      if (currentRound && findRound._id === currentRound._id) {
        dispatch(setCurrentRound(updatedRound));
      }
    }
  });

  socket.on('update-net-response', (data: ITeiBreakerAction) => {
    // Update current round nets and all nets
    const updatedCRN = [...currRoundNets];
    const updatedN = [...allNets];

    for (let i = 0; i < data.nets.length; i += 1) {
      const crnI = updatedCRN.findIndex((n) => n._id === data.nets[i]._id); // crnI = current round net index
      if (crnI !== -1) {
        const netObj = { ...updatedCRN[crnI], netType: data.nets[i].netType };
        updatedCRN[crnI] = netObj;
      }

      const nI = updatedN.findIndex((n) => n._id === data.nets[i]._id); // nI = nI = net index
      if (nI !== -1) {
        const netObj = { ...updatedN[nI], netType: data.nets[i].netType };
        updatedN[nI] = netObj;
      }
    }

    // ===== Create 2 Points Nets =====
    const lockedNets = updatedCRN.filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);
    if (lockedNets.length > 1) {
      const lnIds = lockedNets.map((n) => n._id);
      for (let i = 0; i < updatedCRN.length; i += 1) {
        if (!lnIds.includes(updatedCRN[i]._id) && updatedCRN[i].round === roundList[roundList.length - 1]._id) {
          updatedCRN[i] = { ...updatedCRN[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
        }
      }

      for (let i = 0; i < updatedN.length; i += 1) {
        if (!lnIds.includes(updatedN[i]._id)) {
          updatedN[i] = { ...updatedN[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
        }
      }
    }

    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedN));
  });
};

export default listenSocketEvents;
