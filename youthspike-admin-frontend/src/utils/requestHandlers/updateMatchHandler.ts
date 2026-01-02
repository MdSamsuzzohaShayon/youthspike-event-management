import { IAddMatch, IError, TMatchMutationFunction, TMutationFunction } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleError } from '../handleError';
import { handleResponseCheck } from './playerHelpers';

interface IUpdateMatchHandlerProps {
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  eventId: string;
  mutateMatch: TMatchMutationFunction;
  matchId: string;
  updateMatch: Partial<IAddMatch>;
  showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
}

export async function updateMatchHandler({ setActErr, setIsLoading, eventId, mutateMatch, matchId, updateMatch, showAddMatch }: IUpdateMatchHandlerProps) {
  try {
    setIsLoading(true);

    const updateMatchObj: Record<string, any> = { ...updateMatch, event: eventId };

    // Prevent updating empty object
    if (Object.entries(updateMatchObj).length <= 1) return setIsLoading(false);

    // Remove teams field if present
    if (updateMatchObj.teams) delete updateMatchObj.teams;

    const res = await mutateMatch({ variables: { input: updateMatchObj, matchId } });
    const matchRes = res?.data?.updateMatch;

    const success = await handleResponseCheck(matchRes, setActErr);

    if (success) {
      if (showAddMatch) showAddMatch(false);
      // if (router) {
      //   router.push(`/${eventId}/matches/${ldoIdUrl || ''}`);
      // }
    }
  } catch (error: any) {
    console.log(error);
    handleError({ error, setActErr });
  } finally {
    setIsLoading(false);
  }
}
