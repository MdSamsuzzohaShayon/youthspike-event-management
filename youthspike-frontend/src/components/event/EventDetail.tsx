import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AdvancedImage } from '@cloudinary/react';
import { useUser } from '@/lib/UserProvider';
import { useAppDispatch } from '@/redux/hooks';
import cld from '@/config/cloudinary.config';
import { IEvent, IGroup, IMatchExpRel, IPlayer, ITeam } from '@/types';
import { EEventItem } from '@/types/event';
import { setRankingMap, setTeamsPlayerRanking } from '@/redux/slices/playerRankingSlice';
import { divisionsToOptionList } from '@/utils/helper';
import { EVENT_ITEM, imgW, APP_NAME } from '@/utils/constant';

import { useLdoId } from '@/lib/LdoProvider';
import MatchList from '../match/MatchList';
import TeamList from '../team/TeamList';
import SelectInput from '../elements/SelectInput';
import PlayerStandings from '../player/PlayerStandings';

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

  const [selectedItem, setSelectedItem] = useState<EEventItem>(EEventItem.TEAM);
  const [currDivision, setCurrDivision] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const divisionList = useMemo(() => divisionsToOptionList(event.divisions || []), [event.divisions]);
  const groupList = useMemo(() => {
    if (!currDivision || currDivision === '') {
      // If currDivision is null or empty string, return the entire group list
      return event.groups || [];
    }
    // Filter groups based on the division
    return (event.groups || []).filter((group) => group.division?.trim().toLowerCase() === currDivision.trim().toLowerCase());
  }, [event.groups, currDivision]);

  const filteredData = useMemo(() => {
    const filterByDivision = (item: { division?: string }) => (currDivision ? item.division?.trim().toLowerCase() === currDivision.trim().toLowerCase() : true);

    const filterByGroup = (item: { group?: { _id: string } }) => (selectedGroup ? item.group?._id === selectedGroup : true);

    return {
      teams: event.teams?.filter(filterByDivision).filter(filterByGroup) || [],
      matches: event.matches?.filter(filterByDivision) || [],
      players: event.players?.filter(filterByDivision) || [],
    };
  }, [event, currDivision, selectedGroup]);

  const initializeLists = useCallback(() => {
    const rankingMap = new Map();

    const teamsPlayerRanking = event.teams?.reduce((rankings, team) => {
      if (!team?.playerRanking?.rankLock) {
        rankings.push({
          ...team.playerRanking,
          team: { _id: team._id, name: team.name, division: team.division, event: event._id },
        });
        team?.playerRanking?.rankings?.forEach(({ player, rank }) => rankingMap.set(player._id, rank));
      }
      return rankings;
    }, [] as any[]);

    dispatch(setTeamsPlayerRanking(teamsPlayerRanking || []));
    dispatch(setRankingMap(Array.from(rankingMap)));
  }, [dispatch, event]);

  useEffect(() => {
    initializeLists();
    const eventItem = searchParams.get(EVENT_ITEM) as EEventItem;
    if (eventItem) setSelectedItem(eventItem);
  }, [event, initializeLists, searchParams]);

  const renderContent = useMemo(() => {
    const renderMap = {
      [EEventItem.PLAYER]: <PlayerStandings playerList={filteredData.players} matchList={filteredData.matches} />,
      [EEventItem.TEAM]: <TeamList teamList={filteredData.teams} selectedGroup={selectedGroup} matchList={filteredData.matches} />,
      [EEventItem.MATCH]: <MatchList matchList={filteredData.matches} />,
    };
    return renderMap[selectedItem] || null;
  }, [filteredData, selectedGroup, selectedItem]);

  const renderSponsors = useMemo(
    () => (
      <>
        <div className="w-20" key="default-logo">
          <Image width={imgW.xs} height={imgW.xs} src="/free-logo.png" alt={`${APP_NAME}-logo`} />
        </div>
        {event.sponsors?.map((sponsor, index) => <AdvancedImage key={sponsor._id || `sponsor-${index}`} cldImg={cld.image(sponsor.logo.toString())} className="w-20" />)}
      </>
    ),
    [event.sponsors],
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
          <div className="flex gap-4 flex-wrap">{renderSponsors}</div>
        </div>
      )}

      <div className="w-full mb-4 p-4 bg-gray-800 rounded-md">
        <div className="w-full flex justify-center items-center">
          <SelectInput
            key="d-i-1"
            handleSelect={(e) => setCurrDivision(e.target.value)}
            defaultTxt="Select division"
            defaultValue=""
            name="division"
            optionList={divisionList}
            lblTxt="Division"
            vertical
            extraCls="text-center w-full lg:w-2/12"
          />
        </div>
        <div className="w-full flex justify-center items-center">
          <SelectInput
            key="g-i-1"
            handleSelect={(e) => setSelectedGroup(e.target.value || null)}
            defaultTxt="Overall"
            defaultValue=""
            name="group"
            optionList={groupList.map((g) => ({ value: g._id, text: g.name }))}
            lblTxt="Group"
            vertical
            extraCls="text-center w-full lg:w-2/12"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div className="side-bar w-full lg:w-1/4 bg-gray-800 p-4 rounded-md lg:h-screen overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          {event.players?.length || event.teams?.length || event.matches?.length ? (
            <ul className="flex flex-col gap-2">
              {[EEventItem.PLAYER, EEventItem.TEAM, EEventItem.MATCH].map((item) => (
                <motion.li
                  key={item}
                  className={`cursor-pointer p-2 rounded-md uppercase text-center ${selectedItem === item ? 'bg-yellow-500 text-black font-semibold' : 'bg-gray-700 text-white'}`}
                  onClick={() => setSelectedItem(item)}
                  whileHover={{ scale: 1.05 }}
                >
                  {item === EEventItem.TEAM ? `Standings / Teams` : item}
                </motion.li>
              ))}
            </ul>
          ) : (
            <h3>No matches, teams, or players have been created yet!</h3>
          )}
        </motion.div>

        <div className="content w-full lg:w-3/4 rounded-md">{renderContent}</div>
      </div>
    </div>
  );
}

export default EventDetail;
