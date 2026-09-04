import Image from "next/image";
import Link from "next/link";

interface ITeamRosterHeaderProps {
  teamName?: string;
  rosterHref?: string;
  headingClassName?: string;
}

/**
 * Team name heading with an optional "open roster in a new tab" link.
 * Shared between the opponent and "my team" roster panels so this markup
 * only needs to be maintained in one place.
 */
function TeamRosterHeader({
  teamName,
  rosterHref,
  headingClassName = "op-team-name text-2xl font-bold uppercase",
}: ITeamRosterHeaderProps) {
  return (
    <div className="container px-4 mx-auto flex justify-start items-center gap-x-2">
      <h1 className={headingClassName}>{teamName}</h1>
      {rosterHref && (
        <Link href={rosterHref}>
          <Image
            height={20}
            width={20}
            src="/icons/new-tab.svg"
            alt="expand-btn"
            className="w-8 h-8 svg-white"
          />
        </Link>
      )}
    </div>
  );
}

export default TeamRosterHeader;