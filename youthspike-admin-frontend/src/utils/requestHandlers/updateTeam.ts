// ------------------------------
// ♻️ Update Team
// ------------------------------

import { IBaseTeamAction, ITeamAdd } from '@/types';
import uploadTeamData from './uploadTeamData';
import { handleError } from '../handleError';
import { handleResponseCheck } from './playerHelpers';

interface IPrevTeam extends ITeamAdd {
  _id: string;
}

interface IUpdateTeam extends IBaseTeamAction {
  eventId: string | null;
  prevTeam: IPrevTeam | null;
  updateTeamState: Partial<ITeamAdd>;
}

export async function updateTeam({
  showMessage,
  eventId,
  prevTeam,
  updateTeamState,
  setIsLoading,
  uploadedLogo,
  playerIdList,
  mutateTeam,
  addTeam,
  setAvailablePlayers,
  setPlayerIdList,
  teamAddCB,
}: IUpdateTeam): Promise<boolean> {
  let success = true;
  try {
    setIsLoading(true);

    // Build update input
    const input = { ...updateTeamState };
    if (!input.captain) delete input.captain;
    delete input.logo;

    // Ensure prevTeam is available before proceeding
    if (!prevTeam) {
      return false;
    }

    const teamObj = { input, teamId: prevTeam._id, eventId, logo: null };
    let response: any = null;

    // 🧠 Upload with logo (if any)
    response = await uploadTeamData(true, teamObj, uploadedLogo);

    // 🧠 If no logo → GraphQL mutation
    if (!response) {
      const teamRes = await mutateTeam({ variables: teamObj });
      response = teamRes?.data?.updateTeam;
    }

    // 🧩 Handle response
    const isSuccess = await handleResponseCheck(response, showMessage);
    if (isSuccess) {
      setAvailablePlayers((prev) => prev.filter((p) => !playerIdList.includes(p._id)));
      setPlayerIdList([]);
      if (teamAddCB && response?.data) teamAddCB(response.data);
    }
  } catch (error: any) {
    console.error(error);
    success = false;
    handleError({ error, showMessage });
  } finally {
    setIsLoading(false);
  }
  return success;
}


export default updateTeam;