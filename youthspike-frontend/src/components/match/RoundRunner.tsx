import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActionBox } from '@/redux/slices/roundSlice';
import { IActionBox } from '@/types';
import { UserRole } from '@/types/user';
import { EActionProcess } from '@/types/elements';
import { ETeam, ITeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from '@/lib/SocketProvider';


interface IRoundRunnerProps {
  onTop: boolean;
  team: ITeam | null | undefined;
  teamE: ETeam;
  handleAction: (e: React.SyntheticEvent, team: string | null | undefined, process: string) => void;
}


function RoundRunner({ onTop, team, teamE, handleAction }: IRoundRunnerProps) {
  /**
   * Step-1: Both team check in -> If a team checked in show your team checked in
   * Step-2: If both team checked in start placing players to the net
   * Step-3: Submit line up one by one team
   * Step-4: If both team submit their line up the net will be locked up they can not change players on the net (All nets of the round need to be locked)
   */
  // Hooks
  const dispatch = useAppDispatch();
  const user = useUser();
  const socket = useSocket();

  // Redux State
  const currentRound = useAppSelector((state) => state.rounds.current);
  const currentRoom = useAppSelector((state) => state.rooms.current);
  const {myTeam, opTeam, opTeamE, myTeamE, myTeamProcess, opTeamProcess} = useAppSelector((state)=>state.matches);

  // Local State 
  const [checkedIn, setCheckedIn] = useState<boolean>(false);
  const [submittedLineup, setSubmittedLineup] = useState<boolean>(false);

  // console.log({ actionBox, process, onTop, team, handleAction, currentRoom });

  // @ts-ignore
  const handleCheckIn = (e: React.SyntheticEvent) => {
    handleAction(e, team?._id, EActionProcess.CHECKIN);
    setCheckedIn((prevState) => !prevState);
    // Change text of action box when this button was clicked
  }

  const handleSubmitLineup = (e: React.SyntheticEvent) => {
    handleAction(e, team?._id, EActionProcess.LINEUP);
    setSubmittedLineup((prevState) => !prevState);
  }




  const renderMatchCheckIn = (hasAction: boolean): React.ReactNode => {
    return (
      <React.Fragment key="match-check-in-opponent">
        <h3>Match Check-in</h3>
        {onTop ? (
          <p>{opTeam?.name} {currentRoom && opTeamProcess === EActionProcess.CHECKIN ? 'has checked' : 'is going to check'} in.</p>
        ) : (
          <React.Fragment>
            {!checkedIn && hasAction && <p>Ensure you have all your players and are ready to play, then check in!</p>}
            {!hasAction && (
              <p>{team?.name} {teamE === ETeam.teamA && currentRoom && myTeamProcess === EActionProcess.CHECKIN ? 'has' : 'is going to'} check in.</p>
            )}
            {hasAction && (
              checkedIn ? (
                <p>You have checked in successfully, now the other team needs to check in!</p>
              ) : (
                <button className='uppercase btn-info' type="button" onClick={handleCheckIn}>Check-in</button>
              )
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  const renderMatchLineup = (hasAction: boolean): React.ReactNode => {
    /**
     * First of all, team A is going to submit their players
     * Check if team a has submitted their players or not
     */
    return (
      <React.Fragment key="match-check-in-opponent">
        <h3>Submit Lineup</h3>
        <p>Your squad is placing players first. Choose 2 players for each and and click submit.</p>
        <p>Your squad is current waiting for the other squad to place their players.</p>
        {onTop ? (
          <p>{team?.name} {currentRoom && currentRoom.teamAProcess === EActionProcess.CHECKIN ? 'has' : 'is going to'} submit lineup.</p>
        ) : (
          <React.Fragment>
            {!submittedLineup && hasAction && <p>Ensure you have all your players and are ready to play, then check in!</p>}
            {!hasAction && (
              <p>{team?.name} {teamE === ETeam.teamA && currentRoom && currentRoom.teamBProcess === EActionProcess.CHECKIN ? 'has' : 'is going to'} check in.</p>
            )}
            {hasAction && (
              submittedLineup ? (
                <p>You have submitted your squad successfully, now the other team needs to submit their players!</p>
              ) : (
                <button className='uppercase btn-info' type="button" onClick={handleSubmitLineup}>Submit Lineup</button>
              )
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  };

  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;
    let comps: React.ReactNode[] = [];

    // Check if user has action
    if (user && user?.token && (user.info?.role !== UserRole.captain || (!onTop && user.info.captainplayer))) {
      hasAction = true;
    }


    // Check different action processes
    if (currentRoom) {
      switch (true) {
        case currentRoom.teamAProcess === EActionProcess.INITIATE || currentRoom.teamBProcess === EActionProcess.INITIATE:
          comps.push(renderMatchCheckIn(hasAction));
          break;

        case currentRoom.teamAProcess === EActionProcess.CHECKIN || currentRoom.teamBProcess === EActionProcess.CHECKIN:
          comps.push(renderMatchLineup(hasAction));
          break;

        case currentRoom.teamAProcess === EActionProcess.LINEUP || currentRoom.teamBProcess === EActionProcess.LINEUP:
          console.log("Submit -> and do something -> refetch data");
          // @ts-ignore
          break;

        case currentRoom.teamAProcess === EActionProcess.LOCKED || currentRoom.teamBProcess === EActionProcess.LOCKED:
          console.log("Will add more logic");
          break;

        default:
          break;
      }
    }

    return <React.Fragment>{comps}</React.Fragment>;
  };

  useEffect(() => {
    if (currentRound && currentRound._id && currentRound._id !== '') {
      // dispatch(setActionBox({ title: '', text: '', roundNum: currentRound.num, process }));
    }
  }, [currentRound]);

  return (
    <div className="w-full">
      <div className="container px-4 mx-auto my-4 bg-gray-900 text-gray-100 text-center">
        <div className="box w-full flex flex-col justify-center items-center py-2">
          {currentRoom && renderActionBoxes()}
        </div>
        {/* <div className="clock bg-red-700 w-full flex justify-center">
          <p className="text-gray-100">05:00</p>
        </div> */}
      </div>
    </div>
  );
}

export default RoundRunner;