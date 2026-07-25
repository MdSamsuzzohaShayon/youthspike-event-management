import { ITeam } from "@/types";
import CaptainAvatar from "./CaptainAvatar";

interface ICaptainSectionProps {
    captain: NonNullable<ITeam['captain']>;
}

function TeamCardCaptainSection({ captain }: ICaptainSectionProps) {
    return (
        <div className="flex items-center gap-3">
            <CaptainAvatar captain={captain} />
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-white truncate">
                    {captain.firstName} {captain.lastName}
                </h4>
                <div className="w-full flex items-center gap-x-2 flex-wrap">
                    <p className="text-xs text-gray-400 truncate">@{captain.username}</p>
                    <div className="border border-l border-yellow-logo h-6"></div>
                    {captain.email && <p className="text-xs text-gray-400 truncate">{captain.email}</p>}
                </div>
            </div>
        </div>
    );
}


export default TeamCardCaptainSection;