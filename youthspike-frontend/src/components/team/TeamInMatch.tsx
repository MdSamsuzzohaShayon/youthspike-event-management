import { ITeam } from '@/types';
import { CldImage } from 'next-cloudinary';
import Image from 'next/image';
import React from 'react';

interface ITeamInMatchProps {
  team: ITeam;
  home: boolean;
}

function TeamInMatch({ team, home }: ITeamInMatchProps) {
  return (
    <div className="flex justify-start items-center">
      <div className="logo m-2">
        {team.captain?.profile ? (
          <CldImage alt={team.captain?.profile} width="200" height="200" className="w-12" src={team.captain?.profile} />
        ) : (
          <Image width={20} height={20} src="/free-logo.svg" className="w-16" alt="free-logo" />
        )}
      </div>
      <div className="detail m-2 ">
        <h3>
          {home ? 'Home' : 'Invited'} Team: {team.name}
        </h3>
        <p>Captain: {`${team.captain?.firstName} ${team.captain?.lastName}`}</p>
        <p>Email: {team.captain?.email}</p>
      </div>
    </div>
  );
}

export default TeamInMatch;
