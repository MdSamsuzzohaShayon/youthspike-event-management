import { EActionProcess, ETeam, IPlayer, IRoundRelatives } from "@/types";
import { CldImage } from "next-cloudinary";
import Image from "next/image";

interface IPlayerImageProps {
    player: IPlayer | null;
    onTop: boolean;
    shouldShowAddPlayer: boolean;
    onImageClick: (e: React.SyntheticEvent) => void;
    myTeamE: ETeam;
    currRound: IRoundRelatives | null;
}

/**
 * Displays player image or placeholder/add button
 */
const PlayerImage: React.FC<IPlayerImageProps> = ({
    player,
    onTop,
    shouldShowAddPlayer,
    onImageClick,
    myTeamE,
    currRound
}) => {
    // Player has profile image
    if (player?.profile) {
        return (
            <CldImage
                crop="fit"
                alt={player.firstName}
                width="200"
                height="200"
                className="w-full h-full object-top object-cover"
                src={player.profile}
                onClick={onImageClick}
            />
        );
    }


    // console.log({myTeamE, firstPlacing: currRound?.firstPlacing, tap: currRound?.teamAProcess, tbp: currRound?.teamBProcess});

    if (myTeamE !== currRound?.firstPlacing && currRound?.teamAProcess === EActionProcess.CHECKIN &&
        currRound?.teamBProcess === EActionProcess.CHECKIN) {
        return (
            <Image
                width={100}
                height={100}
                src="/empty-img.jpg"
                alt="No player"
                className="w-full h-full object-center object-cover"
                role="presentation"
            />
        );
    }

    // Show add player button
    if (!onTop && !player && shouldShowAddPlayer) {
        return (
            <div className="w-full h-full flex justify-center items-center">
                <Image
                    width={100}
                    height={100}
                    src="/icons/plus.svg"
                    alt="Add player"
                    className={`${onTop ? "svg-white" : "svg-black"
                        } w-5/6 md:h-full object-top object-cover`}
                    role="presentation"
                    onClick={onImageClick}
                />
            </div>
        );
    }

    // Empty placeholder
    return (
        <Image
            width={100}
            height={100}
            src="/empty-img.jpg"
            alt="No player"
            className="w-full h-full object-center object-cover"
            role="presentation"
        />
    );
};



export default PlayerImage;