import { IError, IEvent, IOption, IPlayerExpRel, IPlayerRanking, IPlayerRankingExpRel, IPlayerRankingItem, IPlayerRankingItemExpRel, ITeam } from '@/types';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sortable from 'sortablejs';
import { motion, AnimatePresence } from "framer-motion";
import { EPlayerStatus } from '@/types/player';
import { useMutation } from '@apollo/client';
import useScreenWidth from '../../hooks/useScreenWidth';
import PlayerCard from './PlayerCard';
import { UPDATE_PLAYER_RANKING } from '@/graphql/player-ranking';
import { handleError } from '@/utils/handleError';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import SelectInput from '../elements/forms/SelectInput';
import { UPDATE_PLAYERS } from '@/graphql/players';

interface IPlayerListProps {
  playerList: IPlayerExpRel[];
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList?: IOption[];
  showRank?: boolean;
  teamList?: ITeam[];
  rankControls?: boolean;
  teamId?: string | null;
  refetchFunc?: () => void;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
  playerRanking?: IPlayerRankingExpRel | null;
  currEvent?: null | IEvent;
  inactive?: boolean;
}

interface IPlayerRank {
  player: string;
  rank: number;
}

function PlayerList({ playerList, eventId, setIsLoading, rankControls, refetchFunc, teamList, showRank, divisionList, teamId, setActErr, playerRanking, currEvent, inactive }: IPlayerListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const screenWidth = useScreenWidth();
  const user = useUser();
  const [checkedPlayers, setCheckedPlayers] = useState<Map<string, boolean>>(new Map());
  const actionEl = useRef<HTMLUListElement | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [showMovePlayer, setShowMovePlayer] = useState<boolean>(false);
  const [teamOptions, setTeamOptions] = useState<IOption[]>([]);
  const [newTeamId, setNewTeamId] = useState<null | string>(null);

  const [mutatePlayers] = useMutation(UPDATE_PLAYERS);
  


  



  const handleCheckAllToggle = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const newCheckedPlayers: Map<string, boolean> = new Map();
    if (inputEl.checked) {
      playerList.forEach((m) => {
        newCheckedPlayers.set(m._id, true);
      });
      setCheckedPlayers(newCheckedPlayers);
    } else {
      setCheckedPlayers(new Map());
    }
  }

  const handleDeletePlayers = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkedPlayers.size <= 0) return;
    try {
      setIsLoading(true);
      const checkedMatchIds = Array.from(checkedPlayers)
        .filter(([_, isChecked]) => isChecked) // Filter for checked items
        .map(([matchId]) => matchId); // Map to just the match IDs
      // const response = await deleteMultipleMatches({ variables: { matchIds: checkedMatchIds } });
      // const success = handleResponse({ response: response.data.deleteMatches, setActErr });
      // if (!success) return;
      setCheckedPlayers(new Map());
      if (refetchFunc) await refetchFunc()
    } catch (error: any) {
      handleError({ error, setActErr })
    } finally {
      setIsLoading(false);
    }
    setShowFilter(false);
  }

  const handleMovePlayers = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Get All checked players
    // New team of player
    try {
      setIsLoading(true);
      const checkedPlayerIds = Array.from(checkedPlayers)
        .filter(([_, isChecked]) => isChecked) // Filter for checked items
        .map(([matchId]) => matchId); // Map to just the match IDs
        const players = [];
        for (let i = 0; i < checkedPlayerIds.length; i+=1) {
          players.push({_id: checkedPlayerIds[i], team: newTeamId});
        }
        await mutatePlayers({variables: {input: players}}); // 
        if(refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    }finally{
      setIsLoading(false);
    }
  }

  const handleActiveInactive = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const checkedPlayerIds = Array.from(checkedPlayers)
        .filter(([_, isChecked]) => isChecked) // Filter for checked items
        .map(([matchId]) => matchId); // Map to just the match IDs
        const players = [];
        for (let i = 0; i < checkedPlayerIds.length; i+=1) {
          const status = inactive ? EPlayerStatus.ACTIVE : EPlayerStatus.INACTIVE;
          players.push({_id: checkedPlayerIds[i], status});
        }
        await mutatePlayers({variables: {input: players}});
        if(refetchFunc) await refetchFunc();
    } catch (error) {
      console.log(error);
    }finally{
      setIsLoading(false);
    }
  }


    const handleDivisionChange = (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!teamList) return;
      const inputEl = e.target as HTMLSelectElement;
      const dl: IOption[] = [];
      for (let i = 0; i < teamList.length; i += 1) {
        if (teamList[i].division.trim().toLowerCase() === inputEl.value.trim().toLowerCase()) {
          dl.push({ text: teamList[i].name, value: teamList[i]._id });
        }
      }
      setTeamOptions(dl);
    };

    const handleShowMove=(e: React.SyntheticEvent)=>{
      e.preventDefault();
      setShowMovePlayer(true);
      setShowFilter(false);
    }

  
  return (
    <React.Fragment>
      {(user.info?.role === UserRole.admin || user.info?.role === UserRole.director) && playerList.length > 0 &&  (
        <div className="bulk-selection relative w-full flex justify-between">
          <div className="input-group flex items-center gap-2 justify-between"  >
            <input onClick={handleCheckAllToggle} type="checkbox" name="bulkaction" id="bulk-action" />
            <label htmlFor="bulk-action">Bulk Action</label>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/dropdown.svg" alt="dropdown" className="w-6 svg-white" role='presentation' onClick={() => setShowFilter((prevState) => !prevState)} />
          </div>


          {/* Bulk Action start  */}
          <ul ref={actionEl} className={`${showFilter ? 'flex' : 'hidden'} flex-col justify-start items-start gap-1 py-2 px-4 bg-gray-900 absolute top-7 left-14 z-10 rounded-lg`}>
            <li role="presentation" className='capitalize cursor-pointer' onClick={handleDeletePlayers}>
              delete
            </li>

            <li role="presentation" className='capitalize cursor-pointer' onClick={handleShowMove}>
              Move
            </li>

            <li role="presentation" className='capitalize cursor-pointer' onClick={handleActiveInactive}>
              {inactive ? "Active" : "Inactive"}
            </li>
          </ul>
          {/* Bulk Action end  */}
        </div>
      )}

      {showMovePlayer && (
        <div className="w-full move-team w-full p-2 bg-gray-800 flex flex-col items-start justify-end relative">
          <button type="button" className="close" aria-label="close" onClick={() => setShowMovePlayer(false)}>
            <Image width={imgSize.logo} height={imgSize.logo} src="/icons/close.svg" alt="" className="w-6 h-6 svg-white" />
          </button>
          <form className="w-full" onSubmit={handleMovePlayers}>
            <SelectInput key="division-1" handleSelect={handleDivisionChange} vertical name="division" optionList={divisionList || []} />
            {/* @ts-ignore */}
            <SelectInput key="team-2" handleSelect={(e)=>setNewTeamId(e.target.value)} vertical name="team" optionList={teamOptions} />
            <button className="btn-info mt-4" type="submit">
              Move
            </button>
          </form>
        </div>
      )}

      <ul ref={listRef}>
        {renderPlayerList(playerList, playerRanking)}
      </ul>
    </React.Fragment>
  );
}

export default PlayerList;
