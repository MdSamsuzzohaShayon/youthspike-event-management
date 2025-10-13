import TextImg from "@/components/elements/TextImg";
import { IPlayer, ITeam } from "@/types";
import { CldImage } from "next-cloudinary";
import Image from "next/image";

interface ITeamInNetProps {
  team: ITeam;
  playerA: IPlayer | null;
  playerB: IPlayer | null;
}

const TeamInNet: React.FC<ITeamInNetProps> = ({ team, playerA, playerB }) => (
  <div className="team-in-net team-a w-3/6 flex items-start justify-between gap-x-2 p-1">
    <div className="w-4/12 flex flex-col items-center space-y-1">
      {playerA && (
        <>
          <div className="image-container w-full aspect-square flex justify-center items-center overflow-hidden">
            {playerA?.profile ? (
              <CldImage
                className="w-full h-full object-cover"
                height={120}
                width={120}
                src={playerA.profile}
                alt={playerA.firstName}
              />
            ) : (
              <TextImg
                className="w-full h-full rounded-lg"
                fullText={`${playerA.firstName} ${playerA.lastName}`}
              />
            )}
          </div>
          <p className="player-name break-words break-all whitespace-normal text-center uppercase w-full px-1">
            {playerA.firstName} {playerA.lastName}
          </p>
        </>
      )}
    </div>
    <div className="w-3/12 flex justify-center">
      <div className="image-container w-full aspect-square flex justify-center items-center overflow-hidden">
        {team?.logo ? (
          <CldImage
            src={team.logo}
            alt={team.name}
            className="w-full h-full object-cover"
            height={120}
            width={120}
          />
        ) : (
          <TextImg
            className="w-full h-full object-cover"
            fullText={team.name}
          />
        )}
      </div>
    </div>
    <div className="w-4/12 flex flex-col items-center space-y-1">
      {playerB && (
        <>
          <div className="image-container w-full aspect-square flex justify-center items-center overflow-hidden">
            {playerB?.profile ? (
              <CldImage
                className="w-full h-full object-center object-cover"
                height={120}
                width={120}
                src={playerB.profile}
                alt={playerB.firstName}
              />
            ) : (
              <TextImg
                className="w-full h-full rounded-lg"
                fullText={`${playerB.firstName} ${playerB.lastName}`}
              />
            )}
          </div>
          <p className="player-name break-words break-all whitespace-normal text-center uppercase w-full px-1">
            {playerB.firstName} {playerB.lastName}
          </p>
        </>
      )}
    </div>
  </div>
);

export default TeamInNet;
