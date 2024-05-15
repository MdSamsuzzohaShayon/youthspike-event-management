import { GET_EVENT_WITH_MATCHES_TEAMS } from "@/graphql/matches";
import { IAddMatch, IError, IMatch, IMatchExpRel } from "@/types";
import { MutationFunction } from "@apollo/client";
import { Router } from "next/router";
import React from "react";

interface IAddOrUpdateMatchProps {
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    eventId: string;
    mutateMatch: MutationFunction;
    createMatch: MutationFunction;
    addMatch: IAddMatch;
    setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
    updateMatch: Partial<IAddMatch>;
    currDivision?: string;
    matchId?: string;
    update?: boolean;
    showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
    router?: Router;
    addMatchCB?: (matchData: IMatchExpRel) => void;
}

async function addOrUpdateMatch({ setIsLoading, eventId, mutateMatch, createMatch, matchId, addMatch, currDivision, setActErr, updateMatch, update, showAddMatch, router, addMatchCB }: IAddOrUpdateMatchProps) {
    try {
        setIsLoading(true);
        let matchRes = null;
        if (update) {
            const updateMatchObj = { ...updateMatch, event: eventId };
            if (updateMatchObj.date) {
                updateMatchObj.date = new Date(updateMatchObj.date).toISOString();
            }
            if (Object.entries(updateMatchObj).length <= 1) return setIsLoading(false); // Do not allow to update empty object
            // @ts-ignore
            if (updateMatchObj.teams) delete updateMatchObj.teams;
            matchRes = await mutateMatch({ variables: { input: updateMatchObj, matchId } });
            setActErr(null);
            // Get updated match
        } else {
            if (!currDivision || currDivision === '') return setActErr({ code: 400, success: false, message: 'You must select a division!' })
            const addMatchObj = { ...addMatch, event: eventId };
            if (currDivision) addMatchObj.division = currDivision;
            addMatchObj.date = new Date(addMatchObj.date).toISOString();
            if (addMatchObj.teamA === '' || addMatchObj.teamB === '') return setActErr({ code: 400, success: false, message: 'Teams can not be empty to unselected!' });
            if (addMatchObj.teamA === addMatchObj.teamB) return setActErr({ code: 400, success: false, message: 'Both teams are same!' })
            // @ts-ignore
            if (addMatchObj.teams) delete addMatchObj.teams;
            matchRes = await createMatch({ variables: { input: addMatchObj } });
            if (matchRes?.data?.createMatch?.data && addMatchCB) addMatchCB(matchRes?.data?.createMatch?.data);
            setActErr(null);
        }
        if (showAddMatch) showAddMatch(false);
        if(update && router){
            if(matchRes?.data?.updateMatch?.code >= 200 && matchRes?.data?.updateMatch?.code <= 299){
                router.push(`/${eventId}/matches`);
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        setIsLoading(false);
    }

}

export default addOrUpdateMatch;