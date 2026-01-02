import { UPDATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayer, IPlayerAdd, IPlayerExpRel } from '@/types/player';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleRedirect, sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IError, IResponse } from '@/types';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';

interface IUpdatePlayerData extends IResponse{
  data?: IPlayerExpRel;
}

type TMutationFunction = useMutation.MutationFunction<
  {
    updatePlayer: IUpdatePlayerData;
  },
  {
    [x: string]: any;
  },
  ApolloCache
>;

interface IUpdatePlayer {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerUpdate: Partial<IPlayerAdd>;
  prevPlayer: IPlayer | null;
  uploadedProfile: React.RefObject<File | null>;
  updatePlayer: TMutationFunction;

}

async function updatePlayerFn({ setActErr, setIsLoading, playerUpdate, prevPlayer, uploadedProfile, updatePlayer }: IUpdatePlayer) {
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
    // if (!success) return;

    // // if (refetch) await refetch();
    // if (responseData?.data) {
    //   await handleRedirect(router, eventId, ldoIdUrl, team);
    //   // router.push(` /${eventId}/players`)
    // }
    return success;
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
  return false;
}

export default updatePlayerFn;
