import { TParams } from '@/types';
import { redirect } from 'next/navigation';

interface TeamSinglePageProps {
  params: TParams;
}

export default async function TeamSinglePage({ params }: TeamSinglePageProps) {
  const { teamId, eventId } = await params;

  redirect(`/teams/${teamId}/roster`);
}
