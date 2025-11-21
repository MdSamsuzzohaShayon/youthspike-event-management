import QRCode from "@/components/elements/QRCode.tsx";
import TextImg from "@/components/elements/TextImg";
import { FRONTEND_URL } from "@/utils/keys";
import { CldImage } from "next-cloudinary";
import Link from "next/link";

interface IScoreBoxProps {
  teamId: string;
  name: string;
  teamLogo: string | null;
  score: number;
  penalty: number;
}

const ScoreBox: React.FC<IScoreBoxProps> = ({
  teamId,
  name,
  teamLogo,
  score,
  penalty
}) => (
  <div className="w-full flex flex-col justify-center items-center">
    <h4 className="match-points">Match Points</h4>
    <div className="w-full flex justify-enter items-center gap-x-1">
      <Link
        className="inline-block w-20"
        href={`/teams/${teamId}/roster`}
      >
        {teamLogo ? (
          <CldImage
            src={teamLogo}
            alt={name}
            className="w-full h-full"
            height={50}
            width={50}
          />
        ) : (
          <TextImg fullText={name} className="w-full h-full" />
        )}
      </Link>
      <div className={`team-score-point text-center`}>{score + penalty}</div>
    </div>
  </div>
);

export default ScoreBox;
