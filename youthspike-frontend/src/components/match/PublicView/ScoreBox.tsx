import TextImg from "@/components/elements/TextImg";
import { EView } from "@/types";
import { CldImage } from "next-cloudinary";
import Image from "next/image";
interface IScoreBoxProps {
  name: string;
  teamLogo: string | null;
  score: number;
}
const ScoreBox: React.FC<IScoreBoxProps> = ({ name, teamLogo, score }) => (
  <div className="w-full flex flex-col justify-center items-center">
    {teamLogo ? (
      <CldImage
        src={teamLogo}
        alt={name}
        className="w-20"
        height={50}
        width={50}
      />
    ) : (
      <TextImg fullText={name} className="w-20 h-20" />
    )}
    <div className={`team-score-point text-center`}>{score}</div>
  </div>
);

export default ScoreBox;
