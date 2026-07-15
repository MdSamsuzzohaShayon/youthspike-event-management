export enum EEmailsenderFor {
    'TEAM' = 'TEAM',
    'EVENT' = 'EVENT',
}

export interface IEmailsender {
    _id: string;
    timestamp: string;
    sentfor: EEmailsenderFor;
    event: string;
    emailcontents: string[];
}


export interface IEmailcontent {
    subject: string;
    content: string; // email template
    player: string;
    team: string;
    emailsender: string;
    senttime?: string;
}