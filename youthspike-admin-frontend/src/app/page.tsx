/* eslint-disable react-hooks/exhaustive-deps */

import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers'
import { getEventDirector } from './_requests/ldo';
import { IUserContext } from '@/types';
import { UserRole } from '@/types/user';
import { LDO_ID } from '@/utils/constant';
import EventsMain from '@/components/event/EventsMain';


async function EventsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {

  const cookieStore = await cookies();
  const user = cookieStore.get('user')?.value;
  const token = cookieStore.get('token')?.value;


  const userContext: IUserContext = {
    info: user ? JSON.parse(user) : null,
    token: token ? token : null
  };

  let directorId = null;

  // http://localhost:3000/?ldoId=skwhj4i2u2j3g23j
  if (userContext.info?.role === UserRole.admin) {
    directorId = searchParams[LDO_ID] as string;

    if (!directorId) {
      redirect("/admin")
    }
  }






  const eventDirector = await getEventDirector(directorId, userContext.token);

  if (!eventDirector) {
    // Logout 
    notFound();
  }


  directorId = eventDirector.director?._id;
  const events = eventDirector.events;




  return (
    <div className="events-page container px-6 mx-auto min-h-screen">
      <EventsMain events={events} ldo={eventDirector} />
    </div>
  );
}

export default EventsPage;
