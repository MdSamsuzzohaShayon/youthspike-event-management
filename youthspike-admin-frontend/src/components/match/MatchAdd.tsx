import { useMutation } from '@apollo/client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DateInput from '../elements/forms/DateInput';
import { IAddMatch, IDateChangeHandlerProps, IEventExpRel, IGroupExpRel, IMatchExpRel, ITeam } from '@/types';
import SelectInput from '../elements/forms/SelectInput';
import ToggleInput from '../elements/forms/ToggleInput';
import { CREATE_MATCH, UPDATE_MATCH } from '@/graphql/matches';
import { assignStrategies, homeTeamStrategy, lockTimes, tieBreakingRules } from '@/utils/staticData';
import { EAssignStrategies } from '@/types/elements';
import addOrUpdateMatch from '@/utils/requestHandlers/addOrUpdateMatch';
import { useRouter } from 'next/navigation';
import { useLdoId } from '@/lib/LdoProvider';
import { ERosterLock, ETieBreakingStrategy } from '@/types/event';
import { useError } from '@/lib/ErrorProvider';
import TeamSelector from './TeamSelector';
import InputField from '../elements/forms/InputField';
import TextareaInput from '../elements/forms/TextareaInput';
import { getLocalDateTimeISO } from '@/utils/datetime';

interface IMatchAddProps {
  eventId: string;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  groupList: IGroupExpRel[];
  currDivision?: string;
  update?: boolean;
  teamList?: ITeam[];
  matchId?: string;
  eventData?: IEventExpRel | null;
  showAddMatch?: React.Dispatch<React.SetStateAction<boolean>>;
  prevMatch?: IMatchExpRel;
  addMatchCB?: (matchData: IMatchExpRel) => void;
}

const initialAddMatch: IAddMatch = {
  date: getLocalDateTimeISO(),
  event: '',
  description: '',
  location: '',
  accessCode: '',
  numberOfNets: 0,
  numberOfRounds: 0,
  teamA: '',
  teamB: '',
  autoAssignLogic: EAssignStrategies.AUTO,
  autoAssign: false,
  division: '',
  netVariance: 0,
  homeTeam: '',
  rosterLock: '',
  timeout: 0,
  tieBreaking: ETieBreakingStrategy.TWO_POINTS_NET,
};

