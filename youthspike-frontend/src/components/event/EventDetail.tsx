/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch } from '@/redux/hooks';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import cld from '@/config/cloudinary.config';
import { IEvent, IGroup, IMatchExpRel, IOption, IPlayer, IPlayerRankingExpRel, ITeam } from '@/types';
import { AdvancedImage } from '@cloudinary/react';
import { EEventItem } from '@/types/event';
import { setRankingMap, setTeamsPlayerRanking } from '@/redux/slices/playerRankingSlice';
import { divisionsToOptionList } from '@/utils/helper';
import { EVENT_ITEM, imgW, APP_NAME } from '@/utils/constant';

import { useLdoId } from '@/lib/LdoProvider';
import MatchList from '../match/MatchList';
import TeamList from '../team/TeamList';
import PlayerList from '../player/PlayerList';
import SelectInput from '../elements/SelectInput';

// Interfaces
interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatchCaptain extends IMatchExpRel {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}

interface IEventRelatives extends IEvent {
  matches?: IMatchCaptain[];
  players?: IPlayer[];
  teams?: ITeamCaptain[];
}

function EventDetail({ event }: { event: IEventRelatives }) {
  const { ldoIdUrl } = useLdoId();
  const dispatch = useAppDispatch();
  const user = useUser();
  const searchParams = useSearchParams();

  const [selectedItem, setSelectedItem] = useState<EEventItem>(EEventItem.MATCH);
  const [currDivision, setCurrDivision] = useState<string | null>(null);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);

  const [teamList, setTeamList] = useState<ITeamCaptain[]>([]);
  const [matchList, setMatchList] = useState<IMatchCaptain[]>([]);
  const [playerList, setPlayerList] = useState<IPlayer[]>([]);
  const [groupList, setGroupList] = useState<IGroup[]>([]);

  const initializeLists = useCallback(() => {
    const rankingMap = new Map();

    setTeamList(event.teams || []);
    setMatchList(event.matches || []);
    setPlayerList(event.players || []);
    setGroupList(event.groups || []);

    const teamsPlayerRanking = event.teams?.reduce((rankings, team) => {
      if (!team.playerRanking.rankLock) {
        rankings.push({
          ...team.playerRanking,
          team: { _id: team._id, name: team.name, division: team.division, event: event._id },
        });
        team.playerRanking.rankings.forEach(({ player, rank }) => rankingMap.set(player._id, rank));
      }
      return rankings;
    }, [] as IPlayerRankingExpRel[]);

    dispatch(setTeamsPlayerRanking(teamsPlayerRanking || []));
    dispatch(setRankingMap(Array.from(rankingMap)));
  }, [dispatch, event]);

  useEffect(() => {
    initializeLists();
    if (event.divisions) setDivisionList(divisionsToOptionList(event.divisions));
    const eventItem = searchParams.get(EVENT_ITEM) as EEventItem;
    if (eventItem) setSelectedItem(eventItem);
  }, [event, initializeLists, searchParams]);

  const filterList = (division: string) => {
    const matchesDivision = (item: { division?: string }) => item.division?.trim().toLowerCase() === division.trim().toLowerCase();

    setTeamList(event.teams?.filter(matchesDivision) || []);
    setMatchList(event.matches?.filter(matchesDivision) || []);
    setPlayerList(event.players?.filter(matchesDivision) || []);
    setGroupList(event.groups?.filter(matchesDivision) || []);
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDivision = e.target.value;
    setCurrDivision(selectedDivision);
    // eslint-disable-next-line no-unused-expressions
    selectedDivision ? filterList(selectedDivision) : initializeLists();
  };

  const renderContent = () => {
    const renderMap = {
      [EEventItem.PLAYER]: <PlayerList playerList={playerList} />,
      [EEventItem.TEAM]: <TeamList teamList={teamList} groupList={groupList} matchList={matchList} />,
      [EEventItem.MATCH]: <MatchList matchList={matchList} division={currDivision} />,
    };
    return renderMap[selectedItem] || null;
  };

  const renderSponsors = () => (
    <>
      <div className="w-20" key="default-logo">
        <Image width={imgW.xs} height={imgW.xs} src="/free-logo.png" alt={`${APP_NAME}-logo`} />
      </div>
      {event.sponsors?.map((sponsor, index) => <AdvancedImage key={sponsor._id || `sponsor-${index}`} cldImg={cld.image(sponsor.logo.toString())} className="w-20" />)}
    </>
  );

  return (
    <div className="container mx-auto px-4 mb-8">
      <div className="text-center w-full flex flex-col items-center mb-6">
        <Link href={`/${ldoIdUrl}`}>
          <Image height={100} width={100} src="/free-logo.png" alt="youthspike-logo" className="w-24" />
        </Link>
        <h1 className="text-2xl font-bold mt-2">{event.name}</h1>
      </div>

      {!user.token && event.sponsors && (
        <div className="mb-6">
          <h3 className="mb-4 text-lg font-semibold">Sponsors</h3>
          <div className="flex gap-4 flex-wrap">{renderSponsors()}</div>
        </div>
      )}

      <SelectInput handleSelect={handleDivisionChange} name="division" optionList={divisionList} lblTxt="Division" rw="w-3/6 mb-4" />

      <div className="flex flex-col md:flex-row gap-6">
        <motion.div
          className="side-bar w-full md:w-1/4 bg-gray-800 p-4 rounded-md sticky top-4 md:top-20 z-10 md:h-screen overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {event.players?.length || event.teams?.length || event.matches?.length ? (
            <ul className="flex flex-col gap-2">
              {[EEventItem.PLAYER, EEventItem.TEAM, EEventItem.MATCH].map((item) => (
                <motion.li
                  key={item}
                  className={`cursor-pointer p-2 rounded-md text-center ${selectedItem === item ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
                  onClick={() => setSelectedItem(item)}
                  whileHover={{ scale: 1.05 }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          ) : (
            <h3>No matches, teams, or players have been created yet!</h3>
          )}
        </motion.div>

        <div className="content w-full md:w-3/4 rounded-md p-6">{renderContent()}</div>
      </div>
    </div>
  );
}

export default EventDetail;
