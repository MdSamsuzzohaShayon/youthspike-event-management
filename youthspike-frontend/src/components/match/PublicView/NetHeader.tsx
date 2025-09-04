import { useAppDispatch } from "@/redux/hooks";
import { setCurrNetNum } from "@/redux/slices/netSlice";
import {
  EView,
  INetRelatives,
  IServerReceiverOnNetMixed,
  ITeam,
} from "@/types";
import LocalStorageService from "@/utils/LocalStorageService";
import React, { useMemo } from "react";

interface INetHeaderProps {
  view: EView;
  matchId: string;
  net: INetRelatives;
  setView: React.Dispatch<React.SetStateAction<EView>>;
  teamA: ITeam | null;
  teamB: ITeam | null;
  srNet: IServerReceiverOnNetMixed | null;
}

function NetHeader({
  view,
  matchId,
  net,
  setView,
  teamA,
  teamB,
  srNet,
}: INetHeaderProps) {
  const dispatch = useAppDispatch();

  const selectedNet = useMemo(() => {
    return {
      ...net,
      teamAScore: srNet?.teamAScore || net.teamAScore,
      teamBScore: srNet?.teamBScore || net.teamBScore,
    };
  }, [net, srNet]);

  const handleRoundNetSelect = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (view === EView.NET) {
      LocalStorageService.setMatch(matchId, net.round);
      setView(EView.ROUND);
    } else {
      LocalStorageService.setMatch(matchId, net.round, net._id);
      dispatch(setCurrNetNum(net.num));
      setView(EView.NET);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-6 sm:gap-8">
        {/* Title */}
        <h3 className="text-yellow-logo font-extrabold text-2xl sm:text-3xl text-center sm:text-left">
          Net {net.num}
        </h3>

        {/* Scoreboard */}
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {/* Team A */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-yellow-logo rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-black font-extrabold text-3xl sm:text-4xl">
                {selectedNet?.teamAScore || 0}
              </span>
            </div>
            <span className="mt-2 text-yellow-logo text-sm sm:text-base font-bold truncate max-w-[80px] text-center">
              {teamA?.name?.split(" ")[0] || "Team A"}
            </span>
          </div>

          {/* Divider */}
          <span className="text-yellow-logo font-bold text-3xl sm:text-4xl">
            -
          </span>

          {/* Team B */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-logo">
              <span className="text-black font-extrabold text-3xl sm:text-4xl">
                {selectedNet?.teamBScore || 0}
              </span>
            </div>
            <span className="mt-2 text-yellow-logo text-sm sm:text-base font-bold truncate max-w-[80px] text-center">
              {teamB?.name?.split(" ")[0] || "Team B"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center sm:justify-end">
          <button
            className="w-full sm:w-auto px-6 py-3 text-base font-bold rounded-lg bg-yellow-logo text-black hover:bg-yellow-300 transition-all shadow-md"
            onClick={handleRoundNetSelect}
          >
            {view === EView.NET ? "ENTER ROUND" : "ENTER NET"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NetHeader;