function MatchAdd({ eventId, setIsLoading, teamList, currDivision, groupList, update, matchId, eventData, showAddMatch, prevMatch, addMatchCB }: IMatchAddProps) {
  const router = useRouter();
  const { ldoIdUrl } = useLdoId();
  const { setActErr } = useError();

  // Local State
  const [addMatch, setAddMatch] = useState<IAddMatch>(initialAddMatch);
  const [updateMatch, setUpdateMatch] = useState<Partial<IAddMatch>>({});
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);

  // GraphQL
  const [createMatch] = useMutation(CREATE_MATCH);
  const [mutateMatch] = useMutation(UPDATE_MATCH);

  // Memoized derived state
  const filteredTeamList = useMemo(() => {
    if (!teamList) return [];
    if (!selectedGroup || selectedGroup.toLowerCase() === 'all') return teamList;

    const group = groupList.find((g) => g._id === selectedGroup);
    if (!group?.teams) return [];

    const teamIds = new Set(group.teams.map((gt) => gt._id));
    return teamList.filter((t) => teamIds.has(t._id));
  }, [teamList, selectedGroup, groupList]);

  // Generic handlers
  const createChangeHandler =
    <T extends unknown>(
      isUpdate: boolean,
      stateSetter: React.Dispatch<React.SetStateAction<IAddMatch>> | React.Dispatch<React.SetStateAction<Partial<IAddMatch>>>,
      transformer?: (value: string) => T,
    ) =>
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const inputEl = e.target as HTMLInputElement;
      const value = transformer ? transformer(inputEl.value) : inputEl.value;
      if (isUpdate) {
        (stateSetter as React.Dispatch<React.SetStateAction<Partial<IAddMatch>>>)((prev) => ({ ...prev, [inputEl.name]: value }));
      } else {
        (stateSetter as React.Dispatch<React.SetStateAction<IAddMatch>>)((prev) => ({ ...prev, [inputEl.name]: value }));
      }
    };

  const handleInputChange = createChangeHandler(!!update, update ? setUpdateMatch : setAddMatch);
  // const handleNumInputChange = createChangeHandler(!!update, update ? setUpdateMatch : setAddMatch, parseInt);
  const handleSelectChange = handleInputChange;

  const handleNumInputChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLInputElement;
    const newValue = parseInt(inputEl.value, 10);
    if (update) {
      setUpdateMatch((prev) => ({ ...prev, [inputEl.name]: newValue }));
    } else {
      setAddMatch((prev) => ({ ...prev, [inputEl.name]: newValue }));
    }
  };

  const handleToggleInput = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const state = update ? updateMatch : addMatch;
    const newValue = !(state.autoAssign ?? false);
    if (update) {
      setUpdateMatch((prev) => ({ ...prev, autoAssign: newValue }));
    } else {
      setAddMatch((prev) => ({ ...prev, autoAssign: newValue }));
    }
  };


  const handleDateChange = (name: string, value: string) => {
    if (update) {
      setUpdateMatch((prev) => ({ ...prev, [name]: value }));
    } else {
      setAddMatch((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRosterLockDate = (name: string, value: string) => {
    if (update) {
      setUpdateMatch((prev) => ({ ...prev, rosterLock: value }));
    } else {
      setAddMatch((prev) => ({ ...prev, rosterLock: value }));
    }
  };

  const handleGroupChange = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const inputEl = e.target as HTMLSelectElement;
    const newGroup = inputEl.value !== '' ? inputEl.value : undefined;
    setSelectedGroup(newGroup);

    if (update) {
      setUpdateMatch((prev) => ({
        ...prev,
        group: newGroup?.toLowerCase() === 'all' ? undefined : newGroup,
      }));
    } else {
      setAddMatch((prev) => ({
        ...prev,
        group: newGroup?.toLowerCase() === 'all' ? undefined : newGroup,
      }));
    }
  };

  const handleAddMatch = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    await addOrUpdateMatch({
      setActErr,
      setIsLoading,
      eventId,
      mutateMatch,
      createMatch,
      matchId,
      addMatch,
      ldoIdUrl,
      currDivision,
      updateMatch,
      update,
      showAddMatch,
      router,
      addMatchCB,
    });
  };

  // Initialize state
  useEffect(() => {
    if (!prevMatch && !eventData) return;

    const mObj = prevMatch
      ? {
          ...initialAddMatch,
          ...prevMatch,
          teamA: prevMatch.teamA._id,
          teamB: prevMatch.teamB._id,
          group: typeof prevMatch.group === 'object' ? prevMatch.group._id : prevMatch.group,
        }
      : {
          ...initialAddMatch,
          numberOfRounds: eventData!.rounds,
          numberOfNets: eventData!.nets,
          date: eventData!.startDate,
          netVariance: eventData!.netVariance,
          autoAssign: eventData!.autoAssign,
          timeout: eventData!.timeout,
          rosterLock: eventData!.rosterLock,
          homeTeam: eventData!.homeTeam,
          description: eventData!.description,
          location: eventData!.location,
          accessCode: eventData!.accessCode,
          tieBreaking: eventData!.tieBreaking,
          fwango: eventData!.fwango,
        };

    setAddMatch(mObj);
  }, [eventData, prevMatch]);

  // Memoized group options
  const groupOptions = useMemo(() => {
    const baseOptions = [{ id: 1, text: 'All', value: 'all' }];

    if (!addMatch.division) {
      return [...baseOptions, ...groupList.map((g, i) => ({ id: i + 2, text: g.name, value: g._id }))];
    }

    const divisionUpper = addMatch.division.trim().toUpperCase();
    return [...baseOptions, ...groupList.filter((g) => g.division.trim().toUpperCase() === divisionUpper).map((g, i) => ({ id: i + 2, text: g.name, value: g._id }))];
  }, [groupList, addMatch.division]);

  return (
    <form onSubmit={handleAddMatch} className="w-full">
      <div className="part-1 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <DateInput 
          label="Start Date" 
          name="date" 
          handleDateChange={handleDateChange} 
          value={addMatch.date} 
          required={!update} 
        />

        <InputField
          key="field-numberOfNets"
          type="number"
          required={!update}
          label="Number of nets"
          name="numberOfNets"
          value={addMatch.numberOfNets ?? ''}
          handleInputChange={handleNumInputChange}
        />
        <InputField
          key="field-numberOfRounds"
          type="number"
          required={!update}
          label="Number of rounds"
          name="numberOfRounds"
          value={addMatch.numberOfRounds??''}
          handleInputChange={handleNumInputChange}
        />
        <InputField key="field-netVariance" type="number" required={!update} label="Net Variance" name="netVariance" value={addMatch.netVariance ?? ''} handleInputChange={handleNumInputChange} />
      </div>

      <div className="part-3 grid grid-cols-1 gap-6 mt-6">
        {!update && <SelectInput key="select-group" handleSelect={handleGroupChange} name="group" label="Group" defaultValue={addMatch.division} optionList={groupOptions} />}
      </div>

      <div className="part-3.5 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {selectedGroup && filteredTeamList.length > 0 && <TeamSelector teamList={filteredTeamList} setAddMatch={setAddMatch} />}
      </div>

      <div className="mt-6 w-full">
        <h3 className="w-full capitalize">Default settings</h3>
      </div>
      <div className="part-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <SelectInput key="select-homeTeam" name="homeTeam" defaultValue={addMatch.homeTeam} optionList={homeTeamStrategy} label="How is home team decided?" handleSelect={handleInputChange} />
        <SelectInput key="select-tieBreaking" name="tieBreaking" value={addMatch.tieBreaking} optionList={tieBreakingRules} label="Tie breaking strategy" handleSelect={handleInputChange} />
      </div>

      <div className="part-4 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <ToggleInput handleInputChange={handleToggleInput} name="autoAssign" label="Auto assign when clock runs out" defaultValue={addMatch.autoAssign} />
      </div>

      <div className="part-5 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <SelectInput
          key="select-autoAssignLogic"
          defaultValue={addMatch.autoAssignLogic}
          name="autoAssignLogic"
          optionList={assignStrategies}
          label="Which auto assign logic when clock runs out?"
          handleSelect={handleInputChange}
        />

        <SelectInput
          key="select-rosterLock"
          name="rosterLock"
          value={addMatch.rosterLock === ERosterLock.FIRST_ROSTER_SUBMIT ? ERosterLock.FIRST_ROSTER_SUBMIT : ERosterLock.PICK_A_DATE}
          optionList={lockTimes}
          label="When does the roster lock setting?"
          handleSelect={handleInputChange}
        />
        {addMatch.rosterLock && addMatch.rosterLock !== '' && addMatch.rosterLock !== ERosterLock.FIRST_ROSTER_SUBMIT.toString() && (
          <DateInput key="date-rosterLock" name="rosterLockDate" label="Pick A date when ranking is going to lock" handleDateChange={handleRosterLockDate} defaultValue={addMatch.rosterLock} />
        )}

      </div>

      <div className="part-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <InputField key="field-timeout" type="number" required={!update} label="Sub Clock" name="timeout" value={addMatch.timeout ?? ''} handleInputChange={handleNumInputChange} />
        <InputField key="field-fwango" type="text" handleInputChange={handleInputChange} label="Fwango Link" name="fwango" value={addMatch.fwango || ''} />
      </div>

      <div className="part-7 grid grid-cols-1 gap-6 mt-6">
        <TextareaInput key="field-description" handleInputChange={handleInputChange} name="description" required={!update} defaultValue={addMatch.description} />
      </div>

      <div className="part-8 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <InputField key="field-location" type="text" handleInputChange={handleInputChange} label="Location / Start time" name="location" defaultValue={addMatch.location || ''} />
        <InputField key="field-accessCode" type="text" handleInputChange={handleInputChange} label="Access Code" name="accessCode" value={addMatch.accessCode || ''} />
      </div>

      <button className="btn-info mt-4 w-full">{update ? 'Update' : 'Create'}</button>
    </form>
  );
}

export default MatchAdd;
