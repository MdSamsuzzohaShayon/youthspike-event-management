import React, { useRef, useState, useCallback, useEffect } from 'react';
import InputField from '../elements/forms/InputField';
import Image from 'next/image';

interface ShowDivisionsProps {
  divisions: string; // comma-separated string
  onInputChange: (e: React.SyntheticEvent) => void;
}

const ShowDivisions: React.FC<ShowDivisionsProps> = ({ divisions, onInputChange }) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [divisionList, setDivisionList] = useState<string[]>([]);

  // Sync local state when prop changes
  useEffect(() => {
    setDivisionList(
      divisions
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
    );
  }, [divisions]);

  const openDialog = useCallback(
    (index: number | null) => {
      setEditIndex(index);
      dialogRef.current?.showModal();
      const inputEl = document.getElementById('division-input') as HTMLInputElement | null;
      if (inputEl) inputEl.value = index !== null ? divisionList[index] : '';
    },
    [divisionList],
  );

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
    setEditIndex(null);
  }, []);

  const updateParent = useCallback(
    (newDivisionsArr: string[]) => {
      setDivisionList(newDivisionsArr);
      const newDivisions = newDivisionsArr.join(', ');
      const syntheticEvent = {
        target: { name: 'divisions', value: newDivisions },
      } as unknown as React.SyntheticEvent;
      onInputChange(syntheticEvent);
    },
    [onInputChange],
  );

  const handleDelete = useCallback(
    (item: string) => {
      updateParent(divisionList.filter((d) => d !== item));
    },
    [divisionList, updateParent],
  );

  const handleSave = useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      const inputEl = document.getElementById('division-input') as HTMLInputElement | null;
      if (!inputEl || !inputEl.value.trim()) return;

      const value = inputEl.value.trim();
      let newDivisionsArr = [...divisionList];

      if (editIndex !== null) {
        newDivisionsArr[editIndex] = value;
      } else {
        newDivisionsArr.push(value);
      }

      updateParent(newDivisionsArr);
      closeDialog();
    },
    [divisionList, editIndex, updateParent, closeDialog],
  );

  return (
    <ul className="flex gap-1 flex-wrap mt-2">
      <dialog ref={dialogRef} className="modal-dialog">
        <div className="p-4">
          <img src="/icons/close.svg" role="presentation" onClick={closeDialog} className="svg-white mt-2" alt="Close" />
          <InputField type="text" name="division-input" label={editIndex !== null ? 'Update Division' : 'Add Division'} required={false} />
          <button className="btn-info mt-4 text-center" onClick={handleSave}>
            Ok
          </button>
        </div>
      </dialog>

      {divisionList.map((item, i) => (
        <li key={`${item}-${i}`} className="px-4 py-2 rounded-full bg-gray-800 flex items-center justify-between">
          {item}
          <img className="w-4 h-4 svg-white ml-2" role="presentation" onClick={() => openDialog(i)} src="/icons/edit.svg" alt="Edit" />
          <img className="w-4 h-4 svg-white ml-2" role="presentation" onClick={() => handleDelete(item)} src="/icons/close.svg" alt="Remove" />
        </li>
      ))}

      <li className="btn-info" role="presentation" onClick={() => openDialog(null)}>
        <Image height={50} width={50} className="w-4 h-4 svg-black ml-2" src="/icons/plus.svg" alt="Add" />
      </li>
    </ul>
  );
};

export default React.memo(ShowDivisions);
