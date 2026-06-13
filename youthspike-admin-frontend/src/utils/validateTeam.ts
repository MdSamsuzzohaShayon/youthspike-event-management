import { TAddTeam } from "@/types";

function validateTeam(
    team: TAddTeam
): string | null {

    if (!team.name) {
        return 'Team name can not be empty.';
    }

    if (team.name.length > 20) {
        return 'Team name must not exceed 20 characters.';
    }

    if (team.name.length < 2) {
        return 'Team name must be longer than 2 characters.';
    }

    if (!team.division) {
        return 'Each team must have a divison.';
    }

    if (!team.events || team.events.length === 0) {
        return 'Each team must be included to an event.';
    }

    return null;
}

export default validateTeam;