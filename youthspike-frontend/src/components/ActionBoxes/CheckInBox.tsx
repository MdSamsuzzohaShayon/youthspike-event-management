import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import { EPlayerStatus, INetRelatives, IRoom } from '@/types';
import { EActionProcess } from '@/types/room';
import { ETeam, ITeam } from '@/types/team';
import React, { useMemo } from 'react';
import PointText from './PointText';
import EmitEvents from '@/utils/socket/EmitEvents';
import { useSocket } from '@/lib/SocketProvider';
import { useUser } from '@/lib/UserProvider';
import submitLineup from '@/utils/match/submitLineup';

interface IBoxProps {
  teamA: ITeam | null;
  teamB: ITeam | null;
  currRoundNets: INetRelatives[];
  currRoom: IRoom | null;
  otp: EActionProcess;
  eventId: string | null;
}

function CheckInBox({ currRoundNets, currRoom, otp, eventId, teamA, teamB }: IBoxProps) {
  const dispatch = useAppDispatch();
  const socket = useSocket();
  const user = useUser();

  const { myTeamE, myPlayers, closePSCAvailable, match: currMatch } = useAppSelector((state) => state.matches);
  const { currentRoundNets } = useAppSelector((state) => state.nets);
  const { current: currRound, roundList } = useAppSelector((state) => state.rounds);

  const isLineupFilled = useMemo(() => {
    return currentRoundNets.every(net => {
      if (myTeamE === ETeam.teamA) {
        return net.teamAPlayerA && net.teamAPlayerB;
      }
      return net.teamBPlayerA && net.teamBPlayerB;
    });
  }, [currentRoundNets, myTeamE]);

  const pointText = useMemo(() => {
    if (currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN) {
      return `Round ${currRound.num} - Player Assignments`;
    }
    if (otp === EActionProcess.LINEUP) {
      return `Round ${currRound?.num} - Player Assignments`;
    }
    if (currRound?.num === 1) {
      return 'Squad check in';
    }
    return '';
  }, [currRound, otp]);

  const boxStyle = useMemo(() => {
    if (
      (currRound?.teamAProcess === EActionProcess.CHECKIN && currRound?.teamBProcess === EActionProcess.CHECKIN && myTeamE === currRound?.firstPlacing) ||
      otp === EActionProcess.LINEUP
    ) {
      return 'box-success';
    }
    return 'box-danger';
  }, [currRound, otp, myTeamE]);

  const handleSubmitLineup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    submitLineup({ dispatch, currMatch, currRoom, myTeamE, currentRoundNets, currRound, myPlayers, roundList, closePSCAvailable, teamA, teamB });
  };

  const renderSubmitButton = () => (
    <button
      className={isLineupFilled ? 'btn-light-outline' : 'btn-light'}
      type="button"
      onClick={handleSubmitLineup}
    >
      Submit Lineup
    </button>
  );

  const renderPlacingFirst = () => (
    <div className="flex w-full justify-start items-start flex-col">
      {myTeamE === currRound?.firstPlacing ? (
        <>
          <h2 className="font-black text-start">
            PLACING your lineup. Please assign 2 players to each net and SUBMIT your lineup.
          </h2>
          {renderSubmitButton()}
        </>
      ) : (
        <h2 className="font-black text-start">Waiting for the other squad to PLACE their lineup.</h2>
      )}
    </div>
  );

  const renderContent = () => {
    if (
      currRound?.teamAProcess === EActionProcess.CHECKIN &&
      currRound?.teamBProcess === EActionProcess.CHECKIN
    ) {
      return renderPlacingFirst();
    }
    if (otp === EActionProcess.LINEUP) {
      return (
        <>
          <h2 className="font-black text-start">
            MATCHING your lineup. Please assign 2 players to each net and SUBMIT your lineup.
          </h2>
          {renderSubmitButton()}
        </>
      );
    }
    if (currRound?.num === 1) {
      return (
        <>
          <h2 className="uppercase font-black text-start">Waiting for the other squad to check in.</h2>
          <button type="button" className="btn-success">You are checked in</button>
        </>
      );
    }
    return renderPlacingFirst();
  };

  return (
    <div className={`py-2 w-full ${boxStyle}`}>
      <div className="container px-4 mx-auto flex justify-between items-center gap-1">
        <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
          <PointText txt={pointText} />
          {renderContent()}
        </div>
        <div className="hidden md:block w-2/6">
          <Image
            width={300}
            height={200}
            src="/imgs/spikeball-players.png"
            alt="spikeball-players"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}

export default CheckInBox;
