'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';

import { useEventForm } from '@/hooks/useEventForm';
import { TAddBadge, IBadge, ICreateEventResponse, IEvent, IEventExpRel, IEventSponsor, IProStats, IResponse } from '@/types';

import Loader from '../elements/Loader';
import EventFormSections from './EventFormSections';
import { useMessage } from '@/lib/MessageProvider';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { ADD_EVENT, UPDATE_EVENT } from '@/graphql/event';
import { createEvent } from '@/utils/request-handlers/createEvent';
import SponsorManager from './SponsorManager';
import BadgeInput from '../elements/forms/BadgeInput';
import deleteDraftImages from '@/utils/request-handlers/deleteDraftImages';
import { updateEvent } from '@/utils/request-handlers/updateEvent';

export interface IEventAddProps {
  update: boolean;
  previousEvent?: IEvent;
  previousWight?: IProStats;
  previousMultiplayer?: IProStats;
  previousSponsorList?: IEventSponsor[];
  prevBadges?: IBadge[];
}



const EventAddUpdate = ({ update, previousEvent, previousMultiplayer, previousWight, previousSponsorList, prevBadges=[] }: IEventAddProps) => {
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
  const [badges, setBadges] = useState<TAddBadge[]>(prevBadges);
  const badgesRef = useRef<TAddBadge[]>(badges);



  const [addEvent] = useMutation<{ createEvent: ICreateEventResponse }>(ADD_EVENT);
  const [mutateEvent] = useMutation<{ updateEvent: IResponse }>(UPDATE_EVENT);

  const {
    eventState,
    multiplayer,
    weight,

    updateEventState,
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
    setUpdateEventState,
    initialEvent,
    initialProStats,
  } = useEventForm(update, previousEvent, previousMultiplayer, previousWight, previousSponsorList);
  const apolloClient = useApolloClient();



  const handleSave = async () => {
    // await fetch(`/api/teams/${teamName}/badges`, {
    //   method: "PATCH",
    //   body: JSON.stringify({ badges }),
    // });
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (update && eventId) {
        await updateEvent({
          eventId,
          mutateEvent,
          updateEventState,
          sponsors,
          badges,
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
          badges,
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
      if(eventId){
        router.push(`/${eventId}/${ldoIdUrl}`);
      }else{
        router.push(`/${ldoIdUrl}`);
      }
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

  useEffect(() => {
    badgesRef.current = badges;
  }, [badges]);
  
  useEffect(() => {
    return () => {
      const icons = badgesRef.current.map((badge) => badge.icon);
  
      if (icons.length > 0) {
        void deleteDraftImages(icons);
      }
    };
  }, []);

  if (isLoading) return <Loader />;

  return (
    <form onSubmit={handleSubmit}>
      <div className="w-full grid grid-col-1 md:grid-cols-2 gap-x-2 gap-y-1">
        <EventFormSections
          update={update}
          eventState={eventState}
          updateEvent={updateEventState}
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
          setUpdateEvent={setUpdateEventState}
          onSelectChange={handleSelectChange}
        />
      </div>

      {/* Badge  */}
      <BadgeInput
        name="badges"
        label="Badges"
        value={badges}
        onChange={setBadges}
      />

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
