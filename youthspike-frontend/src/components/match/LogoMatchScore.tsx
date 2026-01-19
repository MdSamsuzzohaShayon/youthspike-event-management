import { useAppSelector } from '@/redux/hooks';
import { ETeam, ITeam } from '@/types/team';
import { netSize } from '@/utils/constant';
import TextImg from '../elements/TextImg';
import { CldImage } from 'next-cloudinary';

interface ILogoMatchScoreProps {
  dark: boolean;
  teamE: ETeam;
  completed: boolean;
  // eslint-disable-next-line react/require-default-props
  team?: ITeam | null;
  penalty: number;
}

function LogoMatchScore({ dark, team, teamE, completed, penalty }: ILogoMatchScoreProps) {
  const { matchScore } = useAppSelector((state) => state.matches);

  const myS = teamE === ETeam.teamA ? matchScore.teamAMScore : matchScore.teamBMScore;
  const opS = teamE === ETeam.teamA ? matchScore.teamBMScore : matchScore.teamAMScore;
  const plusMinus = teamE === ETeam.teamA ? matchScore.teamAMPlusMinus : matchScore.teamBMPlusMinus;



  return (
    <div className={`logo-match-score py-2 flex w-full ${dark ? 'text-white flex-col' : 'text-black-logo flex-col-reverse'} gap-1`}>
      <div className="w-full flex justify-between items-center pt-4 gap-1">
        <div className="w-3/6 overflow-hidden">
          {team?.logo ? (
            <CldImage alt={team.name} width="200" height="200" className="w-full" crop="fit" src={team.logo} />
          ) : (
            <TextImg fullText={team?.name} className="h-32 w-32 rounded-lg" style={{ height: `${netSize.tlh}rem` }} />
          )}
        </div>
        <div className="w-3/6 flex flex-col justify-center items-center gap-y-1">
          <h3 className="break-words w-max leading-4 uppercase font-bold text-sm">
            Match <br /> Score
          </h3>
          <div className={`score-box w-full md:w-3/6 border border-yellow p-2 ${myS > opS && completed ? 'bg-green-600 text-white' : ''} flex justify-center items-center text-center flex-col rounded-lg`}>
            <span className='text-4xl md:text-6xl'>
              {myS + penalty}
            </span>
            {plusMinus !== 0 && <p className={`text-xs ${plusMinus > 0 ? "text-white-500" : "text-red-500"}`}>{plusMinus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LogoMatchScore;
