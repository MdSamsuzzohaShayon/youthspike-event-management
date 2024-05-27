import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ADD_EVENT, UPDATE_EVENT } from '@/graphql/event';
import { useMutation } from '@apollo/client';

// Components
import { useUser } from '@/lib/UserProvider';
import { IEventAddProps, IEventAdd, IEventSponsorAdd } from '@/types';
import { UserRole } from '@/types/user';
import { assignStrategies } from '@/utils/staticData';
import addOrUpdateEvent from '@/utils/requestHandlers/addOrUpdateEvent';
import { APP_NAME } from '@/utils/keys';
import Image from 'next/image';
import { imgSize } from '@/utils/style';
import ToggleInput from '../elements/forms/ToggleInput';
import SelectInput from '../elements/forms/SelectInput';
import TextInput from '../elements/forms/TextInput';
import NumberInput from '../elements/forms/NumberInput';

import staticData from '../../lib/data.json';
import DateInput from '../elements/forms/DateInput';
import ShowDivisions from './ShowDivisions';
import ShowSponsors from './ShowSponsors';
import useClickOutside from '../../hooks/useClickOutside';
import AnyFileInput from '../elements/forms/AnyFileInput';
import FileInput from '../elements/forms/FileInput';
import TextareaInput from '../elements/forms/TextareaInput';
import ImageInput from '../elements/forms/ImageInput';
// Select Input Options
const { homeTeamStrategy, rosterLockList } = staticData;

const initialEvent: IEventAdd = {
  name: 'Event 1',
  divisions: '',
  nets: 3,
  rounds: 2,
  netVariance: 3,
  homeTeam: homeTeamStrategy[0].value,
  autoAssign: false,
  autoAssignLogic: assignStrategies[0],
  rosterLock: rosterLockList[0].value,
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  playerLimit: 10,
  active: true,
  timeout: 3,
  fwango: null,
  coachPassword: 'Spikeball',
  description: 'USA',
};

const initialCurrSponsor = { logo: null, company: '' };

