import { IToggleInputProps } from '@/types';
import React, { useState } from 'react';

type CustomSyntheticEvent<T = Element> = React.SyntheticEvent<T> & {
  target: {
    name: string;
    value: boolean;
  };
};

const ToggleInput = (props: IToggleInputProps) => {

  const [defaultValue, setDefaultValue] = useState<boolean>(props.value ? true : false);

  const dv = props.value ? props.value : false;

  const toggle=(e: React.SyntheticEvent, value: boolean)=>{
    try {

      const customEvent = {
        target: {
          name: props.name,
          value
        },
        preventDefault: function () {
          e.preventDefault();
        }
      }
      setDefaultValue(value);
      // @ts-ignore
      props.handleInputChange(customEvent);
    } catch (error: any) {
      console.error(error);
    }
  }

  const handleToggleOn = (e: React.SyntheticEvent) => {
    toggle(e, true);
  }

  const handleToggleOff = (e: React.SyntheticEvent) => {
    toggle(e, false);
  }

  return (
    <div className={`input-item mt-4 ${props.extraCls} ${props.widthCls ? props.widthCls : 'w-full'} flex justify-between items-center`}>
      <label htmlFor={props.name} className={`capitalize ${props.lw ? props.lw : ''}`}>{props.lblTxt ? props.lblTxt : props.name}</label>
      <div className={`border border-yellow-logo ${dv === true ? 'bg-yellow-logo text-black' : 'bg-transparent'} outline-none px-2 rounded-full h-10 w-20 text-center flex items-center justify-between`}>
        {defaultValue && <span role="presentation" onClick={handleToggleOff}>Off</span>}
        <button type="button" className='w-7 h-7 bg-white rounded-full' onClick={defaultValue ? handleToggleOff : handleToggleOn} ></button>
        {!defaultValue && <span role="presentation" onClick={handleToggleOn}>On</span>}
      </div>
    </div>
  )
}

export default ToggleInput;