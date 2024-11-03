/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import cld from '@/config/cloudinary.config';
import { IEvent, IMatchExpRel, IPlayer, IPlayerRankingExpRel, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import { useUser } from '@/lib/UserProvider';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { EEventItem } from '@/types/event';
import { useAppDispatch } from '@/redux/hooks';
import { EVENT_ITEM, imgW } from '@/utils/constant';
import Link from 'next/link';
import { APP_NAME } from '@/utils/keys';
import { useLdoId } from '@/lib/LdoProvider';
import { setRankingMap, setTeamsPlayerRanking } from '@/redux/slices/playerRankingSlice';
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

function EventDetail({ event }: { event: IEventRelatives }) {
  const user = useUser();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { ldoIdUrl } = useLdoId();

  const [selectedItem, setSelectedItem] = useState<EEventItem>(EEventItem.MATCH);

  // After redirecting set an item to select between playerList, teamList or match list of an event
  useEffect(() => {
    // @ts-ignore
    const eventItem: EEventItem | null | undefined = searchParams.get(EVENT_ITEM);
    if (eventItem) {
      setSelectedItem(eventItem);
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (selectedItem) {
      case EEventItem.PLAYER:
        return <PlayerList playerList={event.players} />;
      case EEventItem.TEAM:
        return <TeamList teamList={event.teams} divisions={event.divisions} matchList={event.matches} />;
      case EEventItem.MATCH:
        return <MatchList matchList={event.matches} divisions={event.divisions} />;
      default:
        return null;
    }
  };

  const renderSponsors = () => {
    const sponsorList: React.ReactNode[] = [];
    sponsorList.push(
      <div className="w-20" key="default-logo">
        <Image width={imgW.xs} height={imgW.xs} src="/free-logo.png" alt={`${APP_NAME}-logo`} />
      </div>,
    );
    event.sponsors.forEach((sponsor, index) => {
      sponsorList.push(<AdvancedImage cldImg={cld.image(sponsor.logo.toString())} key={sponsor._id || `sponsor-${index}`} className="w-20" />);
    });
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <React.Fragment>{sponsorList}</React.Fragment>;
  };

  useEffect(() => {
    if (event.teams && event.teams.length > 0) {
      const eventTeams = event.teams;
      const teamsPlayerRanking: IPlayerRankingExpRel[] = [];
      const rankingMap = new Map();
      for (let i = 0; i < eventTeams.length; i += 1) {
        if (!eventTeams[i].playerRanking.rankLock) {
          // @ts-ignore
          const { rankings } = eventTeams[i].playerRanking as IPlayerRankingExpRel[];
          const playerSingleRanking: IPlayerRankingExpRel = {
            _id: eventTeams[i].playerRanking._id,
            rankLock: eventTeams[i].playerRanking.rankLock,
            rankings,
            team: {
              _id: eventTeams[i]._id,
              name: eventTeams[i].name,
              division: eventTeams[i].division,
              // @ts-ignore
              event: event._id,
            },
          };
          teamsPlayerRanking.push(playerSingleRanking);
          for (let j = 0; j < rankings.length; j += 1) {
            rankingMap.set(rankings[j].player._id, rankings[j].rank);
          }
        }
      }
      dispatch(setTeamsPlayerRanking(teamsPlayerRanking));
      dispatch(setRankingMap(Array.from(rankingMap)));
    }
  }, [dispatch, event]);

  return (
    <div className="w-full mb-8">
      <div className="logo-with event my-4 text-center w-full flex items-center justify-center flex-col">
        <Link href={`/${ldoIdUrl}`}>
          <Image height={100} width={100} src="/free-logo.png" alt="youthspike-logo" className="w-24" />
        </Link>
        <h1>{event.name}</h1>
      </div>

      {!user.token && event?.sponsors && (
        <>
          <h3 className="mb-4">Sponsors</h3>
          <div className="sponsors w-full flex items-center justify-between md:justify-start flex-wrap gap-2 bg-black-logo">{renderSponsors()}</div>
        </>
      )}

      <div className="flex flex-col md:flex-row mt-8 bg-black-logo px-2">
        <div className="side-bar sticky top-0 w-full md:w-2/6 flex flex-row md:flex-col flex-wrap mb-2 z-10">
          {event.players?.length === 0 && event.teams?.length === 0 && event.matches?.length === 0 ? (
            <h3>No matche, team, or, player is been created yet!</h3>
          ) : (
            <>
              <li
                role="presentation"
                onClick={() => setSelectedItem(EEventItem.PLAYER)}
                className={`list-none cursor-pointer p-2 ${selectedItem === EEventItem.PLAYER ? 'font-bold bg-yellow-logo text-black' : 'bg-black-logo'}`}
              >
                Players
              </li>
              <li
                role="presentation"
                onClick={() => setSelectedItem(EEventItem.TEAM)}
                className={`list-none cursor-pointer p-2 ${selectedItem === EEventItem.TEAM ? 'font-bold bg-yellow-logo text-black' : 'bg-black-logo'}`}
              >
                Teams
              </li>
              <li
                role="presentation"
                onClick={() => setSelectedItem(EEventItem.MATCH)}
                className={`list-none cursor-pointer p-2 ${selectedItem === EEventItem.MATCH ? 'font-bold bg-yellow-logo text-black' : 'bg-black-logo'}`}
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
