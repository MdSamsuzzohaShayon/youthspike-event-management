import React from 'react';
import { IEvent, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
// import { initialUserMenuList } from '@/utils/staticData';
import Link from 'next/link';
import TextImg from '../elements/TextImg';
import PlayerList from '../player/PlayerList';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
}

function TeamDetail({ event, team }: ITeamDetailProps) {
  // const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);

  return (
    <>
      <h1 className="uppercase text-center">Teams/roster</h1>
      <h1 className="uppercase text-center">{event?.name}</h1>

      {/* Team detail  */}
      <div className="team-detail mt-8 mb-4 w-full flex justify-center flex-col items-center">
        {team.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="w-20" /> : <TextImg className="w-20 h-20" fullText={team.name} txtCls="text-2xl" />}

        <h3 className="capitalize ">{team && team.name}</h3>
        {/* <div className="navigator w-full flex justify-center items-center gap-x-2 flex-wrap">
          {userMenuList.map((item, iIdx) => (
            <Link key={item.id} href={item.id === 8 || item.id === 5 ? `${item.link}` : `/${eventId}${item.link}`}>
              {iIdx !== 0 && '|'} {item.text}
            </Link>
          ))}
        </div> */}
        <Link className="btn-success" href={`/events/${team.event._id}`}>
          Main Event
        </Link>
      </div>
      <div className="w-full player-list">
        <PlayerList playerList={team.players} />
      </div>
    </>
  );
}

export default TeamDetail;
