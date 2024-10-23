/* eslint-disable react/require-default-props */
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { imgW } from '@/utils/constant';
import { overflowNetH } from '@/utils/styles';
import React, { useEffect, useState } from 'react';
import { setNotTieBreakerNetId } from '@/redux/slices/netSlice';
import { Socket } from 'socket.io-client';
import EmitEvents from '@/utils/socket/EmitEvents';
import NetBox from '../net/NetBox';

interface INotTieBreakerProps {
  ntbnId: string; // notTieBreakerNetId
  currRoundNets: INetRelatives[];
  socket: Socket | null;
  currRound: IRoundRelatives | null;
  teamA?: ITeam | null;
  teamB?: ITeam | null;
}

function NotTieBreaker({ ntbnId, currRoundNets, socket, currRound, teamA, teamB }: INotTieBreakerProps) {
  const dispatch = useAppDispatch();

  const [selectedNet, setSelectedNet] = useState<null | INetRelatives>(null);
  const { currentRoundNets, nets: allNets } = useAppSelector((state) => state.nets);
  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);

  const handleCloseLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setNotTieBreakerNetId(null));
  };

  const handleConfirmNet = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // notTwoPointNet({ socket, netId: ntbnId, currRoom, currRound, currRoundNets, dispatch, allNets });
    const emitEvents = new EmitEvents(socket, dispatch);
    emitEvents.banANet({ netId: ntbnId, currRoom, currRound, currRoundNets, allNets });
    dispatch(setNotTieBreakerNetId(null));
  };

  useEffect(() => {
    if (ntbnId && currentRoundNets && currentRoundNets.length > 0) {
      const netExist = currentRoundNets.find((n) => n._id === ntbnId);
      if (netExist) setSelectedNet(netExist);
    }
  }, [ntbnId, currentRoundNets]);

  if (!selectedNet)
    return (
      <div className="container p-4 mx-auto ">
        <h2>No net found!</h2>
      </div>
    );

  return (
    <div className="w-full z-20 overflow-y-scroll" style={{ height: `${overflowNetH}rem` }}>
      <div className="container p-4 mx-auto ">
        <Image height={imgW.logo} width={imgW.logo} alt="close-icon" src="/icons/close.svg" className="svg-black w-8 h-8 mb-4" role="presentation" onClick={handleCloseLineup} />
        <h3 className="mb-4 text-center">Not 2 Points Net</h3>
        <div className="team-box">
          <NetBox crn={selectedNet} myTeamE={ETeam.teamA} teamPlayerList={teamAPlayers} netTitle={teamA?.name} />
          <NetBox crn={selectedNet} myTeamE={ETeam.teamB} teamPlayerList={teamBPlayers} netTitle={teamB?.name} />
        </div>

        <div className="w-full flex justify-center gap-x-2">
          <button type="button" className="btn-secondary mb-4" onClick={handleConfirmNet}>
            Confirm
          </button>
          <button type="button" className="btn-danger mb-4" onClick={handleCloseLineup}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotTieBreaker;
