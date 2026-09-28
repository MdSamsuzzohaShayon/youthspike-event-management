import { useLdoId } from "@/lib/LdoProvider";
import { ETeam, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import Link from "next/link";
import TextImg from "../elements/TextImg";

interface ITeamCardProps{
    team: ITeam; 
    teamE: ETeam; 
    teamScore: number; 
    won: boolean;
}
/** ✅ Team card reusable component - optimized with direct props */
const TeamCard = ({team, teamE, teamScore, won}: ITeamCardProps) => {
    const {ldoIdUrl} = useLdoId();
    return (
        <Link href={`/teams/${team._id}/roster/${ldoIdUrl}`} className={`flex items-center ${teamE === ETeam.teamA ? 'flex-row' : 'flex-row-reverse'} gap-1 p-1 rounded-md ${won ? 'bg-green-600/20 border border-green-500' : ''}`}>
            <div className="flex-shrink-0">
                {team?.logo ? (
                    <CldImage crop="fit" alt={team.name} width={100} height={100} className="w-12 h-12 object-contain" src={team.logo} />
                ) : (
                    <TextImg fullText={team.name} className="w-12 h-12 object-contain rounded-xl" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h5 className="text-xs font-medium text-white capitalize break-words">{team?.name}</h5>
            </div>
            <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border ${won ? 'border-green-500 bg-green-600 text-white' : 'border-gray-400 bg-white text-black'}`}>
                <span className="text-xs font-bold">
                    {/* {teamScore + penalty} */}
                    {teamScore}
                    </span>
            </div>
        </Link>
    );
}

export default TeamCard;