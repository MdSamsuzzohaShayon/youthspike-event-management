import { CldImage } from "next-cloudinary";
import TextImg from "../elements/TextImg";

interface ITeamLogoProps {
    logo?: string | null;
    name: string;
}

function TeamLogo({ logo, name }: ITeamLogoProps) {
    return logo ? (
        <CldImage crop="fit" width={64} height={64} src={logo} alt={name} className="w-8 h-8 object-cover rounded-lg" />
    ) : (
        <TextImg className="w-8 h-8 rounded-lg bg-yellow-logo" fullText={name} />
    );
}

export default TeamLogo;