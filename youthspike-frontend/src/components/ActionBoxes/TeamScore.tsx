import { ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";

interface ITeamScoreProps{
    team: ITeam | null;
    points: number;
    winningTeamId: string | null;
}
const TeamScore = ({team, points, winningTeamId}: ITeamScoreProps) => {
    const isWinner = winningTeamId === team?._id;

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {team?.logo ? (
                <div className="w-20">
                    <CldImage
                        alt={team.name}
                        width="200"
                        height="200"
                        className="w-full"
                        crop="fit"
                        src={team.logo}
                    />
                </div>
            ) : (
                <TextImg fullText={team?.name} className="w-20 h-20 rounded-lg" />
            )}

            <h2 className="text-sm font-bold uppercase">{team?.name}</h2>

            <div
                className={`w-20 h-20 rounded-lg flex items-center justify-center ${isWinner ? "bg-green-500 text-white" : "bg-white text-black"
                    }`}
            >
                <h2 className="text-4xl">{points}</h2>
            </div>
        </div>
    );
};


export default TeamScore;