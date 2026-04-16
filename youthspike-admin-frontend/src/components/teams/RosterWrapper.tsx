import { UPDATE_TEAM } from '@/graphql/teams';
import { useMessage } from '@/lib/MessageProvider';
import { EPlayerStatus, IEvent, IOption, IPlayer, IPlayerExpRel, IPlayerRankingExpRel, ITeam } from '@/types';
import React, { useCallback, useMemo, useState } from 'react';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';
import { useMutation } from '@apollo/client/react';

interface IRosterWrapperProps {
  events: IEvent[];
  team: ITeam;
  players: IPlayer[];
  playerRanking: IPlayerRankingExpRel;
  teamList: ITeam[];
}
function RosterWrapper({ events, team, players, playerRanking, teamList }: IRosterWrapperProps) {
  // Local State
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<Set<string>>(new Set());
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hooks
  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const { showMessage } = useMessage();


  // Event handlers
  const handleAddPlayersToTeam = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      try {
        await mutateTeam({
          variables: {
            input: { players: Array.from(playerIdsToAdd) },
            teamId: team._id,
            eventId: "event._id", // temp
          },
        });
        window.location.reload();
      } catch (error) {
        showMessage({ type: 'error', message: (error as Error)?.message || 'An error occurred' });
      }
    },
    [playerIdsToAdd, team, events, mutateTeam, showMessage],
  );
  const refetchFunc = useCallback(() => window.location.reload(), []);
  const handleCheckboxChange = useCallback((pId: string, isChecked: boolean) => {
    setPlayerIdsToAdd((prev) => {
      const newSet = new Set(prev);
      isChecked ? newSet.add(pId) : newSet.delete(pId);
      return newSet;
    });
  }, []);

  // Memoization
  const { activePlayers, inactivePlayers } = useMemo(() => {
    const active = [],
      inactive = [];
    for (let i = 0; i < players.length; i++) {
      const p = { ...players[i] };
      p.teams = team ? [team._id] : [];

      p.captainofteams = p.captainofteams?.length ? [String(team._id)] : [];
      p.cocaptainofteams = p.cocaptainofteams?.length ? [team._id] : [];

      const obj = { ...p } as IPlayerExpRel;

      if (obj.status === EPlayerStatus.ACTIVE) {
        active.push(obj);
      } else if (obj.status == EPlayerStatus.INACTIVE) {
        inactive.push(obj);
      }
    }

    return {
      activePlayers: active,
      inactivePlayers: inactive,
    };
  }, [players]);


  const unassignedPlayers = useMemo(() => {
    const list = [];
    for (const player of activePlayers) {
      if (!player.teams) continue;
      const teamIds = [];
      for (const t of player.teams) {
        if (typeof t === "object") {
          teamIds.push(t._id);
        }
        else {
          teamIds.push(t);
        }
      }
      if (!teamIds?.includes(team._id)) {
        list.push(player);
      }
    }
    return list;
  }, [team, activePlayers]);

  const divisionList: IOption[] = useMemo(() => {
    const divisions = divisionsOfEvents(events);
    return divisionsToOptionList(divisions);
  }, [events]) 


  if (addPlayer) {
    return (
      <div className="space-y-3">
        <SectionHeader
          title="Add Players"
          subtitle={`${activePlayers.length} available players`}
          action={
            <button
              onClick={() => setAddPlayer(false)}
              className="text-gray-400 hover:text-white text-sm font-medium px-3 py-1 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
            >
              Back
            </button>
          }
        />

        <form onSubmit={handleAddPlayersToTeam} className="space-y-3">
          <PlayerSelectInput availablePlayers={unassignedPlayers as IPlayer[]}
            eventId={"event._id"} // temp
            handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
          <button type="submit" className="w-full bg-yellow-400 text-gray-900 py-3 rounded-lg font-bold text-sm hover:bg-yellow-300 transition-colors shadow-lg">
            ADD SELECTED PLAYERS
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader
        title="Team Roster"
        subtitle={`${activePlayers.length} active players`}
        action={
          <button onClick={() => setAddPlayer(true)} className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-300 transition-colors shadow-lg">
            + ADD PLAYER
          </button>
        }
      />

      <div className="space-y-2">
        <PlayerList
          playerList={activePlayers}
          setIsLoading={setIsLoading}
          rankControls
          refetchFunc={refetchFunc}
          teamList={teamList}
          divisionList={divisionList}
          teamId={team?._id}
          showRank
          playerRanking={playerRanking}
          events={events} 
        />
      </div>

      {inactivePlayers.length > 0 && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-400">Inactive Players</h3>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">{inactivePlayers.length}</span>
          </div>
          <PlayerList
            playerList={inactivePlayers}
            events={events} 
            setIsLoading={setIsLoading}
            refetchFunc={refetchFunc}
            teamList={teamList}
            divisionList={divisionList}
            teamId={team._id}
            inactive
          />
        </div>
      )}
    </div>
  );
}

const SectionHeader = ({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <div>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
    {action}
  </div>
);

export default RosterWrapper;
