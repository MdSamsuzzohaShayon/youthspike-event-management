import { IAddMatch, IError, IMatchExpRel } from "@/types";
import { MutationFunction } from "@apollo/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { handleError, handleResponse } from "../handleError";

interface IAddMatchHandlerProps {
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    eventId: string;
    createMatch: MutationFunction;
    addMatch: IAddMatch;
    currDivision?: string;
    showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
    router?: AppRouterInstance;
    addMatchCB?: (matchData: IMatchExpRel) => void;
}

async function addMatchHandler({
    setActErr,
    setIsLoading,
    eventId,
    createMatch,
    addMatch,
    currDivision,
    showAddMatch,
    router,
    addMatchCB,
}: IAddMatchHandlerProps) {
    try {
        setIsLoading(true);

        const addMatchObj = { ...addMatch, event: eventId };
        if (currDivision && currDivision !== '') addMatchObj.division = currDivision;

        // Basic validations
        if (!addMatchObj.teamA || !addMatchObj.teamB)
            return setActErr({ code: 400, success: false, message: 'Teams cannot be empty!' });
        if (addMatchObj.teamA === addMatchObj.teamB)
            return setActErr({ code: 400, success: false, message: 'Both teams are the same!' });

        // Remove unused field
        // @ts-ignore
        if (addMatchObj.teams) delete addMatchObj.teams;

        const res = await createMatch({ variables: { input: addMatchObj } });
        const matchRes = res?.data?.createMatch;
        if (matchRes?.data && addMatchCB) addMatchCB(matchRes.data);

        const success = await handleResponse({ response: matchRes, setActErr });

        if (success) {
            if (showAddMatch) showAddMatch(false);
        }
    } catch (error: any) {
        console.log(error);
        handleError({ error, setActErr });
    } finally {
        setIsLoading(false);
    }
}

export default addMatchHandler;
