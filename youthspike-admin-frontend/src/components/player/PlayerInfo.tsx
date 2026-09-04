import { useLdoId } from "@/lib/LdoProvider";
import routerService from "@/lib/router-service";
import { IEvent, ITeam } from "@/types";
import { CURRENT_EVENT } from "@/utils/constant";
import SessionStorageService from "@/utils/SessionStorageService";
import Link from "next/link";
import { useMemo } from "react";

interface IPlayerInfoProps {
    name: string; 
    teams: ITeam[]; 
    selectedEvent?: IEvent | null; 
}

const PlayerInfo = ({ name, teams, selectedEvent }: IPlayerInfoProps) => {
    const { ldoIdUrl } = useLdoId();

    
    const handleRedirectTeam = (e: React.SyntheticEvent, teamId: string) => {
        e.preventDefault();
        // `/teams/${team._id}/roster/${ldoIdUrl}`
        if (selectedEvent) {
            SessionStorageService.setItem(CURRENT_EVENT, selectedEvent?._id);
        }
        routerService.push(`/teams/${teamId}/roster/${ldoIdUrl}`)
    }
    
    const teamsOfPlayer = useMemo(() => {
        const list = [];
        const set = new Set();
        for (const team of teams) {
          if (!set.has(team._id)) {
            list.push(team);
            set.add(team._id);
          }
        }
        return list;
      }, [teams]);


    return (
        <div className="player-name flex flex-col w-full text-white">
            <div className="w-full md:flex-col flex flex-wrap justify-between items-center md:items-start">
                <h5 className="break-words text-xs md:text-lg font-semibold capitalize">{name}</h5>
                {teamsOfPlayer && teamsOfPlayer.length > 0 && (
                    teamsOfPlayer.map((team) => (<Link key={team._id} href="#" onClick={(e) => handleRedirectTeam(e, team._id)} className="md:hidden text-yellow-logo uppercase font-bold tracking-wide underline">
                        {team.name.slice(0, 3)}
                    </Link>))
                )}
            </div>
            {teamsOfPlayer && teamsOfPlayer.length > 0 && (
                <div className="w-full hidden md:flex justify-start gap-x-2 items-center">
                    {teamsOfPlayer.map((team) => (
                        <Link key={team._id} href={`/teams/${team._id}/roster/${ldoIdUrl}`} className="text-yellow-logo uppercase font-bold tracking-wide">
                            {team.name} {teamsOfPlayer.length > 1 && "/"}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PlayerInfo;