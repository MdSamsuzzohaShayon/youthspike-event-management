import React from 'react';
import { setActErr } from '@/redux/slices/elementSlice';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IJoinTheRoomProps, IStatusChange, IRoomNetAssign, IRoundRelatives, IJoinData, ICheckInData, IUpdatePointData, INetRelatives } from '@/types';
import { IUser, IUserContext, UserRole } from '@/types/user';
import { EActionProcess, IRoom, IRoomNetType, ISubmitLineupAction, ITeiBreakerAction } from '@/types/room';
import { INotTwoPointNetProps, ISubmitLineupProps, ISubmitUpdatePointsProps } from '@/types/socket';
import { ETeam, ITeam } from '@/types/team';
import { Socket } from 'socket.io-client';
import { ETieBreaker } from '@/types/net';
import { setCurrentRoundNets, setNets } from '@/redux/slices/netSlice';
import { getLocalTeam } from '../localStorage';

class EmitEvents {
  isAuthenticated: boolean;

  isValidTeam: boolean;

  teamIdStr: string | null;

  roomNetAssign: boolean;

  allNetsFilled: boolean;

  hasSubbedPlayers: boolean;

  constructor(
    private socket: Socket | null,
    private dispatch: React.Dispatch<React.ReducerAction<any>>,
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
  async joinRoom({ user, teamA, teamB, currRound, matchId }: IJoinTheRoomProps) {
    if (!this.socket || !currRound) return;
    const joinData: IJoinData = { match: matchId, round: currRound._id, userRole: UserRole.public };

    if (!teamA || !teamB || !user.token || !user.info) {
      this.socket.emit('join-room-from-client', joinData);
      return;
    }

    if (!this.isAuthorized(user.info) || !this.isTeamValid(teamA, teamB)) return;

    joinData.team = await this.getTeamId(user.info, teamA, teamB);
    if (user.info) {
      joinData.userRole = user.info.role;
      joinData.userId = user.info._id;
    }

    this.socket.emit('join-room-from-client', joinData);
  }

  checkIn({ user, currRoom, currRound, roundList, myTeamE }: IStatusChange) {
    if (!currRoom || !currRound || !user?.info) return;

    const actionData: ICheckInData = {
      room: currRoom._id,
      round: currRound._id,
      teamAProcess: myTeamE === ETeam.teamA ? EActionProcess.CHECKIN : currRound.teamAProcess,
      teamBProcess: myTeamE === ETeam.teamB ? EActionProcess.CHECKIN : currRound.teamBProcess,
      userId: user.info._id,
      userRole: user.info.role,
      teamE: myTeamE,
    };

    this.updateRoundList(currRound, roundList, actionData);
    this.socket?.emit('check-in-from-client', actionData);
  }

  submitLineup({ user, teamA, teamB, currRoom, currRound, currRoundNets, roundList, myPlayerIds, myTeamE }: ISubmitLineupProps) {
    if (!user || !user?.token || !teamA || !teamB || !currRoom || !currRound) {
      console.error({ msg: 'Not provided required value', user, token: user?.token, teamA, teamB, currRoom, currRound });
      return;
    }

    const actionData: ISubmitLineupAction = this.prepareLineupActionData(user, teamA, teamB, currRoom, currRound, currRoundNets, myTeamE);

    const selectedPlayers = new Set();
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
      this.dispatch(setActErr({ success: false, message: 'Every net must have players!' }));
      return;
    }

    actionData.subbedPlayers = this.getSubbedPlayers(myPlayerIds, currRound, selectedPlayers);
    this.updateRoundWithLineup(currRound, roundList, actionData);
    this.socket?.emit('submit-lineup-from-client', actionData);
  }

  updatePoints({ currRoom, currRound, currRoundNets, myTeamE }: ISubmitUpdatePointsProps) {
    if (!currRoom || !currRound) {
      this.dispatch(setActErr({ success: false, message: 'No room or round found!' }));
      return;
    }

    const netPointsList = currRoundNets.map((net) => ({
      _id: net._id,
      teamAScore: net.teamAScore ?? 0,
      teamBScore: net.teamBScore ?? 0,
    }));

    const actionData: IUpdatePointData = {
      nets: netPointsList,
      room: currRoom._id,
      round: currRound._id,
      teamE: myTeamE,
    };

    this.socket?.emit('update-points-from-client', actionData);
  }

