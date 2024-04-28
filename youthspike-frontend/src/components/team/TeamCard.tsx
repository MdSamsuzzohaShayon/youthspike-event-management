import { IPlayer, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import React from 'react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';

interface IteamCaptain extends ITeam {
  captain: IPlayer;
}

interface ITeamCardProps {
  team: IteamCaptain;
}

function TeamCard({ team }: ITeamCardProps) {
  return (
    <div className="team-card w-full p-2 bg-gray-700 rounded-lg flex items-start justify-between">
      <div className="w-6/12">
        <div className="brand flex gap-1 items-center">
          {team.logo ? (
            <div className="advanced-img w-12">
              <AdvancedImage cldImg={cld.image(team.logo)} alt={team.name} className="w-full" />
            </div>
          ) : (
            <TextImg className="w-12 h-12" fullText={team.name} />
          )}
          <h3 className="leading-none text-lg font-bold">{team.name}</h3>
        </div>
        {/* <p>2-1 Record</p> */}
      </div>
      <div className="w-6/12">
        <div className="brand flex gap-1">
          {team.captain?.profile && (
            <div className="advanced-img w-12 h-12 rounded-full border-2 border-yellow-logo">
              <AdvancedImage cldImg={cld.image(team?.captain?.profile)} alt={team?.captain?.firstName} className="w-full" />
            </div>
          )}
          {team?.captain?.firstName && (
            <div className="caption flex flex-col">
              <p className="uppercase text-xs">Captain</p>
              <h3 className="leading-none text-lg font-bold">{`${team?.captain?.firstName} ${team?.captain?.lastName}`}</h3>
            </div>
          )}
        </div>
        {/* <p className='flex'><span><img src="/icons/telephone.svg" alt="telephone" className='w-6 svg-white' /></span>222-222-2222</p> */}
        {team?.players && (
          <p className="flex gap-1">
            Active players <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-900">{team?.players?.length}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default TeamCard;
