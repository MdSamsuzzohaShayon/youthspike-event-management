import {
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import React from "react";
import "./RoundView.css";
import Image from "next/image";

interface IRoundViewProps {
  roundList: IRoundRelatives[];
  allNets: INetRelatives[];
  currRoundNets: INetRelatives[];
  currRound: IRoundRelatives | null;
  teamA: ITeam | null;
  teamB: ITeam | null;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  setView: React.Dispatch<React.SetStateAction<EView>>;
  srMap: Map<string, IServerReceiverOnNetMixed>;
  matchId: string;
  view: EView;
}

const TeamScore = () => (
  <div className="w-full flex flex-col justify-center items-center">
    <Image
      className="w-20"
      height={50}
      width={50}
      alt="team-a"
      src="/empty-img.jpg"
    />
    <div className="score text-6xl text-center">4</div>
  </div>
);

const TeamInNet = () => (
  <div className="team-a w-3/6 flex items-center justify-start gap-x-2 border-1 border-yellow-logo">
    <div className="w-4/12 flex flex-col items-center">
      <Image
        className="w-full"
        height={50}
        width={50}
        alt="player-a"
        src="/imgs/player.png"
      />
      <h4 className="uppercase word-breaks">Lionel Messi</h4>
    </div>
    <Image
      className="w-3/12"
      height={50}
      width={50}
      alt="team-a"
      src="/empty-img.jpg"
    />
    <div className="w-4/12 flex flex-col items-center">
      <Image
        className="w-full"
        height={50}
        width={50}
        alt="player-a"
        src="/imgs/player.png"
      />
      <h4 className="uppercase word-breaks">Lionel Messi</h4>
    </div>
  </div>
);

const NetInRound = () => {
  return (
    <div className="w-full border">
      {/* Top side  */}
      <div className="top-side flex justify-between items-center">
        <TeamInNet />
        <TeamInNet />
      </div>

      {/* Bottom side  */}
      <div className="bottom-side flex justify-between items-center">
        <div className="team-a-score bg-gray-100 text-black text-6xl p-2">
          9
        </div>
        <div className="player-actions"></div>
        <div className="w-4/12 flex flex-col items-center">
          <h2>ACE</h2>
          <Image
            className="w-12"
            height={50}
            width={50}
            alt="player-a"
            src="/imgs/player.png"
          />
          <h4 className="uppercase word-breaks">Lionel Messi</h4>
        </div>
        <div className="team-a-score bg-red-400 text-black text-6xl p-2">
          12
        </div>
      </div>
    </div>
  );
};

const RoundView = ({
  roundList,
  allNets,
  currRound,
  currRoundNets,
  teamA,
  teamB,
  teamAPlayers,
  teamBPlayers,
  setView,
  srMap,
  matchId,
  view,
}: IRoundViewProps) => {
  return (
    <div className="round-view w-full">
      {/* SHow team score here only for poietrat  */}
      <div className="team-score-poietrat flex justify-center items-center gap-2">
        <TeamScore />
        <TeamScore />
      </div>

      {/* First row  */}
      <div className="two-nets-row w-full flex justify-between items-center flex-wrap gap-2">
        {/* In this row there will be 2 nets */}
        <div className="net-in-round">
          <NetInRound />
        </div>
        <div className="net-in-round">
          <NetInRound />
        </div>
      </div>

      {/* Second row  */}
      <div className="two-nets-row w-full flex justify-between items-center flex-wrap gap-x-2 mt-2">
        <div className="team-score">
          <TeamScore />
        </div>
        {/* In this row there will be 2 nets */}
        <div className="net-in-round">
          <NetInRound />
        </div>
        <div className="team-score">
          <TeamScore />
        </div>
      </div>
    </div>
  );
};

export default RoundView;
