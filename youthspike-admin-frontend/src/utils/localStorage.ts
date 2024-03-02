// Division
function setDivisionToStore(division: string) {
    window.localStorage.setItem("division", division);
}

function getDivisionFromStore(): null | string {
    const division = window.localStorage.getItem("division");
    if (division && division.trim() !== '') return division.trim().toLowerCase()
    return null;
}

function removeDivisionFromStore() {
    window.localStorage.removeItem("division");
}


// Team
function setTeamToStore(teamId: string) {
    window.localStorage.setItem("team", teamId);
}

function getTeamFromStore(): null | string {
    const teamId = window.localStorage.getItem("team");
    if (teamId && teamId.trim() !== '') return teamId;
    return null;
}

function removeTeamFromStore() {
    window.localStorage.removeItem("team");
}

export { setDivisionToStore, getDivisionFromStore, removeDivisionFromStore, setTeamToStore, getTeamFromStore, removeTeamFromStore};