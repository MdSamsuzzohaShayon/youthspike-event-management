import {
  ESRRole,
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import PlayerView from "./PlayerView";
import TextImg from "@/components/elements/TextImg";
import React, { useCallback, useMemo } from "react";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
import { useAppDispatch } from "@/redux/hooks";
import { setCurrentRoundNets } from "@/redux/slices/netSlice";
import { setCurrentRound, setRoundList } from "@/redux/slices/roundSlice";
import NetInRoundView from "./NetInRoundView";

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
}

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
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();



  const {teamAScore, teamBScore} = useMemo(()=>{
    let aScore = 0, bScore = 0;
    currRoundNets.forEach(n => {
      // if(!n.teamAScore || !n.teamBScore) return;
      if((n.teamAScore || 0) > (n.teamBScore||0)){
        aScore += n.points;
      }else if((n.teamAScore || 0) < (n.teamBScore||0)){
        bScore += n.points;
      }
    });
    return {teamAScore: aScore, teamBScore: bScore}
  }, [currRoundNets]);

  // Precompute lookups for faster access
  const roundIdToIndex = useMemo(() => {
    const map: Record<string, number> = {};
    roundList.forEach((round, idx) => {
      map[round._id] = idx;
    });
    return map;
  }, [roundList]);

  const netsByRound = useMemo(() => {
    const map: Record<string, typeof allNets> = {};
    allNets.forEach((net) => {
      if (!map[net.round]) map[net.round] = [];
      map[net.round].push(net);
    });
    return map;
  }, [allNets]);

  const changeTheRound = useCallback(
    (targetRoundIndex: number) => {
      const roundObj = roundList[targetRoundIndex];
      if (!roundObj) return;

      // Avoid filtering all nets every time → O(1) lookup
      const filteredNets = netsByRound[roundObj._id] ?? [];
      dispatch(setCurrentRoundNets(filteredNets));

      // Update team process if needed
      dispatch(setCurrentRound(roundObj));

      // Update only the changed round (less copying)
      const newRoundList = [...roundList];
      newRoundList[targetRoundIndex] = roundObj;
      dispatch(setRoundList(newRoundList));
    },
    [dispatch, netsByRound, roundList]
  );

  const handleRoundChangePrev = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!currRound) return;

      const currIdx = roundIdToIndex[currRound._id];
      if (currIdx > 0) {
        const prevIdx = currIdx - 1;
        changeTheRound(prevIdx);
      }
    },
    [currRound, roundIdToIndex, changeTheRound]
  );

  const handleRoundChangeNext = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      if (!currRound) return;

      const currIdx = roundIdToIndex[currRound._id];
      if (currIdx < roundList.length - 1) {
        const nextIdx = currIdx + 1;
        changeTheRound(nextIdx);
      }
    },
    [currRound, roundIdToIndex, roundList.length, changeTheRound]
  );

  return (
    <div className="bg-gray-900 min-h-screen p-4 md:p-6 rounded-xl">
      {/* Header Section */}
      <div className="bg-gray-800 rounded-xl p-4 md:p-6 mb-6 shadow-lg border border-gray-700">
        {/* Container */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Left: Round Title */}
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 text-center md:text-left">
            Round {currRound?.num}
          </h2>

          {/* Center: Teams + VS */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-6 space-y-3 md:space-y-0 justify-center">
            {/* Team A */}
            <div className="flex items-center space-x-2">
              {teamA?.logo ? (
                <CldImage
                  src={teamA.logo}
                  alt={teamA.name}
                  width={60}
                  height={60}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-yellow-400 object-cover"
                />
              ) : (
                <TextImg
                  fullText={teamA?.name || "TA"}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-yellow-400"
                />
              )}
              <span className="text-white font-bold text-sm md:text-base">
                {teamA?.name}
              </span>
            </div>

            {/* VS Badge */}
            <div className="bg-yellow-400 text-black font-bold px-3 py-1 rounded-full text-xs md:text-sm text-center">
              VS
            </div>

            {/* Team B */}
            <div className="flex items-center space-x-2">
              <span className="text-white font-bold text-sm md:text-base">
                {teamB?.name}
              </span>
              {teamB?.logo ? (
                <CldImage
                  src={teamB.logo}
                  alt={teamB.name}
                  width={60}
                  height={60}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <TextImg
                  fullText={teamB?.name || "TB"}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-white"
                />
              )}
            </div>
          </div>

          {/* Right: Score */}
          <div className="flex justify-center md:justify-end">
            <div className="change-round flex justify-conter items-center">
              <div className="change-round flex justify-center items-center space-x-4">
                {/* Left arrow (rotated) */}
                <Image
                  src="/icons/right-arrow.svg"
                  alt="Previous Round"
                  height={50}
                  width={50}
                  className="w-12 svg-white transform rotate-180"
                  role="presentation"
                  onClick={handleRoundChangePrev}
                />

                {/* Right arrow (normal) */}
                <Image
                  src="/icons/right-arrow.svg"
                  alt="Next Round"
                  height={50}
                  width={50}
                  className="w-12 svg-white"
                  onClick={handleRoundChangeNext}
                />
              </div>
            </div>
            <div className="bg-black px-6 py-3 rounded-lg border border-yellow-400 shadow-inner">
              <div className="flex items-center space-x-4">
                <span className="text-white font-bold text-2xl md:text-3xl">
                  {teamAScore}
                </span>
                <span className="text-yellow-400 font-bold text-2xl md:text-3xl">
                  -
                </span>
                <span className="text-white font-bold text-2xl md:text-3xl">
                  {teamBScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currRoundNets.map((net: INetRelatives, index: number) => (
          <NetInRoundView key={index} srNet={srMap.get(net._id) || null} net={net} setView={setView} teamA={teamA} teamB={teamB} currRoundNets={currRoundNets} teamAPlayers={teamAPlayers} teamBPlayers={teamBPlayers} />
        ))}
      </div>
    </div>
  );
};

export default RoundView;
