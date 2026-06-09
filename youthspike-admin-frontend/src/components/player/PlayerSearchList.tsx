import { useMemo, useState } from "react";
import {
  IEvent,
  IOption,
  IPlayer,
  IPlayerRank,
  ITeam,
} from "@/types";

import PlayerCard from "./PlayerCard";
import {
  createTeamsMap,
  divisionsOfEvents,
  divisionsToOptionList,
} from "@/utils/helper";

interface IProps {
  events: IEvent[];
  playerList: IPlayer[];
  teamList: ITeam[];
}

function PlayerSearchList({
  events,
  playerList,
  teamList,
}: IProps) {
  const [, setIsLoading] = useState(false);

  /**
   * Compute divisions only when events change.
   */
  const divisionList: IOption[] = useMemo(() => {
    return divisionsToOptionList(divisionsOfEvents(events));
  }, [events]);

  /**
   * Map<PlayerId, Team[]>
   */
  const teamsOfPlayerMap = useMemo(
    () => createTeamsMap(teamList),
    [teamList]
  );

  return (
    <div className="playerList">
      <ul className="relative w-full">
        {playerList.map((player) => {
          // Single Map lookup instead of multiple lookups
          const teams = teamsOfPlayerMap.get(player._id) ?? [];

          // Safely get the last team
          // temp
          const selectedTeam =
            teams.length > 0 ? teams[teams.length - 1] : undefined;

          return (
            <li
              key={player._id}
              className="mb-2 flex items-center rounded-xl bg-gray-800 p-2"
            >
              <PlayerCard
                player={player as IPlayerRank}
                teams={teams}
                selectedTeam={selectedTeam}
                divisionList={divisionList}
                teamList={teamList}
                isChecked={false}
                onSelect={() => {}}
                setIsLoading={setIsLoading}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PlayerSearchList;