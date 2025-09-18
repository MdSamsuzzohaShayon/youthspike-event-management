import React from 'react';
import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam } from '@/types/team';
import { calcRoundScore } from '@/utils/helper';

interface IPointsByRoundProps {
  roundList: IRoundRelatives[];
  teamE: ETeam;
  allNets: INetRelatives[];
  dark?: boolean;
}

function PointsByRound({ roundList, dark, allNets, teamE}: IPointsByRoundProps) { 
  
  
  

  const calcScore = (round: IRoundRelatives): React.ReactNode => {

    const score  = calcRoundScore(allNets.filter((n) => n.round === round._id), teamE);

    return (
      <React.Fragment>
        <p className={`base-point h-8 w-8 ${dark ? "bg-gray-100 text-gray-900" : "border"} rounded-full text-center flex justify-center items-center`}>
          {score}</p>
      </React.Fragment>
    );
  };

  return (
    <div className={`points-by-round flex justify-center items-center w-full text-gray-100 gap-x-1`}>
      {roundList.map((round, i) => (
        <div className={`r-box w-12 flex flex-col justify-center items-center`} key={i}>
          {calcScore(round)}
        </div>
      ))}
    </div>
  );
}

export default PointsByRound;