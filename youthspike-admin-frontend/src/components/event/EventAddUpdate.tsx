'use client';

import React, { useEffect, useState } from 'react';
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
import Image from 'next/image';

const EventAddUpdate = ({ update, prevEvent, prevMultiplayer, prevWight }: IEventAddProps) => {
  // Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const pName = usePathname();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSponsorDialogOpen, setIsSponsorDialogOpen] = useState<boolean>(false);
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
    setUpdateEvent,
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
      router.push(`/${event}/${ldoIdUrl}`);
    } catch (error) {
      setActErr({
        message: error instanceof Error ? error.message : String(error),
        success: false,
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
    <form className="w-full grid grid-col-1 md:grid-cols-2 gap-x-2 gap-y-1" onSubmit={handleSubmit}>
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
      />

      <div className="w-full flex flex-col">
        <SponsorDialog isOpen={isSponsorDialogOpen} onClose={() => setIsSponsorDialogOpen(false)} onSave={handleSponsorImgList} />

        <div className="sponsors-heading flex justify-between w-full mt-4 items-center">
          <h3 className="text-2xl capitalize">Sponsors</h3>
          <button className="btn-info" role="presentation" onClick={() => setIsSponsorDialogOpen(true)}>
            <Image height={50} width={50} className="w-4 h-4 svg-black ml-2" src="/icons/plus.svg" alt="Add" />
          </button>
        </div>
        <ShowSponsors
          defaultSponsor={eventState.defaultSponsor}
          fileList={sponsorImgList}
          handleImgRemove={(e, company) => handleSponsorRemove(company)}
          handleDefaultSponsor={(e) => handleDefaultSponsorToggle(false)}
        />
      </div>
      <div />

      <div className="mt-6">
        <button type="submit" className="w-full btn-info">
          {update ? 'Update' : 'Submit'}
        </button>
      </div>
    </form>
  );
};

export default EventAddUpdate;
