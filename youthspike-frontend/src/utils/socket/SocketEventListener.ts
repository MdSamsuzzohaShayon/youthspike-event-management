import { setMessage } from "@/redux/slices/elementSlice";
import { setMatchInfo } from "@/redux/slices/matchesSlice";
import {
  setCurrentRoundNets,
  setCurrNetNum,
  setNets,
} from "@/redux/slices/netSlice";
import { setCurrentRoom } from "@/redux/slices/roomSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import {
  setCurrentServerReceiver,
  setServerReceiverPlays,
  setServerReceiversOnNet,
} from "@/redux/slices/serverReceiverOnNetSlice";
import {
  EMessage,
  ICheckInResponse,
  ILineUpResponse,
  IResetServerReceiverResponse,
  IRevertPlayReceiverResponse,
  IRoom,
  IRoundRelatives,
  IServerReceiverActionResponse,
  IServerReceiverOnNetMixed,
  IServerReceiverResponse,
  ISRConfirmResponse,
  IUpdateExtendOvertimeResponse,
  IUpdateNet,
  IUpdateNetResponse,
  IUpdatePointsResponse,
  IUpdateRound,
} from "@/types";
import { ETieBreaker } from "@/types/net";
import { IRoomRoundProcess } from "@/types/room";
import React from "react";
import { Socket } from "socket.io-client";

// Class to handle socket events
class SocketEventListener {
  socket: Socket | null;

  dispatch: React.Dispatch<React.SetStateAction<any>>;

  audioPlayEl: React.RefObject<HTMLElement | null> | null;

  constructor(
    socket: Socket,
    dispatch: React.Dispatch<React.SetStateAction<any>>,
    audioPlayEl?: React.RefObject<HTMLElement | null>
  ) {
    this.socket = socket;
    this.dispatch = dispatch;
    this.audioPlayEl = audioPlayEl ?? null;

    this.restartAudio.bind(this);
  }

  handleJoinRoom(
    data: IRoom,
    dispatch: React.Dispatch<React.SetStateAction<any>>
  ) {
    this.dispatch = dispatch;

    dispatch(setCurrentRoom(data));
  }

  restartAudio() {
    if (this.audioPlayEl && this.audioPlayEl.current)
      this.audioPlayEl.current.click();
  }

