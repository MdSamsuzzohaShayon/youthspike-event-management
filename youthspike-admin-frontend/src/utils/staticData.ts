import { EAssignStrategies, IMenuItem } from "@/types/elements";
import { EEventPeriod } from "@/types/event";
import { EGroupRule } from "@/types/group";

const assignStrategies = [EAssignStrategies.AUTO, EAssignStrategies.RANDOM, EAssignStrategies.ANCHORING];
const eventPeriods = [EEventPeriod.CURRENT, EEventPeriod.PAST,];

const initialUserMenuList: IMenuItem[] = [
    // home, settings, teams, groups, players, matches, account, admin, ldo, 
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
        id: 2.5,
        imgName: 'group',
        text: 'Groups',
        link: '/groups'
    },
    {
        id: 3,
        imgName: 'players',
        text: 'roster',
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


export const ruleList = [
    EGroupRule.CAN_PLAY_EACH_OTHER, EGroupRule.CAN_NOT_PLAY_EACH_OTHER
]

export { assignStrategies, eventPeriods, initialUserMenuList, eventPaths };