import { CREATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayerAdd } from '@/types/player';
import { MutationFunction } from '@apollo/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleRedirect, sendGraphQLFormData, handleResponseCheck } from './playerHelpers';
import { IError } from '@/types';

interface ICreatePlayer {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerState: IPlayerAdd;
  division?: string;
  eventId: string;
  uploadedProfile: React.RefObject<File | null>;
  addPlayer: MutationFunction;
  setPlayerState: React.Dispatch<React.SetStateAction<IPlayerAdd>>;
  initialPlayerAdd: IPlayerAdd;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  router: AppRouterInstance;
  e: React.SyntheticEvent;
  ldoIdUrl: string;
  team: string | null;
}

async function createPlayer({
  setActErr,
  setIsLoading,
  playerState,
  division,
  eventId,
  uploadedProfile,
  addPlayer,
  setPlayerState,
  initialPlayerAdd,
  setAddPlayer,
  router,
  e,
  ldoIdUrl,
  team,
}: ICreatePlayer) {
  try {
    setIsLoading(true);

    if (!division) {
      setActErr({ success: false, message: 'You must select a division!' });
      return;
    }

    const playerAddObj = { ...playerState, division, event: eventId };

    let playerRes;
    if (uploadedProfile?.current) {
      playerRes = await sendGraphQLFormData(
        CREATE_PLAYER_RAW,
        { input: playerAddObj, profile: null },
        uploadedProfile.current
      );
    } else {
      playerRes = await addPlayer({ variables: { input: playerAddObj } });
    }

    const responseData = playerRes?.data?.createPlayer;
    const success = await handleResponseCheck(responseData, setActErr);
    if (!success) return;

    if (responseData?.data) {
      await handleRedirect(router, eventId, ldoIdUrl, team);
      setPlayerState(initialPlayerAdd);
      (e.target as HTMLFormElement).reset();
      if (setAddPlayer) setAddPlayer(false);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setIsLoading(false);
  }
}

export default createPlayer;
