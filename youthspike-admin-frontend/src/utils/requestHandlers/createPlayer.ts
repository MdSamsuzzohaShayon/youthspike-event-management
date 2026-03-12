import { CREATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayerAdd } from '@/types/player';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IMessage, IResponse } from '@/types';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';

type IAddPlayer =  useMutation.MutationFunction<{
  createPlayer: IResponse;
}, {
  [x: string]: any;
}, ApolloCache>;

interface ICreatePlayer {
  showMessage: (message: Omit<IMessage, "id">) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerState: IPlayerAdd;
  eventId: string;
  uploadedProfile: React.RefObject<File | null>;
  addPlayer: IAddPlayer;
  division?: string;
}

async function createPlayer({
  showMessage,
  setIsLoading,
  playerState,
  division,
  eventId,
  uploadedProfile,
  addPlayer
}: ICreatePlayer) {
  try {
    setIsLoading(true);

    if (!division) {
      showMessage({ type: 'error', message: 'You must select a division!' });
      return;
    }

    const playerAddObj = { ...playerState, division, event: eventId };

    let playerRes;
    if (uploadedProfile?.current) {
      playerRes = await sendGraphQLFormData(CREATE_PLAYER_RAW, { input: playerAddObj, profile: null }, uploadedProfile.current);
    } else {
      playerRes = await addPlayer({ variables: { input: playerAddObj } });
    }

    const responseData = playerRes?.data?.createPlayer;
    const success = await handleResponseCheck(responseData, showMessage);
    return success;
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
  return false;
}

export default createPlayer;
