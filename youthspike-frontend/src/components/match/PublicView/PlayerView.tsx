import TextImg from "@/components/elements/TextImg";
import { ESRRole, IPlayer } from "@/types";
import { CldImage } from "next-cloudinary";

interface IPlayerViewProps {
  player: IPlayer | null;
  role: ESRRole;
  compact?: boolean;
}

const PlayerView = ({ player, role, compact = false }: IPlayerViewProps) => (
  <div className={`flex items-center p-2 bg-gray-800 rounded-lg border border-gray-700 hover:border-yellow-400 transition-all duration-200 group ${
    compact ? "space-x-3" : "space-x-4"
  }`}>
    {player && (
      <>
        <div className="relative flex-shrink-0">
          {player.profile ? (
            <CldImage
              width={compact ? 40 : 48}
              height={compact ? 40 : 48}
              className={`rounded-full object-cover border-2 border-yellow-400 group-hover:scale-105 transition-transform duration-200 ${
                compact ? "w-10 h-10" : "w-12 h-12"
              }`}
              src={player.profile}
              alt={player.firstName}
            />
          ) : (
            <TextImg 
              className={`rounded-full border-2 border-yellow-400 ${
                compact ? "w-10 h-10" : "w-12 h-12"
              }`} 
              fullText={`${player.firstName.charAt(0)}${player.lastName.charAt(0)}`}
            />
          )}
          
          {/* Role Badge */}
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-1 rounded-full min-w-[16px] text-center">
            {role === ESRRole.SERVER ? 'S' : 'R'}
          </div>
        </div>
        
        <div className="overflow-hidden">
          <p className={`text-white font-semibold truncate ${
            compact ? "text-sm max-w-[100px] md:max-w-[120px]" : "text-sm max-w-[80px] md:max-w-[100px]"
          }`}>
            {player.firstName} {player.lastName}
          </p>
          <p className="text-yellow-400 text-xs capitalize">
            {role.toLowerCase()}
          </p>
        </div>
      </>
    )}
    
    {!player && (
      <div className="flex items-center">
        <div className={`rounded-full bg-gray-700 border border-dashed border-yellow-400 flex items-center justify-center ${
          compact ? "w-10 h-10" : "w-12 h-12"
        }`}>
          <span className="text-gray-400 text-xs">TBA</span>
        </div>
        <div className="ml-3">
          <p className="text-gray-400 text-sm">To be announced</p>
        </div>
      </div>
    )}
  </div>
);

export default PlayerView;