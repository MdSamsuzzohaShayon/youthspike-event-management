import { INetRelatives, IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { netSize, screen } from '@/utils/constant';
import { calcRoundScore } from '@/utils/scoreCalc';
import { border, headingStyle, textStyle } from '@/utils/styles';

interface ILogoMatchScoreProps {
  dark: boolean;
  team?: ITeam | null;
  roundList: IRoundRelatives[];
  teamE: ETeam;
  screenWidth: number;
  allNets: INetRelatives[]
}

function LogoMatchScore({ dark, team, roundList, teamE, screenWidth, allNets }: ILogoMatchScoreProps) {

  const calcTeamScore = () => {
    let totalScore = 0, pms = 0; // pms = plus minus score
    for (let i = 0; i < roundList.length; i += 1) {
      const netList = allNets.filter((n) => n.round === roundList[i]._id);
      const { score, plusMinusScore } = calcRoundScore(netList, roundList[i], dark, teamE);
      totalScore += score;
      pms += plusMinusScore;
    }
    return {ts: totalScore, pms};
  }

  return (
    <div className={`logo-match-score flex w-full ${dark ? "text-gray-100 flex-col" : "text-gray-900 flex-col-reverse"} `}>
      <div className="w-full flex justify-between items-center pt-4 gap-1">
        <img src="/free-logo.svg" alt="next" className="w-2/6" style={{ height: `${netSize.tlh}rem` }} />
        <h3 className={`break-words w-2/6 leading-4`} style={headingStyle(screenWidth)}>Match Score</h3>
        <div className={`score-box w-2/6 ${dark ? border.dark : border.light} ${screenWidth > screen.xs ? "" : "p-2"} flex justify-center items-center text-center flex-col`}>
          <p style={textStyle(screenWidth)}>{calcTeamScore().ts}</p>
          <p style={textStyle(screenWidth)} className={calcTeamScore().pms > 0 ? `text-green-600` : `text-red-600`}>{calcTeamScore().pms > 0 ? `+${calcTeamScore().pms}` : `${calcTeamScore().pms}`}</p>
        </div>
      </div>
      <div className={`w-full border  ${dark ? border.dark : border.light} ${screenWidth > screen.xs ? "mt-2" : "mt-4"} `}>
        <h2 className={`${screenWidth > screen.xs ? 'leading-5' : 'p-2 leading-8'} text-center uppercase break-words`} style={headingStyle(screenWidth, 0, 0.2)}>{team && team.name}</h2>
      </div>
    </div>
  );
}

export default LogoMatchScore;