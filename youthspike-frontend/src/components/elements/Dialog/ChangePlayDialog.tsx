import ServerReceiverPlayInput from "@/components/ScoreKeeping/ServerReceiverPlayInput";
import { IPlayer, IServerReceiverSinglePlay } from "@/types";
import React from "react";

interface IChangePlayDialogProps {
  changePlayEl: React.RefObject<HTMLDialogElement | null>;
  currPlays: IServerReceiverSinglePlay[];
  teamAById: Map<string, IPlayer>;
  teamBById: Map<string, IPlayer>;
  toBeSelectedPlay: null | number;
  setToBeSelectedPlay: React.Dispatch<React.SetStateAction<number | null>>;
  teamAPlayers: IPlayer[];
  teamBPlayers: IPlayer[];
  handlePlayChange: () => void;
}

function ChangePlayDialog({
  changePlayEl,
  currPlays,
  teamAById,
  teamBById,
  toBeSelectedPlay,
  setToBeSelectedPlay,
  teamAPlayers,
  teamBPlayers,
  handlePlayChange,
}: IChangePlayDialogProps) {
  return (
    <dialog ref={changePlayEl} className="modal-dialog">
      <div className="p-6 space-y-4 max-h-[90vh] overflow-hidden flex flex-col">
        <h2 className="text-xl font-semibold text-yellow-400">
          Select specific play
        </h2>

        {/* Scrollable content body */}
        {currPlays.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-1">
            <ul className="space-y-2">
              {currPlays.map((sr, i) => (
                <ServerReceiverPlayInput
                  sr={sr}
                  teamAById={teamAById}
                  teamBById={teamBById}
                  key={i}
                  toBeSelectedPlay={toBeSelectedPlay}
                  setToBeSelectedPlay={setToBeSelectedPlay}
                  teamAPlayers={teamAPlayers}
                  teamBPlayers={teamBPlayers}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-red-300">
            ⚠️ Warning: There are no history of playing anything on this net.
          </p>
        )}

        {toBeSelectedPlay && (
          <p className="text-sm text-red-300">
            ⚠️ Warning: Confirming a specific play will permanently delete all
            plays that come after it.
          </p>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            className={`${
              toBeSelectedPlay
                ? "bg-yellow-logo hover:bg-yellow-400 text-black"
                : "bg-gray-700 hover:bg-gray-800 text-white"
            }   px-4 py-2 rounded-md font-medium transition duration-200"`}
            onClick={toBeSelectedPlay ? handlePlayChange : () => {}}
          >
            Confirm
          </button>
          <button
            className="bg-transparent border border-yellow-logo text-yellow-400 hover:bg-yellow-600 hover:text-white px-4 py-2 rounded-md transition duration-200"
            onClick={() => {
              changePlayEl.current?.close();
              setToBeSelectedPlay(null);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default ChangePlayDialog;
