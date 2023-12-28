import { IActionBox } from '@/types';
import { EActionProcess } from '@/types/elements';
import React from 'react';

interface IRoundRunnerProps {
  actionBox: IActionBox;
}


function RoundRunner({ actionBox }: IRoundRunnerProps) {

  const renderActionBoxes = (process: string): React.ReactNode => {
    let title = null, desc = null, extra = null;
    let buttons: React.ReactNode[] = [];
    switch (process) {
      case EActionProcess.INITIATE_OPONENT.toString():
        title = 'Match Check-in';
        desc = 'Your opponent is placing';
        break;
      case EActionProcess.INITIATE.toString():
        title = 'Match Check-in';
        desc = 'Ensure you have all your players and are ready to play, then check-in.';
        buttons.push(<button className='uppercase'>Check-in</button>);
        extra = 'Your squad will be PLACING players first.';
        break;

      case EActionProcess.CHECKIN_OPONENT.toString():
        title = 'Match Check-in';
        desc = 'Ensure you have all your players and are ready to play, then check-in.';
        buttons.push(<button className='uppercase'>Team name has checked-in</button>);
        extra = 'Team name squad will be PLACING players first.';
        break;


      default:
        break;
    }
    if (process === EActionProcess.INITIATE.toString()) {
      title = 'Match Check-in';
    }
    return <div></div>;
  }

  return (
    <div className="w-full">
      <div className="container px-4 mx-auto my-4 bg-gray-900 text-gray-100 text-center">
        <h2 className='uppercase'>{actionBox.title}</h2>
        <div className="box flex justify-between items-start py-2">
          {renderActionBoxes(actionBox.process.toString())}
        </div>
        <div className="clock bg-red-700 w-full flex justify-center">
          <p className="text-gray-100">05:00</p>
        </div>
      </div>
    </div>
  );
}

export default RoundRunner;