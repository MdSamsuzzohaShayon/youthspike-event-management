import { UserRole } from '@/types/user';
import { TParams } from '@/types';
import { getAnEvent } from '@/app/_requests/events';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUserFromCookie } from '@/utils/serverCookie';
import SettingsMain from '@/components/event/SettingsMain';
import { getAPlayer } from '@/app/_requests/players';

interface ISettingsPageProps {
  params: TParams;
}

async function SettingsPage({ params }: ISettingsPageProps) {
  const pathParams = await params;
  const cookieStore = await cookies();

  // Queries
  const eventExist = await getAnEvent(pathParams.eventId);
  if (!eventExist) {
    notFound();
  }

  const userExist = await getUserFromCookie(cookieStore);
  if (!userExist) {
    notFound();
  }

  const playerId =
    userExist.info?.role === UserRole.captain || userExist.info?.role === UserRole.co_captain
      ? userExist.info?.role === UserRole.captain
        ? userExist.info.captainplayer
        : userExist.info.cocaptainplayer
      : null;

  const playerExist = await getAPlayer(playerId || null);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">{userExist.info?.role === UserRole.captain || userExist.info?.role === UserRole.co_captain ? 'Update Captain' : 'Update Event'}</h1>

      <SettingsMain eventId={pathParams.eventId} prevEvent={eventExist} prevPlayer={playerExist} />
    </div>
  );
}

export default SettingsPage;
