'use client';

import React, { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/UserProvider';
import { UserRole } from '@/types/user';
import { useLdoId } from '@/lib/LdoProvider';
import { useError } from '@/lib/ErrorProvider';
import { useEventForm } from '@/hooks/useEventForm';
import { IEventAddProps } from '@/types';

import Loader from '../elements/Loader';
import EventFormSections from './EventFormSections';
import SponsorDialog from './SponsorDialog';
import { updateEventWithFiles } from '@/utils/requestHandlers/updateEvent';
import { addEventWithFiles } from '@/utils/requestHandlers/addEvent';
import ShowSponsors from './ShowSponsors';

const EventAddUpdate = ({ update, prevEvent, prevMultiplayer, prevWight }: IEventAddProps) => {
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const pName = usePathname();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();
  const [isLoading, setIsLoading] = useState(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [directorId, setDirectorId] = useState<string | null>(null);

  const {
    eventState,
    multiplayer,
    weight,
    
    updateEvent,
    updateMultiplayer,
    updateStats,
    updateWeight,

    sponsorImgList,
    eventLogo,
    handleInputChange,
    handleToggleChange,
    handleNumberInputChange,
    handleDateChange,
    handleProStatsChange,
    handleSponsorImgList,
    handleSponsorRemove,
    handleDefaultSponsorToggle,
    handleLogoChange,
    setEventState,
    initialEvent,
    initialProStats,
  } = useEventForm(update, prevEvent, prevMultiplayer, prevWight);


  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let event = eventId;
      if (update && eventId) {
        await updateEventWithFiles({
          eventId,
          updateEvent,
          sponsorImgList,
          eventLogo: eventLogo.current,
          updateMultiplayer,
          updateStats,
          updateWeight,
          setActErr,
        });
      } else {
        event = await addEventWithFiles({
          eventState,
          sponsorImgList,
          eventLogo: eventLogo.current,
          directorId,
          multiplayer,
          weight,
          
          setActErr,
        });
      }

      // Reset form and navigate
      setEventState(initialEvent);
      if (!update && event) {
        router.push(`/${event}/${ldoIdUrl}`);
      }
      if(update){
        window.location.reload();
      }
    } catch (error) {
      setActErr({
        message: error instanceof Error ? error.message : String(error),
        success: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
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
    <form className="w-full" onSubmit={handleSubmit}>
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
      />

      <SponsorDialog isOpen={isSponsorDialogOpen} onClose={() => setIsSponsorDialogOpen(false)} onSave={handleSponsorImgList} />

      <div className="sponsors-heading flex justify-between w-full mt-4 items-center">
        <h3 className="text-2xl capitalize">Sponsors</h3>
        <button type="button" onClick={() => setIsSponsorDialogOpen(true)} className="btn-info">
          Add New
        </button>
      </div>

      <ShowSponsors
        defaultSponsor={eventState.defaultSponsor}
        fileList={sponsorImgList}
        handleImgRemove={(e, company) => handleSponsorRemove(company)}
        handleDefaultSponsor={(e) => handleDefaultSponsorToggle(false)}
      />

      <div className="mt-6 flex justify-center">
        <button type="submit" className="w-full btn-info">
          {update ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default EventAddUpdate;
