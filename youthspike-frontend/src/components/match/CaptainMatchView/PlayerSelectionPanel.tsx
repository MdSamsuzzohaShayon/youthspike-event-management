import AvailablePlayers from "@/components/player/AvailablePlayers";
import { IPlayer, IRoundRelatives } from "@/types";
import Image from "next/image";

interface IPlayerSelectionPanelProps {
  selectedNetNum: number | null;
  availablePlayerIds: string[];
  currentRound: IRoundRelatives | null;
  myPlayers: IPlayer[];
  disabledPlayerIds: string[];
  minHeight: number;
  onClose: () => void;
}


const PlayerSelectionPanel: React.FC<IPlayerSelectionPanelProps> = ({
  selectedNetNum,
  availablePlayerIds,
  currentRound,
  myPlayers,
  disabledPlayerIds,
  minHeight,
  onClose,
}) => {
  return (
    <div
      id="left-drop-down"
      style={{ minHeight: `${minHeight}px` }}
      className="drop-down-select w-3/6 overflow-y-scroll text-black-logo bg-white border border-gray-300"
    >
      <div className="flex justify-end p-2">
        <Image
          width={24}
          height={24}
          alt="Close player selection"
          src="/icons/close.svg"
          className="svg-black cursor-pointer"
          onClick={onClose}
        />
      </div>
      <div className="flex flex-col flex-1 justify-center px-2 w-full">
        <h3 className="text-center mb-2">
          Selected Net {selectedNetNum ?? ''}
        </h3>
        <AvailablePlayers
          availablePlayerIds={availablePlayerIds}
          currentRound={currentRound}
          myPlayers={myPlayers}
          disabledPlayerIds={disabledPlayerIds}
        />
      </div>
    </div>
  );
};


export default PlayerSelectionPanel;