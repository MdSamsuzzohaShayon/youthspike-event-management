import { EServerReceiverAction, ETeam, ITeam } from '@/types';
import React from 'react';

interface IActionHandlerProps {
  serverReceiverAction: EServerReceiverAction | null;
  setServerReceiverAction: React.Dispatch<React.SetStateAction<EServerReceiverAction | null>>;
  teamA: ITeam | null;
  teamB: ITeam | null;
  serverTeamE: null | ETeam;
}

function ActionHandler({ serverReceiverAction, setServerReceiverAction, teamA, teamB, serverTeamE }: IActionHandlerProps) {
  const handleAceNoTouch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log("The serving player Served the ball so well that the receiver couldn't even touch the ball");
    setServerReceiverAction(EServerReceiverAction.SERVER_ACE_NO_TOUCH);
  };

  const handleAceNoThirdTouch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log("The Serving player put on a serve that was touched by the receiver and set by the setter but the serve was good enough that the receiver couldn't use their third hit");
    setServerReceiverAction(EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH);
  };

  const handleReceivingHittingError = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log('The receiver during their hit did not get the ball back on the net');
    setServerReceiverAction(EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR);
  };

  // Server
  const handleDefensiveConversion = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log('The serving team got the receiving teams hit and put the ball away');
    setServerReceiverAction(EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION);
  };

  const handleServerDoNotKnow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setServerReceiverAction(EServerReceiverAction.SERVER_DO_NOT_KNOW);
  };

  const handleServiceFault = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setServerReceiverAction(EServerReceiverAction.RECEIVER_SERVICE_FAULT);
  };

  const handleOneTwoThreePutAway = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log('The serve was received, the ball was set, and the ball was put away. This is generally the most likely outcome');
    setServerReceiverAction(EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY);
  };

  const handleRallyConversion = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // console.log('The serving team got the receiving teams hit and put the ball away');
    setServerReceiverAction(EServerReceiverAction.RECEIVER_RALLEY_CONVERSION);
  };

  const handleReceiverDoNotKnow = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setServerReceiverAction(EServerReceiverAction.RECEIVER_DO_NOT_KNOW);
  };

  return (
    <div className="bottom-side border-t border-yellow-logo mt-6 flex flex-col md:flex-row justify-between items-start">
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Serving Team / {serverTeamE === ETeam.teamA ? teamA?.name : teamB?.name}</h3>
        <button className={`${serverReceiverAction === EServerReceiverAction.SERVER_ACE_NO_TOUCH ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleAceNoTouch}>
          ACE no-touch
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleAceNoThirdTouch}>
          Ace no 3rd touch
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleReceivingHittingError}>
          Receiving Hitting Error
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleDefensiveConversion}>
          Defensive Conversion
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.SERVER_DO_NOT_KNOW ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleServerDoNotKnow}>
          Don't know
        </button>
      </div>
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Receiving Team / {serverTeamE === ETeam.teamA ? teamB?.name : teamA?.name}</h3>
        <button className={`${serverReceiverAction === EServerReceiverAction.RECEIVER_SERVICE_FAULT ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleServiceFault}>
          Service Fault
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleOneTwoThreePutAway}>
          1-2-3 put away
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.RECEIVER_RALLEY_CONVERSION ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleRallyConversion}>
          rally Conversion
        </button>
        <button className={`${serverReceiverAction === EServerReceiverAction.RECEIVER_DO_NOT_KNOW ? 'btn-info' : 'btn-light'} uppercase`} onClick={handleReceiverDoNotKnow}>
          Don't know
        </button>
      </div>
    </div>
  );
}

export default ActionHandler;
