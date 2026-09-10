import { IPlayer } from "@/types";
import { CldImage } from "next-cloudinary";

const PlayerImage: React.FC<{
    player: IPlayer | null;
    shouldShowAddPlayer: boolean;
    onImageClick: (e: React.SyntheticEvent) => void;
  }> = ({ player, shouldShowAddPlayer, onImageClick }) => {
    if (player?.profile) {
      return (
        <CldImage
          crop="fit"
          alt={player.firstName}
          width="100"
          height="100"
          className="w-full h-full object-cover"
          src={player.profile}
          onClick={onImageClick}
        />
      );
    }
  
    if (!player && shouldShowAddPlayer) {
      return (
        <div 
          className="w-full h-full flex justify-center items-center bg-gray-50 hover:bg-yellow-50 transition-colors duration-200 cursor-pointer" 
          onClick={onImageClick}
        >
          <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    }
  
    return (
      <div className="w-full h-full flex justify-center items-center bg-gray-100">
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    );
  };


  export default PlayerImage;