import { ITeam } from "./team";
import { IDocument } from "./document";
import { IMatch } from "./match";
import { IEvent } from "./event";
import { IResponse } from "./elements";

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
    matches: string[];
}

export interface IGroup extends IDocument {
    name: string;
    active: boolean;
    division: string;
    rule: EGroupRule.CAN_PLAY_EACH_OTHER;
}

export interface IGroupRelatives extends IGroup {
    teams: string[];
    matches: string[];
    event: string;
}

export interface IGroupExpRel extends IGroup {
    teams: ITeam[];
    matches: IMatch[];
    event: IEvent;
}
export interface IGroupRes extends IResponse{
    data?: IGroupExpRel;
}

