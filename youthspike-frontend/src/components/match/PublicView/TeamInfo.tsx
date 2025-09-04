import { ELayout, ETeamType, ITeam } from "@/types";
import TeamLogo from "./TeamLogo";

const TeamInfo = ({
  team,
  teamType,
  layout = ELayout.MOBILE,
}: {
  team: ITeam | null;
  teamType: ETeamType;
  layout?: ELayout;
}) => {
  const isDesktop = layout === ELayout.DESKTOP;
  const isTablet = layout === ELayout.TABLET;
  const isMobile = layout === ELayout.MOBILE;

  // Logo sizes for different devices
  const logoSize = isDesktop
    ? "w-24 h-24"
    : isTablet
    ? "w-16 h-16"
    : "w-14 h-14";

  // Text sizes for different devices
  const textSize = isDesktop ? "text-lg" : isTablet ? "text-base" : "text-sm";

  // Container spacing
  const containerClass = isDesktop
    ? "space-y-3"
    : isTablet
    ? "space-y-2"
    : "space-y-2";

  // Maximum width for text containers
  const textMaxWidth = isDesktop
    ? "max-w-[160px]"
    : isTablet
    ? "max-w-[120px]"
    : "max-w-[100px]";

  // Line height for better text wrapping
  const lineHeight = "leading-tight";

  return (
    <div className={`flex flex-col items-center ${containerClass} flex-1 px-1`}>
      <TeamLogo team={team} teamType={teamType} className={logoSize} />

      {/* Team name with controlled wrapping */}
      <div className={`${textMaxWidth} flex flex-col items-center`}>
        <span
          className={`text-white font-bold ${textSize} ${lineHeight} text-center break-words line-clamp-2`}
        >
          {team?.name}
        </span>
      </div>
    </div>
  );
};

export default TeamInfo;
