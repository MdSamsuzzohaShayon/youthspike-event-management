import { ADD_TEAM_RAW, UPDATE_TEAM_RAW } from "@/graphql/teams";
import { IError, IPlayer, ITeam, ITeamAdd } from "@/types";
import { getCookie } from "../cookie";
import { BACKEND_URL } from "../keys";
import { MutationFunction } from "@apollo/client";

interface IPrevTeam extends ITeamAdd {
    _id: string;
}

interface IAddOrUpdateTeam {
    eventId: string | null;
    teamState: ITeamAdd;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    uploadedLogo: React.RefObject<null | File>;
    updateTeamState: any;
    playerIdList: string[];
    mutateTeam: MutationFunction;
    addTeam: MutationFunction;
    setAvailablePlayers: React.Dispatch<React.SetStateAction<IPlayer[]>>;
    setPlayerIdList: React.Dispatch<React.SetStateAction<string[]>>;
    teamAddCB?: (teamData: ITeam) => void;
    update?: boolean;
    prevTeam?: IPrevTeam;
    currDivision?: string;
}

async function addOrUpdateTeam({ eventId, teamState, setActErr, setIsLoading, update, uploadedLogo, prevTeam, updateTeamState,
    playerIdList, mutateTeam, addTeam, setAvailablePlayers, setPlayerIdList, currDivision, teamAddCB }: IAddOrUpdateTeam) {
    try {
        // Validation
        setIsLoading(true);
        const teamObj = update && prevTeam ? { input: { ...updateTeamState }, teamId: prevTeam._id, eventId, logo: null } : { input: { ...teamState, players: playerIdList, event: eventId }, logo: null };
        if (!update) {
            if (!currDivision) return setActErr({ name: "Invalid team!", message: "You must select a division" })
            const teamInput = { ...teamObj.input };
            teamInput.division = currDivision;
            teamObj.input = teamInput;
        }

        const inputObj = { ...teamObj.input };
        if (!inputObj.captain || inputObj.captain === "") delete inputObj.captain;
        delete inputObj.logo;
        teamObj.input = inputObj;

        if (uploadedLogo.current) {
            const formData = new FormData();
            formData.set('operations', JSON.stringify({
                query: update ? UPDATE_TEAM_RAW : ADD_TEAM_RAW,
                variables: teamObj,
            }));

            formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
            formData.set('0', uploadedLogo.current);
            const token = getCookie('token');
            // formData.forEach(function (value, key) {
            //     console.log(`${key}: ${value}`);
            // });
            const response = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } else {
            let teamRes = null;
            if (update) {
                teamRes = await mutateTeam({
                    variables: teamObj
                });
            } else {
                teamRes = await addTeam({
                    variables: teamObj
                });
                if (teamRes?.data?.createTeam?.data) {
                    if (teamAddCB) teamAddCB(teamRes.data.createTeam.data);
                }
            }
            setAvailablePlayers((prevState) => [...prevState.filter((p) => !playerIdList.includes(p._id))]);
            setPlayerIdList([]);
        }
        setActErr(null);

    } catch (error) {
        console.log(error);
    } finally {
        setIsLoading(false);

    }
}

export default addOrUpdateTeam;