import { useLdoId } from '@/lib/LdoProvider';
import { IPlayerSelectProps } from '@/types';
import Link from 'next/link';
import React from 'react';

function PlayerSelectInput(props: IPlayerSelectProps) {
  const { ldoIdUrl } = useLdoId();

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, playerId: string) => {
    const isChecked = e.target.checked;
    props.handleCheckboxChange(playerId, isChecked);
  };

  return (
    <div className={`input-group w-full flex flex-col ${props.extraCls}`}>
      <label htmlFor="players">
        <span>Select Players or </span>
        {/* <span className='"underline underline-offset-1"' onCli> Create New Player!</span> */}
        <Link href={`/${props.eventId}/players/new/${ldoIdUrl}`} className="underline underline-offset-1">
          Create New Player!
        </Link>
      </label>
      <ul className="flex flex-wrap items-center gap-2">
        {props.availablePlayers.map(
          (ap) =>
              <li key={ap._id} className="flex gap-1 items-center">
                <input type="checkbox" onChange={(e) => handleCheckboxChange(e, ap._id)} />
                <span className="capitalize">{`${ap.firstName} ${ap.lastName}`}</span>
              </li>
        )}
      </ul>
    </div>
  );
}

export default PlayerSelectInput;
