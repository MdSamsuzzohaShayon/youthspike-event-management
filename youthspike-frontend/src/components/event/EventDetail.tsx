/* eslint-disable no-unused-vars */
import cld from '@/config/cloudinary.config';
import { IEvent, IMatchExpRel, IPlayer, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import { useUser } from '@/lib/UserProvider';
import React, { useState } from 'react';
import Image from 'next/image';
import { imgW } from '@/utils/constant';
import { APP_NAME } from '@/utils/keys';
import MatchList from '../match/MatchList';
import TeamList from '../team/TeamList';
import PlayerList from '../player/PlayerList';

interface IteamCaptain extends ITeam {
  captain: IPlayer;
}
interface IMatchCaptain extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface IEventRelatives extends IEvent {
  matches?: IMatchCaptain[];
  players?: IPlayer[];
  teams?: IteamCaptain[];
}

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

// eslint-disable-next-line no-unused-vars, no-shadow
enum EItem {
  PLAYER = 'PLAYER',
  MATCH = 'MATCH',
  TEAM = 'TEAM',
}

function EventDetail({ event }: { event: IEventRelatives }) {
  const [selectedItem, setSelectedItem] = useState<EItem>(EItem.MATCH);
  const user = useUser();

  const renderContent = () => {
    switch (selectedItem) {
      case EItem.PLAYER:
        return <PlayerList playerList={event.players} />;
      case EItem.TEAM:
        return <TeamList teamList={event.teams} divisions={event.divisions} />;
      case EItem.MATCH:
        return <MatchList matchList={event.matches} divisions={event.divisions} />;
      default:
        return null;
    }
  };

  const renderSponsors = () => {
    const sponsorList: React.ReactNode[] = [];
    sponsorList.push(
      <div className="w-20">
        <Image width={imgW.xs} height={imgW.xs} src="/free-logo.png" alt={`${APP_NAME}-logo`} />
      </div>,
    );
    event.sponsors.forEach((sponsor) => {
      sponsorList.push(<AdvancedImage cldImg={cld.image(sponsor.logo.toString())} key={sponsor._id} className="w-20" />);
    });
    return <React.Fragment key="render-sponsor">{sponsorList}</React.Fragment>;
  };

  console.log({ event });

  return (
    <div className="w-full">
      <h1 className="my-4 text-center">{event.name}</h1>
      {!user.token && event?.sponsors && (
        <>
          <h3 className="mb-4">Sponsors</h3>
          <div className="sponsors w-full flex items-center justify-between md:justify-start flex-wrap gap-2 bg-black-logo">{renderSponsors()}</div>
        </>
      )}

      <div className="flex flex-col md:flex-row mt-8 bg-black-logo px-2">
        <div className="side-bar sticky top-0 w-full md:w-2/6 flex flex-row md:flex-col flex-wrap mb-2 ">
          {event.players?.length === 0 && event.teams?.length === 0 && event.matches?.length === 0 ? (
            <h3>No matche, team, or, player is been created yet!</h3>
          ) : (
            <>
              <li
                role="presentation"
                onClick={() => setSelectedItem(EItem.PLAYER)}
                className={`list-none cursor-pointer p-2 ${selectedItem === EItem.PLAYER ? 'font-bold bg-yellow-400' : 'bg-black-logo'}`}
              >
                Players
              </li>
              <li role="presentation" onClick={() => setSelectedItem(EItem.TEAM)} className={`list-none cursor-pointer p-2 ${selectedItem === EItem.TEAM ? 'font-bold bg-yellow-400' : 'bg-black-logo'}`}>
                Teams
              </li>
              <li
                role="presentation"
                onClick={() => setSelectedItem(EItem.MATCH)}
                className={`list-none cursor-pointer p-2 ${selectedItem === EItem.MATCH ? 'font-bold bg-yellow-400' : 'bg-black-logo'}`}
              >
                Matches
              </li>
            </>
          )}
        </div>
        <div className="w-full md:w-4/6 static">{renderContent()}</div>
      </div>
    </div>
  );
}

export default EventDetail;
