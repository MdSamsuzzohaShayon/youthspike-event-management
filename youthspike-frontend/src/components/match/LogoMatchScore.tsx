import { ITeam } from '@/types/team';

interface ILogoMatchScoreProps {
  dark: boolean;
  team: ITeam;
}

function LogoMatchScore({ dark, team }: ILogoMatchScoreProps) {
  return (
    <div className="logo-match-score w-full ">
      <div className="flex justify-between items-center pt-4 gap-1">
        <img src="/next.svg" alt="next" className="w-2/6" />
        <h3 className="leading-4 w-2/6">Match Score</h3>
        <div className={`score-box w-2/6 border ${dark ? 'border-gray-100' : ' border-gray-900'} p-2 flex justify-center items-center text-center flex-col`}>
          <p>2</p>
          <p className="text-green-600">+8</p>
        </div>
      </div>
      <div className={`w-full border ${dark ? 'border-gray-100' : 'border-gray-900'} mt-4`}>
        <h2 className="p-2 text-center uppercase">{team && team.name}</h2>
      </div>
    </div>
  );
}

export default LogoMatchScore;
