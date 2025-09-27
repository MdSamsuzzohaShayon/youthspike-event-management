import React from 'react';
import { INetRelatives, IPlayer, ITeam } from '@/types';
import NetInputItem from './NetInputItem';

interface NetSelectionPanelProps {
  currRoundNets: INetRelatives[];
  currNetNum: number;
  playerMap: Map<string, IPlayer>;
  teamA: ITeam;
  teamB: ITeam;
  onNetChange: (e: React.SyntheticEvent, netNum: number) => void;
}

export default function NetSelectionPanel({
  currRoundNets,
  currNetNum,
  playerMap,
  teamA,
  teamB,
  onNetChange,
}: NetSelectionPanelProps) {
  return (
    <div className="space-y-2 md:space-y-3">
      <div className="md:hidden">
        <ul className="grid grid-cols-1 gap-2 list-none">
          {currRoundNets.map((n) => (
            <NetInputItem
              key={n._id}
              onNetChange={onNetChange}
              net={n}
              playerMap={playerMap}
              teamA={teamA}
              teamB={teamB}
              isCurrentNet={n.num === currNetNum}
            />
          ))}
        </ul>
      </div>
      
      <div className="hidden md:block">
        <ul className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 list-none">
          {currRoundNets.map((n) => (
            <NetInputItem
              key={n._id}
              onNetChange={onNetChange}
              net={n}
              playerMap={playerMap}
              teamA={teamA}
              teamB={teamB}
              isCurrentNet={n.num === currNetNum}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}