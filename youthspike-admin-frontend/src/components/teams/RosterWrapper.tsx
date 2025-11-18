import { UPDATE_TEAM } from '@/graphql/teams';
import { useError } from '@/lib/ErrorProvider';
import { EPlayerStatus, IEvent, IPlayer, IPlayerExpRel, IPlayerRank, IPlayerRanking, IPlayerRankingExpRel } from '@/types';
import { useMutation } from '@apollo/client';
import React, { useCallback, useMemo, useState } from 'react';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import { divisionsToOptionList } from '@/utils/helper';

interface IRosterWrapperProps {
  event: IEvent;
  teamId: string;
  players: IPlayer[];
  playerRanking: IPlayerRankingExpRel;
}
function RosterWrapper({ event, teamId, players, playerRanking }: IRosterWrapperProps) {
  // Local State
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<Set<string>>(new Set());
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Hooks
  const [mutateTeam] = useMutation(UPDATE_TEAM);
  const { setActErr } = useError();

  // Event handlers
  const handleAddPlayersToTeam = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      try {
        await mutateTeam({
          variables: {
            input: { players: Array.from(playerIdsToAdd) },
            teamId,
            eventId: event._id,
          },
        });
        window.location.reload();
      } catch (error) {
        setActErr({ message: (error as Error)?.message || '', success: false });
      }
    },
    [playerIdsToAdd, teamId, event, mutateTeam, setActErr],
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
      const p = structuredClone(players[i]);
      p.teams = teamId ? [teamId] : [];
      // @ts-ignore
      p.captainofteams = p.captainofteams?.length ? [teamId] : [];
      // @ts-ignore
      p.cocaptainofteams = p.cocaptainofteams?.length ? [teamId] : [];

      //   teamPlayers.push(p as IPlayerExpRel);
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
  const divisionList = useMemo(() => (event?.divisions ? divisionsToOptionList(event.divisions) : []), [event?.divisions]);

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
          <PlayerSelectInput availablePlayers={activePlayers as IPlayer[]} eventId={event._id} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" />
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
          eventId={event._id}
          setIsLoading={setIsLoading}
          rankControls
          refetchFunc={refetchFunc}
          teamList={[]}
          divisionList={divisionList}
          teamId={teamId}
          showRank
          playerRanking={playerRanking}
          currEvent={event}
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
            eventId={event._id}
            setIsLoading={setIsLoading}
            refetchFunc={refetchFunc}
            teamList={[]}
            divisionList={divisionList}
            teamId={teamId}
            currEvent={event}
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
