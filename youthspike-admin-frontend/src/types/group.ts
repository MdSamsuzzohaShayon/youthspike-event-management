import { IEvent, ITeam } from ".";
import { IDocument } from "./document";

export enum EGroupRule {
    CAN_PLAY_EACH_OTHER = 'CAN_PLAY_EACH_OTHER',
    CAN_NOT_PLAY_EACH_OTHER = 'CAN_NOT_PLAY_EACH_OTHER',
}

export interface IGroupAdd {
    name: string;
    event: string;
    active: boolean;
    division: string;
    rule: EGroupRule.CAN_PLAY_EACH_OTHER;
    teams: string[];
}

export interface IGroup extends IDocument {
    name: string;
    active: boolean;
    division: string;
    rule: EGroupRule.CAN_PLAY_EACH_OTHER;
}

export interface IGroupRelatives extends IGroup {
    teams: string[];
    event: string;
}

export interface IGroupExpRel extends IGroup {
    teams: ITeam[];
    event: IEvent;
}

