import { useUser } from '@/lib/UserProvider';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { UserRole } from '@/types/user';
import { EActionProcess, IError } from '@/types/elements';
import { ETeam, ITeam } from '@/types/team';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSocket } from '@/lib/SocketProvider';


interface IRoundRunnerProps {
  team: ITeam | null | undefined;
  teamE: ETeam;
  handleAction: (e: React.SyntheticEvent, team: string | null | undefined, process: string) => void;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  updatePoints: (e: React.SyntheticEvent) => void;
}


function RoundRunner({ team, teamE, handleAction, setActErr, updatePoints }: IRoundRunnerProps) {
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
  const currentRoundNets = useAppSelector((state) => state.nets.currentRoundNets);
  const { myTeam, opTeam, opTeamE, myTeamE, myTeamProcess, opTeamProcess } = useAppSelector((state) => state.matches);

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
    // Check all players are assigned or not
    let isValid = true;
    if (teamE === ETeam.teamA) {
      for (const net of currentRoundNets) {
        if (!net.teamAPlayerA || !net.teamAPlayerB) isValid = false;
      }
    } else {
      for (const net of currentRoundNets) {
        if (!net.teamBPlayerA || !net.teamBPlayerB) isValid = false;
      }
    }
    if (!isValid) return setActErr({ name: 'Incomplete nets', message: "Please select players for all nets and submit again!" });

    handleAction(e, team?._id, EActionProcess.LINEUP);
    setSubmittedLineup((prevState) => !prevState);
  }




  const renderMatchCheckIn = (hasAction: boolean): React.ReactNode => {
    return (
      <React.Fragment key="match-check-in-opponent">
        <h3>Match Check-in</h3>
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
    );
  };

  const renderMatchLineup = (hasAction: boolean): React.ReactNode => {
    /**
     * First of all, team A is going to submit their players
     * Check if team a has submitted their players or not
     */
    return (
      <React.Fragment key="match-lineup-opponent">
        <h3>Submit Lineup</h3>
        {!submittedLineup && (
          teamE === ETeam.teamA
            ? (currentRoom?.teamAProcess === EActionProcess.CHECKIN
              ? <p>Your squad is placing players first. Choose 2 players for each and and click submit.</p>
              : <p>Your squad is currently waiting for the other squad to place their players.</p>)
            : (currentRoom?.teamAProcess === EActionProcess.LINEUP
              ? <p>Thhe other team have submitted their line up, now it's your turn!</p>
              : <p>Your squad is currently waiting for the other squad to place their players</p>)
        )}
        {hasAction && (
          submittedLineup ? (
            <p>You have submitted your squad successfully, now the other team needs to submit their players!</p>
          ) : (
            teamE === ETeam.teamA
              ? <button className='uppercase btn-info' type="button" onClick={handleSubmitLineup}>Submit Lineup</button>
              : currentRoom?.teamAProcess === EActionProcess.LINEUP && <button className='uppercase btn-info' type="button" onClick={handleSubmitLineup}>Submit Lineup</button>
          )
        )}
      </React.Fragment>
    );
  };

  const renderMatchLocked = (hasAction: boolean): React.ReactNode => {
    /**
     * First of all, team A is going to submit their players
     * Check if team a has submitted their players or not
     */
    return (
      <React.Fragment key="match-locked-opponent">
        <h3>Locked nets</h3>
        {hasAction
          ? <p>You have submitted all of the players to nets for this round, you can not change any players!</p>
          : <p>{team?.name} submitted all of the players to nets for this round, they can not change any players!</p>}
        {hasAction && (
          <button className='uppercase btn-info' type="button" onClick={updatePoints}>Update points</button>
        )}
      </React.Fragment>
    );
  };

  const renderActionBoxes = (): React.ReactNode => {
    let hasAction: boolean = false;
    let comps: React.ReactNode[] = [];

    // Check if user has action
    if (user && user?.token && user.info?.role === UserRole.captain) {
      hasAction = true;
    }


    // Check different action processes
    if (currentRoom) {
      // console.log({ myTeamRoomProcess: myTeamE === ETeam.teamA ? currentRoom.teamAProcess : currentRoom.teamBProcess, myTeamProcess });

      switch (myTeamProcess) {
        case EActionProcess.INITIATE:
          comps.push(renderMatchCheckIn(hasAction));
          break;

        case EActionProcess.CHECKIN:
          if (opTeamProcess === EActionProcess.CHECKIN || opTeamProcess === EActionProcess.LINEUP) {
            comps.push(renderMatchLineup(hasAction));
          } else {
            comps.push(renderMatchCheckIn(hasAction));
          }
          break;

        case EActionProcess.LINEUP:
          console.log("Submit -> and do something -> refetch data, lock data, they can no longer change their players!");
          comps.push(renderMatchLineup(hasAction));
          // @ts-ignore
          break;

        case EActionProcess.LOCKED:
          comps.push(renderMatchLocked(hasAction));
          break;

        default:
          break;
      }
    }

    return <React.Fragment>{comps}</React.Fragment>;
  };

  useEffect(() => {
    if (currentRound && currentRound._id && currentRound._id !== '' && currentRoom) {
      if (teamE === ETeam.teamA) {
        if (currentRoom.teamAProcess === EActionProcess.CHECKIN) {
          setCheckedIn(true);
        } else if (currentRoom.teamAProcess === EActionProcess.LINEUP) {
          setSubmittedLineup(true);
        }
      } else {
        if (currentRoom.teamBProcess === EActionProcess.CHECKIN) {
          setCheckedIn(true);
        } else if (currentRoom.teamBProcess === EActionProcess.LINEUP) {
          setSubmittedLineup(true);
        }
      }
      // Set submit line up or vhrvk up button action
    }
  }, [currentRoom]);

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