function EventAddUpdate({ update, setActErr, prevEvent, setIsLoading }: IEventAddProps) {
  // Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const pName = usePathname();

  // Local State
  const eventLogo = useRef<null | File>(null);
  const sponsorInputEl = useRef<HTMLInputElement>(null);
  const addSponsorDialogEl = useRef<HTMLDialogElement | null>(null);
  const [currSponsor, setCurrSponsor] = useState<IEventSponsorAdd>(initialCurrSponsor);

  const [eventState, setEventState] = useState<IEventAdd>(prevEvent ? { ...prevEvent, coachPassword: initialEvent.coachPassword } : initialEvent);
  const [updateEvent, setUpdateEvent] = useState<Partial<IEventAdd>>({});
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const [sponsorImgList, setSponsorImgList] = useState<IEventSponsorAdd[]>([]);

  // GraphQL
  const [eventAdd] = useMutation(ADD_EVENT);
  const [eventUpdate] = useMutation(UPDATE_EVENT);

  /**
   * Add event mutation
   */
  const handleEventAdd = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await addOrUpdateEvent({
      e,
      update,
      eventId,
      directorId,
      setEventState,
      setIsLoading,
      eventState,
      updateEvent,
      sponsorImgList,
      sponsorInputEl,
      eventLogo,
      setActErr,
      eventUpdate,
      eventAdd,
      user,
      router,
      initialEvent,
    });
  };

  /**
   * Change input on cange event
   */
  const handleInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (!update) {
      setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    } else {
      setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleNumberInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const inputEl = e.target as HTMLInputElement;
      const intVal = parseInt(inputEl.value, 10);
      if (typeof intVal === 'number') {
        if (!update) {
          setEventState((prevState) => ({ ...prevState, [inputEl.name]: intVal }));
        } else {
          setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: intVal }));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDivisionInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    if (update && prevEvent?.divisions) {
      setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };

  const handleToggleInput = (e: React.SyntheticEvent, stateName: string) => {
    e.preventDefault();
    if (!update) {
      // @ts-ignore
      const prevStateVal: boolean = eventState[stateName];
      setEventState((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
    } else {
      // @ts-ignore
      const prevStateVal: boolean = eventState[stateName] ? eventState[stateName] : false;
      setUpdateEvent((prevState) => ({ ...prevState, [stateName]: !prevStateVal }));
    }
  };

  const handleImgRemove = (e: React.SyntheticEvent, companyName: string) => {
    e.preventDefault();
    setSponsorImgList((prevState) => {
      // Need to update
      return prevState.filter((imgFile) => (typeof imgFile === 'string' ? imgFile !== companyName : imgFile.company !== companyName));
    });
  };

  /**
   * File Upload
   */
  const handleSponsorDialog = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (addSponsorDialogEl.current) {
      setCurrSponsor(initialCurrSponsor);
      addSponsorDialogEl.current.showModal();

      // Reset Input
      const companyInput = document.getElementById('company');
      if (companyInput) {
        // @ts-ignore
        companyInput.value = '';
      }
    }
  };

  const closeModal = () => {
    if (addSponsorDialogEl.current) {
      addSponsorDialogEl.current.close();
    }
  };

  useClickOutside(addSponsorDialogEl, () => {
    closeModal();
  });

  const handleCloseModal = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
  };

  const handleOk = (e: React.SyntheticEvent) => {
    e.preventDefault();
    closeModal();
  };

  const handleFileNameChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setCurrSponsor((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
  };

  const handleFileChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const fileInputEl = e.target as HTMLInputElement;
    // @ts-ignore
    sponsorInputEl.current = fileInputEl;
    if (!fileInputEl.files || fileInputEl.files.length === 0) return;

    const inputedFile = fileInputEl.files[0];

    if (currSponsor.company && currSponsor.company !== '') {
      const prevSponsor = sponsorImgList.find((si) => si.company === currSponsor.company);
      const sponsorObj = prevSponsor ? { ...prevSponsor } : { company: currSponsor.company, logo: inputedFile };
      setSponsorImgList((prevState) => [...prevState.filter((ps) => ps.company !== currSponsor.company), sponsorObj]);
      setCurrSponsor((prevState) => ({ ...prevState, logo: inputedFile }));
    } else {
      setCurrSponsor((prevState) => ({ ...prevState, logo: inputedFile }));
      setSponsorImgList((prevState) => [...prevState, { company: currSponsor.company, logo: inputedFile }]);
    }
  };


  const handleLogoChange = (uploadedFile: File) => {
    eventLogo.current = uploadedFile;
  };

  /**
   * Lifecycle hooks
   */
  useEffect(() => {
    // Getting event Id from url
    const pnList = pName.split('/');
    if (pnList.includes('settings')) {
      // settings = edit event page
      const nPnList = pnList.filter((pn) => pn !== '');
      const newEventId = nPnList[0];
      setEventId(newEventId);
    }
    // Getting Director Id
    if (user.info?.role === UserRole.admin) {
      const newDirectorId = searchParams.get('ldoId');
      if (!newDirectorId) {
        router.push('/admin');
        return;
      }
      setDirectorId(newDirectorId);
    } else {
      setDirectorId(user.info?._id ? user.info._id : null);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const sl: IEventSponsorAdd[] = [];

      try {
        if (!update) {
          // Fetch the logo file from the local directory
          const response = await fetch('/free-logo.png');
          const blob = await response.blob(); // Convert the response to a Blob

          const defaultLogoFile = new File([blob], 'default_logo.jpg', { type: 'image/jpeg' }); // Create a File object

          // Create the initial sponsor image list with the default logo file
          sl.push({
            company: APP_NAME,
            logo: defaultLogoFile,
          });
        }

        if (prevEvent && prevEvent.sponsors && prevEvent.sponsors.length > 0) {
          for (let i = 0; i < prevEvent.sponsors.length; i += 1) {
            // @ts-ignore
            sl.push({ company: prevEvent.sponsors[i].company, logo: prevEvent.sponsors[i].logo });
          }
        }

        setSponsorImgList(sl); // Update the state with the fetched data
      } catch (error) {
        console.error('Error fetching default logo:', error);
        // If fetching fails, fall back to using the previous event sponsors
        if (prevEvent && prevEvent.sponsors && prevEvent.sponsors.length > 0) {
          for (let i = 0; i < prevEvent.sponsors.length; i += 1) {
            // @ts-ignore
            sl.push({ company: prevEvent.sponsors[i].company, logo: prevEvent.sponsors[i].logo });
          }
        }
        setSponsorImgList(sl); // Update the state with the fallback data
      }
    };

    fetchData();
  }, [prevEvent, update]);

  return (
    <form onSubmit={handleEventAdd} className="flex flex-col gap-2">
      <TextInput required={!update} defaultValue={eventState.name} handleInputChange={handleInputChange} lblTxt="Name" name="name" lw="w-2/6" rw="w-4/6" />

      <ImageInput handleFileChange={handleLogoChange} name="logo"  />
      {/* <FileInput defaultValue={eventState.logo} handleFileChange={handleLogoChange} name="logo" extraCls="md:w-5/12" /> */}

      <DateInput required={!update} defaultValue={eventState.startDate} handleInputChange={handleInputChange} lblTxt="Start Date" name="startDate" lw="w-2/6" rw="w-4/6" />
      <DateInput required={!update} defaultValue={eventState.endDate} handleInputChange={handleInputChange} lblTxt="End Date" name="endDate" lw="w-2/6" rw="w-4/6" />

      {!update ? (
        <TextInput required={!update} defaultValue={eventState.divisions} handleInputChange={handleDivisionInputChange} readOnly={update} lblTxt="DIVISIONS" name="divisions" lw="w-2/6" rw="w-4/6" />
      ) : (
        <h4>Divisions</h4>
      )}

      <ShowDivisions
        update={update}
        dStr={eventState.divisions}
        prevDivisions={prevEvent && prevEvent.divisions ? prevEvent.divisions : ''}
        setEventState={setEventState}
        setUpdateEvent={setUpdateEvent}
        eventId={eventId}
        updateEvent={updateEvent}
      />
      {/* Default setting  */}
      <h3 className="text-2xl capitalize mt-4">Default setting</h3>

      <NumberInput defaultValue={eventState.nets} handleInputChange={handleNumberInputChange} lblTxt="Number of nets" name="nets" required={!update} />
      <NumberInput defaultValue={eventState.rounds} handleInputChange={handleNumberInputChange} lblTxt="Number of rounds" name="rounds" required={!update} />
      <NumberInput defaultValue={eventState.netVariance} handleInputChange={handleNumberInputChange} lblTxt="Net Variance" name="netVariance" required={!update} />

      <SelectInput name="homeTeam" defaultValue={eventState.homeTeam} optionList={homeTeamStrategy} lblTxt="How is home team decided?" handleSelect={handleInputChange} rw="w-3/6" lw="w-3/6" />
      <ToggleInput handleValueChange={handleToggleInput} lblTxt="Auto assign when clock runs out" value={eventState.autoAssign} name="autoAssign" />
      <SelectInput
        defaultValue={eventState.autoAssignLogic}
        name="autoAssignLogic"
        optionList={assignStrategies.map((as) => ({ value: as, text: as }))}
        lblTxt="Which auto assign logic when clock runs out?"
        handleSelect={handleInputChange}
        rw="w-3/6"
        lw="w-3/6"
      />
      <SelectInput
        name="rosterLock"
        defaultValue={rosterLockList[0].value}
        optionList={rosterLockList}
        lblTxt="When does the roster lock setting?"
        handleSelect={handleInputChange}
        rw="w-3/6"
        lw="w-3/6"
      />
      <NumberInput required lblTxt="Sub Clock" name="timeout" defaultValue={eventState.timeout} handleInputChange={handleInputChange} />

      <TextInput handleInputChange={handleInputChange} lblTxt="Coach Password" name="coachPassword" required defaultValue={eventState.coachPassword} rw="w-3/6" lw="w-3/6" />

      <TextInput handleInputChange={handleInputChange} lblTxt="Fwango Link" name="fwango" defaultValue={eventState.fwango} rw="w-3/6" lw="w-3/6" />

      <TextareaInput handleInputChange={handleInputChange} name="description" vertical required defaultValue={eventState.description} rw="w-3/6" lw="w-3/6" />

      {/* File upload start  */}
      <dialog ref={addSponsorDialogEl}>
        <div className="close-wrapper w-full flex justify-end items-center">
          <Image width={imgSize.logo} height={imgSize.logo} alt="close-icon" src="/icons/close.svg" role="presentation" onClick={handleCloseModal} className="svg-white w-6" />
        </div>
        <div className="flex items-center justify-center flex-col">
          {/* defaultValue={currSponsor.company} */}
          <TextInput vertical handleInputChange={handleFileNameChange} name="company" required={false} />
          <AnyFileInput handleFileChange={handleFileChange} name="logo" vertical lblTxt="Sponsor Logo" />
          <div className="input-group mt-4">
            <button type="button" className="btn-info" onClick={handleOk}>
              Ok
            </button>
          </div>
        </div>
      </dialog>
      <div className="sponsors-heading flex justify-between w-full mt-4 items-center">
        <h3 className="text-2xl capitalize">Sponsors</h3>
        <button type="button" onClick={handleSponsorDialog} className="btn-primary">
          Add New
        </button>
      </div>
      {/* File upload end  */}
      <ShowSponsors fileList={sponsorImgList} handleImgRemove={handleImgRemove} />

      <button className="btn-info" type="submit">
        {update ? 'Update' : 'Submit'}
      </button>
    </form>
  );
}

export default EventAddUpdate;
