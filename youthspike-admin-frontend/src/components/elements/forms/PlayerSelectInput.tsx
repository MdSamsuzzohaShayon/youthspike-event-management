import { useLdoId } from '@/lib/LdoProvider';
import { IEvent, IPlayer } from '@/types';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import InputField from './InputField';
import { debounce } from '@/utils/helper';


export interface IPlayerSelectInputProps {
  name: string;
  onCheckboxChange: (playerId: string, isChecked: boolean) => void;
  players: IPlayer[];
  events: string[];
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


  useEffect(() => {
    if (players && players.length > 0) {
      setPlayerList(players);
    }
  }, [players]);

  return (
    <div className={`input-group w-full flex flex-col ${extraClass}`}>
      <label htmlFor="players">
        <span>Select Players or </span>
        {events.map((event) => (
          <Link
            key={event}
            href={`/${event}/players/new/${ldoIdUrl}`}
            className="underline underline-offset-1"
          >
            Create New Player!
          </Link>
        ))}
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
