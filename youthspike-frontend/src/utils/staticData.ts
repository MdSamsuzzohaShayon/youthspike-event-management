import { IMenuItem } from '@/types';
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

export {
  // eslint-disable-next-line import/prefer-default-export
  userMenuList,
  // userMenuList
};
