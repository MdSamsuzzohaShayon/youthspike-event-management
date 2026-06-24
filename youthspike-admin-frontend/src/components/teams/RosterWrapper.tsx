import { UPDATE_TEAM } from '@/graphql/teams';
import { useMessage } from '@/lib/MessageProvider';
import { EPlayerStatus, IEvent, IOption, IPlayer, IPlayerExpRel, IPlayerRankingExpRel, ITeam } from '@/types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import { divisionsOfEvents, divisionsToOptionList } from '@/utils/helper';
import { useMutation } from '@apollo/client/react';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';

interface IRosterWrapperProps {
  events: IEvent[];
  team: ITeam;
  players: IPlayer[];
  unassignedPlayers: IPlayer[];
  playerRanking: IPlayerRankingExpRel;
  teamList: ITeam[];
}
function RosterWrapper({ events, team, players, unassignedPlayers, playerRanking, teamList }: IRosterWrapperProps) {
  // Local State
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<Set<string>>(new Set());
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

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
          },
        });
        // Need to add cache later
        window.location.reload();
      } catch (error) {
        showMessage({ type: 'error', message: (error as Error)?.message || 'An error occurred' });
      }
    },
    [playerIdsToAdd, team, events, mutateTeam, showMessage],
  );


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



  const divisionList: IOption[] = useMemo(() => {
    const currentEventId = SessionStorageService.getItem(CURRENT_EVENT);
    const allDivisions = divisionsOfEvents(events);

    if (!currentEventId) {
      return divisionsToOptionList(allDivisions);
    }

    const currentEvent = events.find(
      (event) => event._id === currentEventId,
    );

    return divisionsToOptionList(
      currentEvent?.divisions ?? allDivisions,
    );
  }, [events]);




  useEffect(() => {
    const event = SessionStorageService.getItem(CURRENT_EVENT);
    if (event) {
      const eventExist = events.find((e) => e._id === event);
      if (eventExist) {
        setSelectedEvent(eventExist);
      }
    }
  }, [events]);


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
          <PlayerSelectInput players={unassignedPlayers as IPlayer[]}
            events={events}
            onCheckboxChange={handleCheckboxChange} name="add-player-to-team" />


          {unassignedPlayers.length > 0 && (
            <button type="submit" className="btn-info">
              ADD SELECTED PLAYERS
            </button>
          )}
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
          <button onClick={() => setAddPlayer(true)} className="btn-info">
            + ADD PLAYER
          </button>
        }
      />

      <div className="space-y-2">
        <PlayerList
          playerList={activePlayers}
          setIsLoading={setIsLoading}
          rankControls
          teamList={[...teamList, team]}
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
            teamList={[...teamList, team]}
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
