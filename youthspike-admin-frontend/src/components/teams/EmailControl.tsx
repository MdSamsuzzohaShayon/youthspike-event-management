import { IEmailcontent, ITeam } from "@/types";
import { formatEmailSentTime } from "@/utils/datetime";
import { getLatestEmailContent } from "@/utils/helper";
import Image from "next/image";

interface IEmailControlProps {
    team: ITeam;
    emailcontents?: IEmailcontent[];
    sendCredentialLabel: string;
    onSendCredential: (e: React.SyntheticEvent, teamId: string) => void;
}

function EmailControl({ team, emailcontents, sendCredentialLabel, onSendCredential }: IEmailControlProps) {
    const latest = getLatestEmailContent(emailcontents ?? []);
    const formatted = latest?.senttime ? formatEmailSentTime(latest.senttime) : null;

    return (
        <>
            <button onClick={(e) => onSendCredential(e, team._id)} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors" aria-label={`${sendCredentialLabel} Credential`}>
                <Image
                    src="/icons/send-email.svg"
                    alt="Send Email"
                    width={18}
                    height={18}
                    className={`h-12 ${team.sendCredentials ? 'svg-green' : 'svg-white'} opacity-80 hover:opacity-100 transition-opacity`}
                />
                {latest && formatted && (
                    <span className='flex flex-col gap-y-0 text-[0.8rem]'>
                        <span>{formatted.date}</span>
                        <span>{formatted.time}</span>
                    </span>
                )}
            </button>
        </>
    );
}

export default EmailControl;