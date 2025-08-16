import React from "react";
import { setMessage } from "@/redux/slices/elementSlice";
import { setVerifyLineup } from "@/redux/slices/matchesSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import {
  IJoinTheRoomProps,
  IStatusChange,
  IRoomNetAssign,
  IRoundRelatives,
  IJoinData,
  ICheckInData,
  IUpdatePointData,
  INetRelatives,
  IAceNoThirdTouchInput,
  IReceivingHittingErrorInput,
  IOneTwoThreePutAwayInput,
  IRallyConversionInput,
  IDefensiveConversionInput,
  INotTwoPointNetProps,
  ISubmitLineupProps,
  ISubmitUpdatePointsProps,
  ISubmitExtendOvertimeProps,
  ISetServerReceiverChange,
  ISetServerReceiverDataInput,
  IServiceFaultInput,
  IAceNoTouchInput,
  IUpdateCachePointsInput,
  IResetScoreInput,
  EActionProcess,
  IRoom,
  IRoomNetType,
  ISubmitLineupAction,
  ITeiBreakerAction,
  IUser,
  IUserContext,
  UserRole,
  ETeam,
  ITeam,
  ETieBreaker,
  IServerDoNotKnowInput,
  IReceiverDoNotKnowInput,
  EServerPositionPair,
  IRevertPlayInput,
  EMessage,
} from "@/types";
import { Socket } from "socket.io-client";
import { setCurrentRoundNets, setNets } from "@/redux/slices/netSlice";
import LocalStorageService from "../LocalStorageService";

class EmitEvents {
  isAuthenticated: boolean;

  isValidTeam: boolean;

  teamIdStr: string | null;

  roomNetAssign: boolean;

  allNetsFilled: boolean;

  hasSubbedPlayers: boolean;

  constructor(
    private socket: Socket | null,
    private dispatch: React.Dispatch<React.SetStateAction<any>>
  ) {
    this.socket = socket;
    this.dispatch = dispatch;

    // Just to fix error
    this.isAuthenticated = false;
    this.isValidTeam = false;
    this.teamIdStr = null;
    this.roomNetAssign = false;
    this.allNetsFilled = false;
    this.hasSubbedPlayers = false;
  }

