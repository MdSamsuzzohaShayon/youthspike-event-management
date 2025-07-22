import { EServerReceiverAction } from '@/types';
import EmitEvents from '../socket/EmitEvents';
import { Socket } from 'socket.io-client';

const actionConfirmation = (
  match: string,
  socket: Socket | null,
  dispatch: React.Dispatch<React.ReducerAction<any>>,
  serverReceiverAction: EServerReceiverAction | null,
  receiver: string | null,
  net: string | null,
  room: string | null,
) => {
  const emit = new EmitEvents(socket, dispatch);
  switch (serverReceiverAction) {
    case EServerReceiverAction.SERVER_ACE_NO_TOUCH:
      if (receiver && net && room) {
        emit.aceNoTouch({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH:
      if (receiver && net && room) {
        emit.aceNoThirdTouch({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION:
      if (receiver && net && room) {
        emit.defensiveConversion({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR:
      if (receiver && net && room) {
        emit.receivingHittingError({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.SERVER_DO_NOT_KNOW:
      if (receiver && net && room) {
        emit.serverDoNotKnow({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.RECEIVER_SERVICE_FAULT:
      if (receiver && net && room) {
        emit.serviceFault({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY:
      if (receiver && net && room) {
        emit.oneTwoThreePutAway({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.RECEIVER_RALLEY_CONVERSION:
      if (receiver && net && room) {
        emit.rallyConversion({ match, receiver, net, room });
      }
      break;

    case EServerReceiverAction.RECEIVER_DO_NOT_KNOW:
      if (receiver && net && room) {
        emit.receiverDoNotKnow({ match, receiver, net, room });
      }
      break;

    default:
      console.log(`Action is unknown ${serverReceiverAction}`);
      
      break;
  }
};

export default actionConfirmation;
