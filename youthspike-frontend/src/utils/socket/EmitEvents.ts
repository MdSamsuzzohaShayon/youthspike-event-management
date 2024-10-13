import React from 'react';
import { setActErr } from '@/redux/slices/elementSlice';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { setCurrentRound, setRoundList } from '@/redux/slices/roundSlice';
import { IJoinTheRoomProps, IStatusChange, IRoomNetAssign, IRoundRelatives, IJoinData, ICheckInData, IUpdatePointData, INetRelatives } from '@/types';
import { IUser, IUserContext, UserRole } from '@/types/user';
import { EActionProcess, IRoom, ISubmitLineupAction } from '@/types/room';
import { ISubmitLineupProps, ISubmitUpdatePointsProps } from '@/types/socket';
import { ETeam, ITeam } from '@/types/team';
import { Socket } from 'socket.io-client';
import { getLocalTeam } from '../localStorage';

class EmitEvents {
  constructor(
    private socket: Socket | null,
    private dispatch: React.Dispatch<React.ReducerAction<any>>,
  ) {
    this.socket = socket;
    this.dispatch = dispatch;
  }

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
    if (!user?.info?.token) return;

    const actionData: ISubmitLineupAction = this.prepareLineupActionData(user, teamA, teamB, currRoom, currRound, currRoundNets, myTeamE);

    if (!this.isAllNetsFilled(currRoundNets, myTeamE)) {
      this.dispatch(setActErr({ success: false, message: 'Every net must have players!' }));
      return;
    }

    actionData.subbedPlayers = this.getSubbedPlayers(myPlayerIds, currRound);
    this.updateRoundWithLineup(currRound, roundList, actionData);
    this.socket?.emit('submit-lineup-from-client', actionData);
  }

  updatePoints({ currRoom, currRound, currRoundNets, myTeamE }: ISubmitUpdatePointsProps) {
    if (!currRoom || !currRound) return;

    const netPointsList = currRoundNets.map((net) => ({
      _id: net._id,
      teamAScore: net.teamAScore ?? 0,
      teamBScore: net.teamBScore ?? 0,
    }));

    const actionData: IUpdatePointData = {
      nets: netPointsList,
      room: currRoom?._id ?? 'NO_ROOM_ID_FOUND',
      round: currRound?._id ?? 'NO_ROUND_ID_FOUND',
      teamE: myTeamE,
    };

    this.socket?.emit('update-points-from-client', actionData);
  }

  private isAuthorized(userInfo: IUser): boolean {
    return [UserRole.admin, UserRole.director, UserRole.captain, UserRole.co_captain].includes(userInfo.role);
  }

  private isTeamValid(teamA: ITeam, teamB: ITeam): boolean {
    return teamA && teamB && (teamA.captain || teamA.cocaptain) && (teamB.captain || teamB.cocaptain);
  }

  private async getTeamId(userInfo: IUser, teamA: ITeam, teamB: ITeam): Promise<string | null> {
    if ((teamA.captain && userInfo.captainplayer === teamA.captain._id) || (teamA.cocaptain && userInfo.cocaptainplayer === teamA.cocaptain._id)) {
      return teamA._id;
    }
    if ((teamB.captain && userInfo.captainplayer === teamB.captain._id) || (teamB.cocaptain && userInfo.cocaptainplayer === teamB.cocaptain._id)) {
      return teamB._id;
    }
    if (userInfo.role === UserRole.admin || userInfo.role === UserRole.director) {
      const teamId = await getLocalTeam();
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
      userRole: user?.info?.role,
      userId: user?.info?._id,
    };
    return lineupData;
  }

  private getRoomNetAssignments(currRoundNets: INetRelatives[], myTeamE: ETeam): IRoomNetAssign[] {
    return currRoundNets.map((net) => ({
      _id: net._id,
      teamAPlayerA: net.teamAPlayerA,
      teamAPlayerB: net.teamAPlayerB,
      teamBPlayerA: net.teamBPlayerA,
      teamBPlayerB: net.teamBPlayerB,
    }));
  }

  private isAllNetsFilled(currRoundNets: INetRelatives[], myTeamE: ETeam): boolean {
    return currRoundNets.every((net) => {
      if (myTeamE === ETeam.teamA) return net.teamAPlayerA && net.teamAPlayerB;
      return net.teamBPlayerA && net.teamBPlayerB;
    });
  }

  private getSubbedPlayers(myPlayerIds: string[], currRound: IRoundRelatives | null): string[] {
    const subsOrRound = currRound?.subs ? [...currRound.subs] : [];
    return [...new Set([...subsOrRound, ...myPlayerIds.filter((id) => !subsOrRound.includes(id))])];
  }

  private updateRoundWithLineup(currRound: IRoundRelatives | null, roundList: IRoundRelatives[], actionData: ISubmitLineupAction) {
    const roundIndex = roundList.findIndex((r) => r._id === currRound?._id);
    if (roundIndex === -1) return;

    const updatedRound: IRoundRelatives = {
      ...roundList[roundIndex],
      teamAProcess: actionData.teamAProcess,
      teamBProcess: actionData.teamBProcess,
      subs: actionData.subbedPlayers,
    };

    const newRoundList = [{ ...updatedRound, subs: actionData.subbedPlayers }, ...roundList.filter((r) => r._id !== currRound._id)];
    this.dispatch(setRoundList(newRoundList));
    this.dispatch(setCurrentRound(updatedRound));
    this.dispatch(setVerifyLineup(false));
  }
}

export default EmitEvents;
