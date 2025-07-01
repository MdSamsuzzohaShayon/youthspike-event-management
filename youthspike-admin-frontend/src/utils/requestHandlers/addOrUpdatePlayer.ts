import { CREATE_PLAYER_RAW, UPDATE_PLAYER_RAW } from '@/graphql/players';
import { IPlayer, IPlayerAdd } from '@/types/player';
import { BACKEND_URL } from '../keys';
import { MutationFunction } from '@apollo/client';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getTeamFromStore } from '../localStorage';
import { handleResponse } from '../handleError';
import { IError } from '@/types';
import { getCookie } from '../clientCookie';

interface IAddOrUpdatePlayer {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  playerState: IPlayerAdd;
  eventId: string | null;
  uploadedProfile: React.RefObject<File | null>;
  playerUpdate: Partial<IPlayerAdd>;
  updatePlayer: MutationFunction;
  addPlayer: MutationFunction;
  setPlayerState: React.Dispatch<React.SetStateAction<IPlayerAdd>>;
  initialPlayerAdd: IPlayerAdd;
  setAddPlayer?: React.Dispatch<React.SetStateAction<boolean>>;
  router: AppRouterInstance;
  e: React.SyntheticEvent;
  prevPlayer?: IPlayer | null;
  ldoIdUrl: string;
  division?: string;
  update?: boolean;
  refetch?: () => Promise<void>;
  team: string | null;
}

async function addOrUpdatePlayer({
  setActErr,
  setIsLoading,
  playerState,
  division,
  eventId,
  uploadedProfile,
  playerUpdate,
  prevPlayer,
  ldoIdUrl,
  updatePlayer,
  addPlayer,
  setPlayerState,
  initialPlayerAdd,
  setAddPlayer,
  router,
  e,
  update,
  refetch,
  team,
}: IAddOrUpdatePlayer) {
  
  let success = true;

  const handleRedirect = async () => {
    if (team) {
      await router.push(`/${eventId}/teams/${team}/${ldoIdUrl}`);
    } else {
      await router.push(`/${eventId}/players/${ldoIdUrl}`);
    }
  
    // Optional: router.refresh() if you really want to revalidate server data
    router.refresh();
  };

  const extractResponseData = (res: any) => update ? res?.data?.updatePlayer : res?.data?.createPlayer;

  try {
    setIsLoading(true);

    const playerAddObj = structuredClone(playerState);
    if (division === '' && !update) {
      setActErr({ success: false, message: 'You must select a division!' });
      return;
    }

    if (division) playerAddObj.division = division;
    // if (playerAddObj.rank) playerAddObj.rank = parseInt(playerAddObj.rank as any, 10);
    playerAddObj.event = eventId as string;

    let playerRes = null;

    const sendGraphQLFormData = async () => {
      const formData = new FormData();
      const mutationVariables: any = {
        input: update ? { ...playerUpdate } : playerAddObj,
        profile: null,
      };
      if (update) mutationVariables.playerId = prevPlayer?._id;

      formData.set(
        'operations',
        JSON.stringify({
          query: update ? UPDATE_PLAYER_RAW : CREATE_PLAYER_RAW,
          variables: mutationVariables,
        }),
      );
      formData.set('map', JSON.stringify({ '0': ['variables.profile'] }));
      formData.set('0', uploadedProfile.current as File);

      const token = getCookie('token');
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      return await response.json();
    };

    if (uploadedProfile?.current) {
      playerRes = await sendGraphQLFormData();
    } else {
      playerRes = update && prevPlayer?._id
        ? await updatePlayer({ variables: { input: playerUpdate, playerId: prevPlayer._id } })
        : await addPlayer({ variables: { input: playerAddObj } });
    }

    const responseData = extractResponseData(playerRes);
    success = await handleResponse({ response: responseData, setActErr });
    if (!success) return;

    if (!update && playerRes?.data?.createPlayer?.data) {
      await handleRedirect();
    } else if (update && playerRes?.data?.updatePlayer?.data) {
      if (refetch) await refetch();
    }

    const responseCode = responseData?.code;
    const isSuccessCode = responseCode >= 200 && responseCode < 300;

    if (isSuccessCode) {
      setActErr(null);
      if (!update) {
        setPlayerState(initialPlayerAdd);
        (e.target as HTMLFormElement).reset();
      }
    } else {
      setActErr({ success: false, message: responseData?.message });
    }

    if (setAddPlayer && !update) setAddPlayer(false);
    if (refetch) await refetch();

  } catch (error) {
    console.log(error);
  } finally {
    setIsLoading(false);
    if (update && success) await handleRedirect();
  }
}

export default addOrUpdatePlayer;
