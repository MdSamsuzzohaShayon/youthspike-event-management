import NewTeamComp from '@/components/teams/NewTeamComp';
import { TParams } from '@/types';

interface INewTeamPageProps {
  searchParams: TParams;
}

// eventId, groupList, handleClose, setIsLoading, players, update, prevTeam, currDivision, divisions
export default async function NewTeamPage({ searchParams }: INewTeamPageProps) {


  

  return <NewTeamComp searchParams={searchParams} />;
}
