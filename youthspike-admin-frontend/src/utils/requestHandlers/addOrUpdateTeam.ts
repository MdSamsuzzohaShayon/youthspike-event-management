import { ADD_TEAM_RAW, UPDATE_TEAM_RAW } from '@/graphql/teams';
import { IMessage, IPlayer, ITeam, ITeamAdd } from '@/types';
import { BACKEND_URL } from '../keys';
import { handleError, handleResponse } from '../handleError';
import { getCookie } from '../clientCookie';

interface IPrevTeam extends ITeamAdd {
  _id: string;
}

interface IAddOrUpdateTeam {
  showMessage: (message: Omit<IMessage, "id">) => void;
  eventId: string | null;
  teamState: ITeamAdd;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  uploadedLogo: React.RefObject<null | MediaSource | Blob>;
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

async function addOrUpdateTeam({
  showMessage,
  eventId,
  teamState,
  setIsLoading,
  update,
  uploadedLogo,
  prevTeam,
  updateTeamState,
  playerIdList,
  mutateTeam,
  addTeam,
  setAvailablePlayers,
  setPlayerIdList,
  currDivision,
  teamAddCB,
}: IAddOrUpdateTeam): Promise<boolean> {
  let success = true;
  try {
    // Validation
    setIsLoading(true);
    const teamObj = update && prevTeam ? { input: { ...updateTeamState }, teamId: prevTeam._id, eventId, logo: null } : { input: { ...teamState, players: playerIdList, event: eventId }, logo: null };
    if (!update) {
      if (!currDivision) {
        showMessage({ type: 'error', message: 'You must select a division' });
        return false;
      }
      const teamInput = { ...teamObj.input };
      teamInput.division = currDivision;
      teamObj.input = teamInput;
    }

    const inputObj = { ...teamObj.input };
    if (!inputObj.captain || inputObj.captain === '') delete inputObj.captain;
    delete inputObj.logo;
    teamObj.input = inputObj;

    let response = null;
    if (uploadedLogo.current instanceof Blob) {
      const formData = new FormData();
      formData.set(
        'operations',
        JSON.stringify({
          query: update ? UPDATE_TEAM_RAW : ADD_TEAM_RAW,
          variables: teamObj,
        }),
      );

      formData.set('map', JSON.stringify({ '0': ['variables.logo'] }));
      formData.set('0', uploadedLogo.current);
      const token = getCookie('token');
      // formData.forEach(function (value, key) {
      //     console.log(`${key}: ${value}`);
      // });
      const res = await fetch(BACKEND_URL, { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } });
      const jsonRes = await res.json();

      response = jsonRes?.updateTeam | jsonRes?.createTeam;
    } else {
      let teamRes = null;
      if (update) {
        teamRes = await mutateTeam({
          variables: teamObj,
        });
        response = teamRes?.data?.updateTeam;
      } else {
        teamRes = await addTeam({
          variables: teamObj,
        });
        response = teamRes?.data?.createTeam;
      }
    }

    const success = await handleResponse({response, showMessage});
    if(success){
        setAvailablePlayers((prevState) => [...prevState.filter((p) => !playerIdList.includes(p._id))]);
        setPlayerIdList([]);
    }
  } catch (error: any) {
    console.log(error);
    success = false;
    handleError({ error, showMessage });
  } finally {
    setIsLoading(false);
  }
  return success;
}

export default addOrUpdateTeam;
