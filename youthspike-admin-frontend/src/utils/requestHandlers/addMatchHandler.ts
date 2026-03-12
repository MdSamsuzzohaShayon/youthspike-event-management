import { IAddMatch, ICreateMatchData, IMatchExpRel, IMessage } from '@/types';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { handleError } from '../handleError';
import { handleResponseCheck } from './playerHelpers';
import { useMutation } from '@apollo/client/react';
import { ApolloCache } from '@apollo/client';

type TMutationFunction = useMutation.MutationFunction<{
    createMatch: ICreateMatchData;
}, {
    [x: string]: any;
}, ApolloCache>

interface IAddMatchHandlerProps {
  showMessage: (message: Omit<IMessage, "id">) => void;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  eventId: string;
  createMatch: TMutationFunction;
  addMatch: IAddMatch;
  currDivision?: string;
  showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
  addMatchCB?: (matchData: IMatchExpRel) => void;
}

async function addMatchHandler({ showMessage, setIsLoading, eventId, createMatch, addMatch, currDivision, showAddMatch, addMatchCB }: IAddMatchHandlerProps) {
  try {
    setIsLoading(true);

    const addMatchObj = { ...addMatch, event: eventId };
    if (currDivision && currDivision !== '') addMatchObj.division = currDivision;

    // Basic validations
    if (!addMatchObj.teamA || !addMatchObj.teamB) return showMessage({ code: 400, type: "error", message: 'Teams cannot be empty!' });
    if (addMatchObj.teamA === addMatchObj.teamB) return showMessage({ code: 400, type: "error", message: 'Both teams are the same!' });

    // Remove unused field
    // @ts-ignore
    if (addMatchObj.teams) delete addMatchObj.teams;

    const res = await createMatch({ variables: { input: addMatchObj } });
    const matchRes = res?.data?.createMatch;
    if (matchRes?.data && addMatchCB) addMatchCB(matchRes.data);

    const success = await handleResponseCheck(matchRes, showMessage);

    if (success) {
      if (showAddMatch) showAddMatch(false);
    }
  } catch (error: any) {
    console.log(error);
    handleError({ error, showMessage });
  } finally {
    setIsLoading(false);
  }
}

export default addMatchHandler;
