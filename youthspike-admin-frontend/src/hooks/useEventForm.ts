import { useState, useRef } from 'react';
import { IEventAdd, IEventSponsorAdd, IProStatsAdd, ETieBreakingStrategy, IEvent, IProStats } from '@/types';
import { getLocalDateTimeISO } from '@/utils/datetime';
import { assignStrategies, tieBreakingRules, lockTimes, homeTeamStrategy } from '@/utils/staticData';

const initialProStats: IProStatsAdd = {
  servingPercentage: 1,
  acePercentage: 1,
  receivingPercentage: 1,
  defensiveConversionPercentage: 1,
  hittingPercentage: 1,
  settingPercentage: 1,
};

const initialEvent: IEventAdd = {
  name: 'Unnamed Event',
  startDate: getLocalDateTimeISO(),
  endDate: getLocalDateTimeISO(),
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
  tieBreaking: tieBreakingRules[0].value as ETieBreakingStrategy,
  coachPassword: '',
  location: 'USA',
  accessCode: '',
  description: 'A New Event is Idho, USA.',
  defaultSponsor: true,
  playerLimit: 10,
  active: true,
};

export function useEventForm(update: boolean, prevEvent?: IEventAdd | IEvent, prevMultiplayer?: IProStats, prevWight?: IProStats, prevStats?: IProStats) {
  const eventLogo = useRef<Blob | null>(null);
  const [eventState, setEventState] = useState<IEventAdd>(
    prevEvent ? { ...prevEvent, coachPassword: initialEvent.coachPassword } : initialEvent
  );
  const [multiplayer, setMultiplayer] = useState<IProStatsAdd>(prevMultiplayer || initialProStats);
  const [weight, setWeight] = useState<IProStatsAdd>(prevWight || initialProStats);
  
  // Update
  const [updateEvent, setUpdateEvent] = useState<Partial<IEventAdd>>({});
  const [updateMultiplayer, setUpdateMultiplayer] = useState<Partial<IProStatsAdd>>({});
  const [updateWeight, setUpdateWeight] = useState<Partial<IProStatsAdd>>({});
  const [updateStats, setUpdateStats] = useState<Partial<IProStatsAdd>>({});
 
  const [sponsorImgList, setSponsorImgList] = useState<IEventSponsorAdd[]>(
    prevEvent && 'sponsors' in prevEvent && Array.isArray(prevEvent.sponsors) ? 
      prevEvent.sponsors.map(s => ({ company: s, logo: null })) : []
  );

  const handleInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const { name, value } = inputEl;
    updateFormState(name, value);
  };

  const handleToggleChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const { name, checked } = inputEl;
    updateFormState(name, checked ?? false);
  };

  const handleNumberInputChange = (e: React.SyntheticEvent) => {
    const inputEl = e.target as HTMLInputElement;
    const { name, value } = inputEl;
    const intVal = parseInt(value, 10);
    if (!isNaN(intVal)) {
      updateFormState(name, intVal);
    }
  };

  const handleDateChange = (name: string, value: string) => {
    updateFormState(name, value);
  };

  

  const updateFormState = (name: string, value: any) => {
    if (update) {
      setUpdateEvent(prev => ({ ...prev, [name]: value }));
    } else {
      setEventState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProStatsChange = (prefix: 'multiplayer' | 'weight', field: string, value: number) => {
    const setters = {
      multiplayer: update ? setUpdateMultiplayer : setMultiplayer,
      weight: update ? setUpdateWeight : setWeight
    };
    
    // setters[prefix](prev => ({ ...prev, [field]: value }));
    setters[prefix]((prev: IProStatsAdd) => ({ ...prev, [field]: value }));
  };

  const handleSponsorImgList = (sponsor: IEventSponsorAdd) => {
    setSponsorImgList(prev => [...prev.filter(ps => ps.company !== sponsor.company), sponsor]);
  };

  const handleSponsorRemove = (companyName: string | null) => {
    setSponsorImgList(prev => prev.filter(imgFile => 
      typeof imgFile === 'string' ? imgFile !== companyName : imgFile.company !== companyName
    ));
  };

  const handleDefaultSponsorToggle = (value: boolean) => {
    updateFormState('defaultSponsor', value);
  };

  const handleLogoChange = (file: MediaSource | Blob) => {
    eventLogo.current = file as Blob;
  };

  return {
    eventState,
    multiplayer,
    weight,
    
    updateEvent,
    updateMultiplayer,
    updateWeight, 
    updateStats,

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
  };
}