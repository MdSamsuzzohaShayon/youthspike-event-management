import React from 'react';
import { IDateChangeHandlerProps, IEventAdd, IProStatsAdd } from '@/types';
import { assignStrategies, tieBreakingRules, lockTimes, homeTeamStrategy } from '@/utils/staticData';
import { ERosterLock } from '@/types/event';
import InputField from '../elements/forms/InputField';
import ImageInput from '../elements/forms/ImageInput';
import DateInput from '../elements/forms/DateInput';
import SelectInput from '../elements/forms/SelectInput';
import ToggleInput from '../elements/forms/ToggleInput';
import DateTimeInput from '../elements/forms/DateTimeInput';
import TextareaInput from '../elements/forms/TextareaInput';
import ShowDivisions from './ShowDivisions';
import ProStatsInput from './ProStatsInput';

interface EventFormSectionsProps {
  update: boolean;
  eventState: IEventAdd;
  updateEvent: Partial<IEventAdd>;
  onInputChange: (e: React.SyntheticEvent) => void;
  onToggleChange: (e: React.SyntheticEvent) => void;
  onNumberChange: (e: React.SyntheticEvent) => void;
  onDateChange: (name: string, value: string) => void;
  onProStatsChange: (prefix: 'multiplayer' | 'weight', field: string, value: number) => void;
  onSelectChange?: (e: React.SyntheticEvent) => void;
  multiplayer: IProStatsAdd;
  weight: IProStatsAdd;
  onLogoChange?: (uploadedFile: Blob | MediaSource) => void;
  prevEvent?: IEventAdd;
  setEventState?: React.Dispatch<React.SetStateAction<IEventAdd>>;
  setUpdateEvent?: React.Dispatch<React.SetStateAction<Partial<IEventAdd>>>;
  eventId?: string | null;
}

const EventFormSections: React.FC<EventFormSectionsProps> = ({
  update,
  eventState,
  updateEvent,
  onInputChange,
  onToggleChange,
  onNumberChange,
  onDateChange,
  onProStatsChange,
  onSelectChange,
  multiplayer,
  weight,
  onLogoChange,
  prevEvent,
  setEventState,
  setUpdateEvent,
  eventId,
}) => {
  return (
    <>
      <InputField name="name" type="text" label="Name" handleInputChange={onInputChange} defaultValue={eventState.name} required={!update} />

      <div className="img-wrapper">
        <div className="hidden md:block w-3/6" />
        <div className="w-full md:w-3/6">
          <ImageInput handleFileChange={onLogoChange} name="logo" defaultValue={eventState.logo || null} />
        </div>
      </div>

      <DateInput label="Start Date" name="startDate" handleDateChange={onDateChange} defaultValue={eventState.startDate} required={!update} />

      <DateInput label="End Date" name="endDate" handleDateChange={onDateChange} defaultValue={eventState.endDate} required={!update} />

      <InputField required={!update} name="nets" type="number" handleInputChange={onNumberChange} label="Number of nets" defaultValue={eventState.nets} />

      <InputField required={!update} name="rounds" type="number" handleInputChange={onNumberChange} label="Number of rounds" defaultValue={eventState.rounds} />

      <InputField required={!update} name="netVariance" type="number" handleInputChange={onNumberChange} label="Net Variance" defaultValue={eventState.netVariance} />

      <InputField name="fwango" type="text" label="Fwango Link" handleInputChange={onInputChange} defaultValue={eventState.fwango || ''} />

      <div className="w-full flex flex-col justify-center items-start">
        {!update ? (
          <InputField type="text" required value={eventState.divisions} handleInputChange={onInputChange} label="Divisions" name="divisions" className='w-full' />
        ) : (
          <h4 className="capitalize text-lg font-semibold mb-1">Divisions</h4>
        )}

        {<ShowDivisions divisions={eventState?.divisions || ''} onInputChange={onInputChange} />}
      </div>

      <SelectInput name="homeTeam" label="How is home team decided?" handleSelect={onSelectChange} optionList={homeTeamStrategy} defaultValue={eventState.homeTeam} />

      <SelectInput name="tieBreaking" optionList={tieBreakingRules} defaultValue={eventState.tieBreaking} handleSelect={onSelectChange} label="Tie breaking strategy" />

      <ToggleInput handleInputChange={onToggleChange} name="autoAssign" label="Auto assign when clock runs out" defaultValue={eventState.autoAssign} />
      <ToggleInput handleInputChange={onToggleChange} name="includeState" label="Include the match into player stats" defaultValue={eventState.includeState} />

      <SelectInput name="autoAssignLogic" optionList={assignStrategies} handleSelect={onSelectChange} label="Which auto assign logic when clock runs out?" defaultValue={eventState.autoAssignLogic} />

      <SelectInput name="rosterLock" optionList={lockTimes} handleSelect={onSelectChange} defaultValue={eventState.rosterLock} label="When does the roster lock setting?" />

      {eventState.rosterLock && eventState.rosterLock !== '' && eventState.rosterLock !== ERosterLock.FIRST_ROSTER_SUBMIT.toString() && (
        <DateTimeInput name="rosterLockDate" label="Set a time for locking roster ranking!" required={!update} handleDateChange={onDateChange} />
      )}

      <InputField name="timeout" type="number" handleInputChange={onNumberChange} label="Sub Clock (in minutes)" defaultValue={eventState.timeout} />

      <InputField name="coachPassword" type="password" label="Coach Password" required={!update} handleInputChange={onInputChange} defaultValue={eventState.coachPassword} />
      <TextareaInput name="description" label="Description" required={!update} handleInputChange={onInputChange} defaultValue={eventState.description} />
      <InputField type="text" name="location" label="Location" required={!update} handleInputChange={onInputChange} defaultValue={eventState.location} />

      <InputField
        type="text"
        tooltip="For scorekeeper, access code are needed to change the score!"
        name="accessCode"
        label="Access Code"
        handleInputChange={onInputChange}
        value={eventState.accessCode}
      />

      <ProStatsInput
        label="Multiplayer Stats"
        namePrefix="multiplayer"
        defaultValue={multiplayer}
        handleInputChange={(e) => {
          const name = e.target.name.split('.')[1];
          const value = parseFloat(e.target.value);
          onProStatsChange('multiplayer', name, value);
        }}
      />

      <ProStatsInput
        label="Weight Stats"
        namePrefix="weight"
        defaultValue={weight}
        handleInputChange={(e) => {
          const name = e.target.name.split('.')[1];
          const value = parseFloat(e.target.value);
          onProStatsChange('weight', name, value);
        }}
      />
    </>
  );
};

export default EventFormSections;
