import EmitEvents from '@/utils/socket/EmitEvents';
import React from 'react';
import { Socket } from 'socket.io-client';

interface IActionHandlerProps{
  matchId: string;
  dispatch: React.Dispatch<React.ReducerAction<any>>;
  socket: Socket | null;
  server: string | null;
  receiver: string | null;
  currNet: string | null;
  room: string | null;
}

function ActionHandler({matchId, socket, dispatch, server, receiver, currNet, room}: IActionHandlerProps) {

    const handleAceNoTouch=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        // console.log("The serving player Served the ball so well that the receiver couldn't even touch the ball");
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.aceNoTouch(actionData);
        }
        
    }

    const handleAceNoThirdTouch=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The Serving player put on a serve that was touched by the receiver and set by the setter but the serve was good enough that the receiver couldn't use their third hit");
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.aceNoThirdTouch(actionData);
        }
        
    }

    const handleReceivingHittingError=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The receiver during their hit did not get the ball back on the net");
        // 
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.receivingHittingError(actionData);
        }
        
    }

    const handleDefensiveConversion=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The receiving team won the point by getting a defensive touch and put the ball away");

        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.defensiveConversion(actionData);
        }
        
    }


    const handleServerDoNotKnow=(e: React.SyntheticEvent)=>{
        e.preventDefault();
    }

    const handleServiceFault=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.serviceFault(actionData);
        }
    }

    const handleOneTwoThreePutAway=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The serve was received, the ball was set, and the ball was put away. This is generally the most likely outcome");
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.oneTwoThreePutAway(actionData);
        }
    }

    const handleRallyConversion=(e: React.SyntheticEvent)=>{
        e.preventDefault();
        console.log("The serving team got the receiving teams hit and put the ball away");
        if (receiver && currNet && room) {
          const actionData = {
            match: matchId,
            receiver,
            net: currNet,
            room
          };
          const emit = new EmitEvents(socket, dispatch);
          emit.rallyConversion(actionData);
        }
        
    }

    const handleReceiverDoNotKnow=(e: React.SyntheticEvent)=>{
        e.preventDefault();
    }

  return (
    <div className="bottom-side border-t border-yellow-logo mt-6 flex flex-col md:flex-row justify-between items-start">
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Serving Team</h3>
        <button className="btn-light uppercase" onClick={handleAceNoTouch}>ACE no-touch</button>
        <button className="btn-light uppercase" onClick={handleAceNoThirdTouch}>Ace no 3rd touch</button>
        <button className="btn-light uppercase" onClick={handleReceivingHittingError}>Receiving Hitting Error</button>
        <button className="btn-light uppercase" onClick={handleDefensiveConversion}>Defensive Conversion</button>
        <button className="btn-light uppercase" onClick={handleServerDoNotKnow} >Don't know</button>
      </div>
      <div className="w-full md:w-2/6 flex flex-col gap-y-2 mt-6">
        <h3 className="uppercase text-center">Receiving Team</h3>
        <button className="btn-light uppercase" onClick={handleServiceFault}>Service Fault</button>
        <button className="btn-light uppercase" onClick={handleOneTwoThreePutAway}>1-2-3 put away</button>
        <button className="btn-light uppercase" onClick={handleRallyConversion}>rally Conversion</button>
        <button className="btn-light uppercase" onClick={handleReceiverDoNotKnow}>Don't know</button>
      </div>
    </div>
  );
}

export default ActionHandler;
