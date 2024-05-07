import cld from '@/config/cloudinary.config';
import { ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
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
          <AdvancedImage cldImg={cld.image(team.captain?.profile)} className="w-12" alt={team.captain?.firstName} />
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
