import { useUser } from "@/lib/UserProvider";
import { useAppSelector } from "@/redux/hooks";
import { EActionProcess, ETeam, ETeamPlayer, IPlayer } from "@/types";
import { useMemo } from "react";
import PlayerImage from "./PlayerImage";

interface IPlayerScoreCardProps {
    player: IPlayer | null;
    playerRank: number;
    onTop?: boolean;
    subbedRounds?: number[];
    teamPlayer?: ETeamPlayer;
    evacuatePlayer?: (teamPlayer: ETeamPlayer, playerId: string | null) => void;
    dropdownPlayer?: (e: React.SyntheticEvent, teamPlayer: ETeamPlayer) => void;
}

const ScoreCard: React.FC<IPlayerScoreCardProps> = ({
    player,
    playerRank,
    onTop = false,
    subbedRounds,
    teamPlayer,
    evacuatePlayer,
    dropdownPlayer,
}) => {
    const user = useUser();
    const currentRoom = useAppSelector((state) => state.rooms.current);
    const currentRound = useAppSelector((state) => state.rounds.current);
    const { closePSCAvailable, myTeamE } = useAppSelector((state) => state.matches);

    const canModify = useMemo(() => {
        if (!currentRound || !user.token || !currentRoom || !evacuatePlayer) return false;

        const validProcesses = [EActionProcess.LINEUP, EActionProcess.CHECKIN];
        const isInLineupOrCheckin =
            validProcesses.includes(currentRound.teamAProcess) ||
            validProcesses.includes(currentRound.teamBProcess);

        const bothCheckin =
            currentRound.teamAProcess === EActionProcess.CHECKIN &&
            currentRound.teamBProcess === EActionProcess.CHECKIN;

        const mixedProcess =
            (currentRound.teamAProcess === EActionProcess.CHECKIN && currentRound.teamBProcess === EActionProcess.LINEUP) ||
            (currentRound.teamAProcess === EActionProcess.LINEUP && currentRound.teamBProcess === EActionProcess.CHECKIN);

        return player ? isInLineupOrCheckin : (bothCheckin || mixedProcess);
    }, [currentRound, user.token, currentRoom, evacuatePlayer, player]);

    const shouldShowRemove = useMemo(() => {
        if (!player || !closePSCAvailable) return false;
        if (myTeamE === ETeam.teamA) return !currentRound?.teamAScore;
        if (myTeamE === ETeam.teamB) return !currentRound?.teamBScore;
        return false;
    }, [player, closePSCAvailable, myTeamE, currentRound]);

    const handleDropDown = (e: React.SyntheticEvent) => {
        if (dropdownPlayer && teamPlayer) dropdownPlayer(e, teamPlayer);
    };

    const handleEvacuatePlayer = (e: React.SyntheticEvent, playerId: string | null) => {
        e.stopPropagation();
        if (evacuatePlayer && teamPlayer) evacuatePlayer(teamPlayer, playerId);
    };

    return (
        <div className="flex flex-col items-center justify-start gap-1 w-full">
            {/* Avatar Wrapper - Made Larger */}
            <div
                className={`group relative w-20 h-20 rounded-xl overflow-hidden border-2 ${onTop ? 'border-yellow-400' : 'border-gray-200'
                    } shadow-sm cursor-pointer transition-transform hover:scale-105`}
            >
                {/* Micro Rank Badge */}
                {player && (
                    <span className={`absolute top-0.5 left-0.5 z-10 px-1.5 py-0.5 rounded-md text-[9px] font-black shadow-sm ${onTop ? 'bg-yellow-400 text-black' : 'bg-gray-900 text-yellow-400'
                        }`}>
                        #{playerRank}
                    </span>
                )}

                {/* Micro Remove Button */}
                {shouldShowRemove && (
                    <button
                        type="button"
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full p-0.5 flex items-center justify-center transition-transform hover:scale-110 z-10"
                        onClick={(e) => handleEvacuatePlayer(e, player?._id || null)}
                        aria-label="Remove player"
                    >
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <PlayerImage
                    player={player}
                    shouldShowAddPlayer={canModify}
                    onImageClick={handleDropDown}
                />
            </div>

            {/* Micro Name & Subs */}
            <div className="text-center w-full px-1">
                <p className="text-[10px] font-bold text-gray-800 uppercase line-clamp-1 leading-tight">
                    {player?.firstName || 'Empty'}
                </p>
                {player?.lastName && (
                    <p className="text-[9px] text-gray-400 truncate leading-tight">{player.lastName}</p>
                )}
                {subbedRounds && subbedRounds.length > 0 && (
                    <p className="text-[8px] text-yellow-600 font-bold mt-0.5">
                        {subbedRounds.map((r, i) => `S${r}${i === subbedRounds.length - 1 ? '' : ','}`)}
                    </p>
                )}
            </div>
        </div>
    );
};


export default ScoreCard;
