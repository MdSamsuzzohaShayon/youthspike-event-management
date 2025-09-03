import { ELayout, ETeamType, ITeam } from "@/types";
import TeamLogo from "./TeamLogo";

const TeamInfo = ({ 
    team, 
    teamType, 
    layout = ELayout.MOBILE 
  }: { 
    team: ITeam | null; 
    teamType: ETeamType;
    layout?: ELayout;
  }) => {
    const isDesktop = layout === ELayout.DESKTOP;
    const logoSize = isDesktop ? "w-20 h-20" : "w-14 h-14";
    const textSize = isDesktop ? "text-lg" : "text-sm";
    const maxWidth = isDesktop ? "max-w-[150px]" : "max-w-[100px]";

    return (
      <div className="flex flex-col items-center space-y-2 flex-1">
        <TeamLogo team={team} teamType={teamType} className={logoSize} />
        <span className={`text-white font-bold ${textSize} truncate ${maxWidth} text-center`}>
          {team?.name}
        </span>
      </div>
    );
  };

  export default TeamInfo;
