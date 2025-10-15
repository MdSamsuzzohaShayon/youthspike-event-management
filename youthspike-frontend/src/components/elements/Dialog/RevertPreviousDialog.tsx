import ServerReceiverPlayInput from "@/components/ScoreKeeping/ServerReceiverPlayInput";
import {
  IAccessCode,
  IMatchRelatives,
  INetRelatives,
  IPlayer,
  IRoom,
  IServerReceiverSinglePlay,
} from "@/types";
import EmitEvents from "@/utils/socket/EmitEvents";
import React, { useMemo } from "react";
import { Socket } from "socket.io-client";

interface IRevertPreviousDialogProps {
  revertPlayEl: React.RefObject<HTMLDialogElement | null>;
  currPlays: IServerReceiverSinglePlay[];
  dispatch: React.Dispatch<React.SetStateAction<any>>;
  currMatch: IMatchRelatives;
  currNetNum: number;
  currRoom: IRoom | null;
  playerMap: Map<string, IPlayer>;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  netByNum?: Map<number, INetRelatives>;
  socket?: Socket | null;
  token?: string | null;
  accessCode?: IAccessCode | null;
}

function RevertPreviousDialog({
  revertPlayEl,
  currPlays,
  socket,
  dispatch,
  currMatch,
  netByNum,
  currNetNum,
  token,
  accessCode,
  currRoom,
  playerMap,
  teamAPlayers,
  teamBPlayers,
}: IRevertPreviousDialogProps) {

  
  const handleRevertPlay = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!socket) {
      console.log("No socket found");
      return;
    }
    if(!netByNum){
      console.log("No net number found");
      return;
    }
    const emit = new EmitEvents(socket, dispatch);
    if (currPlays.length === 1) {
      // Reset
      const net = netByNum.get(currNetNum);
      emit.resetScores({
        match: currMatch._id,
        net: net?._id || null,
        room: currRoom?._id || null,
        accessCode: accessCode?.code.toString() || token || null,
      });
    } else {
      const highestPlay = currPlays.reduce(
        (max, current) => (current.play > max.play ? current : max),
        currPlays[0]
      );
      const lastPlay: number = highestPlay.play;
      emit.revertPlay({
        match: currMatch._id,
        net: netByNum.get(currNetNum)?._id || null,
        room: currRoom?._id || null,
        accessCode: token || accessCode?.code || null,
        play: lastPlay,
      });
    }
    revertPlayEl.current?.close();
  };

  const lastPlay = useMemo(() => {
    return currPlays.reduce(
      (max, current) => (current.play > max.play ? current : max),
      currPlays[0]
    );
  }, [currPlays]);

  return (
    <dialog ref={revertPlayEl} className="modal-dialog">
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold text-yellow-400">
          Revert to previous play
        </h2>

        {lastPlay && (
          <div className="flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              <ServerReceiverPlayInput
                sr={lastPlay}
                playerMap={playerMap}
                key={`last-play-${lastPlay.play}`}
                teamAPlayers={teamAPlayers}
                teamBPlayers={teamBPlayers}
              />
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-300">
          ⚠️ Warning: This will revert the previous play (one single play back).
          From that play you can continue the game. But this record will be
          deleted.
        </p>

        <div className="flex justify-end gap-3 pt-4">
          <button
            className="bg-yellow-logo hover:bg-yellow-400 text-black px-4 py-2 rounded-md font-medium transition duration-200"
            onClick={handleRevertPlay}
          >
            Confirm
          </button>
          <button
            className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
            onClick={(e) => {
              revertPlayEl.current?.close();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default RevertPreviousDialog;
