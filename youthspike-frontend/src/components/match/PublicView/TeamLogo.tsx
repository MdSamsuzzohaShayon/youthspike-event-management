import TextImg from "@/components/elements/TextImg";
import { ETeamType, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";

const TeamLogo = ({
  team,
  teamType,
  className = "",
}: {
  team: ITeam | null;
  teamType: ETeamType;
  className?: string;
}) => {
  const borderColor =
    teamType === ETeamType.TEAM_A ? "border-yellow-400" : "border-white";

  if (team?.logo) {
    return (
      <CldImage
        src={team.logo}
        alt={team.name}
        width={70}
        height={70}
        className={`object-cover object-center rounded-sm ${borderColor} ${className}`}
        crop="fit"
      />
    );
  }
  return (
    <TextImg
      fullText={team?.name || (teamType === ETeamType.TEAM_A ? "TA" : "TB")}
      className={`font-bold ${borderColor} ${className}`}
    />
  );
};


export default TeamLogo;
