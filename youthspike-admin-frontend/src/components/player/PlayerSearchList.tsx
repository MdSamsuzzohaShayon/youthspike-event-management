import { useMemo, useState } from "react";
import {
  IPlayer,
  IPlayerRank,
  ITeam,
} from "@/types";
// import { useAppSelector } from "@/redux/hooks";
import PlayerCard from "./PlayerCard";
import { createTeamsMap } from "@/utils/helper";

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



  const teamsOfPlayerMap = useMemo(() => createTeamsMap(teamList), [teamList]);


  return (
    <div className="playerList">
      <ul className="relative w-full">

        {playerList.map((player) => <li key={player._id} className="mb-2 flex items-center bg-gray-800 rounded-xl p-2">
          <PlayerCard key={player._id} player={player as IPlayerRank}
            teams={teamsOfPlayerMap.get(player._id) || []}
            onSelect={() => { }} isChecked={false}
            teamList={teamList} setIsLoading={setIsLoading} />
        </li>)}
      </ul>
    </div>
  );
}

export default PlayerSearchList;