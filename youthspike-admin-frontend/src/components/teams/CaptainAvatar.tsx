import { ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";

interface ICaptainAvatarProps {
    captain: NonNullable<ITeam['captain']>;
}

function CaptainAvatar({ captain }: ICaptainAvatarProps) {
    return captain.profile ? (
        <CldImage crop="fit" width={40} height={40} src={captain.profile} alt={captain.firstName} className="w-8 h-8 rounded-full object-cover" />
    ) : (
        <TextImg className="w-8 h-8 rounded-full bg-gray-600" fullText={captain.firstName + captain.lastName} />
    );
}

export default CaptainAvatar;
