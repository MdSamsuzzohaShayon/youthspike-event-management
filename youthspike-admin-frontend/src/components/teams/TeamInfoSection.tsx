import { IOption, ITeam } from "@/types";
import TeamLogo from "./TeamLogo";
import SelectInput from "../elements/forms/SelectInput";

interface ITeamInfoSectionProps {
    team: ITeam;
    groupOptions: IOption[];
    selectedGroup: string | null;
    onGroupChange: (e: React.SyntheticEvent) => void;
  }
  
  function TeamInfoSection({ team, groupOptions, selectedGroup, onGroupChange }: ITeamInfoSectionProps) {
    return (
      <div className="flex items-center gap-4 mb-2">
        <TeamLogo logo={team.logo} name={team.name} />
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-white truncate">{team.name}</h3>
          <div className="mt-1">
            <SelectInput name="group" optionList={groupOptions} handleSelect={onGroupChange} value={selectedGroup} />
          </div>
        </div>
      </div>
    );
  }


  export default TeamInfoSection;