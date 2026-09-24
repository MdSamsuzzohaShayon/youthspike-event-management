import InputField from '@/components/elements/InputField';
import { UPDATE_MATCH } from '@/graphql/matches';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setMatchInfo } from '@/redux/slices/matchesSlice';
import { ETeam, IMatchSettingDetail, IUpdateMatchResponse } from '@/types';
import { useMutation } from '@apollo/client/react';
import React, { useCallback, useState } from 'react';

interface ITeamPenaltyPointsProps {
    dialogSettingRef: React.RefObject<HTMLDialogElement | null>;
    matchDetails: IMatchSettingDetail;
}

function TeamPenaltyPoints({ matchDetails, dialogSettingRef }: ITeamPenaltyPointsProps) {

    const [mutateMatch, { loading }] =
        useMutation<IUpdateMatchResponse>(UPDATE_MATCH);
    const dispatch = useAppDispatch();

    const {
        match,
        myTeam,
        opTeam,
        myTeamE,
    } = useAppSelector((state) => ({
        match: state.matches.match,
        myTeam: state.matches.myTeam,
        opTeam: state.matches.opTeam,
        myTeamE: state.matches.myTeamE,
    }));

    const [updateMatchObj, setUpdateMatchObj] = useState({
        teamAP: match?.teamAP || 0,
        teamBP: match?.teamBP || 0,
    });

    const handleUpdateMatch = useCallback(
        async (e: React.SyntheticEvent) => {
            e.preventDefault();
            try {
                const input = {
                    teamAP: updateMatchObj?.teamAP || null,
                    teamBP: updateMatchObj?.teamBP || null,
                };
                const { data } = await mutateMatch({
                    variables: { input, matchId: match._id },
                });
                dialogSettingRef.current?.close();
                // Update match info
                dispatch(setMatchInfo({ ...match, ...input }));
                console.info("Update match data", data);
            } catch (error) {
                console.error(error);
            }
        },
        [match, updateMatchObj]
    );

    return (
        <form
            className="flex flex-col md:flex-row justify-between items-end gap-2 border border-yellow-500/30 rounded-xl p-4 shadow-lg"
            onSubmit={handleUpdateMatch}
        >
            <InputField
                name="teamAP"
                type="number"
                label={`${myTeamE === ETeam.teamA ? myTeam?.name : opTeam?.name
                    } penalty`}
                defaultValue={matchDetails?.teamAP}
                handleInputChange={(e) => {
                    setUpdateMatchObj((prev) => ({
                        ...prev,
                        teamAP: parseInt(e.target.value, 10),
                    }));
                }}
                className="w-full md:w-2/6"
            />
            <InputField
                name="teamBP"
                label={`${myTeamE === ETeam.teamA ? opTeam?.name : myTeam?.name
                    } penalty`}
                type="number"
                defaultValue={matchDetails?.teamBP}
                handleInputChange={(e) => {
                    setUpdateMatchObj((prev) => ({
                        ...prev,
                        teamBP: parseInt(e.target.value, 10),
                    }));
                }}
                className="w-full md:w-2/6"
            />
            <button className="btn-info w-full md:w-2/6" type="submit">
                Update
            </button>
        </form>
    )
}

export default TeamPenaltyPoints;