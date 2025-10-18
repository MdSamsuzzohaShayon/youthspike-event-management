// components/event/render/EventContent.tsx

import React from "react";
import { EEventItem } from "@/types/event";
import { IMatch, IPlayer, ITeam, ITeamCaptain, IPlayerStats, INetRelatives, IRoundRelatives } from "@/types";
import PlayerStandings from "@/components/player/PlayerStandings";
import TeamList from "@/components/team/TeamList";
import MatchList from "@/components/match/MatchList";

interface EventContentProps {
  selectedItem: EEventItem;
  filteredData: {
    players: IPlayer[];
    teams: ITeamCaptain[];
    matches: IMatch[];
    matchesNoGroupFilter?: IMatch[];
    matchList: IMatch[];
  };
  playerStatsMap: Map<string, IPlayerStats[]>;
  teamMap: Map<string, ITeam>;
  selectedGroup: string | null;
  nets: INetRelatives[];
  rounds: IRoundRelatives[];
}

const EventContent: React.FC<EventContentProps> = ({
  selectedItem,
  filteredData,
  playerStatsMap,
  teamMap,
  selectedGroup,
  nets,
  rounds,
}) => {
  switch (selectedItem) {
    case EEventItem.PLAYER:
      return (
        <PlayerStandings
          playerList={filteredData.players}
          matchList={filteredData.matches}
          playerStatsMap={playerStatsMap}
          teamMap={teamMap}
        />
      );

    case EEventItem.TEAM:
      return (
        <TeamList
          teamList={filteredData.teams}
          selectedGroup={selectedGroup}
          matchList={filteredData.matchList}
          nets={nets}
          rounds={rounds}
        />
      );

    case EEventItem.MATCH:
      return (
        <MatchList
          matchList={filteredData.matches}
          nets={nets}
          rounds={rounds}
        />
      );

    default:
      return null;
  }
};

export default EventContent;
