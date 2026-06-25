import { useMemo, useState } from "react";
import {
  IEvent,
  IGetTeamResponse,
  IOption,
  IPlayer,
  IPlayerRank,
  IResponse,
  ITeam,
  ITeamRelatives,
  IUpdatePlayerRankingRes,
  IUpdatePlayerResponse,
  TUpdatePlayer,
  TUpdateTeam,
} from "@/types";

import PlayerCard from "./PlayerCard";
import {
  createTeamsMap,
  divisionsOfEvents,
  divisionsToOptionList,
} from "@/utils/helper";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { UPDATE_TEAM } from "@/graphql/teams";
import { DELETE_A_PLAYER, UPDATE_PLAYER } from "@/graphql/players";
import { UPDATE_PLAYER_RANKING } from "@/graphql/player-ranking";
import updateTeam from "@/utils/request-handlers/updateTeam";
import { useMessage } from "@/lib/MessageProvider";
import updatePlayer from "@/utils/request-handlers/updatePlayer";

interface IPlayerSearchListProps {
  events: IEvent[];
  playerList: IPlayer[];
  teamList: ITeam[];
  selectedEvent?: IEvent | null;
}

function PlayerSearchList({
  events,
  playerList,
  teamList,
  selectedEvent
}: IPlayerSearchListProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Hooks
  const {setMessage} = useMessage();
  
  // GraphQL
  const [mutateTeam] = useMutation<{ updateTeam: IGetTeamResponse }>(UPDATE_TEAM);
  const [mutatePlayer, { client }] = useMutation<{ updatePlayer: IUpdatePlayerResponse }>(UPDATE_PLAYER);
  const [deleteAPlayer] = useMutation<{ deletePlayer: IResponse}>(DELETE_A_PLAYER);
  const apolloClient = useApolloClient();
  


  const handleDelete = async (e: React.SyntheticEvent, playerId: string) => {
    const response = await deleteAPlayer({ variables: { playerId } });
    // console.log(response);
    window.location.reload();
  }

  
  const handleUpdateTeam = async (e: React.SyntheticEvent, updateTeamState: Partial<TUpdateTeam>) => {
    const selectedTeam: ITeamRelatives | null = null;
    await updateTeam({
      prevTeam: selectedTeam,
      updateTeamState,
      setMessage,
      setIsLoading,
      apolloClient,
      mutateTeam,
      // @ts-ignore
      events: selectedTeam ? (selectedTeam?.events.map((e: string | IEvent) => typeof e === "object" ? e._id : e) ?? []) : [],
    });
    window.location.reload();
  }


  // const handleUpdatePlayer = (e: React.SyntheticEvent, updatePlayerState: Partial<TUpdatePlayer>, playerId: string) => {
  //   const player = playerList.find((p) => p._id === playerId);
  //   updatePlayer({ mutatePlayer, playerUpdate: updatePlayerState, prevPlayer: player as IPlayer, setIsLoading, setMessage, uploadedProfile: null })
  //   window.location.reload();
  // }

  const handleUpdatePlayer = (event: React.SyntheticEvent, updatePlayerState: Partial<TUpdatePlayer>, playerId: string) => {
    event.preventDefault();
    const player = playerList.find((p) => p._id === playerId);
    if (!player) {
      setMessage({type: 'error', message: `There are no player with this ID: ${playerId}`});
      console.error(`There are no player with this ID: ${playerId}`);
      return;
    }
    updatePlayer({ mutatePlayer, playerUpdate: updatePlayerState, prevPlayer: player as IPlayer, setIsLoading, setMessage, uploadedProfile: null })
    window.location.reload();
  }

  const handleContextMenu = (e: React.SyntheticEvent) => {
    e.preventDefault(); // Prevent the default context menu from showing
  };




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
                onSelect={() => { }}
                setIsLoading={setIsLoading}
                selectedEvent={selectedEvent || null}
                onUpdateTeam={handleUpdateTeam}
                onDelete={handleDelete}
                onUpdatePlayer={handleUpdatePlayer}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PlayerSearchList;