  // Socket action function
  async joinRoom({
    user,
    teamA,
    teamB,
    currRound,
    matchId,
  }: IJoinTheRoomProps) {
    if (!this.socket || !currRound) return;
    const joinData: IJoinData = {
      match: matchId,
      round: currRound._id,
      userRole: UserRole.public,
    };

    this.socket.emit("join-room-from-client", joinData);
    if (!teamA || !teamB) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Team A, or Team B details is not found, try refreshing!",
        })
      );
    }

    /*
    if (!this.isAuthorized(user.info)) return this.dispatch(setMessage({ type: EMessage.ERROR, message: 'This user is not authorized to do this operation!' }));
    */
    if (
      user?.info &&
      (user.info.role === UserRole.captain ||
        user.info.role === UserRole.co_captain)
    ) {
      // Check if captain or co-captain in in team A or team B
      if (
        !(
          (teamA.captain && teamA.captain._id === user.info.captainplayer) ||
          (teamA.cocaptain &&
            teamA.cocaptain._id === user.info.cocaptainplayer) ||
          (teamB.captain && teamB.captain._id === user.info.captainplayer) ||
          (teamB.cocaptain && teamB.cocaptain._id === user.info.cocaptainplayer)
        )
      ) {
        return this.dispatch(
          setMessage({
            type: EMessage.ERROR,
            message: "This captain or co-captain not in both team!",
          })
        );
      }
    }

    joinData.team = await this.getTeamId(user.info, teamA, teamB);
    if (user.info) {
      joinData.userRole = user.info.role;
      joinData.userId = user?.info?._id;
    }

    this.socket.emit("join-room-from-client", joinData);
  }

  checkIn({ user, currRoom, currRound, roundList, myTeamE }: IStatusChange) {
    if (!currRoom || !currRound || !user?.info) return;

    const actionData: ICheckInData = {
      room: currRoom._id,
      round: currRound._id,
      teamAProcess:
        myTeamE === ETeam.teamA
          ? EActionProcess.CHECKIN
          : currRound.teamAProcess,
      teamBProcess:
        myTeamE === ETeam.teamB
          ? EActionProcess.CHECKIN
          : currRound.teamBProcess,
      userId: user.info._id,
      userRole: user.info.role,
      teamE: myTeamE,
    };

    this.updateRoundList(currRound, roundList, actionData);
    this.socket?.emit("check-in-from-client", actionData);
  }

  submitLineup({
    eventId,
    user,
    teamA,
    teamB,
    currRoom,
    currRound,
    currRoundNets,
    roundList,
    myPlayerIds,
    myTeamE,
  }: ISubmitLineupProps) {
    if (!user || !user?.token || !teamA || !teamB || !currRoom || !currRound) {
      console.error({
        msg: "Not provided required value",
        user,
        token: user?.token,
        teamA,
        teamB,
        currRoom,
        currRound,
      });
      return;
    }

    const actionData: ISubmitLineupAction = this.prepareLineupActionData(
      eventId,
      user,
      teamA,
      teamB,
      currRoom,
      currRound,
      currRoundNets,
      myTeamE
    );

    const selectedPlayers = new Set<string>();
    let filledAllNets = true;
    currRoundNets.forEach((crn) => {
      if (myTeamE === ETeam.teamA) {
        if (crn.teamAPlayerA && crn.teamAPlayerB) {
          selectedPlayers.add(crn.teamAPlayerA);
          selectedPlayers.add(crn.teamAPlayerB);
        } else {
          filledAllNets = false;
        }
      } else if (crn.teamBPlayerA && crn.teamBPlayerB) {
        selectedPlayers.add(crn.teamBPlayerA);
        selectedPlayers.add(crn.teamBPlayerB);
      } else {
        filledAllNets = false;
      }
    });
    if (!filledAllNets) {
      this.dispatch(
        setMessage({ type: EMessage.ERROR, message: "Every net must have players!" })
      );
      return;
    }

    const notSelectedPlayers = this.getSubbedPlayers(
      myPlayerIds,
      currRound,
      selectedPlayers
    );
    const prevSubs: string[] = [];
    if (currRound.subs && currRound.subs.length > 0) {
      for (let i = 0; i < currRound.subs.length; i += 1) {
        prevSubs.push(currRound.subs[i]);
      }
    }
    // @ts-ignore
    actionData.subbedPlayers = [
      ...new Set([...notSelectedPlayers, ...prevSubs]),
    ];
    this.updateRoundWithLineup(currRound, roundList, actionData);
    this.socket?.emit("submit-lineup-from-client", actionData);
  }

  updatePoints({
    currRoom,
    currRound,
    currNet,
    myTeamE,
  }: ISubmitUpdatePointsProps) {
    if (!currRoom || !currRound || !currNet) {
      this.dispatch(
        setMessage({ type: EMessage.ERROR, message: "No room, net or round found!" })
      );
      return;
    }

    // const netPointsList = currRoundNets.map((net) => ({
    //   _id: net._id,
    //   teamAScore: net?.teamAScore && net?.teamAScore >= 0  ? net?.teamAScore : null,
    //   teamBScore: net?.teamBScore && net?.teamBScore >= 0  ? net?.teamBScore : null,
    // }));

    const currNetObj = {
      _id: currNet._id,
      teamAScore:
        currNet?.teamAScore && currNet?.teamAScore >= 0
          ? currNet?.teamAScore
          : null,
      teamBScore:
        currNet?.teamBScore && currNet?.teamBScore >= 0
          ? currNet?.teamBScore
          : null,
    };

    const actionData: IUpdatePointData = {
      net: currNetObj,
      room: currRoom._id,
      round: currRound._id,
      teamE: myTeamE,
    };

    this.socket?.emit("update-points-from-client", actionData);
  }

  extendOvertime({ currRoom, currRound }: ISubmitExtendOvertimeProps) {
    if (!currRoom || !currRound) {
      this.dispatch(
        setMessage({ type: EMessage.ERROR, message: "No room or round found!" })
      );
      return;
    }
    this.socket?.emit("extend-overtime-from-client", {
      room: currRoom._id,
      round: currRound._id,
    });
  }

  banANet({
    netId,
    currRoom,
    currRound,
    currRoundNets,
    allNets,
  }: INotTwoPointNetProps) {
    const actionData: ITeiBreakerAction = {
      match: currRound?.match,
      room: currRoom?._id ? currRoom?._id : null,
      round: currRound?._id ? currRound?._id : null,
      teamAProcess: currRound?.teamAProcess ? currRound?.teamAProcess : null,
      teamBProcess: currRound?.teamBProcess ? currRound?.teamBProcess : null,
      nets: [],
    };

    const updatedAllNets = [...allNets];
    const updatedNets = [...currRoundNets];
    const nI = updatedNets.findIndex((n) => n._id === netId);
    const anI = updatedAllNets.findIndex((n) => n._id === netId);
    if (nI === -1 || anI === -1) return;

    updatedAllNets[anI] = {
      ...updatedAllNets[anI],
      netType: ETieBreaker.FINAL_ROUND_NET_LOCKED,
    };
    updatedNets[nI] = {
      ...updatedNets[nI],
      netType: ETieBreaker.FINAL_ROUND_NET_LOCKED,
    };

    // ===== Create 2 Points Nets =====
    const lockedNets = updatedNets.filter(
      (n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED
    );
    if (lockedNets.length > 1) {
      const lnIds = lockedNets.map((n) => n._id);
      for (let i = 0; i < updatedNets.length; i += 1) {
        if (
          !lnIds.includes(updatedNets[i]._id) &&
          updatedNets[i].round === currRound?._id
        ) {
          updatedNets[i] = {
            ...updatedNets[i],
            points: 2,
            netType: ETieBreaker.TIE_BREAKER_NET,
          };
        }
      }

      for (let i = 0; i < updatedAllNets.length; i += 1) {
        if (
          !lnIds.includes(updatedAllNets[i]._id) &&
          updatedAllNets[i].round === currRound?._id
        ) {
          updatedAllNets[i] = {
            ...updatedAllNets[i],
            points: 2,
            netType: ETieBreaker.TIE_BREAKER_NET,
          };
        }
      }
    }

    this.dispatch(setCurrentRoundNets(updatedNets));
    this.dispatch(setNets(updatedAllNets));

    const roundNetAssign: IRoomNetType[] = updatedNets.map((net) => ({
      _id: net._id,
      netType: net.netType,
    }));
    actionData.nets = roundNetAssign;

    if (this.socket)
      this.socket.emit("update-tie-breaker-from-client", actionData);
  }

  // Helper functions
  private isAuthorized(userInfo: IUser): boolean {
    this.isAuthenticated = false;
    return [
      UserRole.admin,
      UserRole.director,
      UserRole.captain,
      UserRole.co_captain,
    ].includes(userInfo.role);
  }

  private isTeamValid(teamA: ITeam, teamB: ITeam): boolean {
    this.isValidTeam = !!(
      teamA &&
      teamB &&
      (teamA.captain || teamA.cocaptain) &&
      (teamB.captain || teamB.cocaptain)
    );
    return this.isValidTeam;
  }

  private async getTeamId(
    userInfo: IUser | null,
    teamA: ITeam,
    teamB: ITeam
  ): Promise<string | null> {
    // Default team, team B
    if (!userInfo) return null;

    // Check captain or co captain or team A
    if (
      (teamA.captain && userInfo.captainplayer === teamA.captain._id) ||
      (teamA.cocaptain && userInfo.cocaptainplayer === teamA.cocaptain._id)
    ) {
      this.teamIdStr = teamA._id;
      return teamA._id;
    }

    // Check captain or co captain or team B
    if (
      (teamB.captain && userInfo.captainplayer === teamB.captain._id) ||
      (teamB.cocaptain && userInfo.cocaptainplayer === teamB.cocaptain._id)
    ) {
      this.teamIdStr = teamB._id;
      return teamB._id;
    }

    // Check team Id from local storage
    if (
      userInfo.role === UserRole.admin ||
      userInfo.role === UserRole.director
    ) {
      const teamId = await LocalStorageService.getLocalTeam();
      this.teamIdStr = teamId;
      return teamId === ETeam.teamA ? teamA._id : teamB._id;
    }

    return null;
  }

  private updateRoundList(
    currRound: IRoundRelatives,
    roundList: IRoundRelatives[],
    actionData: any
  ) {
    const roundIndex = roundList.findIndex((r) => r._id === currRound._id);
    if (roundIndex === -1) return;
    const updatedRound = {
      ...roundList[roundIndex],
      teamAProcess: actionData.teamAProcess,
      teamBProcess: actionData.teamBProcess,
    };
    this.dispatch(
      setRoundList([
        ...roundList.filter((r) => r._id !== currRound._id),
        updatedRound,
      ])
    );
    this.dispatch(setCurrentRound(updatedRound));
  }

  private prepareLineupActionData(
    eventId: string,
    user: IUserContext,
    teamA: ITeam,
    teamB: ITeam,
    currRoom: IRoom,
    currRound: IRoundRelatives,
    currRoundNets: INetRelatives[],
    myTeamE: ETeam
  ): ISubmitLineupAction {
    const lineupData: ISubmitLineupAction = {
      room: currRoom?._id ?? null,
      eventId,
      round: currRound?._id ?? null,
      match: currRoom?.match,
      teamAProcess:
        myTeamE === ETeam.teamA
          ? EActionProcess.LINEUP
          : currRound?.teamAProcess,
      teamBProcess:
        myTeamE === ETeam.teamB
          ? EActionProcess.LINEUP
          : currRound?.teamBProcess,
      teamAId: teamA?._id ?? "NO_ID_FOUND",
      teamBId: teamB?._id ?? "NO_ID_FOUND",
      subbedPlayers: [],
      nets: this.getRoomNetAssignments(currRoundNets, myTeamE),
      teamE: myTeamE,
      userRole: user?.info?.role ?? UserRole.public,
      userId: user?.info?._id,
    };
    return lineupData;
  }

  private getRoomNetAssignments(
    currRoundNets: INetRelatives[],
    myTeamE: ETeam
  ): IRoomNetAssign[] {
    this.roomNetAssign = true;
    console.log({ myTeamE });

    return currRoundNets.map((net) => ({
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA,
      teamAPlayerB: net.teamAPlayerB,
      teamBPlayerA: net.teamBPlayerA,
      teamBPlayerB: net.teamBPlayerB,
    }));
  }

  private getSubbedPlayers(
    myPlayerIds: string[],
    currRound: IRoundRelatives | null,
    selectedPlayers: Set<string>
  ): string[] {
    this.hasSubbedPlayers = true;
    const subsOrRound = currRound?.subs
      ? [...currRound.subs, ...selectedPlayers]
      : [];
    return [
      ...new Set([...myPlayerIds.filter((id) => !subsOrRound.includes(id))]),
    ];
  }

  private updateRoundWithLineup(
    currRound: IRoundRelatives | null,
    roundList: IRoundRelatives[],
    actionData: ISubmitLineupAction
  ) {
    const roundIndex = roundList.findIndex((r) => r._id === currRound?._id);
    if (roundIndex === -1) return;

    const updatedRound: IRoundRelatives = {
      ...roundList[roundIndex],
      // @ts-ignore
      teamAProcess: actionData.teamAProcess,
      // @ts-ignore
      teamBProcess: actionData.teamBProcess,
      subs: actionData.subbedPlayers,
    };

    const newRoundList = [
      { ...updatedRound, subs: actionData.subbedPlayers },
      ...roundList.filter((r) => r._id !== currRound?._id),
    ];
    this.dispatch(setRoundList(newRoundList));
    this.dispatch(setCurrentRound(updatedRound));
    this.dispatch(setVerifyLineup(false));
  }

  /**
   * Score keeper events to emit
   */
  setServerReceiver({
    dispatch,
    currRoom,
    currRound,
    currMatch,
    currRoundNets,
    currNetNum,
    server,
    receiver,
    accessCode,
  }: ISetServerReceiverChange) {
    if (!currNetNum) {
      return dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Please select a net before proceeding.",
        })
      );
    }

    const currNet = currRoundNets.find((n) => n.num === currNetNum);
    if (!currNet) {
      return dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Selected net not found. Try refreshing the page.",
        })
      );
    }

    if (!server || !receiver) {
      return dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Both server and receiver must be selected to continue.",
        })
      );
    }

    if (!currRoom || !currRound) {
      return dispatch(
        setMessage({
          type: EMessage.ERROR,
          message:
            "No active round or room found. Please refresh and try again.",
        })
      );
    }

    if (!accessCode) {
      return dispatch(
        setMessage({
          type: EMessage.ERROR,
          message:
            "Access denied. You must have a valid access code for this match.",
        })
      );
    }

    // Set server position
    const actionData: ISetServerReceiverDataInput = {
      match: currMatch._id,
      room: currRoom._id,
      server,
      receiver,
      round: currRound._id,
      net: currNet._id,
      accessCode: accessCode.code,
      serverPositionPair: EServerPositionPair.PAIR_A_LEFT
    };

    // Update state
    // this.updateRoundList(currRound, roundList, actionData);
    this.socket?.emit("set-players-from-client", actionData);
  }

  serviceFault({ match, net, room }: IServiceFaultInput) {
    const actionData = { match, net, room };
    this.socket?.emit("service-fault-from-client", actionData);
  }

  serverDefensiveConversion({
    match,
    net,
    room,
  }: IDefensiveConversionInput) {
    const actionData = { match, net, room };
    this.socket?.emit("server-defensive-conversion-from-client", actionData);
  }

  aceNoTouch({ match, net, room }: IAceNoTouchInput) {
    const actionData = { match, net, room };
    this.socket?.emit("ace-no-touch-from-client", actionData);
  }

  aceNoThirdTouch({ match, net, room }: IAceNoThirdTouchInput) {
    const actionData = { match, net, room };
    this.socket?.emit("ace-no-third-touch-from-client", actionData);
  }

  serverDoNotKnow({ match, net, room }: IServerDoNotKnowInput) {
    const actionData = { match, net, room };
    this.socket?.emit("server-do-not-know-from-client", actionData);
  }

  receiverDoNotKnow({ match, net, room }: IReceiverDoNotKnowInput) {
    const actionData = { match, net, room };
    this.socket?.emit("receiver-do-not-know-from-client", actionData);
  }

  receivingHittingError({
    match,
    net,
    room,
  }: IReceivingHittingErrorInput) {
    const actionData = { match, net, room };
    this.socket?.emit("receiving-hitting-error-from-client", actionData);
  }

  oneTwoThreePutAway({ match, net, room }: IOneTwoThreePutAwayInput) {
    const actionData = { match, net, room };
    this.socket?.emit("one-two-three-put-away-from-client", actionData);
  }

  receiverDefensiveConversion({ match, net, room }: IRallyConversionInput) {
    const actionData = { match, net, room };
    this.socket?.emit("receiver-defensive-conversion-from-client", actionData);
  }

  updateCachePoints({ match, net, room, accessCode }: IUpdateCachePointsInput) {
    const actionData = { match, net, room, accessCode };
    // 
    this.socket?.emit("update-cache-points-from-client", actionData);
  }

  resetScores({ match, net, room, accessCode }: IResetScoreInput) {
    if (!net) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Please select a net before proceeding.",
        })
      );
    }

    if (!room) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "There is no room to send message.",
        })
      );
    }

    if (!accessCode) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message:
            "You do not have permission to do this operation. You must put a valid access code!",
        })
      );
    }

    const actionData = { match, net, room, accessCode };
    this.socket?.emit("reset-score-from-client", actionData);
  }

  revertPlay({ match, net, play, room, accessCode }: IRevertPlayInput) {
    if (!net) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "Please select a net before proceeding.",
        })
      );
    }

    if (!play) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message: "There is no room to send message.",
        })
      );
    }

    if (!accessCode) {
      return this.dispatch(
        setMessage({
          type: EMessage.ERROR,
          message:
            "You do not have permission to do this operation. You must put a valid access code!",
        })
      );
    }

    const actionData: IRevertPlayInput = { match, net, play, room, accessCode };
    this.socket?.emit("revert-play-from-client", actionData);
  }
}

export default EmitEvents;
