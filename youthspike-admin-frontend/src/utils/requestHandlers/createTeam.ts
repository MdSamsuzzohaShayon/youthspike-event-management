// ------------------------------
// 🆕 Create Team
// ------------------------------

import { IBaseTeamAction, ITeamAdd } from '@/types';
import uploadTeamData from './uploadTeamData';
import { handleError } from '../handleError';
import { handleResponseCheck } from './playerHelpers';

interface ICreateTeam extends IBaseTeamAction {
  eventId: string | null;
  teamState: ITeamAdd;
  currDivision: string | null;
}

export async function createTeam({
  setActErr,
  eventId,
  teamState,
  setIsLoading,
  uploadedLogo,
  playerIdList,
  addTeam,
  mutateTeam,
  setAvailablePlayers,
  setPlayerIdList,
  currDivision,
  teamAddCB,
}: ICreateTeam): Promise<boolean> {
  let success = true;
  try {
    setIsLoading(true);

    // ✅ Validation
    if (!currDivision) {
      setActErr({ message: 'You must select a division', success: false });
      return false;
    }

    // Build input
    const input = {
      ...teamState,
      division: currDivision,
      players: playerIdList,
      event: eventId,
    };

    if (!input.captain) delete input.captain;
    delete input.logo;

    const teamObj = { input, logo: null };
    let response: any = null;

    // 🧠 Upload with logo (if any)
    response = await uploadTeamData(false, teamObj, uploadedLogo);

    // 🧠 If no logo → use GraphQL mutation
    if (!response) {
      const teamRes = await addTeam({ variables: teamObj });
      response = teamRes?.data?.createTeam;
    }

    // 🧩 Handle response
    const isSuccess = await handleResponseCheck(response, setActErr );
    if (isSuccess) {
      setAvailablePlayers((prev) => prev.filter((p) => !playerIdList.includes(p._id)));
      setPlayerIdList([]);
      if (teamAddCB && response?.data) teamAddCB(response.data);
    }
  } catch (error: any) {
    console.error(error);
    success = false;
    handleError({ error, setActErr });
  } finally {
    setIsLoading(false);
  }
  return success;
}

export default createTeam;
