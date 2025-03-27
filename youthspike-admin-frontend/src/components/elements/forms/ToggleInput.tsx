import { IToggleInputProps } from '@/types';
import React, { useEffect, useRef, useState } from 'react';

const ToggleInput = ({ name, label, defaultValue, handleInputChange }: IToggleInputProps) => {
  const [isChecked, setIsChecked] = useState<boolean>(defaultValue ?? false);
  const hiddenInputEl = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsChecked(defaultValue ?? false);
  }, [defaultValue]);

  useEffect(() => {
    if (hiddenInputEl.current) {
      hiddenInputEl.current.checked = isChecked;
    }
  }, [isChecked]);

  const toggle = (e: React.SyntheticEvent, newValue: boolean) => {
    e.preventDefault();
    setIsChecked(newValue);
  };

  return (
    <div className="flex justify-between items-center bg-gray-800 px-3 py-1 rounded-md border border-gray-700 col-span-2">
      <span className="capitalize text-lg font-semibold">{label || name}</span>
      <div
        className={`border border-yellow-logo ${isChecked ? 'bg-yellow-logo text-black' : 'bg-transparent'} 
        outline-none px-2 rounded-full h-10 w-20 text-center flex items-center justify-between`}
      >
        {isChecked && <span role="presentation" onClick={(e) => toggle(e, false)}>Off</span>}
        <button
          type="button"
          className="w-7 h-7 bg-white rounded-full"
          onClick={(e) => toggle(e, !isChecked)}
        />
        {!isChecked && <span role="presentation" onClick={(e) => toggle(e, true)}>On</span>}
      </div>
      <input ref={hiddenInputEl} type="checkbox" className="hidden" name={name} defaultChecked={isChecked} onChange={handleInputChange} />
    </div>
  );
};

export default ToggleInput;
