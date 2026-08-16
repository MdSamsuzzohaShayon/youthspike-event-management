export enum EBadgeFor {
    'TEAM' = 'TEAM',
    'PLAYER' = 'PLAYER',
}


export interface IBadge {
    _id: string;
    name: string;
    description: string;
    badgeFor: EBadgeFor,
    /** Uploaded image URL returned from the server / Cloudinary. */
    icon: string;
    event: string;
    teams: string[]
    players: string[];
}

  