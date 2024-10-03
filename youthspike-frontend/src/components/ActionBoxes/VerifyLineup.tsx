import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setVerifyLineup } from '@/redux/slices/matchesSlice';
import { ETeam } from '@/types/team';
import { checkInToLineup } from '@/utils/match/emitSocketEvents';
import React from 'react';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import NetBox from '../net/NetBox';

function VerifyLineup() {
  const socket = useSocket();
  const user = useUser();
  const dispatch = useAppDispatch();

  const { teamA, teamB } = useAppSelector((state) => state.teams);
  const { myTeamE, myPlayers } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);
  const currRoom = useAppSelector((state) => state.rooms.current);
  const { teamAPlayers, teamBPlayers } = useAppSelector((state) => state.players);

  const handleCloseLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    dispatch(setVerifyLineup(false));
  };

  const handlePlayerSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    checkInToLineup({ socket, user, teamA, teamB, currRoom, currRound, currRoundNets: currentRoundNets, roundList, myPlayerIds: [...myPlayers.map((p) => p._id)], dispatch, myTeamE });
  };

  return (
    <div className="w-full bg-white text-black-logo z-20">
      <div className="container p-4 mx-auto ">
        <Image src="/icons/close.svg" alt="close icon picture" className="svg-black mb-4" role="presentation" onClick={handleCloseLineup} width={imgW.logo} height={imgW.logo} />
        <div className="w-full flex justify-start items-center flex-col">
          <h3 className="mb-4">Assigned Nets</h3>
          {currentRoundNets &&
            currentRoundNets.length > 0 &&
            currentRoundNets.map((crn) =>
              myTeamE === ETeam.teamA ? (
                <NetBox key={crn._id} crn={crn} myTeamE={myTeamE} teamPlayerList={teamAPlayers} />
              ) : (
                <NetBox key={crn._id} crn={crn} myTeamE={myTeamE} teamPlayerList={teamBPlayers} />
              ),
            )}

          <div className="buttons w-full flex justify-center items-center gap-x-2">
            <button type="button" className="btn-secondary mb-4" onClick={handlePlayerSubmit}>
              Submit
            </button>
            <button type="button" className="btn-danger mb-4" onClick={handleCloseLineup}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyLineup;
