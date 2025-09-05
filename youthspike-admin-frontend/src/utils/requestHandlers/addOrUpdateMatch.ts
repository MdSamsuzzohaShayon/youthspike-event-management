import { IAddMatch, IError, IMatchExpRel } from "@/types";
import { MutationFunction } from "@apollo/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import React from "react";
import { handleError, handleResponse } from "../handleError";

interface IAddOrUpdateMatchProps {
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    eventId: string;
    mutateMatch: MutationFunction;
    createMatch: MutationFunction;
    addMatch: IAddMatch;
    updateMatch: Partial<IAddMatch>;
    ldoIdUrl: string;
    currDivision?: string;
    matchId?: string;
    update?: boolean;
    showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
    router?: AppRouterInstance;
    addMatchCB?: (matchData: IMatchExpRel) => void;
}


async function addOrUpdateMatch({ setActErr, setIsLoading, eventId, mutateMatch, createMatch, matchId, addMatch, ldoIdUrl, currDivision, updateMatch, update, showAddMatch, router, addMatchCB }: IAddOrUpdateMatchProps) {
    try {
        setIsLoading(true);
        let matchRes = null;

        const dateObj = { msg: 'Creating a match - frontend!', matchId: "", date: "" }; // For debuging purpose
        if (update) {
            const updateMatchObj = { ...updateMatch, event: eventId };
            dateObj.date = updateMatchObj.date || "";
            dateObj.matchId = matchId || "";
            if (Object.entries(updateMatchObj).length <= 1) return setIsLoading(false); // Do not allow to update empty object
            // @ts-ignore
            if (updateMatchObj.teams) delete updateMatchObj.teams;
            matchRes = await mutateMatch({ variables: { input: updateMatchObj, matchId } });
            matchRes = matchRes?.data?.updateMatch;
            setActErr(null);
            // Get updated match
        } else {
            // if (!currDivision || currDivision === '') return setActErr({ code: 400, success: false, message: 'You must select a division!' });
            const addMatchObj = { ...addMatch, event: eventId };
            if (currDivision && currDivision !== '') addMatchObj.division = currDivision;
            if (addMatchObj.teamA === '' || addMatchObj.teamB === '') return setActErr({ code: 400, success: false, message: 'Teams can not be empty to unselected!' });
            if (addMatchObj.teamA === addMatchObj.teamB) return setActErr({ code: 400, success: false, message: 'Both teams are same!' });
            // @ts-ignore
            if (addMatchObj.teams) delete addMatchObj.teams;
            matchRes = await createMatch({ variables: { input: addMatchObj } });
            matchRes = matchRes?.data?.createMatch;
            const resData = matchRes?.data;
            if (resData && addMatchCB) addMatchCB(resData);
            dateObj.date = addMatchObj.date;
            dateObj.matchId = resData?._id || "";
            setActErr(null);
        }

        const success = await handleResponse({ response: matchRes, setActErr });
        // console.log({ success });

        if (success) {
            if (showAddMatch) showAddMatch(false);
            if (update && router) {
                if (matchRes?.data?.updateMatch?.code >= 200 && matchRes?.data?.updateMatch?.code <= 299) {
                    router.push(`/${eventId}/matches/${ldoIdUrl}`);
                }
            }
        }

    } catch (error: any) {
        console.log(error);
        handleError({ error, setActErr });
    } finally {
        setIsLoading(false);
    }

}

export default addOrUpdateMatch;