export interface IBadge {
    _id: string;
    name: string;
    /** Uploaded image URL returned from the server / Cloudinary. */
    icon: string;
    event: string;
    teams: string[]
    players: string[];
}
export type TAddBadge = Omit<IBadge, '_id' | 'event' | 'teams' | 'players'>;
  