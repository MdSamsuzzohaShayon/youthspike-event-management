import { useLdoId } from '@/lib/LdoProvider';
import { IEvent, IPlayer } from '@/types';
import Link from 'next/link';
import React from 'react';


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

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, playerId: string) => {
    const isChecked = e.target.checked;
    onCheckboxChange(playerId, isChecked);
  };

  return (
    <div className={`input-group w-full flex flex-col ${extraClass}`}>
      <label htmlFor="players">
        <span>Select Players or </span>
        {/* <span className='"underline underline-offset-1"' onCli> Create New Player!</span> */}
        {events.map((event) => (
          <Link href={`/${event._id}/players/new/${ldoIdUrl}`} className="underline underline-offset-1">
            Create New Player!
          </Link>
        ))}
      </label>
      <ul className="flex flex-wrap items-center gap-2">
        {players.map(
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
