import { EServerReceiverAction, IMenuItem } from '@/types';
import { UserRole } from '@/types/user';

const userMenuList: IMenuItem[] = [
  {
    id: 1,
    imgName: 'trophy',
    text: 'Home',
    link: '/', // // Event settings
    role: [UserRole.public],
  },
  {
    id: 2,
    imgName: 'teams',
    text: 'Events',
    link: '/events',
    role: [UserRole.public],
  },
  {
    id: 3,
    imgName: 'matches-white',
    text: 'Matches',
    link: '/matches', // // Event settings
    role: [UserRole.public],
  },
  {
    id: 4,
    imgName: 'teams',
    text: 'Teams',
    link: '/teams', // // Event settings
    role: [UserRole.public],
  },
  {
    id: 5,
    imgName: 'players',
    text: 'Rosters',
    link: '/players', // // Event settings
    role: [UserRole.public],
  },
  {
    id: 6,
    imgName: 'setting',
    text: 'Settings',
    link: '/settings',
    role: [UserRole.admin, UserRole.captain, UserRole.co_captain, UserRole.director],
  },
  {
    id: 7,
    imgName: 'setting',
    text: 'Admin',
    link: '/',
    role: [UserRole.admin],
  },
];


const scoreKeeperAction = new Map<EServerReceiverAction, string>();
scoreKeeperAction.set(EServerReceiverAction.SERVER_ACE_NO_THIRD_TOUCH, "Serve not returned in 3 hits. Server scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.SERVER_ACE_NO_TOUCH, "Ace serve! No touch by receiver. Server scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.SERVER_DEFENSIVE_CONVERSION, "Rally won by server after defensive exchange. Server scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.SERVER_RECEIVING_HITTING_ERROR, "Server failed to return. Receiver scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.SERVER_DO_NOT_KNOW, "Server Does not know!");

scoreKeeperAction.set(EServerReceiverAction.RECEIVER_SERVICE_FAULT, "Server missed both serves. Receiver scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.RECEIVER_ONE_TWO_THREE_PUT_AWAY, "Serve received, set, and put away. Receiver scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.RECEIVER_RALLEY_CONVERSION, "Receiver scored with defensive touch and put away. Receiver scores; positions rotate.");
scoreKeeperAction.set(EServerReceiverAction.RECEIVER_DO_NOT_KNOW, "Receiver Does not know!");

export {
  // eslint-disable-next-line import/prefer-default-export
  userMenuList,
  // userMenuList
  scoreKeeperAction
};
