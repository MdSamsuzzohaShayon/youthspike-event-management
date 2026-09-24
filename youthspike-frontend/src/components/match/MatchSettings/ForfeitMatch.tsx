import React, { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useUser } from "@/lib/UserProvider";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setMessage } from "@/redux/slices/elementSlice";
import { EMessage, IMatchRelatives, IRoundRelatives, IUpdateMatchResponse, UserRole } from "@/types";
import { UPDATE_MATCH } from "@/graphql/matches";
import Loader from "@/components/elements/Loader";
import InputField from "@/components/elements/InputField";

interface IForfeitMatchProps {
    match: IMatchRelatives;
    currRound?: IRoundRelatives | null;
}

function ForfeitMatch({ match, currRound }: IForfeitMatchProps) {
    const user = useUser();
    const dispatch = useAppDispatch();
    const [showForm, setShowForm] = useState(false);
    const [teamAScore, setTeamAScore] = useState("");
    const [teamBScore, setTeamBScore] = useState("");

    const [mutateMatch, { loading }] = useMutation<IUpdateMatchResponse>(UPDATE_MATCH);

    const {teamA, teamB} = useAppSelector((state)=> state.teams);


    // ====== Role Guard: Only admin & director can forfeit ======
    const userRole = user?.info?.role;

    if (userRole !== UserRole.admin && userRole !== UserRole.director) {
        return null;
    }

    const matchId = match?._id;
    const currRoundId = currRound?._id;

    // ====== Handlers ======
    const handleForfeitClick = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setShowForm(true);
    };

    const handleCancel = (e: React.SyntheticEvent) => {
        e.preventDefault();
        setShowForm(false);
        setTeamAScore("");
        setTeamBScore("");
    };

    const handleForfeit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        try {
            if (loading) {
                return;
            }

            const completed = true;
            const input: Record<string, any> = {
                completed,
                teamAScore: Number(teamAScore),
                teamBScore: Number(teamBScore),
            };
            if (!completed) {
                input.currRound = currRoundId;
            }

            const { data } = await mutateMatch({
                variables: { input, matchId },
            });

            // ✅ Handle GraphQL response success/failure
            if (data?.updateMatch?.success) {
                window.location.reload();
            } else {
                alert(data?.updateMatch?.message || "Failed to forfeit match.");
            }
        } catch (err) {
            console.error("Error forfeiting match:", err);
            dispatch(setMessage({ type: EMessage.ERROR, message: String(err) }));
        }
    };



    // ====== Collapsed State: Forfeit Match Button ======
    if (!showForm) {
        return (
            <div className="w-full flex justify-center">
                <button
                    onClick={handleForfeitClick}
                    aria-label="Forfeit Match"
                    className="btn-info"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M4 22V4c0-.55.45-1 1-1s1 .45 1 1v1h13c.55 0 1 .45 1 1v9c0 .55-.45 1-1 1H6v6c0 .55-.45 1-1 1s-1-.45-1-1z" />
                        </svg>
                        Forfeit Match
                    </span>
                    {/* Shimmer effect */}
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
            </div>
        );
    }

    // ====== Expanded State: Forfeit Form ======
    return (
        <div className="w-full">
            <div className="relative overflow-hidden rounded-xl border-2 border-yellow-500/30 bg-gradient-to-br from-gray-900 to-black-logo p-5 shadow-xl shadow-black/40">
                {/* Top accent line */}
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-500/60 to-transparent" />

                {/* Header */}
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-yellow-400">Forfeit Match</h3>
                        <p className="truncate text-xs text-gray-400">
                            Enter final scores for the forfeited match.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleForfeit} className="space-y-4">
                    {/* Score Inputs */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {/* Team A Score */}
                        <div className="space-y-1.5">
                            <InputField
                                name="teamAScore"
                                type="number"
                                label={teamA?.name || ''}
                                value={teamAScore || ''}
                                handleInputChange={(e: React.SyntheticEvent) => {
                                    setTeamAScore((e.target as HTMLInputElement).value);
                                }}
                                className="w-full md:w-2/6"
                            />
                        </div>

                        {/* Team B Score */}
                        <div className="space-y-1.5">
                            <InputField
                                name="teamBScore"
                                type="number"
                                label={`${teamB?.name || ''}`}
                                value={teamBScore || ''}
                                handleInputChange={(e: React.SyntheticEvent) => {
                                    setTeamBScore((e.target as HTMLInputElement).value);
                                }}
                                className="w-full md:w-2/6"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={loading}
                            aria-label="Confirm Forfeit"
                            className="btn-info"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-1.5">
                                {loading ? (
                                    <>
                                        <Loader />
                                        Forfeiting...
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Forfeit
                                    </>
                                )}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            className="btn-danger"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForfeitMatch;