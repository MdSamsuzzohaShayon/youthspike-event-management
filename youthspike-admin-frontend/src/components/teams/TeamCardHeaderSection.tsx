import { IEmailcontent, ITeam } from "@/types";
import CheckboxInput from "../elements/forms/CheckboxInput";
import Link from "next/link";
import EmailControl from "./EmailControl";
import Image from "next/image";
import ActionMenu from "./ActionMenu";

interface IHeaderSectionProps {
    team: ITeam;
    eventId: string;
    ldoIdUrl: string;
    isChecked: boolean;
    playerCount: number;
    actionOpen: boolean;
    actionEl: React.RefObject<HTMLUListElement | null>;
    emailcontents?: IEmailcontent[];
    sendCredentialLabel: string;
    onCheckedTeam: (e: React.SyntheticEvent, teamId: string) => void;
    onSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
    onMoveTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
    onDeleteTeamOpen: (e: React.SyntheticEvent, team: ITeam) => void;
    onToggleActionMenu: () => void;
    onCloseActionMenu: () => void;
    onTeamRedirect: (e: React.SyntheticEvent) => void;
}

function TeamCardHeaderSection({
    team,
    eventId,
    ldoIdUrl,
    isChecked,
    playerCount,
    actionOpen,
    actionEl,
    emailcontents,
    sendCredentialLabel,
    onCheckedTeam,
    onSendCredential,
    onMoveTeamOpen,
    onDeleteTeamOpen,
    onToggleActionMenu,
    onCloseActionMenu,
    onTeamRedirect,
}: IHeaderSectionProps) {
    return (
        <div className="flex items-center justify-between mb-2 min-h-[2.5rem]">
            {/* Left: Checkbox and Team Number */}
            <div className="flex items-center gap-3 flex-1">
                <CheckboxInput _id={team._id} name="team-select" defaultValue={isChecked} handleInputChange={onCheckedTeam} />
                <span className="bg-yellow-logo text-black text-xs font-bold rounded-full h-8 w-8 flex items-center justify-center">{team.num}</span>
            </div>

            {/* Center: Players Count */}
            <div className="flex items-center justify-center flex-1">
                <div className="flex flex-col md:flew-row items-center justify-center text-sm text-gray-300 bg-gray-700 px-3 py-1.5 rounded-lg">
                    <span className="mr-2">Players:</span>
                    <span className="font-medium">
                        {playerCount}
                    </span>
                </div>
            </div>

            {/* Right: Actions and Preview */}
            <div className="flex items-center justify-end gap-3 flex-1">
                <div className="flex justify-center items-start flex-col">
                    {team.division && <span className='uppercase'>{team.division.toUpperCase()}</span>}
                    <Link href="#" className="btn-info" type='button' onClick={onTeamRedirect}>PREVIEW</Link>
                    <EmailControl
                        team={team}
                        emailcontents={emailcontents}
                        sendCredentialLabel={sendCredentialLabel}
                        onSendCredential={onSendCredential}
                    />
                </div>

                <div className="relative">
                    <button onClick={onToggleActionMenu} className="w-8 h-8 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors" aria-label="Team options">
                        <Image width={16} height={16} src="/icons/dots-vertical.svg" alt="Options" className="svg-white" />
                    </button>
                    <ActionMenu
                        team={team}
                        eventId={eventId}
                        ldoIdUrl={ldoIdUrl}
                        actionOpen={actionOpen}
                        actionEl={actionEl}
                        sendCredentialLabel={sendCredentialLabel}
                        onClose={onCloseActionMenu}
                        onSendCredential={onSendCredential}
                        onMoveTeamOpen={onMoveTeamOpen}
                        onDeleteTeamOpen={onDeleteTeamOpen}
                    />
                </div>
            </div>
        </div>
    );
}


export default TeamCardHeaderSection;