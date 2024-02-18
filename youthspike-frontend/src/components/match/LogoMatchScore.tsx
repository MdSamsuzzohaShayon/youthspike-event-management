import { IRoundRelatives } from '@/types';
import { ETeam, ITeam } from '@/types/team';
import { screen } from '@/utils/constant';
import { border } from '@/utils/styles';

interface ILogoMatchScoreProps {
  dark: boolean;
  team?: ITeam | null;
  roundList: IRoundRelatives[];
  teamE: ETeam;
  screenWidth: number;
}

function LogoMatchScore({ dark, team, roundList, teamE, screenWidth }: ILogoMatchScoreProps) {

  const calcTeamScore = ()=>{
    let totalScore = 0;
    for (let i = 0; i < roundList.length; i+=1) {
      // @ts-ignore
      if(teamE === ETeam.teamA && roundList[i] && roundList[i].teamAScore && roundList[i].teamBScore && roundList[i].teamAScore > roundList[i].teamBScore){
        totalScore += 1;
        // @ts-ignore
      }else if(teamE === ETeam.teamB && roundList[i] && roundList[i].teamAScore && roundList[i].teamBScore && roundList[i].teamAScore < roundList[i].teamBScore){
        totalScore += 1;
      }
    }
    return totalScore;
  }
  
  return (
    <div className={`logo-match-score w-full ${dark ? "text-gray-100" : "text-gray-900"}`}>
      <div className="w-full flex justify-between items-center pt-4 gap-1">
        <img src="/free-logo.svg" alt="next" className="w-2/6" />
        <h3 className={`break-words w-2/6 leading-4`} style={{fontSize: screenWidth > screen.xs ? "0.5rem" : "1rem"}}>Match Score</h3>
        <div className={`score-box w-2/6 ${dark ? border.dark : border.light} ${screenWidth > screen.xs ? "" : "p-2"} flex justify-center items-center text-center flex-col`}>
          <p style={{fontSize: screenWidth > screen.xs ? "0.5rem" : "1rem"}}>{calcTeamScore()}</p>
          <p className="text-green-600">+8</p>
        </div>
      </div>
      <div className={`w-full border  ${dark ? border.dark : border.light} ${screenWidth > screen.xs ? "mt-2": "mt-4"} `}>
        <h2 className={`${screenWidth > screen.xs ? 'leading-5': 'p-2 leading-8'} text-center uppercase break-words`} style={{fontSize: screenWidth > screen.xs ? "0.8rem" : "1.5rem"}}>{team && team.name}</h2>
      </div>
    </div>
  );
}

export default LogoMatchScore;