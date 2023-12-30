import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setActionBox } from '@/redux/slices/roundSlice';
import { IActionBox } from '@/types';
import { EActionProcess } from '@/types/elements';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';

interface IRoundRunnerProps {
  actionBox: IActionBox;
  process: string;
}


function RoundRunner({ actionBox, process }: IRoundRunnerProps) {
  const dispatch = useAppDispatch();

  const currentRound = useAppSelector((state) => state.rounds.current);

  const renderActionBoxes = (): React.ReactNode => {
    let title = null, desc = null, extra = null;
    let buttons: React.ReactNode[] = [];
    switch (process) {
      case EActionProcess.INITIATE:
        buttons.push(<>
          <h3>Match Check-in</h3>
          <p>Ensure you have all your players and are ready to play, then check-in.</p>
          <button className='uppercase btn-secondary'>Check-in</button>
          <p>Your squad will be PLACING players first.</p>
        </>);
        break;

      case EActionProcess.CHECKIN_OPONENT:
        title = 'Match Check-in';
        desc = 'Ensure you have all your players and are ready to play, then check-in.';
        buttons.push(<button className='uppercase'>Team name has checked-in</button>);
        extra = 'Team name squad will be PLACING players first.';
        break;


      default:
        break;
    }
    if (process === EActionProcess.INITIATE) {
      title = 'Match Check-in';
    }
    return <div>{buttons}</div>;
  }

  useEffect(() => {
    if (currentRound && currentRound._id && currentRound._id !== '') {
      dispatch(setActionBox({ title: '', text: '', roundNum: currentRound.num, process }));
    }
  }, [currentRound]);

  return (
    <div className="w-full">
      <div className="container px-4 mx-auto my-4 bg-gray-900 text-gray-100 text-center">
        <div className="box flex justify-between items-start py-2">
          {renderActionBoxes()}
        </div>
        {/* <div className="clock bg-red-700 w-full flex justify-center">
          <p className="text-gray-100">05:00</p>
        </div> */}
      </div>
    </div>
  );
}

export default RoundRunner;