'use client'

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ADD_EVENT, UPDATE_EVENT } from '@/graphql/event';
import { useMutation } from '@apollo/client';

// Components
import { useUser } from '@/lib/UserProvider';
import { IEventAddProps, IEventAdd, IEventSponsorAdd, IDateChangeHandlerProps } from '@/types';
import { UserRole } from '@/types/user';
import { assignStrategies, tieBreakingRules, lockTimes, homeTeamStrategy } from '@/utils/staticData';
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
import TextareaInput from '../elements/forms/TextareaInput';
import ImageInput from '../elements/forms/ImageInput';

import { useSocket } from '@/lib/SocketProvider';
import { useLdoId } from '@/lib/LdoProvider';
import { ERosterLock, ETieBreakingStrategy } from '@/types/event';
import { useError } from '@/lib/ErrorContext';
import DateTimeInput from '../elements/forms/DateTimeInput';
import InputField from '../elements/forms/InputField';
import { createEvent } from '@/app/actions/event';
import DivisionInputField from '../elements/forms/DivisionInputField';

interface IAddMutationVariables {
  sponsorsInput: IEventSponsorAdd[];
  logo: null | string;
  // updateInput?: Partial<IEventAdd>;
  input?: IEventAdd;
}


// Logo and division is missing
const initialEvent: IEventAdd = {
  name: 'Unnamed Event',
  startDate: new Date().toISOString(),
  endDate: new Date().toISOString(),
  nets: 3,
  rounds: 2,
  netVariance: 3,
  fwango: null,

  timeout: 3,
  divisions: '',

  homeTeam: homeTeamStrategy[0].value,
  autoAssign: false,
  autoAssignLogic: assignStrategies[0].value,
  rosterLock: lockTimes[0].value,

  tieBreaking: ETieBreakingStrategy.TWO_POINTS_NET,
  coachPassword: '',
  location: 'USA',
  description: 'USA',

  defaultSponsor: true,
  playerLimit: 10,
  active: true,
};

const initialCurrSponsor = { logo: null, company: '' };

