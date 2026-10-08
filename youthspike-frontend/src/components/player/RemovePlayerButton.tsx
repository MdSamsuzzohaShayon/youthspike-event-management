import { ETeam, IPlayer } from "@/types";
import Image from "next/image";

interface IRemovePlayerButtonProps {
    player: IPlayer | null;
    myTeamE: ETeam;
    currentRound: any;
    closePSCAvailable: boolean;
    onRemove: (e: React.SyntheticEvent, playerId: string | null) => void;
}

/**
 * Remove/evacuate player button
 */
const RemovePlayerButton: React.FC<IRemovePlayerButtonProps> = ({
    player,
    myTeamE,
    currentRound,
    closePSCAvailable,
    onRemove,
}) => {
    const shouldShowForTeamA =
        myTeamE === ETeam.teamA && closePSCAvailable && !currentRound?.teamAScore;

    const shouldShowForTeamB =
        myTeamE === ETeam.teamB && closePSCAvailable && !currentRound?.teamBScore;

    if (!shouldShowForTeamA && !shouldShowForTeamB) {
        return null;
    }

    return (
        <div className="absolute top-1 right-1 w-4 bg-black-logo rounded-full">
            <Image
                width={12}
                height={12}
                src="/icons/close.svg"
                className="w-full h-full svg-white"
                alt="Remove player"
                role="presentation"
                onClick={(e) => onRemove(e, player?._id || null)}
            />
        </div>
    );
};


export default RemovePlayerButton;