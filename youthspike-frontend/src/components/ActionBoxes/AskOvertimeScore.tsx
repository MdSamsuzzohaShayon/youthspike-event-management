import Image from 'next/image';
import React from 'react';
import EmitEvents from '@/utils/socket/EmitEvents';
import { useAppDispatch } from '@/redux/hooks';
import { IRoom, IRoundRelatives } from '@/types';
import { useSocket } from '@/lib/SocketProvider';
import PointText from './PointText';

interface IAskOvertimeScoreProps {
  currRoom: IRoom;
  currRound: IRoundRelatives;
  completeDialogEl: React.RefObject<HTMLDialogElement | null>;
}

function AskOvertimeScore({ currRoom, currRound, completeDialogEl }: IAskOvertimeScoreProps) {
  const socket = useSocket();
  const dispatch = useAppDispatch();

  const handleOvertimeRound = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const emitEvents = new EmitEvents(socket, dispatch);
    emitEvents.extendOvertime({ currRoom, currRound });
  };

  const handleFinishMatch = (e: React.SyntheticEvent) => {
    e.preventDefault();
  };
  return (
    <div className="container px-4 mx-auto flex py-2 w-full justify-between items-center gap-1 box-success">
      <div className="w-full md:w-4/6 flex flex-col justify-start items-start">
        <PointText txt="Match tied!" />
        <h3 className="font-script">Score of both teams are same, the match is tied!</h3>
        <button className="btn-light uppercase m-2" type="button" onClick={handleOvertimeRound}>
          Overtime round
        </button>
        <button className="btn-light uppercase m-2" type="button" onClick={() => completeDialogEl.current?.showModal()}>
          Finish match
        </button>
      </div>
      <div className="hidden md:block w-2/6">
        <Image width={300} height={300} src="/imgs/spikeball-players.png" alt="spikeball-players" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

export default AskOvertimeScore;
