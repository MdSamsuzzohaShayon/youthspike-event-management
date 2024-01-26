import { IPlayer, IMatch, ITeam, IOption } from '@/types';
import { UserRole } from '@/types/user';
import React, { useEffect, useState } from 'react';
import MatchCard from './MatchCard';
import { divisionsToOptionList } from '@/utils/helper';
import SelectInput from '../elements/forms/SelectInput';
import { useUser } from '@/lib/UserProvider';

interface ITeamCaptain extends ITeam {
  captain: IPlayer;
}

interface IMatchDetail extends IMatch {
  teamA: ITeamCaptain;
  teamB: ITeamCaptain;
}



interface IMatchListProps {
  eventId: string;
  matchList?: IMatchDetail[];
  divisions: string;
}

function MatchList({ matchList, divisions, eventId }: IMatchListProps) {
  const [filteredMatchList, setFilteredMatchList] = useState<IMatch[]>([]);
  const [divisionList, setDivisionList] = useState<IOption[]>([]);
  const user = useUser();

  const handleDivisionChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!matchList) return;
    const inputEl = e.target as HTMLSelectElement;
    let filteredList = [...matchList];
    if (user.info?.captainplayer) {
      filteredList = [...filteredList.filter((ml) => ml.teamA.captain._id === user.info?.captainplayer || ml.teamB.captain._id === user.info?.captainplayer)];
    }
    if (inputEl.value !== "") {
      filteredList = filteredList.filter((m) => m.divisions && m.divisions.trim().toLowerCase() === inputEl.value.trim().toLowerCase());
    }
    setFilteredMatchList([...filteredList]);
  }


  useEffect(() => {
    if (matchList && matchList.length > 0) {
      const isCaptain = user.info?.captainplayer
      if (user.info?.captainplayer) {
        setFilteredMatchList([...matchList.filter((ml) => ml.teamA.captain._id === user.info?.captainplayer || ml.teamB.captain._id === user.info?.captainplayer)]);
      } else {
        setFilteredMatchList([...matchList]);
      }
    }


    if (divisions && divisions !== '') {
      const divOptionList = divisionsToOptionList(divisions);
      setDivisionList(divOptionList)
    }
  }, [matchList, divisions]);


  return (
    <div className='matchList w-full flex flex-col md:flex-row justify-between gap-1 flex-wrap'>
      {user?.info?.role !== UserRole.captain && <SelectInput handleSelect={handleDivisionChange} name='division' optionList={divisionList} lblTxt='Division' rw='w-3/6 md:w-5/12' extraCls='mb-4' />}
      

      {filteredMatchList.length > 0 && filteredMatchList.map((match: IMatch, i) => <MatchCard eventId={eventId} key={match._id} match={match} sl={i + 1} />)}
    </div>
  )
}

export default MatchList;