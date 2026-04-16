import { EAssignStrategies, IMenuItem, IOption } from "@/types/elements";
import { EEventPeriod, ERosterLock, ETieBreakingStrategy } from "@/types/event";
import { EGroupRule } from "@/types/group";

const assignStrategies: IOption[] = [
    // EAssignStrategies.AUTO, EAssignStrategies.RANDOM, EAssignStrategies.ANCHORING
    { id: 1, value: EAssignStrategies.AUTO, text: "Auto" },
    { id: 2, value: EAssignStrategies.RANDOM, text: "Random" }  ,
    { id: 3, value: EAssignStrategies.ANCHORING, text: "Anchoring" }
];
const eventPeriods = [
    // EEventPeriod.CURRENT, EEventPeriod.PAST,
    { id: 1, value: EEventPeriod.CURRENT, text: "Current" },
    { id: 2, value: EEventPeriod.PAST, text: "Past" }
];

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


export const tieBreakingRules: IOption[] = [
    // { text: "Overtime round", value: ETieBreakingStrategy.OVERTIME_ROUND }, { text: "Two Points Net", value: ETieBreakingStrategy.TWO_POINTS_NET }
    { id: 1, value: ETieBreakingStrategy.OVERTIME_ROUND, text: "Overtime round" },
    { id: 2, value: ETieBreakingStrategy.TWO_POINTS_NET, text: "Two Points Net" },
    { id: 3, value: ETieBreakingStrategy.MATCH_TIE, text: "Match Can Be Tied" }
];

const eventPaths: string[] = ['settings', 'teams', 'players', 'matches', 'account', 'events', 'admin'];


export const ruleList:IOption[] = [
    { id: 1, text: EGroupRule.CAN_PLAY_EACH_OTHER, value: EGroupRule.CAN_PLAY_EACH_OTHER },
    { id: 2, text: EGroupRule.CAN_NOT_PLAY_EACH_OTHER, value: EGroupRule.CAN_NOT_PLAY_EACH_OTHER }
]

const lockTimes: IOption[] = [
    {
        id: 1,
        value: ERosterLock.FIRST_ROSTER_SUBMIT,
        text: "First Roster Submit"
    },
    {
        id: 2,
        value: ERosterLock.PICK_A_DATE,
        text: "Pick A Date"
    },
];

const homeTeamStrategy = [{
    id: 1,
    value: "toss",
    text: "Toss"
}];

export { assignStrategies, eventPeriods, initialUserMenuList, eventPaths, lockTimes, homeTeamStrategy };