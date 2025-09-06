import { UPDATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayer, IPlayerAdd } from '@/types/player';
import { MutationFunction } from '@apollo/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleRedirect, sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IError } from '@/types';

interface IUpdatePlayer {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerUpdate: Partial<IPlayerAdd>;
  prevPlayer: IPlayer | null;
  eventId: string;
  uploadedProfile: React.RefObject<File | null>;
  updatePlayer: MutationFunction;
  router: AppRouterInstance;
  ldoIdUrl: string;
  refetch?: () => Promise<void>;
  team: string | null;
}

async function updatePlayerFn({ setActErr, setIsLoading, playerUpdate, prevPlayer, eventId, uploadedProfile, updatePlayer, router, ldoIdUrl, refetch, team }: IUpdatePlayer) {
  try {
    setIsLoading(true);

    let playerRes;
    if (uploadedProfile?.current) {
      playerRes = await sendGraphQLFormData(UPDATE_PLAYER_RAW, { input: playerUpdate, profile: null, playerId: prevPlayer?._id }, uploadedProfile.current);
    } else {
      playerRes = await updatePlayer({
        variables: { input: playerUpdate, playerId: prevPlayer?._id },
      });
    }

    const responseData = playerRes?.data?.updatePlayer;
    const success = await handleResponseCheck(responseData, setActErr);
    if (!success) return;

    // if (refetch) await refetch();
    if (responseData?.data) {
      await handleRedirect(router, eventId, ldoIdUrl, team);
      // router.push(` /${eventId}/players`)
    }
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
}

export default updatePlayerFn;