  handleCheckInResponse({
    data,
    dispatch,
    roundList,
    currentRound,
  }: ICheckInResponse) {
    this.restartAudio();

    // Set current round and round list
    const updatedRoundList: IRoundRelatives[] = [];
    let currRoundObj: null | IRoundRelatives = null;
    const roomRounds: IRoomRoundProcess[] = [...data.rounds];
    if (roomRounds.length > 0) {
      for (let i = 0; i < roomRounds.length; i += 1) {
        if (roomRounds[i].teamAProcess && roomRounds[i].teamBProcess) {
          const teamProcessObj = {
            teamAProcess: roomRounds[i].teamAProcess,
            teamBProcess: roomRounds[i].teamBProcess,
          };
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

      // Temp - Creating an issue running this again and again
      dispatch(setRoundList(updatedRoundList));
      if (currRoundObj) dispatch(setCurrentRound(currRoundObj));
    }
  }

  handleLineupResponse({
    data,
    dispatch,
    currRoundNets,
    allNets,
    roundList,
    currentRound,
    currMatch,
  }: ILineUpResponse) {
    this.restartAudio();

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
      if (findCRNI !== -1)
        if (
          updatedCRN[findCRNI].netType === ETieBreaker.FINAL_ROUND_NET_LOCKED &&
          currMatch.extendedOvertime
        ) {
          /**
           * Check my team has selected 2 players or not
           * This is only for overtime round so check that as well
           * Net type must be FINAL_ROUND_NET_LOCKED
           */
          if (!teamObj.teamAPlayerA && !teamObj.teamAPlayerB) {
            teamObj.teamAPlayerA = updatedCRN[findCRNI].teamAPlayerA || null;
            teamObj.teamAPlayerB = updatedCRN[findCRNI].teamAPlayerB || null;
          } else if (!teamObj.teamBPlayerA && !teamObj.teamBPlayerB) {
            teamObj.teamBPlayerA = updatedCRN[findCRNI].teamBPlayerA || null;
            teamObj.teamBPlayerB = updatedCRN[findCRNI].teamBPlayerB || null;
          }
        }

      updatedCRN[findCRNI] = { ...updatedCRN[findCRNI], ...teamObj };

      const findANI = updatedAllNets.findIndex(
        (n) => n._id === data.nets[i]._id
      );
      if (findANI !== -1)
        updatedAllNets[findANI] = { ...updatedAllNets[findANI], ...teamObj };
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
          const teamProcessObj = {
            teamAProcess: roomRounds[i].teamAProcess,
            teamBProcess: roomRounds[i].teamBProcess,
          };
          const roundObj = roundList.find((r) => r._id === roomRounds[i]._id);
          if (roundObj) {
            const properRoundObj = { ...roundObj };
            if (roundList[i]._id === data.subbedRound) {
              properRoundObj.subs = data.subbedPlayers;
            }
            // @ts-ignore
            updatedRoundList.push({ ...properRoundObj, ...teamProcessObj });
            if (roomRounds[i]._id === currentRound?._id) {
              // @ts-ignore
              currRoundObj = { ...properRoundObj, ...teamProcessObj };
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
  }

  handleUpdatePoints({
    data,
    dispatch,
    currRoundNets,
    allNets,
    roundList,
    currentRound,
    match,
  }: IUpdatePointsResponse) {
    this.dispatch = dispatch;
    // ===== set current round nets =====
    const netsOfRound = [...currRoundNets];
    const newAllNets = [...allNets];

    // Update points in the net
    for (let i = 0; i < data.nets.length; i += 1) {
      const findNetIndex = allNets.findIndex((n) => n._id === data.nets[i]._id);
      const findRoundNetIndex = netsOfRound.findIndex(
        (n) => n._id === data.nets[i]._id
      );

      if (findNetIndex !== -1) {
        newAllNets[findNetIndex] = {
          ...newAllNets[findNetIndex],
          teamAScore: data.nets[i].teamAScore,
          teamBScore: data.nets[i].teamBScore,
        };
      }

      if (findRoundNetIndex !== -1) {
        netsOfRound[findRoundNetIndex] = {
          ...netsOfRound[findRoundNetIndex],
          teamAScore: data.nets[i].teamAScore,
          teamBScore: data.nets[i].teamBScore,
        };
      }
    }

    dispatch(setNets(newAllNets));
    dispatch(setCurrentRoundNets(netsOfRound));

    // ===== update round =====
    const findRound: IRoundRelatives | undefined = roundList.find(
      (r) => r._id === data.round._id
    );
    if (findRound) {
      const updatedRound = {
        ...findRound,
        teamAProcess: data.teamAProcess,
        teamBProcess: data.teamBProcess,
        teamAScore: data.round.teamAScore,
        teamBScore: data.round.teamBScore,
        completed: data.round.completed,
      };
      const newRoundList = [
        updatedRound,
        ...roundList.filter((r) => r._id !== data.round._id),
      ];
      dispatch(setRoundList(newRoundList));
      if (currentRound && findRound._id === currentRound._id) {
        dispatch(setCurrentRound(updatedRound));
      }
    }

    // ===== Match Update =====
    if (data.matchCompleted) {
      dispatch(setMatchInfo({ ...match, completed: true }));
    }
  }

  updateExtendOvertime({
    data,
    dispatch,
    match,
  }: IUpdateExtendOvertimeResponse) {
    this.dispatch = dispatch;
    // ===== set current round nets =====
    // Update round list
    dispatch(setRoundList(data.roundList));
    // Set current round
    if (data.roundList && data.roundList.length > 0) {
      let itemWithMaxNum = data.roundList[0]; // Start with the first item

      for (let i = 1; i < data.roundList.length; i += 1) {
        if (data.roundList[i].num > itemWithMaxNum.num) {
          itemWithMaxNum = data.roundList[i];
        }
      }
      // dispatch(setCurrentRound(itemWithMaxNum));
    }
    dispatch(
      setMatchInfo({
        ...match,
        extendedOvertime: data.extendedOvertime,
        rounds: data.roundList.map((r) => r._id),
      })
    );
    dispatch(setNets(data.nets));
  }

  handleUpdateNet({
    data,
    dispatch,
    currRoundNets,
    allNets,
    roundList,
    match,
  }: IUpdateNetResponse) {
    this.dispatch = dispatch;
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
    const lockedNets = updatedCRN.filter(
      (n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED
    );
    if (lockedNets.length > 1) {
      const lnIds = lockedNets.map((n) => n._id);
      for (let i = 0; i < updatedCRN.length; i += 1) {
        if (
          !lnIds.includes(updatedCRN[i]._id) &&
          updatedCRN[i].round === roundList[roundList.length - 1]._id
        ) {
          updatedCRN[i] = {
            ...updatedCRN[i],
            points: 2,
            netType: ETieBreaker.TIE_BREAKER_NET,
          };
        }
      }

      for (let i = 0; i < updatedN.length; i += 1) {
        if (!lnIds.includes(updatedN[i]._id)) {
          updatedN[i] = {
            ...updatedN[i],
            points: 2,
            netType: ETieBreaker.TIE_BREAKER_NET,
          };
        }
      }
    }

    // Update current round nets and all nets
    if (data.match === match._id) {
      dispatch(setMatchInfo({ ...match, completed: true }));
    }

    dispatch(setCurrentRoundNets(updatedCRN));
    dispatch(setNets(updatedN));
  }

  handleUpdateRoundAllPages({
    matchList,
    setMatchList,
    actionData,
  }: IUpdateRound) {
    // Find match index directly in the match list
    const matchIndex = matchList.findIndex((m) => m._id === actionData.match);
    if (matchIndex === -1) return;

    // Directly clone the match object instead of the whole list
    const matchObj = structuredClone(matchList[matchIndex]);

    // If no rounds, initialize as empty; else shallow copy rounds
    const roundList = matchObj.rounds || [];
    const roundIndex = roundList.findIndex((r) => r._id === actionData._id);
    if (roundIndex === -1) return;

    // Update specific round's data
    roundList[roundIndex] = {
      ...roundList[roundIndex],
      teamAProcess: actionData.teamAProcess,
      teamBProcess: actionData.teamBProcess,
    };
    matchObj.rounds = roundList;

    // Set the updated match in a new match list to avoid re-rendering issues
    const updatedMatchList = [...matchList];
    updatedMatchList[matchIndex] = matchObj;
    setMatchList(updatedMatchList);

    console.log("round-update-all-pages ----> ", matchList, actionData);
    this.dispatch(setRoundList([]));
  }

  handleUpdateNetAllPages({ matchList, setMatchList, actionData }: IUpdateNet) {
    // Find match index directly in the match list
    const matchIndex = matchList.findIndex((m) => m._id === actionData.match);
    if (matchIndex === -1) return;

    // Directly clone the match object instead of the whole list
    const matchObj = structuredClone(matchList[matchIndex]);

    // If no rounds, initialize as empty; else shallow copy rounds
    const roundList = matchObj.rounds || [];
    const roundIndex = roundList.findIndex((r) => r._id === actionData._id);
    if (roundIndex === -1) return;

    // Update specific nets's data
    const allNets = [];
    for (let i = 0; i < matchObj.nets.length; i += 1) {
      const changedNetIndex = actionData.nets.findIndex(
        (n) => n._id === matchObj.nets[i]._id
      );
      if (changedNetIndex !== -1) {
        allNets.push({
          ...matchObj.nets[i],
          teamAScore: actionData.nets[changedNetIndex].teamAScore,
          teamBScore: actionData.nets[changedNetIndex].teamBScore,
        });
      } else {
        allNets.push({ ...matchObj.nets[i] });
      }
    }
    matchObj.nets = allNets;

    // Set the updated match in a new match list to avoid re-rendering issues
    const updatedMatchList = [...matchList];
    if (actionData.matchCompleted) {
      matchObj.completed = actionData.matchCompleted;
    }
    updatedMatchList[matchIndex] = matchObj;
    setMatchList(updatedMatchList);

    this.dispatch(setRoundList([]));
  }

  // Score Keeper
  private handleScoreKeeperUpdate({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverResponse) {
    this.dispatch = dispatch;

    if (!data) return;

    const srObj = { ...data.serverReceiverOnNet };
    let found = false;

    const updatedList = serverReceiversOnNet.map((sr) => {
      if (sr.net === srObj.net) {
        found = true;
        return srObj; // Replace existing entry
      }
      return sr;
    });

    if (!found) {
      updatedList.push(srObj); // Add new if not found
    }

    dispatch(setServerReceiverPlays([...serverReceiverPlays, data.singlePlay]));
    dispatch(setServerReceiversOnNet(updatedList));
    dispatch(setCurrentServerReceiver(srObj));
  }

  handleSetPlayers({
    data,
    dispatch,
    serverReceiversOnNet,
    setActionPreview,
  }: ISRConfirmResponse) {
    this.dispatch = dispatch;

    // Score Keeper
    if (data) {
      dispatch(setServerReceiversOnNet([...serverReceiversOnNet, data]));
      dispatch(setCurrentServerReceiver(data));

      if (setActionPreview) setActionPreview(true);
    }

    // Change state
    // Change player stats state -> later

    // Update server receivers on net list
    // This would typically involve fetching or updating the list
    // For now, we'll add the current one to the list if it doesn't exist
    // You may need to adjust this logic based on your specific requirements
  }

  handleServiceFaultResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    console.log("Service fault-----");
    
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleAceNoTouchResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleAceNoThirdTouchResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleOneTwoThreePutAwayResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleRalleyConversionResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleDefensiveConversionResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleHittingErrorResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleServerDoNotKnowResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleReceiverDoNotKnowResponse({
    data,
    dispatch,
    serverReceiversOnNet,
    serverReceiverPlays,
  }: IServerReceiverActionResponse) {
    this.handleScoreKeeperUpdate({
      data,
      dispatch,
      serverReceiversOnNet,
      serverReceiverPlays,
    });
  }

  handleResetServerReceiver({
    data,
    dispatch,
    serverReceiversOnNet,
  }: IResetServerReceiverResponse) {
    this.dispatch = dispatch;

    window.location.reload();
  }

  handleRevertPlay({
    data: serverReceiverOnNetData, // From backend server response
    dispatch,
    serverReceiversOnNet, // From redux store
    serverReceiverPlays,
  }: IRevertPlayReceiverResponse) {
    this.dispatch = dispatch;

    if (!serverReceiverOnNetData.play) return;

    // Single pass: filter plays and find current play
    const newServerReceiverPlays = [];
    for (const play of serverReceiverPlays) {
      if (play.play < serverReceiverOnNetData.play) {
        newServerReceiverPlays.push(play);
      }
    }

    dispatch(setServerReceiverPlays(newServerReceiverPlays));

    // If found, update current server receiver (Both, the array and current server receiver)
    if (serverReceiverOnNetData && serverReceiverOnNetData.room) {
      dispatch(setCurrentServerReceiver(serverReceiverOnNetData));

      // Update serverReceiversOnNet in one pass
      const newSRArr = serverReceiversOnNet.map((item) => {
        if (item.net === serverReceiverOnNetData.net) {
          const { net, ...restNew } = serverReceiverOnNetData;
          return { ...item, ...restNew };
        }
        return item;
      });

      dispatch(setServerReceiversOnNet(newSRArr));
    }
  }

  handleError(
    error: string,
    dispatch: React.Dispatch<React.SetStateAction<any>>
  ) {
    console.log({ error });
    this.dispatch = dispatch;
    dispatch(
      setMessage({
        type: EMessage.ERROR,
        message: `${error}. Try refreshing the page!`,
      })
    );
  }
}

export default SocketEventListener;
