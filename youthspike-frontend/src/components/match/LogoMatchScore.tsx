import { useAppSelector } from '@/redux/hooks';
import { ETeam, ITeam } from '@/types/team';
import { netSize } from '@/utils/constant';
import { AdvancedImage } from '@cloudinary/react';
import cld from '@/config/cloudinary.config';
import TextImg from '../elements/TextImg';

interface ILogoMatchScoreProps {
  dark: boolean;
  teamE: ETeam;
  completed: boolean;
  // eslint-disable-next-line react/require-default-props
  team?: ITeam | null;
}

function LogoMatchScore({ dark, team, teamE, completed }: ILogoMatchScoreProps) {
  const { teamATotalScore, teamBTotalScore } = useAppSelector((state) => state.matches);

  const myS = teamE === ETeam.teamA ? teamATotalScore : teamBTotalScore;
  const opS = teamE === ETeam.teamA ? teamBTotalScore : teamATotalScore;

  return (
    <div className={`logo-match-score py-2 flex w-full ${dark ? 'text-white flex-col' : 'text-black-logo flex-col-reverse'} gap-1`}>
      <div className="w-full flex justify-between items-center pt-4 gap-1">
        <div className="w-3/6">
        {team?.logo ? <AdvancedImage cldImg={cld.image(team.logo)} className="h-24" /> : <TextImg fullText={team?.name} className="h-24" style={{ height: `${netSize.tlh}rem` }} />}
        </div>
        <div className="w-3/6 flex flex-col justify-center items-center gap-y-1">
          <h3 className="break-words w-max leading-4 uppercase font-bold text-c-sm">Match Score</h3>
          <div className={`score-box w-3/6 border border-yellow p-2 ${myS > opS && completed ? 'bg-green-600' : ''} flex justify-center items-center text-center flex-col rounded-lg`}>
            <h3>{myS}</h3>
          </div>
        </div>
      </div>
    </div>
  ); 
}

export default LogoMatchScore;
