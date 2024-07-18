import React, { useEffect, useState } from 'react';
import { IError, IEvent, IMenuItem, IOption, IPlayer, IPlayerRanking, IPlayerRankingExpRel, ITeam } from '@/types';
import { setDivisionToStore, setTeamToStore } from '@/utils/localStorage';
import { useMutation } from '@apollo/client';
import { UPDATE_TEAM } from '@/graphql/teams';
import Link from 'next/link';
import { initialUserMenuList } from '@/utils/staticData';
import { getUserFromCookie } from '@/utils/cookie';
import { getEventIdFromPath, rearrangeMenu } from '@/utils/helper';
import { usePathname } from 'next/navigation';
import { AdvancedImage } from '@cloudinary/react';
import { EPlayerStatus } from '@/types/player';
import cld from '@/config/cloudinary.config';
import PlayerSelectInput from '../elements/forms/PlayerSelectInput';
import PlayerList from '../player/PlayerList';
import useLdoUrl from '@/hooks/useLdoUrl';
import Image from 'next/image';

interface ITeamDetailProps {
  event: IEvent;
  team: ITeam;
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  divisionList: IOption[];
  teamList: ITeam[];
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
  refetchFunc?: () => Promise<void>;
  playerList: IPlayer[];
  playerRanking: IPlayerRankingExpRel;
}

function TeamDetail({ event, team, eventId, setIsLoading, divisionList, teamList, setActErr, refetchFunc, playerList, playerRanking }: ITeamDetailProps) {
  const pathname = usePathname();
  const ldoUrl = useLdoUrl();

  // ===== Local State =====
  const [addPlayer, setAddPlayer] = useState<boolean>(false);
  const [filteredPlayers, setFilteredPlayers] = useState<IPlayer[]>([]);
  const [playerIdsToAdd, setPlayerIdsToAdd] = useState<string[]>([]);
  const [userMenuList, setUserMenuList] = useState<IMenuItem[]>(initialUserMenuList);

  // ===== GraphQL =====
  const [mutateTeam] = useMutation(UPDATE_TEAM);

  // ===== Change Events =====
  const handleCheckboxChange = (pId: string, isChecked: boolean) => {
    if (isChecked) {
      // @ts-ignore
      setPlayerIdsToAdd((prevState) => [...new Set([...prevState, pId])]);
    } else {
      setPlayerIdsToAdd((prevState) => prevState.filter((p) => p !== pId));
    }
  };

  const handleAddPlayersToTeam = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await mutateTeam({ variables: { input: { players: playerIdsToAdd }, teamId: team._id, eventId: event._id } });
      if (refetchFunc) refetchFunc();
      setAddPlayer(false);
    } catch (error) {
      console.log(error);
      // @ts-ignore
      setActErr({ name: error.name, message: error.message, main: error });
    }
  };

  useEffect(() => {
    // Set division
    setDivisionToStore(team.division);
    setTeamToStore(team._id);

    // ===== Set Menu Items =====
    const userDetail = getUserFromCookie();
    if (userDetail) {
      // ===== Check path has event Id or not
      const eventPath = getEventIdFromPath(pathname);
      const menuItemList = rearrangeMenu(userDetail, eventPath);
      setUserMenuList(menuItemList);
    }
  }, []);

  useEffect(() => {
    // Get available players from all player list
    const napList: IPlayer[] = playerList ? playerList.filter((p: IPlayer) => !p.teams || p.teams.length === 0) : []; // nap List = new available players List
    let nfpList = [...napList]; // fnp List = new filtered player List
    nfpList = napList.filter((p) => p.division && p.division.trim().toLowerCase() === team.division.trim().toLowerCase());
    setFilteredPlayers(nfpList);
  }, []);

  const activePlayers = team?.players ? team.players.filter((p) => p.status === EPlayerStatus.ACTIVE) : [];
  const inactivePlayers = team?.players ? team.players.filter((p) => p.status !== EPlayerStatus.ACTIVE) : [];
  

  return (
    <>
      <h1 className="uppercase text-center">Teams/roster</h1>
      <h1 className="uppercase text-center">{event?.name}</h1>

      {/* Team detail  */}
      <div className="team-detail mt-4 w-full flex justify-center flex-col items-center">
        {team.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="w-20 md:w-32" /> : <Image src="/icons/sports-man.svg" width={100} height={100} alt='free-logo' className="w-20 md:w-32 h-20 md:h-32" />}
        <h1 className="capitalize">{team && team.name}</h1>
        <div className="navigator w-full flex justify-center items-center gap-x-2 flex-wrap mt-4">
          {userMenuList.map((item, iIdx) => (
            <Link key={item.id} href={item.id === 8 || item.id === 5 ? `${item.link}` : `/${eventId}${item.link}`}>
              {iIdx !== 0 && '|'} {item.text}
            </Link>
          ))}
        </div>
      </div>

      {addPlayer ? (
        <>
          <div className="flex w-full justify-between items-center mb-4">
            <h3>Add Player to Team</h3>
            <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(false)}>
              Player List
            </button>
          </div>
          <form onSubmit={handleAddPlayersToTeam} className="mb-4">
            <PlayerSelectInput availablePlayers={filteredPlayers} eventId={eventId} handleCheckboxChange={handleCheckboxChange} name="add-player-to-team" ldoUrl={ldoUrl} />
            <button type="submit" className="btn-primary mt-4">
              Add
            </button>
          </form>
        </>
      ) : (
        <div className="bulk-operations-players mt-8">
          <div className="flex w-full justify-between items-center">
            <h3 className="mt-4">Player List</h3>
            <button className="btn-info mt-4" type="button" onClick={() => setAddPlayer(true)}>
              Add Player to Team
            </button>
          </div>

          <div className="sortable-active-player-list mt-4">
            <PlayerList
              playerList={activePlayers}
              eventId={eventId}
              setIsLoading={setIsLoading}
              rankControls
              refetchFunc={refetchFunc}
              teamList={teamList}
              divisionList={divisionList}
              teamId={team._id}
              showRank
              playerRanking={playerRanking}
            />
          </div>

          {inactivePlayers.length > 0 && (
            <div className="sortable-inactive-player-list mt-4">
              <h3 className="my-4">Inactive Player List</h3>
              <PlayerList
                playerList={inactivePlayers}
                eventId={eventId}
                setIsLoading={setIsLoading}
                rankControls
                refetchFunc={refetchFunc}
                teamList={teamList}
                divisionList={divisionList}
                teamId={team._id}
              />
            </div>
          )}
        </div>
      )}

      {/* Show captain  */}
      {/* <CaptainCard team={team} /> */}
    </>
  );
}

export default TeamDetail;
