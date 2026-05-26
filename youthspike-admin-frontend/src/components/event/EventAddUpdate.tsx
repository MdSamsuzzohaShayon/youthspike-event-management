'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';

import { useEventForm } from '@/hooks/useEventForm';
import { ICreateEventResponse, IEvent, IEventExpRel, IEventSponsor, IProStats } from '@/types';

import Loader from '../elements/Loader';
import EventFormSections from './EventFormSections';
import { updateEventWithFiles } from '@/utils/request-handlers/updateEvent';
import { useMessage } from '@/lib/MessageProvider';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { ADD_EVENT } from '@/graphql/event';
import { createEvent } from '@/utils/request-handlers/createEvent';
import SponsorManager from './SponsorManager';

export interface IEventAddProps {
  update: boolean;
  previousEvent?: IEvent;
  previousWight?: IProStats;
  previousMultiplayer?: IProStats;
  previousSponsorList?: IEventSponsor[];
}


const EventAddUpdate = ({ update, previousEvent, previousMultiplayer, previousWight, previousSponsorList }: IEventAddProps) => {
  // Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const pName = usePathname();
  const { ldoIdUrl } = useLdoId();
  const { setMessage } = useMessage();

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);

  const [addEvent] = useMutation<{ createEvent: ICreateEventResponse }>(ADD_EVENT);

  const {
    eventState,
    multiplayer,
    weight,

    updateEvent,
    updateMultiplayer,
    updateStats,
    updateWeight,

    sponsors,
    eventLogo,
    handleInputChange,
    handleToggleChange,
    handleNumberInputChange,
    handleDateChange,
    handleProStatsChange,
    setSponsors,
    handleDefaultSponsorToggle,
    handleLogoChange,
    handleSelectChange,
    setEventState,
    setUpdateEvent,
    initialEvent,
    initialProStats,
  } = useEventForm(update, previousEvent, previousMultiplayer, previousWight, previousSponsorList);
  const apolloClient = useApolloClient();




  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (update && eventId) {
        await updateEventWithFiles({
          eventId,
          updateEvent,
          sponsors,
          eventLogo: eventLogo.current,
          updateMultiplayer,
          updateStats,
          updateWeight,
          setMessage,
        });
      } else {
        await createEvent({
          apolloClient,
          eventState,
          sponsors,
          eventLogo: eventLogo.current,
          directorId,
          multiplayer,
          weight,
          addEvent,
          setMessage,
        });
      }

      // Reset form and navigate
      setEventState(initialEvent);
      router.push(`/${ldoIdUrl}`);
    } catch (error) {
      setMessage({
        message: error instanceof Error ? error.message : String(error),
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const pnList = pName.split('/');
    if (pnList.includes('settings')) {
      const newEventId = pnList.filter((pn) => pn !== '')[0];
      setEventId(newEventId);
    }

    if (user.info?.role === UserRole.admin) {
      const newDirectorId = searchParams.get('ldoId');
      if (!newDirectorId) {
        router.push('/admin');
        return;
      }
      setDirectorId(newDirectorId);
    } else {
      setDirectorId(user.info?._id || null);
    }
  }, [user, pName, searchParams, router]);

  if (isLoading) return <Loader />;

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-full grid grid-col-1 md:grid-cols-2 gap-x-2 gap-y-1">
        <EventFormSections
          update={update}
          eventState={eventState}
          updateEvent={updateEvent}
          onInputChange={handleInputChange}
          onToggleChange={handleToggleChange}
          onNumberChange={handleNumberInputChange}
          onDateChange={handleDateChange}
          onProStatsChange={handleProStatsChange}
          multiplayer={multiplayer}
          weight={weight}
          onLogoChange={handleLogoChange}
          eventId={eventId || null}
          setEventState={setEventState}
          setUpdateEvent={setUpdateEvent}
          onSelectChange={handleSelectChange}
        />
      </div>
      <div>
        <SponsorManager defaultSponsor={eventState.defaultSponsor} sponsors={sponsors} onDefaultSponsorToggle={handleDefaultSponsorToggle} onSetSponsors={setSponsors} />
      </div>



      <div className="mt-6">
        <button type="submit" className="w-full btn-info">
          {update ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default EventAddUpdate;
