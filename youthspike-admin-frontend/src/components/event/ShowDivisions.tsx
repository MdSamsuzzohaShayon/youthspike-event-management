import { IEventAdd } from '@/types';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { UPDATE_EVENT } from '@/graphql/event';
import useClickOutside from '../../hooks/useClickOutside';
import InputField from '../elements/forms/InputField';

interface IShowDivisionsProps {
  update: boolean;
  dStr: string;
  prevDivisions: string;
  eventId: string | null;
  updateEvent: Partial<IEventAdd>;
  setEventState?: React.Dispatch<React.SetStateAction<IEventAdd>>;
  setUpdateEvent?: React.Dispatch<React.SetStateAction<Partial<IEventAdd>>>;
}

function ShowDivisions({ update, dStr, prevDivisions, eventId, updateEvent, setEventState, setUpdateEvent }: IShowDivisionsProps) {
  const [eventUpdate, { error: euErr }] = useMutation(UPDATE_EVENT);
  const addDivisionDialogEl = useRef<HTMLDialogElement | null>(null);
  const [updatedDivisions, setUpdatedDivisions] = useState(prevDivisions);
  const [originalItem, setOriginalItem] = useState<string | null>(null);
  const [addNew, setAddNew] = useState<boolean>(false);

  // Memoize the division list to avoid unnecessary recalculations
  const divisionList = useMemo(() => {
    return dStr.split(',').filter((item) => item.trim() !== '');
  }, [dStr]);

  // Optimized click outside handler
  useClickOutside(
    addDivisionDialogEl,
    useCallback(() => {
      addDivisionDialogEl.current?.close();
      setOriginalItem(null);
    }, []),
  );

  // Memoized refresh function to avoid recreating on every render
  const refreshServer = useCallback(
    async (newDivisions: string) => {
      const inputData = { ...updateEvent, divisions: newDivisions };
      console.log({eventId});
      
      await eventUpdate({
        variables: {
          sponsorsInput: [],
          updateInput: inputData,
          eventId,
        },
      });
    },
    [eventUpdate, eventId, updateEvent],
  );

  // Optimized division removal handler
  const handleCutDivision = useCallback(
    async (e: React.SyntheticEvent, item: string) => {
      e.preventDefault();
      if (!eventId) return;

      const prevDivList = prevDivisions.split(',').filter(Boolean);
      const newDivisions = prevDivList
        .filter((d) => d.trim().toLowerCase() !== item.trim().toLowerCase())
        .map((str) => str.trim())
        .join(', ');

      if (setEventState) setEventState((prev) => ({ ...prev, divisions: newDivisions }));
      if (update) {
        if (setUpdateEvent) setUpdateEvent((prev) => ({ ...prev, divisions: newDivisions }));
      }

      setUpdatedDivisions(newDivisions);
      await refreshServer(newDivisions);
    },
    [eventId, prevDivisions, update, refreshServer, setEventState, setUpdateEvent],
  );

  // Optimized input change handler
  const handleInputChange = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const inputEl = e.target as HTMLInputElement;
      const value = inputEl.value.trim();

      if (!value) return;

      let divisions, updateDivs;

      if (!addNew && originalItem) {
        const prevDivList = prevDivisions.split(',').filter(Boolean);
        const updateDivList = [...prevDivList];

        const prevItemIndex = prevDivList.findIndex((d) => d.trim().toLowerCase().includes(originalItem.trim().toLowerCase()));

        if (prevItemIndex !== -1) {
          let originalStr = prevDivList[prevItemIndex].trim();
          if (originalStr.includes('_')) {
            originalStr = originalStr.split('_')[0].trim();
          }
          const formattedStr = `${originalStr}_${value}_u`;

          prevDivList[prevItemIndex] = value;
          updateDivList[prevItemIndex] = formattedStr;
        }

        divisions = prevDivList.map((str) => str.trim()).join(', ');
        updateDivs = updateDivList.map((str) => str.trim()).join(', ');
      } else {
        divisions = `${prevDivisions}, ${value}`;
        updateDivs = divisions;
      }

      if (setEventState) setEventState((prev) => ({ ...prev, divisions }));
      if (update) {
        if (setUpdateEvent) setUpdateEvent((prev) => ({ ...prev, divisions: updateDivs }));
      }
      setUpdatedDivisions(updateDivs);
    },
    [addNew, originalItem, prevDivisions, update, setEventState, setUpdateEvent],
  );

  // Optimized add division handler
  const handleAddDivision = useCallback(
    async (e: React.SyntheticEvent) => {
      e.preventDefault();
      await refreshServer(updatedDivisions);
      addDivisionDialogEl.current?.close();
      setOriginalItem(null);
    },
    [refreshServer, updatedDivisions],
  );

  // Optimized modal handlers
  const handleShowEditDivision = useCallback((e: React.SyntheticEvent, item: string) => {
    e.preventDefault();
    setAddNew(false);
    addDivisionDialogEl.current?.showModal();

    const inputEl = document.getElementById('division-new') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = item;
      setOriginalItem(item);
    }
  }, []);

  const handleShowAddDivision = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    setAddNew(true);
    addDivisionDialogEl.current?.showModal();

    const inputEl = document.getElementById('division-new') as HTMLInputElement;
    if (inputEl) {
      inputEl.value = '';
    }
  }, []);

  const handleCloseModal = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    addDivisionDialogEl.current?.close();
    setOriginalItem(null);
  }, []);

  // Memoize the list elements to avoid recreating on every render
  const listEl = useMemo(() => {
    return divisionList.map((item, i) => (
      <li className="px-4 py-2 rounded-full bg-gray-800 flex items-center justify-between" key={`${item}-${i}`}>
        {item}
        {update && (
          <>
            <img className="w-4 h-4 svg-white ml-2" role="presentation" onClick={(e) => handleShowEditDivision(e, item)} src="/icons/edit.svg" alt="Edit" />
            <img className="w-4 h-4 svg-white ml-2" role="presentation" onClick={(e) => handleCutDivision(e, item)} src="/icons/close.svg" alt="Remove" />
          </>
        )}
      </li>
    ));
  }, [divisionList, update, handleShowEditDivision, handleCutDivision]);

  // if (!dStr.includes(',')) return <ul>{dStr}</ul>;

  return (
    <ul className="flex gap-1 flex-wrap mt-2">
      <dialog ref={addDivisionDialogEl} className="modal-dialog">
        <div className="p-4">
          <img src="/icons/close.svg" role="presentation" onClick={handleCloseModal} className="svg-white mt-2" alt="Close" />
          <InputField type="text" handleInputChange={handleInputChange} name="division-new" label={addNew ? 'Add Division' : 'Update Division'} required={false} />
          <button className="btn-info mt-4 text-center" onClick={handleAddDivision}>
            Ok
          </button>
        </div>
      </dialog>

      {listEl}

      {update && (
        <li className="px-4 py-2 rounded-full bg-yellow-logo text-black flex items-center justify-between" role="presentation" onClick={handleShowAddDivision}>
          Add New
          <img className="w-4 h-4 svg-black ml-2" src="/icons/plus.svg" alt="Add" />
        </li>
      )}
    </ul>
  );
}

export default React.memo(ShowDivisions);
