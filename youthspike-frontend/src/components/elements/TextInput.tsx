import { ITextInputProps } from '@/types';
import React from 'react';

function TextInput({ defaultValue, name, vertical, lw, handleInputChange, required, rw, lblTxt, extraCls }: ITextInputProps) {
  let dv = '';
  if (defaultValue && defaultValue !== '') dv = defaultValue;

  return (
    <div className={`input-group mt-4 w-full flex ${vertical ? 'flex-col' : ''} items-center ${extraCls ?? ''}`}>
      <label htmlFor={name} className={`capitalize ${vertical ? 'w-full' : ''} ${lw || ''}`}>
        {lblTxt || name}
      </label>
      <input onChange={handleInputChange} id={name} name={name} className={`${vertical ? 'w-full' : ''} form-control ${rw || 'w-20'}`} type="text" defaultValue={dv} required={required} />
    </div>
  );
}

export default TextInput;
