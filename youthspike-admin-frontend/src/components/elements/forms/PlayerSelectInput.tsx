import { useLdoId } from '@/lib/LdoProvider';
import { IEvent, IPlayer } from '@/types';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import InputField from './InputField';
import { debounce } from '@/utils/helper';
import SessionStorageService from '@/utils/SessionStorageService';
import { CURRENT_EVENT } from '@/utils/constant';
import routerService from '@/lib/router-service';


export interface IPlayerSelectInputProps {
  name: string;
  onCheckboxChange: (playerId: string, isChecked: boolean) => void;
  players: IPlayer[];
  events: IEvent[];
  extraClass?: string;
  defaultValue?: string[];
}


function PlayerSelectInput({ events, players, onCheckboxChange, extraClass, defaultValue }: IPlayerSelectInputProps) {
  const { ldoIdUrl } = useLdoId();
  const [playerList, setPlayerList] = useState<IPlayer[]>([]);


  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, playerId: string) => {
    const isChecked = e.target.checked;
    onCheckboxChange(playerId, isChecked);
  };

  const handleInputChange = React.useMemo(() => {
    const filterPlayers = (value: string) => {
      const query = value.trim().toLowerCase();

      if (!query) {
        setPlayerList(players);
        return;
      }

      const filtered = players.filter((player: IPlayer) => {
        const first = player.firstName.toLowerCase();
        const last = player.lastName.toLowerCase();
        const username = player.username.toLowerCase();

        return (
          first.includes(query) ||
          last.includes(query) ||
          username.includes(query)
        );
      });

      setPlayerList(filtered);
    };

    return debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      filterPlayers(e.target.value);
    }, 300);
  }, [players]);


  const handleEventRedirect = (e: React.SyntheticEvent, eventId: string)=>{
    e.preventDefault();
    SessionStorageService.setItem(CURRENT_EVENT, eventId);
    routerService.push(`/players/new/${ldoIdUrl}`);
  }


  useEffect(() => {
    if (players && players.length > 0) {
      setPlayerList(players);
    }
  }, [players]);

  return (
    <div className={`input-group w-full flex flex-col ${extraClass}`}>
      <label htmlFor="players">
        <span className='text-xs'>Select Players or </span>
        <div className="w-full flex justify-start items-center flex-wrap gap-x-4">
        {events.map((event) => (
          <div
            key={event._id}
            role="presentation"
            onClick={(e)=> handleEventRedirect(e, event._id)}
            className="underline underline-offset-1 hover:text-yellow-400 text-xs"
          >
            Create Player in {event.name}
          </div>
        ))}
        </div>
      </label>
      <InputField name='search' className='w-full' label='Search player' onChange={handleInputChange} />
      <ul className="flex flex-wrap items-center gap-2">
        {playerList.map(
          (player, i) =>
            <li key={`${player._id}-${i}`} className="flex gap-1 items-center">
              <input type="checkbox" onChange={(e) => handleCheckboxChange(e, player._id)} />
              <span className="capitalize">{`${player.firstName} ${player.lastName}`}</span>
            </li>
        )}
      </ul>
    </div>
  );
}

export default PlayerSelectInput;
