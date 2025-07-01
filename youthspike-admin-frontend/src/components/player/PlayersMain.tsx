'use client';

import { EPlayerStatus, IPlayerExpRel } from '@/types/player';
import PlayerAdd from '@/components/player/PlayerAdd';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Loader from '@/components/elements/Loader';
import { divisionsToOptionList, isValidObjectId } from '@/utils/helper';
import { IEvent, IGroupRelatives, IOption, IPlayerRankingExpRel, ITeam } from '@/types';
import { UserRole } from '@/types/user';
import { useUser } from '@/lib/UserProvider';
import CurrentEvent from '@/components/event/CurrentEvent';
import { getDivisionFromStore, removeDivisionFromStore, removeTeamFromStore, setDivisionToStore } from '@/utils/localStorage';
import SelectInput from '@/components/elements/forms/SelectInput';
import PlayerList from '@/components/player/PlayerList';
import UserMenuList from '@/components/layout/UserMenuList';

interface IPlayersMainProps {
  currEvent: IEvent;
  players: IPlayerExpRel[];
  groups: IGroupRelatives[];
  teams: ITeam[];
}

function PlayersMain({ currEvent, players, groups, teams }: IPlayersMainProps) {
  // ===== hooks =====
  const user = useUser();


  // ===== Local State =====
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [showRank, setShowRank] = useState<boolean>(false);
  const [rankControls, setRankControls] = useState<boolean>(false);
  const [lockRank, setLockRank] = useState<boolean>(false);

  const [currDivision, setCurrDivision] = useState<string>('');
  const [playerList, setPlayerList] = useState<IPlayerExpRel[]>([]);
  const [filteredPlayerList, setFilteredPlayerList] = useState<IPlayerExpRel[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const [filteredTeamList, setFilteredTeamList] = useState<ITeam[]>([]);
  const [teamPlayerRanking, setTeamPlayerRanking] = useState<IPlayerRankingExpRel | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);


  const handleDivisionSelection = (e: React.SyntheticEvent) => {
    e.preventDefault();
    // ===== Filter Players =====
    const inputEl = e.target as HTMLInputElement;
    setCurrDivision(inputEl.value.trim());
    if (inputEl.value === '') {
      setFilteredTeamList([...teams]);
      setFilteredPlayerList([...playerList]);
      removeDivisionFromStore();
    } else {
      setDivisionToStore(inputEl.value.trim());
      const ntList = teams.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
      setFilteredTeamList([...ntList]);

      const npList = playerList.filter((t) => t.division && t.division.trim().toLowerCase() === inputEl.value.trim().toLowerCase());

      setFilteredPlayerList([...npList]);
    }
  };



  const refetchFunc = async () => {
    // await refetch();
    // fetchPlayer();
    window.location.reload();
  };


  /**
 * Lifecycle hooks
 * Getting and setting event ID & director ID
 * Fetching players
 */
  useEffect(() => {
    const divs = currEvent?.divisions ? divisionsToOptionList(currEvent?.divisions) : []; // divs = divisions
    setDivisionList(divs);

    // ===== Show players of captain's team =====
    let npList: IPlayerExpRel[] = [...players];
    if (user.info?.role === UserRole.captain || user.info?.role === UserRole.co_captain) {
      setShowRank(true);
      setRankControls(true);
      const pId = user.info.captainplayer ? user.info.captainplayer : user.info.cocaptainplayer;
      const playerExist = players.find((p) => p._id === pId);
      if (playerExist) {
        // Make sure captain of which team
        const teamId = playerExist.teams && playerExist.teams.length > 0 ? playerExist.teams[0]._id : null;
        if (teamId) {
          const teamExist = teams.find((t) => t._id === teamId);
          if (teamExist && teamExist) {
            setTeamId(teamId)
            if (teamExist.playerRanking) {
              setTeamPlayerRanking(teamExist.playerRanking);
            }
          }
          npList = players.filter((p): boolean => {
            if (p.teams && p.teams.length > 0) {
              const tIds = p.teams.map((t) => t._id);
              if (tIds.includes(teamId)) {
                return true; // Keep this element in the filtered array
              }
            }
            return false; // Exclude this element from the filtered array
          });
        }
      } else {
        npList = [];
      }
    }
    setPlayerList(npList)

    let fpList = [...npList]; // fp list = filtered players list
    let ftList = teams; // fp list = filtered players list

    // ===== Division and team value =====
    removeTeamFromStore();
    const divisionExist = getDivisionFromStore();
    if (divisionExist) {
      setCurrDivision(divisionExist);
      fpList = players.filter((p) => p.division && p.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
      ftList = teams.filter((t) => t.division && t.division.trim().toLowerCase() === divisionExist.trim().toLowerCase());
    }

    setFilteredPlayerList(fpList);
    setFilteredTeamList(ftList);
  }, [currEvent, user]);





  const activeList = useMemo(() => {
    return filteredPlayerList.filter(p => p.status === EPlayerStatus.ACTIVE);
  }, [filteredPlayerList]);

  const inactiveList = useMemo(() => {
    return filteredPlayerList.filter(p => p.status === EPlayerStatus.INACTIVE);
  }, [filteredPlayerList]);



  if (isLoading) return <Loader />;

  return (
    <React.Fragment>
      {/* Event Menu Start */}
      <div className="event-and-menu">
        {currEvent && <CurrentEvent currEvent={currEvent} />}
        <div className="team-name text-center">
          {(user && user.info?.team) && <h3 className="text-yellow-500 text-gray-400">{user.info.team}</h3>}
        </div>
        <div className="navigator mt-8">
          <UserMenuList eventId={currEvent._id} />
        </div>
      </div>
      {/* Event Menu End */}

      {user?.info?.role !== UserRole.captain && user?.info?.role !== UserRole.co_captain && (
        <div className="mb-4 division-selection w-full mt-6">
          <SelectInput key="players-pg-1" handleSelect={handleDivisionSelection} value={currDivision} name="division" optionList={divisionList} />
        </div>
      )}

      {addPlayer ? (
        <>
          <h3 className="mt-4">Player Add</h3>
          <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(false)}>
            Player List
          </button>
          <PlayerAdd
            eventId={currEvent._id}
            setAddPlayer={setAddPlayer}
            teamList={filteredTeamList}
            division={currDivision}
          />
        </>
      ) : (
        <>
          <div className="w-full bg-gray-800 flex justify-between items-centet mb-2 p-2 rounded-lg">
            <h3 className="mt-4">Player List</h3>
            {user && user.info && (user.info.role === UserRole.admin || user.info.role === UserRole.director) && (
              <button className="btn-info mt-4 mb-4" type="button" onClick={() => setAddPlayer(true)}>
                Add player
              </button>
            )}
          </div>
          <PlayerList
            playerList={activeList}
            eventId={currEvent._id}
            setIsLoading={setIsLoading}
            rankControls={rankControls && !lockRank}
            refetchFunc={refetchFunc}
            teamList={filteredTeamList}
            divisionList={divisionList}
            showRank={showRank}
            playerRanking={teamPlayerRanking}
            teamId={teamId}
            currEvent={currEvent}
          />



          {inactiveList.length > 0 && (
            <div className="w-full">
              <h3 className="mt-4">Inactive Players List</h3>
              <PlayerList key="inactive-players" inactive currEvent={currEvent} eventId={currEvent._id} playerList={inactiveList} setIsLoading={setIsLoading} refetchFunc={refetchFunc} teamList={filteredTeamList} divisionList={divisionList} />
            </div>
          )}
        </>
      )}
    </React.Fragment>
  );
}

export default PlayersMain;
