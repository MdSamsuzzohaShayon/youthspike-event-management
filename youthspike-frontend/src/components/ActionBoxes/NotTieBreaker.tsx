/* eslint-disable react/require-default-props */
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { INetRelatives, IPlayer, IRoundRelatives } from '@/types';
import { ITeam } from '@/types/team';
import { notTwoPointNet } from '@/utils/match/emitSocketEvents';
import { overflowNetH } from '@/utils/styles';
import React, { useEffect, useState } from 'react';
import { ETeamPlayer } from '@/types/net';
import { setNotTieBreakerNetId } from '@/redux/slices/netSlice';
import { Socket } from 'socket.io-client';
import PlayerScoreCard from '../match/PlayerScoreCard';

interface INotTieBreakerProps {
  ntbnId: string; // notTieBreakerNetId
  currRoundNets: INetRelatives[];
  screenWidth: number;
  socket: Socket | null;
  currRound: IRoundRelatives | null;
  teamA?: ITeam | null;
  teamB?: ITeam | null;
}

function NotTieBreaker({ teamA, teamB, ntbnId, screenWidth, currRoundNets, socket, currRound }: INotTieBreakerProps) {
  const dispatch = useAppDispatch();

  const [selectedNet, setSelectedNet] = useState<null | INetRelatives>(null);

  const { myTeamE } = useAppSelector((state) => state.matches);
  const { currentRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);

  const handleCloseLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setNotTieBreakerNetId(null));
  };

  const handleConfirmNet = (e: React.SyntheticEvent) => {
    e.preventDefault();
    notTwoPointNet({ socket, netId: ntbnId, currRoom, currRound, currRoundNets, dispatch, allNets });
    dispatch(setNotTieBreakerNetId(null));
  };

  const idToPlayer = (playerId: string, teamPlayers: IPlayer[]) => {
    const playerExist = teamPlayers.find((p) => p._id === playerId);
    return playerExist || null;
  };

  useEffect(() => {
    if (ntbnId && currentRoundNets && currentRoundNets.length > 0) {
      const netExist = currentRoundNets.find((n) => n._id === ntbnId);
      if (netExist) setSelectedNet(netExist);
    }
  }, [ntbnId, currentRoundNets]);

  // tpa = team player a, tpb = team player b, tp = team players, t = team
  const teamBox = (tpa: string | null | undefined, tpb: string | null | undefined, pae: ETeamPlayer, pbe: ETeamPlayer, tp: IPlayer[], t: ITeam | null | undefined) => {
    const pa = tpa ? idToPlayer(tpa, tp) : null; // pa = player a
    const pb = tpb ? idToPlayer(tpb, tp) : null; // pb = player b
    const teamEl = (
      <>
        <h4 className="mb-4">{t?.name}</h4>
        <div className="team-players w-full flex justify-center items-center gap-x-8 ">
          {tpa && (
            <div className="player-a w-16">
              <PlayerScoreCard key={`tb-${teamA?.name}-player-a`} player={pa} dark={false} textTop teamPlayer={pae} screenWidth={screenWidth} myTeamE={myTeamE}/>
            </div>
          )}
          {tpb && (
            <div className="player-b w-16">
              <PlayerScoreCard key={`tb-${teamA?.name}-player-b`} player={pb} dark={false} textTop={false} teamPlayer={pbe} screenWidth={screenWidth} myTeamE={myTeamE}/>
            </div>
          )}
        </div>
        {pa && pb && pa.rank && pb.rank && <p className="mt-4">Pair Score {pa.rank + pb.rank}</p>}
      </>
    );

    return teamEl;
  };

  if (!selectedNet)
    return (
      <div className="container p-4 mx-auto ">
        <h2>No net found!</h2>
      </div>
    );

  return (
    <div className="w-full bg-white text-gray-900 z-20 overflow-y-scroll" style={{ height: `${overflowNetH}rem` }}>
      <div className="container p-4 mx-auto ">
        <img src="/icons/close.svg" className="svg-black w-8 h-8 mb-4" role="presentation" onClick={handleCloseLineup} />
        <h3 className="mb-4 text-center">Not 2 Points Net</h3>
        <div className="team-box">
          <div className="team-a text-center mb-8">{teamBox(selectedNet.teamAPlayerA, selectedNet.teamAPlayerB, ETeamPlayer.TA_PA, ETeamPlayer.TA_PB, teamAPlayers, teamA)}</div>
          <div className="team-b text-center mb-8">{teamBox(selectedNet.teamBPlayerA, selectedNet.teamBPlayerB, ETeamPlayer.TB_PA, ETeamPlayer.TB_PB, teamBPlayers, teamB)}</div>
        </div>

        <div className="w-full flex justify-center">
          <button type="button" className="btn-secondary mb-4" onClick={handleConfirmNet}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotTieBreaker;
