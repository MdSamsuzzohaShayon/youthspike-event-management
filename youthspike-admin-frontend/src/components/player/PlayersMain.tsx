'use client';

import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import React, { useState, useEffect, useMemo } from 'react';
import Loader from '@/components/elements/Loader';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IEvent, IGroupRelatives, IPlayerRankingExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import {
  getDivisionFromStore,
  removeDivisionFromStore,
  removeTeamFromStore,
  setDivisionToStore
} from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import PlayerList from '@/components/player/PlayerList';
import UserMenuList from '@/components/layout/UserMenuList';

interface IPlayersMainProps {
  currEvent: IEvent;
  players: IPlayerExpRel[];
  groups: IGroupRelatives[];
  teams: ITeam[];
  playerRanking: IPlayerRankingExpRel | null;
}

function PlayersMain({ currEvent, players, groups, teams, playerRanking }: IPlayersMainProps) {
  const user = useUser();

  const [isLoading, setIsLoading] = useState(false);
  const [addPlayer, setAddPlayer] = useState(false);
  const [showRank, setShowRank] = useState(false);
  const [rankControls, setRankControls] = useState(false);
  const [lockRank, setLockRank] = useState(false);

  const [currDivision, setCurrDivision] = useState('');
  // const [teamPlayerRanking, setTeamPlayerRanking] = useState<IPlayerRankingExpRel | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const value = inputEl.value.trim();
    setCurrDivision(value);

    if (!value) {
      removeDivisionFromStore();
    } else {
      setDivisionToStore(value);
    }
  };

  const refetchFunc = async () => {
    window.location.reload();
  };

  // Filter captain's team players if captain/co-captain
  const teamScopedPlayers = useMemo(() => {
    if (
      user?.info?.role === undefined ||
      ![UserRole.captain, UserRole.co_captain].includes(user.info.role)
    ) return players;

    const pId = user.info?.captainplayer || user.info?.cocaptainplayer;
    const playerExist = players.find((p) => p._id === pId);

    if (!playerExist || !playerExist.teams?.[0]) return [];

    const tId = playerExist.teams[0]._id;
    const teamExist = teams.find((t) => t._id === tId);
    if (!teamExist) return [];

    setShowRank(true);
    setRankControls(true);
    setTeamId(tId);

    return players.filter((p) =>
      p.teams?.some((t) => t._id === tId)
    );
  }, [user, players, teams]);

  // Filtered by division
  const [filteredPlayerList, filteredTeamList] = useMemo(() => {
    const basePlayers = teamScopedPlayers;
    const baseTeams = teams;

    if (!currDivision) return [basePlayers, baseTeams];

    const div = currDivision.trim().toLowerCase();

    const fp = basePlayers.filter((p) =>
      p.division?.trim().toLowerCase() === div
    );
    const ft = baseTeams.filter((t) =>
      t.division?.trim().toLowerCase() === div
    );

    return [fp, ft];
  }, [currDivision, teamScopedPlayers, teams]);

  // Load division from store initially
  useEffect(() => {
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
    }
  }, []);

  const activeList = useMemo(
    () => filteredPlayerList.filter((p) => p.status === EPlayerStatus.ACTIVE),
    [filteredPlayerList]
  );

  const inactiveList = useMemo(
    () => filteredPlayerList.filter((p) => p.status === EPlayerStatus.INACTIVE),
    [filteredPlayerList]
  );

  const divisions = useMemo(
    () => (currEvent?.divisions ? divisionsToOptionList(currEvent.divisions) : []),
    [currEvent]
  );

  if (isLoading) return <Loader />;

  return (
    <>
      {/* Event Header */}
      <div className="event-and-menu">
        {currEvent && <CurrentEvent currEvent={currEvent} />}
        <div className="team-name text-center">
          {user?.info?.team && <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>}
        </div>
        <div className="navigator mt-8">
          <UserMenuList eventId={currEvent._id} />
        </div>
      </div>

      {/* Player Add Mode */}
      {addPlayer ? (
        <>
          <div className="w-full bg-gray-800 flex justify-between items-center p-4 mt-6 rounded-lg">
            <h3>Player Add</h3>
            <button className="btn-info" onClick={() => setAddPlayer(false)}>Player List</button>
          </div>

          {(user?.info?.role === undefined ||
            ![UserRole.captain, UserRole.co_captain].includes(user.info.role)) && (
            <div className="mb-4 division-selection w-full mt-6">
              <SelectInput
                key="players-pg-1"
                handleSelect={handleDivisionSelection}
                value={currDivision}
                name="division"
                optionList={divisions}
              />
            </div>
          )}

          <PlayerAdd
            eventId={currEvent._id}
            setAddPlayer={setAddPlayer}
            teamList={filteredTeamList}
            division={currDivision}
          />
        </>
      ) : (
        <>
          {/* Player List Mode */}
          <div className="w-full bg-gray-800 flex justify-between items-center p-4 mt-6 rounded-lg">
            <h3>Player List</h3>
            {(user?.info?.role === UserRole.admin || user?.info?.role === UserRole.director) && (
              <button className="btn-info" onClick={() => setAddPlayer(true)}>Add player</button>
            )}
          </div>

          <div className="player-list mt-6">
            <PlayerList
              playerList={activeList}
              eventId={currEvent._id}
              setIsLoading={setIsLoading}
              rankControls={rankControls && !lockRank}
              refetchFunc={refetchFunc}
              teamList={filteredTeamList}
              divisionList={divisions}
              showRank={showRank}
              playerRanking={playerRanking}
              teamId={teamId}
              currEvent={currEvent}
            />
          </div>

          {inactiveList.length > 0 && (
            <div className="w-full">
              <h3 className="mt-4">Inactive Players List</h3>
              <PlayerList
                key="inactive-players"
                inactive
                currEvent={currEvent}
                eventId={currEvent._id}
                playerList={inactiveList}
                setIsLoading={setIsLoading}
                refetchFunc={refetchFunc}
                teamList={filteredTeamList}
                divisionList={divisions}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}

export default PlayersMain;
