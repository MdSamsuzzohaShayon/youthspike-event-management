import { UserRoleFlags } from "@/types";

const LDO_ID = "ldoId";
const UNAUTHORIZED = "Unauthorized";
const PLAYER_PAGE = "PlayerPage";
const TEAM = "team";
const DIVISION = "division";
const MATCHES_LS = 'MATCHES_LS';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_SPONSOR = "/free-logo.png";
const CURRENT_EVENT = 'current_event'; // Not event of the ldo, it is the event that we are into
// const DEFAULT_CURRENT_EVENT_ID = "NEXT_PUBLIC_CURRENT_EVENT_ID";
const CURRENT_EVENT_ID = 'cei';
const MATCH_WIN_POINTS = 3;

// Constants
const USER_ROLE_DEFAULTS: UserRoleFlags = {
    isAdmin: false,
    isDirector: false,
    isPlayer: false,
    isAdminOrDirector: false,
    isCaptain: false,
    isCoCaptain: false,
};

export {
    LDO_ID,
    UNAUTHORIZED,
    PLAYER_PAGE,
    TEAM,
    DIVISION,
    MATCHES_LS,
    MAX_FILE_SIZE_BYTES,
    DEFAULT_SPONSOR,
    CURRENT_EVENT,
    CURRENT_EVENT_ID,
    MATCH_WIN_POINTS,
    USER_ROLE_DEFAULTS
};