import {
  ESRRole,
  EView,
  INetRelatives,
  IPlayer,
  IRoundRelatives,
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
}: IRoundViewProps) => {
  const dispatch = useAppDispatch();

  const teamAPlayerMap = useMemo(() => {
    return new Map(teamAPlayers.map((p) => [p._id, p]));
  }, [teamAPlayers, currRoundNets]);
  const teamBPlayerMap = useMemo(() => {
    return new Map(teamBPlayers.map((p) => [p._id, p]));
  }, [teamBPlayers, currRoundNets]);

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
                  {currRound?.teamAScore || 0}
                </span>
                <span className="text-yellow-400 font-bold text-2xl md:text-3xl">
                  -
                </span>
                <span className="text-white font-bold text-2xl md:text-3xl">
                  {currRound?.teamBScore || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currRoundNets.map((net: INetRelatives, index: number) => (
          <div
            key={index}
            className="bg-gray-800 p-4 md:p-5 rounded-xl shadow-lg border border-gray-700 hover:border-yellow-400 transition-all duration-300"
          >
            {/* Net Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-600">
              <h3 className="text-yellow-400 font-bold text-lg">
                Net {net.num}
              </h3>
              <button
                className="btn btn-info"
                onClick={() => {
                  setView(EView.NET);
                }}
              >
                Enter
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-white font-semibold bg-black px-2 py-1 rounded text-sm">
                  {net?.teamAScore || 0}
                </span>
                <span className="text-gray-400">-</span>
                <span className="text-white font-semibold bg-black px-2 py-1 rounded text-sm">
                  {net?.teamBScore || 0}
                </span>
              </div>
            </div>

            {/* Team A Players */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                {teamA && teamA.logo ? (
                  <CldImage
                    src={teamA.logo}
                    alt={teamA.name}
                    width={30}
                    height={30}
                    className="w-6 h-6 mr-2 rounded-full object-cover"
                  />
                ) : (
                  <TextImg
                    fullText={teamA?.name?.charAt(0) || "A"}
                    className="w-6 h-6 mr-2 text-xs"
                  />
                )}
                <span className="text-white text-sm font-semibold">
                  {teamA?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {net?.teamAPlayerA && (
                  <PlayerView
                    key={net.teamAPlayerA}
                    player={teamAPlayerMap.get(net.teamAPlayerA) || null}
                    role={ESRRole.SERVER}
                  />
                )}
                {net?.teamAPlayerB && (
                  <PlayerView
                    key={net.teamAPlayerB}
                    player={teamAPlayerMap.get(net.teamAPlayerB) || null}
                    role={ESRRole.SERVER}
                  />
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex justify-center my-3">
              <div className="w-10 h-px bg-yellow-400"></div>
            </div>

            {/* Team B Players */}
            <div>
              <div className="flex items-center mb-2">
                {teamB && teamB.logo ? (
                  <CldImage
                    src={teamB.logo}
                    alt={teamB.name}
                    width={30}
                    height={30}
                    className="w-6 h-6 mr-2 rounded-full object-cover"
                  />
                ) : (
                  <TextImg
                    fullText={teamB?.name?.charAt(0) || "B"}
                    className="w-6 h-6 mr-2 text-xs"
                  />
                )}
                <span className="text-white text-sm font-semibold">
                  {teamB?.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {net.teamBPlayerA && (
                  <PlayerView
                    key={net.teamBPlayerA}
                    player={teamBPlayerMap.get(net.teamBPlayerA) || null}
                    role={ESRRole.SERVER}
                  />
                )}
                {net.teamBPlayerB && (
                  <PlayerView
                    key={net.teamBPlayerB}
                    player={teamBPlayerMap.get(net.teamBPlayerB) || null}
                    role={ESRRole.SERVER}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoundView;
