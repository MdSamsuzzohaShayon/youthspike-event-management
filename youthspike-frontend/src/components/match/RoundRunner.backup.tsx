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
  actionBox: IActionBox;
  process: string;
  onTop: boolean;
  team: ITeam | null | undefined;
  teamE: ETeam;
  handleAction: (e: React.SyntheticEvent, team: string | null | undefined, process: string) => void;
}


function RoundRunner({ actionBox, process, onTop, team, teamE, handleAction }: IRoundRunnerProps) {
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


  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;
    let comps: React.ReactNode[] = [];
    // Check On top
    if (user && user?.token) {
      if (user.info?.role !== UserRole.captain) {
        hasAction = true;
      } else {
        if (!onTop && user.info.captainplayer) {
          hasAction = true;
        }
      }
    }

    // Check both team checkin then show submit lineup button
    if ((currentRoom && currentRoom.teamAProcess === EActionProcess.INITIATE) || (currentRoom && currentRoom.teamBProcess === EActionProcess.INITIATE)) {
      // Check my action box or oponent actionbox
      if (onTop) {
        comps.push(<React.Fragment key="match-check-in-oponent">
          <h3>Match Check-in</h3>
          {teamE === ETeam.teamA ? (
            currentRoom.teamAProcess === EActionProcess.CHECKIN
              ? <p>{team?.name} has checked in.</p>
              : <p>{team?.name} is going to check in.</p>
          ) : (
            currentRoom.teamBProcess === EActionProcess.CHECKIN
              ? <p>{team?.name} has checked in.</p>
              : <p>{team?.name} is going to check in.</p>
          )}
        </React.Fragment >);
      } else {
        comps.push(<React.Fragment key="match-check-in-oponent">
          <h3>Match Check-in</h3>
          {!checkedIn && hasAction && <p>Ensure you have all your players and are ready to play, then checkin!</p>}
          {!hasAction && (teamE === ETeam.teamA && currentRoom.teamBProcess === EActionProcess.CHECKIN
            ? <p>{team?.name} has checked in.</p>
            : <p>{team?.name} is going to checkin.</p>)}
          {hasAction && (
            checkedIn
              ? <p>You have checked in successfully, now the other team needs to check in!</p>
              : <button className='uppercase btn-info' type="button" onClick={handleCheckIn}>Check-in</button>
          )}
        </React.Fragment >);
      }
    } else if ((currentRoom && currentRoom.teamAProcess === EActionProcess.CHECKIN) || (currentRoom && currentRoom.teamBProcess === EActionProcess.CHECKIN)) {
      // Check team is team A, that team will assign players first
      if (teamE === ETeam.teamA) {
        comps.push(<React.Fragment key="match-check-in-oponent">
          <h3>Round {currentRound?.num} Assignments</h3>
          {currentRoom.teamAProcess === EActionProcess.LINEUP
            ? <p>You have submitted your lineup successfully, now your oponent will match</p>
            : <p>You need to submit your team first and your oponent will match.</p>}
          {hasAction && (
            submittedLineup
              ? <p>You have submitted lineup, now the other team need to submit their lineup!</p>
              : <button className='uppercase btn-info' type="button" onClick={handleSubmitLineup} >Submit Lineup</button>
          )}
          <p>Your squad is waiting to match your players once the other squad has submitted their lineup.</p>
        </React.Fragment >);
      } else {
        comps.push(<React.Fragment key="match-check-in-oponent">
          <h3>Round {currentRound?.num} Assignments</h3>
          {currentRoom.teamAProcess === EActionProcess.LINEUP
            ? <p>Your oponent has submitted their lineup successfully, now you need to match!</p>
            : <p>You need to wait to match up with oponent's team until your oponent submit their lineup.</p>}
          {hasAction && (
            submittedLineup
              ? <p>You have submitted lineup, now the other team need to submit their lineup!</p>
              : <button className='uppercase btn-info' type="button" onClick={handleSubmitLineup} >Submit Lineup</button>
          )}
          <p>Your squad is waiting to match your players once the other squad has submitted their lineup.</p>
        </React.Fragment >);
      }
    } else if ((currentRoom && currentRoom.teamAProcess === EActionProcess.LINEUP) || (currentRoom && currentRoom.teamBProcess === EActionProcess.LINEUP)) {
      console.log("Submit -> and do something -> refetch data");
      // @ts-ignore
    } else if ((currentRoom && currentRoom.teamAProcess === EActionProcess.LOCKED) || (currentRoom && currentRoom.teamBProcess === EActionProcess.LOCKED)) {
      comps.push(<React.Fragment key="match-check-in-oponent">
        <h3>Locked</h3>
      </React.Fragment >);
    }

    return <React.Fragment>{comps}</React.Fragment>;
  }

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