function EventAddUpdate({ update, prevEvent }: IEventAddProps) {
  // Hooks
  const router = useRouter();
  const user = useUser();
  const searchParams = useSearchParams();
  const pName = usePathname();
  const socket = useSocket();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  // Local State
  const eventLogo = useRef<null | MediaSource | Blob>(null);
  const addSponsorDialogEl = useRef<HTMLDialogElement | null>(null);
  const [currSponsor, setCurrSponsor] = useState<IEventSponsorAdd>(initialCurrSponsor);

  const [eventState, setEventState] = useState<IEventAdd>(prevEvent ? { ...prevEvent, coachPassword: initialEvent.coachPassword } : initialEvent);
  const [updateEvent, setUpdateEvent] = useState<Partial<IEventAdd>>({});
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
      setActErr,
      update,
      eventId,
      directorId,
      setEventState,
      setIsLoading,
      eventState,
      updateEvent,
      sponsorImgList,
      eventLogo,
      eventUpdate,
      eventAdd,
      router,
      initialEvent,
      socket,
      ldoIdUrl
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

  const handleToggleChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    if (!update) {
      setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.checked ?? false }));
    } else {
      setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: inputEl.checked ?? false }));
    }
  };

  const handleDateChange = ({ name, value }: IDateChangeHandlerProps) => {
    if (!update) {
      setEventState((prevState) => ({ ...prevState, [name]: value }));
    } else {
      setUpdateEvent((prevState) => ({ ...prevState, [name]: value }));
    }
  }

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


  const handleRosterLockDate = ({ name, value }: IDateChangeHandlerProps) => {
    if (!update) {
      setEventState((prevState) => ({ ...prevState, rosterLock: value }));
    } else {
      setUpdateEvent((prevState) => ({ ...prevState, rosterLock: value }));
    }
  }


  const handleDivisionInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    setEventState((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    if (update && prevEvent?.divisions) {
      setUpdateEvent((prevState) => ({ ...prevState, [inputEl.name]: inputEl.value }));
    }
  };


  const handleImgRemove = (e: React.SyntheticEvent, companyName: string) => {
    e.preventDefault();
    setSponsorImgList((prevState) => {
      // Need to update
      return prevState.filter((imgFile) => (typeof imgFile === 'string' ? imgFile !== companyName : imgFile.company !== companyName));
    });
  };

  const handleDefaultSponsor=(e: React.SyntheticEvent)=>{
    e.preventDefault();
    if(update){
      setUpdateEvent((prevState) => ({ ...prevState, defaultSponsor: false }));
    }else{
      setEventState((prevState) => ({ ...prevState, defaultSponsor: false }));
    }
  }

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


  const handleLogoChange = (uploadedFile: MediaSource | Blob) => {
    eventLogo.current = uploadedFile;
  };




  /**
   * Lifecycle hooks
   * Getting and setting event ID & director ID
   */
  useEffect(() => {
    const pnList = pName.split('/');
    if (pnList.includes('settings')) {
      const nPnList = pnList.filter((pn) => pn !== '');
      const newEventId = nPnList[0];
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
      setDirectorId(user.info?._id ? user.info._id : null);
    }
  }, [user]);



  return (
    <form className="w-full" onSubmit={handleEventAdd} >
      <div className="part-1 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Name */}
        <InputField key="dau-1" name="name" type="text" label="Name" handleInputChange={handleInputChange} defaultValue={eventState.name} required={!update} />
        {/* Logo Upload */}
        <ImageInput handleFileChange={handleLogoChange} name="logo" />

        <DateInput key="di-eau-1" label="Start Date" name="startDate" handleDateChange={handleDateChange} defaultValue={eventState.startDate}  required={!update} />
        <DateInput key="di-eau-2" label="End Date" name="endDate" handleDateChange={handleDateChange} defaultValue={eventState.endDate}  required={!update} />




        {/* Number of Nets */}
        <InputField key="dau-2" required={!update} name="nets" type="number" handleInputChange={handleNumberInputChange} label="Number of nets" defaultValue={eventState.nets} />
        <InputField key="dau-3" required={!update} name="rounds" type="number" handleInputChange={handleNumberInputChange} label="Number of rounds" defaultValue={eventState.rounds} />
        <InputField key="dau-4" required={!update} name="netVariance" type="number" handleInputChange={handleNumberInputChange} label="Net Variance" defaultValue={eventState.netVariance} />
        <InputField key="dau-7" name="fwango" type="text" label="Fwango Link" handleInputChange={handleInputChange} defaultValue={eventState.fwango || undefined} />
      </div>
      <div className="w-full mt-6">
        {/* <DivisionInputField  defaultValue={eventState.divisions} name="divisions" /> */}
        {!update ? (
          <InputField key="dau-8" type='text'  required={!update} defaultValue={eventState.divisions} handleInputChange={handleDivisionInputChange} label="Divisions" name="divisions" />
        ) : (
          <h4 className="capitalize text-lg font-semibold mb-1">Divisions</h4>
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
      </div>

      <div className='part-2 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
        {/* Home Team Selection */}
        <SelectInput key="si-dau-1" name='homeTeam' label='How is home team decided?' handleSelect={handleInputChange} optionList={homeTeamStrategy} defaultValue={eventState.homeTeam} />
        <SelectInput key="si-dau-2" name="tieBreaking"
          optionList={tieBreakingRules}
          defaultValue={eventState.tieBreaking}
          handleSelect={handleInputChange}
          label="Tie breaking strategy" />
        {/* Auto Assign */}
        <ToggleInput handleInputChange={handleToggleChange}
          name="autoAssign" label='Auto assign when clock runs out' defaultValue={eventState.autoAssign} />


        <SelectInput key="eau-2" name="autoAssignLogic"
          optionList={assignStrategies}
          handleSelect={handleInputChange}
          label="Which auto assign logic when clock runs out?" defaultValue={eventState.autoAssignLogic} />

        <SelectInput key="eau-4"
          name="rosterLock"
          optionList={lockTimes}
          handleSelect={handleInputChange}
          defaultValue={eventState.rosterLock}
          label="When does the roster lock setting?"
        />

        {eventState.rosterLock && eventState.rosterLock !== "" && eventState.rosterLock !== ERosterLock.FIRST_ROSTER_SUBMIT.toString() && (
          <DateTimeInput name='rosterLockDate' label='Set a time for locking roster ranking!' required={!update} handleDateChange={handleRosterLockDate} />
        )}
      </div>

      <div className='part-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
        <InputField key="dau-5" name="timeout" type="number" handleInputChange={handleNumberInputChange} label="Sub Clock (in minutes)" defaultValue={eventState.timeout} />
        <InputField key="dau-6" name="coachPassword" type="password" label="Coach Password" required={!update} handleInputChange={handleInputChange} defaultValue={eventState.coachPassword} />
      </div>
      <div className='part-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
        <TextareaInput key="ti-eau-1" name="description" label="Description" required={!update} handleInputChange={handleInputChange} defaultValue={eventState.description} />
        <TextareaInput key="ti-eau-2" name="location" label="Location" required={!update} handleInputChange={handleInputChange} defaultValue={eventState.location} />
      </div>

      <dialog ref={addSponsorDialogEl}>
        <div className="close-wrapper w-full flex justify-end items-center">
          <Image width={imgSize.logo} height={imgSize.logo} alt="close-icon" src="/icons/close.svg" role="presentation" onClick={handleCloseModal} className="svg-white w-6" />
        </div>
        <div className="flex items-center justify-center flex-col">
          <InputField key="ti-eau-5" type='text' handleInputChange={handleFileNameChange} name="company" required={false} />
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
      <ShowSponsors handleDefaultSponsor={handleDefaultSponsor} defaultSponsor={eventState.defaultSponsor} fileList={sponsorImgList} handleImgRemove={handleImgRemove} />



      {/* Submit Button */}
      <div className="col-span-2 flex justify-center">
        <button type="submit" className="bg-yellow-400 text-black px-6 py-3 rounded-md font-bold text-lg mt-4 hover:bg-yellow-300">Submit</button>
      </div>
      {/* <button className="btn-info" type="submit">
            {update ? 'Update' : 'Submit'}
          </button> */}
    </form>
  );
}

export default EventAddUpdate;
