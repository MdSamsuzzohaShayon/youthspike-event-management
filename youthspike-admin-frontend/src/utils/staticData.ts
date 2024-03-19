import { EAssignStrategies, IMenuItem } from "@/types/elements";
import { EEventPeriod } from "@/types/event";

const assignStrategies = [EAssignStrategies.AUTO, EAssignStrategies.RANDOM, EAssignStrategies.ANCHORING];
const eventPeriods = [EEventPeriod.CURRENT, EEventPeriod.UPCOMING, EEventPeriod.PASSED,];

const initialUserMenuList: IMenuItem[] = [
    {
        id: 8,
        imgName: 'home',
        text: 'Home',
        link: '/'
    },
    {
        id: 1,
        imgName: 'setting',
        text: 'Settings',
        link: '/settings' // // Event settings
    },
    {
        id: 2,
        imgName: 'teams',
        text: 'Teams',
        link: '/teams'
    },
    {
        id: 3,
        imgName: 'players',
        text: 'Players',
        link: '/players'
    },
    {
        id: 4,
        imgName: 'trophy',
        text: 'Matches',
        link: '/matches'
    },
    {
        id: 5,
        imgName: 'account',
        text: 'Account',
        link: '/account'
    },
    {
        id: 6,
        imgName: 'account',
        text: 'Admin',
        link: '/admin'
    },
    {
        id: 7,
        imgName: 'account',
        text: 'LDO',
        link: '/admin/directors'
    },
    {
        id: 9,
        imgName: 'event',
        text: 'Tournament',
        link: `` // Redirect to Frontend
    },
];

const eventPaths: string[] = ['settings', 'teams', 'players', 'matches', 'account', 'newevent', 'admin'];

export { assignStrategies, eventPeriods, initialUserMenuList, eventPaths };