import { useMemo, useState } from "react";
import {
  IPlayer,
  IPlayerRank,
  ITeam,
} from "@/types";
// import { useAppSelector } from "@/redux/hooks";
import PlayerCard from "./PlayerCard";

interface IProps {
  eventId: string;
  playerList: IPlayer[];
  teamList: ITeam[];
}



function PlayerSearchList({
  eventId,
  playerList,
  teamList
}: IProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const teamMap = useMemo(() => {
    const map = new Map<string, ITeam>();
    for (const team of teamList) {
      map.set(team._id, team);
    }
    return map;
  }, [teamList]);


  return (
    <div className="playerList">
      <ul className="relative w-full">

        {playerList.map((player) => <li key={player._id} className="mb-2 flex items-center bg-gray-800 rounded-xl p-2">
          <PlayerCard key={player._id} eventId={eventId} player={player as IPlayerRank}
            team={player?.teams && player?.teams.length > 0 ? (teamMap.get(player.teams[0]) || null) : null}
            handleSelectPlayer={() => { }} isChecked={false}
            teamList={teamList} setIsLoading={setIsLoading} />
        </li>)}
      </ul>
    </div>
  );
}

export default PlayerSearchList;