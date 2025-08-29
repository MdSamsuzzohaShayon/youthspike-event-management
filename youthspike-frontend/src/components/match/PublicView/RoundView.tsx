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
  matchId: string;
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
  matchId,
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();

  const { teamAScore, teamBScore } = useMemo(() => {
    let aScore = 0,
      bScore = 0;
    currRoundNets.forEach((n) => {
      // if(!n.teamAScore || !n.teamBScore) return;
      if ((n.teamAScore || 0) > (n.teamBScore || 0)) {
        aScore += n.points;
      } else if ((n.teamAScore || 0) < (n.teamBScore || 0)) {
        bScore += n.points;
      }
    });
    return { teamAScore: aScore, teamBScore: bScore };
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
        {/* Mobile Layout: Stacked */}
        <div className="flex flex-col md:hidden items-center space-y-5">
          {/* Round Title and Navigation */}
          <div className="flex items-center justify-center space-x-5 w-full">
            <Image
              src="/icons/right-arrow.svg"
              alt="Previous Round"
              height={40}
              width={40}
              className="w-8 h-8 svg-white transform rotate-180 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleRoundChangePrev}
            />

            <div className="text-yellow-400 font-bold text-xl text-center bg-black px-4 py-2 rounded-full border border-yellow-400">
              Round {currRound?.num}
            </div>

            <Image
              src="/icons/right-arrow.svg"
              alt="Next Round"
              height={40}
              width={40}
              className="w-8 h-8 svg-white cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleRoundChangeNext}
            />
          </div>

          {/* Teams and Logos */}
          <div className="flex items-center justify-between w-full px-4">
            {/* Team A */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              {teamA?.logo ? (
                <CldImage
                  src={teamA.logo}
                  alt={teamA.name}
                  width={70}
                  height={70}
                  className="w-14 h-14 rounded-full border-4 border-yellow-400 object-cover"
                />
              ) : (
                <TextImg
                  fullText={teamA?.name || "TA"}
                  className="w-14 h-14 rounded-full border-4 border-yellow-400 text-lg font-bold"
                />
              )}
              <span className="text-white font-bold text-sm truncate max-w-[100px] text-center">
                {teamA?.name}
              </span>
            </div>

            {/* VS Badge */}
            <div className="mx-2">
              <div className="bg-yellow-400 text-black font-bold w-12 h-12 rounded-full flex items-center justify-center text-lg mx-auto">
                VS
              </div>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              {teamB?.logo ? (
                <CldImage
                  src={teamB.logo}
                  alt={teamB.name}
                  width={70}
                  height={70}
                  className="w-14 h-14 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <TextImg
                  fullText={teamB?.name || "TB"}
                  className="w-14 h-14 rounded-full border-4 border-white text-lg font-bold"
                />
              )}
              <span className="text-white font-bold text-sm truncate max-w-[100px] text-center">
                {teamB?.name}
              </span>
            </div>
          </div>

          {/* Score Display - Mobile */}
          <div className="flex items-center justify-center space-x-6 w-full px-4">
            {/* Team A Score */}
            <div className="relative">
              <div className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <div className="text-black font-bold text-5xl md:text-6xl">
                  {teamAScore}
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="text-yellow-400 font-bold text-4xl">-</div>

            {/* Team B Score */}
            <div className="relative">
              <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-400">
                <div className="text-black font-bold text-5xl md:text-6xl">
                  {teamBScore}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout: Horizontal */}
        <div className="hidden md:flex items-center justify-between">
          {/* Team A */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            {teamA?.logo ? (
              <CldImage
                src={teamA.logo}
                alt={teamA.name}
                width={100}
                height={100}
                className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover"
              />
            ) : (
              <TextImg
                fullText={teamA?.name || "TA"}
                className="w-20 h-20 rounded-full border-4 border-yellow-400 text-xl font-bold"
              />
            )}
            <span className="text-white font-bold text-lg text-center max-w-[150px]">
              {teamA?.name}
            </span>
          </div>

          {/* Score Display - Desktop */}
          <div className="flex items-center justify-center space-x-8 mx-6">
            {/* Team A Score */}
            <div className="relative">
              <div className="w-40 h-40 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl border-6 border-white">
                <div className="text-black font-bold text-7xl">
                  {teamAScore}
                </div>
              </div>
            </div>

            {/* Center: VS and Round Navigation */}
            <div className="flex flex-col items-center space-y-4 mx-2">
              <div className="bg-yellow-400 text-black font-bold w-16 h-16 rounded-full flex items-center justify-center text-2xl">
                VS
              </div>

              <div className="text-yellow-400 font-bold text-xl text-center bg-black px-5 py-2 rounded-full border-2 border-yellow-400">
                Round {currRound?.num}
              </div>

              <div className="flex items-center space-x-4">
                <Image
                  src="/icons/right-arrow.svg"
                  alt="Previous Round"
                  height={50}
                  width={50}
                  className="w-12 h-12 svg-white transform rotate-180 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleRoundChangePrev}
                />
                <Image
                  src="/icons/right-arrow.svg"
                  alt="Next Round"
                  height={50}
                  width={50}
                  className="w-12 h-12 svg-white cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={handleRoundChangeNext}
                />
              </div>
            </div>

            {/* Team B Score */}
            <div className="relative">
              <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-6 border-yellow-400">
                <div className="text-black font-bold text-7xl">
                  {teamBScore}
                </div>
              </div>
            </div>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center space-y-3 flex-1">
            {teamB?.logo ? (
              <CldImage
                src={teamB.logo}
                alt={teamB.name}
                width={100}
                height={100}
                className="w-20 h-20 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <TextImg
                fullText={teamB?.name || "TB"}
                className="w-20 h-20 rounded-full border-4 border-white text-xl font-bold"
              />
            )}
            <span className="text-white font-bold text-lg text-center max-w-[150px]">
              {teamB?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Nets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currRoundNets.map((net: INetRelatives, index: number) => (
          <NetInRoundView
            key={index}
            srNet={srMap.get(net._id) || null}
            net={net}
            setView={setView}
            teamA={teamA}
            teamB={teamB}
            currRoundNets={currRoundNets}
            teamAPlayers={teamAPlayers}
            teamBPlayers={teamBPlayers}
            matchId={matchId}
          />
        ))}
      </div>
    </div>
  );
};

export default RoundView;