  banANet({ netId, currRoom, currRound, currRoundNets, allNets }: INotTwoPointNetProps) {
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

    updatedAllNets[anI] = { ...updatedAllNets[anI], netType: ETieBreaker.FINAL_ROUND_NET_LOCKED };
    updatedNets[nI] = { ...updatedNets[nI], netType: ETieBreaker.FINAL_ROUND_NET_LOCKED };

    // ===== Create 2 Points Nets =====
    const lockedNets = updatedNets.filter((n) => n.netType === ETieBreaker.FINAL_ROUND_NET_LOCKED);
    if (lockedNets.length > 1) {
      const lnIds = lockedNets.map((n) => n._id);
      for (let i = 0; i < updatedNets.length; i += 1) {
        if (!lnIds.includes(updatedNets[i]._id) && updatedNets[i].round === currRound?._id) {
          updatedNets[i] = { ...updatedNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
        }
      }

      for (let i = 0; i < updatedAllNets.length; i += 1) {
        if (!lnIds.includes(updatedAllNets[i]._id) && updatedAllNets[i].round === currRound?._id) {
          updatedAllNets[i] = { ...updatedAllNets[i], points: 2, netType: ETieBreaker.TIE_BREAKER_NET };
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

    if (this.socket) this.socket.emit('update-net-from-client', actionData);
  }

  // Helper functions
  private isAuthorized(userInfo: IUser): boolean {
    this.isAuthenticated = false;
    return [UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain].includes(userInfo.role);
  }

  private isTeamValid(teamA: ITeam, teamB: ITeam): boolean {
    this.isValidTeam = !!(teamA && teamB && (teamA.captain || teamA.cocaptain) && (teamB.captain || teamB.cocaptain));
    return this.isValidTeam;
  }

  private async getTeamId(userInfo: IUser, teamA: ITeam, teamB: ITeam): Promise<string | null> {
    if ((teamA.captain && userInfo.captainplayer === teamA.captain._id) || (teamA.cocaptain && userInfo.cocaptainplayer === teamA.cocaptain._id)) {
      this.teamIdStr = teamA._id;
      return teamA._id;
    }
    if ((teamB.captain && userInfo.captainplayer === teamB.captain._id) || (teamB.cocaptain && userInfo.cocaptainplayer === teamB.cocaptain._id)) {
      this.teamIdStr = teamB._id;
      return teamB._id;
    }
    if (userInfo.role === UserRole.admin || userInfo.role === UserRole.director) {
      const teamId = await getLocalTeam();
      this.teamIdStr = teamId;
      return teamId === ETeam.teamA ? teamA._id : teamB._id;
    }
    return null;
  }

  private updateRoundList(currRound: IRoundRelatives, roundList: IRoundRelatives[], actionData: any) {
    const roundIndex = roundList.findIndex((r) => r._id === currRound._id);
    if (roundIndex === -1) return;
    const updatedRound = { ...roundList[roundIndex], teamAProcess: actionData.teamAProcess, teamBProcess: actionData.teamBProcess };
    this.dispatch(setRoundList([...roundList.filter((r) => r._id !== currRound._id), updatedRound]));
    this.dispatch(setCurrentRound(updatedRound));
  }

  private prepareLineupActionData(user: IUserContext, teamA: ITeam, teamB: ITeam, currRoom: IRoom, currRound: IRoundRelatives, currRoundNets: INetRelatives[], myTeamE: ETeam): ISubmitLineupAction {
    const lineupData: ISubmitLineupAction = {
      room: currRoom?._id ?? null,
      round: currRound?._id ?? null,
      match: currRoom?.match,
      teamAProcess: myTeamE === ETeam.teamA ? EActionProcess.LINEUP : currRound?.teamAProcess,
      teamBProcess: myTeamE === ETeam.teamB ? EActionProcess.LINEUP : currRound?.teamBProcess,
      teamAId: teamA?._id ?? 'NO_ID_FOUND',
      teamBId: teamB?._id ?? 'NO_ID_FOUND',
      subbedPlayers: [],
      nets: this.getRoomNetAssignments(currRoundNets, myTeamE),
      teamE: myTeamE,
      userRole: user?.info?.role ?? UserRole.public,
      userId: user?.info?._id,
    };
    return lineupData;
  }

  private getRoomNetAssignments(currRoundNets: INetRelatives[], myTeamE: ETeam): IRoomNetAssign[] {
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

  // @ts-ignore
  private getSubbedPlayers(myPlayerIds: string[], currRound: IRoundRelatives | null, selectedPlayers: Set<string, string>): string[] {
    this.hasSubbedPlayers = true;
    const subsOrRound = currRound?.subs ? [...currRound.subs, ...selectedPlayers] : [];
    // @ts-ignore
    return [...new Set([...myPlayerIds.filter((id) => !subsOrRound.includes(id))])];
  }

  private updateRoundWithLineup(currRound: IRoundRelatives | null, roundList: IRoundRelatives[], actionData: ISubmitLineupAction) {
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

    const newRoundList = [{ ...updatedRound, subs: actionData.subbedPlayers }, ...roundList.filter((r) => r._id !== currRound?._id)];
    this.dispatch(setRoundList(newRoundList));
    this.dispatch(setCurrentRound(updatedRound));
    this.dispatch(setVerifyLineup(false));
  }
}

export default EmitEvents;
