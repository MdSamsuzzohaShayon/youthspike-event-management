import { useLdoId } from "@/lib/LdoProvider";
import { ETeam, IMatchExpRel, INetRelatives, IRoundRelatives, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import TextImg from "../elements/TextImg";
import scoreCalc from "@/utils/scoreCalc";

interface ITeamCardProps {
    match: IMatchExpRel;
    team: ITeam;
    allNets: INetRelatives[];
    roundList: IRoundRelatives[];
    teamType: ETeam;
}
/** ✅ Team card reusable component */
const TeamCard = ({ match, team, allNets, roundList, teamType }: ITeamCardProps) => {
    const { ldoIdUrl } = useLdoId();

    const { matchScore } = scoreCalc(match, allNets, roundList);
    const teamScore =
        teamType === ETeam.teamA
            ? matchScore.teamAScore
            : matchScore.teamBScore;
    const opponentScore =
        teamType === ETeam.teamA
            ? matchScore.teamBScore 
            : matchScore.teamAScore;
    const won = teamScore > opponentScore && match?.completed;

    return (
        <div
            className={`flex ${teamType === ETeam.teamA ? "flex-row" : "flex-row-reverse"
                } items-center gap-1 p-1 rounded-md ${won ? "bg-green-600/20 border border-green-500" : ""
                }`}
        >
            <Link
                href={`/teams/${team?._id}/roster/${ldoIdUrl}`}
                className="flex-shrink-0"
            >
                {team?.logo ? (
                    <CldImage
                        alt={team?.name || "Team logo"}
                        width={70}
                        height={70}
                        className="w-12 h-12 object-center object-cover"
                        src={team.logo}
                        crop="fit"
                    />
                ) : (
                    <TextImg
                        fullText={team?.name || "Team"}
                        className="w-12 h-12 rounded-xl"
                    />
                )}
            </Link>
            <Link
                href={`/teams/${team?._id}/roster/${ldoIdUrl}`}
                className="flex-1 min-w-0"
            >
                <h5 className="text-xs font-medium text-white capitalize word-breaks text-center">
                    {team?.name || "Unknown Team"}
                </h5>
            </Link>
            <div
                className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg border ${won
                        ? "border-green-500 bg-green-600"
                        : "border-gray-400 bg-white text-black"
                    }`}
            >
                <span className="text-xs font-bold">{teamScore} </span>
            </div>
        </div>
    );
}
    ;


export default TeamCard;