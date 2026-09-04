import { IPlayer, IPlayerRank } from "@/types";

interface IPlayerUsernameRoleProps {
    player: IPlayerRank;
    isCaptain: boolean; 
    isCoCaptain: boolean;
}

const PlayerUsernameRole = ({ player, isCaptain, isCoCaptain }: IPlayerUsernameRoleProps) => (
    <div className="username flex flex-col justify-between items-center">
        <p className="text-gray-400 text-sm">{player.username}</p>
        {player?.email && <p className="text-gray-400 text-sm word-breaks">{player.email}</p>}
        {isCaptain && <p className="text-yellow-logo uppercase">Captain</p>}
        {isCoCaptain && <p className="text-yellow-logo uppercase">Co-Captain</p>}
    </div>
);

export default PlayerUsernameRole;